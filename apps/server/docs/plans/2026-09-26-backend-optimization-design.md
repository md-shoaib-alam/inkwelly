# Backend Optimization Design — Hot-Path Surgical Plan

Date: 2026-09-26
Status: Approved in conversation, pending written-spec review
Stack: unchanged — Bun + Elysia + Drizzle + postgres.js + managed PostgreSQL 17 + local Redis
Evidence base: `docs/capacity-local-vs-vps-2026-09-26.md` (measured on the production VPS today)

---

## 1. Goal and capacity target

Real load to serve (from the 40–50k registered-user target): **~250–500 authenticated req/s** at the
07:00–09:00 IST peak, plus ~8–15 logins/s at 08:00.

Design target chosen by the user: **5–10x headroom** —

| Metric | Today (measured) | This design (projected) |
| --- | --- | --- |
| Authenticated reads, whole box | ~1,050 req/s (2 vCPU, 1 process) | **~5,000–7,500 req/s** (3 pinned Bun processes) |
| Reads per core | ~1,050 | **~2,500–3,000** (auth cache, ≥2,400 gate) |
| Logins | ~4.6/s per core | ~9–10/s per core → **20–30/s burst** |
| Login RAM per in-flight | ~64 MB | ~19–32 MB |
| Median `/auth/me` latency at 2,000 req/s | n/a (would saturate) | **< 50 ms** |

## 2. Decisions already made (gates this plan runs on)

1. **5s in-process auth cache: accepted**, including the security trade-off — deactivation, password
   change or logout takes up to 5 s to take effect instead of instantly.
2. **Scope: code changes + Postgres tuning.** The `shared_buffers` change needs a managed-DB restart
   that the user schedules/approves. Topology (Traefik + multi-process) is in scope for the design;
   hardware purchase (4 vCPU tier) is the user's.
3. **Moderate argon2 tune** with rehash-on-login. Existing hashes stay valid.
4. **Drizzle stays.** Removal was evaluated and rejected (§8).
5. **Rust rewrite rejected** (§8).

## 3. Part 1 — Auth hot path: 5s in-process cache

**Problem (measured):** every authenticated request runs JWT verify + Redis `GET` denylist + `User`
SELECT (`src/lib/auth.ts:41`) ≈ **0.82 ms of the 1.12 ms CPU/request**. This is the wall, not
Drizzle, not Postgres.

**Design:**
- New `src/lib/authCache.ts`: a module-level `Map<string, entry>` keyed by token `jti`, entry holds
  `{ user tuple: {id, name, role, tenantId}, updatedAt(ms), isActive, denied }` + `expiresAt`.
  TTL = `AUTH_CACHE_TTL_MS` env, default **5000**.
- Sweeper: opportunistic — on each get, if `now > expiresAt` treat as miss; a size-capped sweep
  (delete-oldest when entries > `maxEntries`, default 5,000) runs inline every N misses. No timers,
  no background interval — nothing to leak or keep the process alive.
- Flow in `authPlugin` derive: cache hit (fresh entry, `isActive`, not `denied`, `iat >= updatedAt`
  check done at fill time) → return context without touching Redis or Postgres. Miss → existing full
  path, then fill cache.
- Denylist result is cached **as part of the same entry** (`denied:false`), so the Redis GET is also
  skipped on hits. A token that gets denied mid-window survives ≤5 s — accepted trade-off above.
- Cache fill re-checks nothing beyond what the current path checks; all existing fail-closed rules
  stay (Redis down at fill time ⇒ miss ⇒ null ⇒ 401; unchanged).
- Super-admin tenant-resolution branch (`auth.ts:73-98`) runs unchanged on every request — it is
  rare and not the hot path.
- Per-process semantics: with 3 Bun processes each caches independently; correctness is unaffected
  (each re-validates within its own 5 s window). Documented, not fixed.
- **Invalidation hooks (cheap, optional-but-included):** password change / deactivate / delete paths
  already bump `users.updatedAt` or write denylist entries; add a best-effort local `authCache.delete`
  for the current user on the process handling that mutation. Cross-process staleness remains ≤5 s.

**Files:** `src/lib/auth.ts`, new `src/lib/authCache.ts`, mutation call sites in `src/auth/*.ts`
(profile/password), user-deactivate routes. No route signature or response-shape changes (mobile
compat rule).

**Expected result:** 1.12 → ~0.4 ms CPU/request; ≥2,400 req/s per core (acceptance gate).

## 4. Part 2 — Login path: argon2 moderate tune + rehash-on-login

**Problem:** all 16 hash sites call `Bun.password.hash()` with defaults (argon2id, ~64 MB, ~215 ms)
⇒ ~4.6 logins/s per core — the tightest constraint at 08:00.

**Design:**
- New `src/lib/passwords.ts`, the single entry point:
  - `hashPassword(pw)` → `Bun.password.hash(pw, { algorithm: 'argon2id', memoryCost: 19456, timeCost: 2, parallelism: 1 })`
    (OWASP-grade floor ≈19 MB; ~2× faster than current, ~3× less RAM).
  - `verifyPassword(pw, stored)` → `Bun.password.verify` + on success `Bun.password.needsRehash(stored, sameOpts)`
    → return a flag (or rehash + UPDATE the row) so hashes migrate silently at next successful login.
  - Parameters from env (`ARGON2_MEMORY_COST`, `ARGON2_TIME_COST`) with the above defaults, so the
    knob exists without a code change.
- Replace all bare `Bun.password.hash/verify` call sites in `src/auth/`, `src/routes/`,
  `src/graphql/resolvers/` with the helper. Seeds can keep defaults (or use the helper — same output
  shape).
- Rehash failure after a successful login must NOT fail the login: log, continue.
- **Client-facing behavior: none.** Request/response contracts unchanged (mobile compat).

**Expected result:** ~9–10 logins/s per core; old hashes upgrade as users sign in; no forced resets.

## 5. Part 3 — Security fixes carried from the capacity study

- **Issue 2 — `x-forwarded-for` bypass (`src/lib/ip.ts`):** front door is confirmed as Traefik
  (`TRAEFIK_SETUP.md`). Fix: new `TRUSTED_PROXY_IPS` env (Traefik container IP / docker network CIDR).
  `getClientIp` uses `server.requestIP()` socket address; only when that address is in the trusted
  list does it read `x-forwarded-for` (last hop). Everyone else gets their true socket IP. This kills
  the header-bypass of both login limiters.
- **Issue 4 residual (documented, not fixed):** the 30k/min/IP general counter is in-process, so with
  3 processes it is effectively ~90k/min. Acceptable while these are flood caps, not fairness controls.
  Redis-backed per-tenant fairness counters are explicitly **out** — they re-add a Redis GET per
  request, undoing Part 1.

## 6. Part 4 — Single-VPS topology (Traefik + 3 Bun + local Redis)

```
Internet ──TLS──> Traefik :80/:443 (Let's Encrypt)
                    ├── /        → school-web
                    └── /api/*   → round-robin, health-check, retry-next-peer
                    ├── Bun API #1  127.0.0.1:4001  CPUAffinity core 1   START_WORKERS=false
                    ├── Bun API #2  127.0.0.1:4002  CPUAffinity core 2   START_WORKERS=false
                    └── Bun API #3  127.0.0.1:4003  CPUAffinity core 3   START_WORKERS=false
Core 0 reserved: Redis (loopback, noeviction) + Traefik + OS
Separate: BullMQ worker process (START_WORKERS=true), shares surplus cycles
Database: managed PG node — never moves onto the app box
```

- **Why pinning:** the measured 2-process run did not double throughput because co-located Redis,
  Traefik and the load generator consumed the same cores (box at ~101%). Rule: **API processes =
  vCPUs − 1.**
- Pool math: `PG_POOL_MAX` 20 × 3 = ≤60 server connections vs `max_connections=200` — fits; no
  PgBouncer needed at this target (listed as a later option).
- Redis: local, `maxmemory-policy noeviction` (denylist + BullMQ share it; eviction is a security
  bug, not a cache miss), `appendonly` checked and enabled if off — **must verify current config
  before cutover** (was recorded as not-checked).
- App processes stay stateless; deploys are per-process restarts behind Traefik health checks.
- Hardware: the 4 vCPU tier being evaluated works only at **8 GB** (₹450 tier is 4 GB — thinner than
  the current 7.8 GB box; argon2 stampedes are RAM-bound too). Postgres stays on its own node.

## 6b. If EVERYTHING goes on one VPS (app + Redis + Traefik + Postgres)

The §6 layout keeps Postgres on its managed node. This is the sizing if the user instead puts the
database on the same box (allowed at current scale; the split becomes worth paying for as the DB
grows past this box).

| Consumer | Cores | RAM |
| --- | --- | --- |
| 3 × Bun API (pinned) | 3 | ~0.5–1 GB each ⇒ ~3 GB |
| Redis + Traefik + OS (core 0) | 1 | Redis ≤1 GB, Traefik ~50 MB |
| PostgreSQL (tuned: `shared_buffers` 4 GB) | **4** | **8–12 GB** (buffers + `work_mem`×conn + page cache) |
| BullMQ worker + login-stampede burst | 1 | ~1 GB (30 in-flight argon2 logins ≈ 0.6 GB at tuned params) |
| **Total for the design target (~5,000–7,500 req/s, 20–30 logins/s)** | **~9–10 vCPU** | **16 GB min / 24–32 GB comfortable** |

NVMe is not a constraint at this load (reads mostly cached; writes are attendance/audit volume,
tens of MB/day); **≥100 GB for OS + DB + growth**, same as today.

Sizing honesty, two ends of the range:

| Target | Single-VPS size | What it survives |
| --- | --- | --- |
| **Real current need (~300 req/s, ~15 logins/s) + 10x headroom after Parts 1–3** | **8 vCPU / 16 GB** | ~2,500–4,000 req/s total, DB sharing the box at install-time tuning |
| Full §1 target (~5,000–7,500 req/s) | 10 vCPU / 24–32 GB | the numbers in §1 |

Costs of the all-in-one choice (each is why §6 says Postgres stays separate):
- One box = app outage **and** DB outage together; managed node keeps automated backups/patching —
  self-hosted PG means the user owns backup cron + WAL retention + PITR testing. Non-negotiable if
  going all-in-one: nightly `pg_dump`/basebackup off-box.
- Disk IO and cores are shared — the exact failure the measured 2-process run showed (co-tenants ate
  the cores). Pinning rules extend to Postgres (`CPUAffinity` for its process group).
- A DB restart now also restarts the app era: schedule both windows together.

**Recommendation unchanged:** at 40–50k users target, 4 vCPU/8 GB app + existing 4 vCPU/16 GB
managed DB (₹ split ≈ current spend) is the safer topology; all-in-one 8–10 vCPU/16–24 GB is the
cheaper single-SKU option if the user takes over backup responsibility.

## 7. Part 5 — Postgres node configuration (restart required, user-scheduled)

| Setting | Now (install default) | Target |
| --- | --- | --- |
| `shared_buffers` | 128 MB | **4 GB** (¼ of 16 GB) |
| `effective_cache_size` | ~4 GB | **~10 GB** |
| `work_mem` | 4 MB | 16 MB |
| `wal_compression` | off | on |

Verification: `pg_stat_statements` enabled so the next capacity round has per-query timing (was a
recorded gap). No schema changes in this plan.

## 8. Rejected alternatives (recorded so they stop being re-litigated)

- **Remove Drizzle (72 files):** per-request wall is the auth path (0.82 of 1.12 ms); Drizzle's
  build/hydrate overhead is a fraction of what remains. Weeks of rewrite, high regression risk against
  shipped Expo endpoints, ~single-digit % gain. `rawDb` (raw postgres.js, prepared) already exists
  in `src/lib/db.ts:41` for any single query a benchmark flags — that's the escape hatch.
- **Rust rewrite:** ~3–5× read speed, **~0× login speed** (argon2 is memory-hard by design), ~0× on
  DB/Redis round-trips, months of dual maintenance for a solo builder on a workload already 4×
  oversized. The same hot-path math without the rewrite is Parts 1–5.
- **Redis-backed rate limiting:** re-adds the per-request Redis GET Part 1 removes. Out.

## 9. Deferred items (each needs its own decision later)

| # | Item | Why deferred |
| --- | --- | --- |
| 7 | `Attendance.date`/`month` TEXT with two date shapes, ~1.08 M rows | Correctness bug; needs a data-migration + rollback plan, not a code edit |
| 8 | Attendance's 13 indexes (404 MB for 147 MB heap; write tax) | Needs `pg_stat_user_indexes` from production first |
| 10 | Live PostHog key in `.env:43` shared by load-test runs | One-line change once a second PostHog project exists |
| — | Multi-tenant contention, TLS, soak tests, real mobile networks | Recorded as not-run in the capacity study |

## 10. Rollout order, testing, and rollback

Order (each step lands, is measured, and can ship independently):

1. **Part 1 auth cache** — unit tests: hit/miss/expiry, denylist-fill fail-closed (Redis down ⇒ 401),
   deactivation ≤5.5 s integration check. k6 gate: ≥2,400 req/s/core. Rollback: `AUTH_CACHE_TTL_MS=0`.
2. **Part 2 passwords helper** — unit tests incl. needsRehash upgrade path on a seeded old hash.
   First real `MODE=login` knee run on the VPS. Rollback: raise env params back (new hashes stay
   verifiable — `needsRehash` re-upgrades later).
3. **Part 3 ip.ts trusted-proxy** — unit tests with spoofed XFF from untrusted socket, real peer from
   trusted CIDR (reuse the `ip.test.ts` harness that must use `listen(0)`, not `app.handle()`).
4. **Part 4 topology** — docker-compose/systemd units; Traefik health checks; final k6 sweep 10→320
   VUs **from an off-box generator** (the known flaw in all current numbers): ≥5,000 req/s total,
   median <50 ms @2,000/s, zero 5xx; `MODE=mix` + `MODE=write` run for the first time.
5. **Part 5 Postgres settings** — applied via provider panel in a scheduled window; before/after
   `pgbench` + read-latency capture.

Every step keeps `bun test` green (the pre-existing DB/Redis-down failure is the known exception)
and typecheck clean. No endpoint contracts change anywhere (mobile release constraint).

## 11. Success criteria (done = all true, with numbers)

- [ ] k6: ≥2,400 authenticated req/s **per core** after Part 1
- [ ] k6: ≥5,000 req/s **total** through Traefik on the 4 vCPU box, median <50 ms @2,000/s
- [ ] k6 `MODE=login`: ≥9 logins/s per core; seeded old hash verified-upgraded in a live login
- [ ] Spoofed `x-forwarded-for` from a non-proxy IP cannot bypass login limiter (reproduce the
      harness trick, expect 429)
- [ ] Redis down ⇒ every cache **miss** fails closed (401, never un-authed); worst-case a
      pre-cached token rides ≤5 s — this is the approved trade-off, tested explicitly
- [ ] Deactivated user token rejected within ≤5.5 s
- [ ] `shared_buffers≈4GB` live; `pg_stat_statements` installed
- [ ] `bun test` + typecheck green; no changed response shapes
