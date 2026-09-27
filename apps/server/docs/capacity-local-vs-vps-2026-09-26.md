# Local vs VPS — capacity comparison, 2026-09-26

Same code, same seeded dataset (10,075 users / 5,000 students / 1,000,000 attendance rows / 60,000 fee rows),
same k6 scenarios. Two different places it ran.

- **Local** = my machine, report: [`capacity-report-2026-09-26.md`](./capacity-report-2026-09-26.md)
- **VPS** = your excloud app box + your managed Postgres, this report

Nothing here is committed. The VPS still has the throwaway deploy on it (`~/app`), and three secrets are still
in the chat log — see "Housekeeping" at the end.

---

## 1. The one-paragraph answer

Local said "you cap at ~290 req/s because Postgres is the wall". **That was wrong, and it was my machine's
fault.** On your real production topology the same code serves **~1,050 authenticated requests/second**
— 3.6× the local number — and **Postgres is not the wall at all**. The wall on the VPS is Bun's single
JavaScript thread: one authenticated request costs about **1.1 ms of one core**, so one process can only ever
do about 900–1,100 req/s, and a second process does not help *on this box* because the box's 2 cores are
already shared with Redis, network interrupts and the load generator itself.

---

## 2. Where each test ran

| | Local | VPS |
|---|---|---|
| App server | My laptop, Bun pinned to 2 of 4 logical CPUs | excloud `m1a.large` — 2 vCPU AMD EPYC 7713, 7.8 GiB RAM, Ubuntu 24.04.5 |
| Bun / Redis | Bun 1.4.2, Redis 7 in Docker | Bun 1.4.2, Redis 7 on the same box (loopback) |
| Database | Postgres in a Docker VM **on the same laptop** | **Managed** PostgreSQL 17.9, `m1a.xlarge` — 4 vCPU / 16 GB, separate node |
| App → DB latency | same host (Docker VM hop) | **0.198 ms** over the private network (`10.0.0.13`) |
| Load generator | k6 on the same laptop, plus this agent and the IDE | k6 on the same VPS (this is a known handicap, see §7) |
| Listeners | workers off, `:4222` | `START_WORKERS=false`, bound to `127.0.0.1:4222` only |
| DB user | — | least-privilege `schoolapp`, verified non-superuser, cross-database writes denied |

The two numbers that changed everything: **0.198 ms** vs **28.7 ms** (laptop → managed DB over the public
internet), and a database with **4 dedicated cores** instead of one sharing a laptop with an IDE.

---

## 3. Headline comparison

| Measured | Local | VPS | Change |
|---|---|---|---|
| Max authenticated read throughput | **~290 req/s** | **~1,050–1,105 req/s** | **3.6×** |
| `GET /auth/me` latency, low concurrency | 112 ms p95 | **1.6 ms median** (1 VU), 8.6 ms median (10 VU) | **~12–70× faster** |
| Raw HTTP ceiling (route that skips auth, Redis and DB) | not separated out | **3,050–3,180 req/s** | new measurement |
| Was the API process the bottleneck? | No (0.64 of 2 pinned cores) | **Yes** — Bun's JS thread pinned at ~1 core | flipped |
| Was Postgres the bottleneck? | **Yes** (1.5 cores avg, 4.5 peak) | **No** — flat ceiling, pool size irrelevant | flipped |
| Effect of raising the connection pool 20 → 60 → 120 | no change (286→261→253 req/s) | no change (633→659 req/s, and those runs were generator-limited) | no either way |
| Ceiling when offering 10× too much load | degrades to ~290/s | degrades to ~998/s at 320 VU, **0 errors** | — |

---

## 4. The shape of the VPS ceiling (this is the important table)

Same request (`GET /auth/me`, admin token), only the client concurrency changed. Nothing else was touched.

| k6 VUs | req/s | median | p95 | p99 |
|---|---|---|---|---|
| 1 | 560 | 1.6 ms | 2.1 ms | 3.6 ms |
| 2 | 778 | 2.3 ms | 3.5 ms | 5.5 ms |
| 5 | 930 | 4.7 ms | 8.0 ms | 12.0 ms |
| 10 | **1,068** | 8.6 ms | 12.7 ms | 17.0 ms |
| 20 | 1,105 | 16.7 ms | 25.2 ms | 37.6 ms |
| 40 | 1,061 | 35.4 ms | 49.1 ms | 65.9 ms |
| 80 | 1,031 | 73.9 ms | 102.8 ms | 138.7 ms |
| 160 | 1,023 | 150.8 ms | 178.9 ms | 259.0 ms |
| 320 | 998 | 305.8 ms | 398.2 ms | 605.1 ms |

Read it like this: **throughput goes flat at ~1,050/s and never comes back up, while latency grows exactly in
proportion to concurrency.** 32× more clients (10 → 320) buys 0% more throughput and 36× more latency. That is
the signature of one saturated queue, not of slow queries — and it is why the local report's
"Above the plateau every endpoint degrades by the same amount" note was pointing at the right phenomenon but
naming the wrong resource.

Same probe against a route that exists nowhere (so: no JWT check, no Redis denylist, no Postgres):

| k6 VUs | req/s | median |
|---|---|---|
| 1 | 1,945 | 0.4 ms |
| 5 | 2,949 | 1.2 ms |
| 20 | 3,058 | 5.2 ms |
| 80 | 3,112 | 22.5 ms |
| 320 | 3,086 | 100.2 ms |

**Ceiling ~3,100/s instead of ~1,050/s.** So of the whole request path, the authentication + data part costs
about two-thirds of the available throughput, and the framework/HTTP part alone could do three times as much.

Per-endpoint, at 20 VUs (all three are the "polled every 30 s" endpoints):

| Endpoint | req/s | median | p95 |
|---|---|---|---|
| `/auth/me` (1 Redis GET + 1 `User` SELECT) | 980–1,105 | 16.7–18.2 ms | 25–30 ms |
| `/notifications/count` (Redis-cached unread count) | 1,012 | 18.3 ms | 26.8 ms |
| `/dashboard` (several aggregates) | 883 | 17.8 ms | 26.6 ms |

`/dashboard` is 20% more expensive than `/auth/me`. The flatness across endpoints is the same lesson as the
local report: they are all waiting on the one shared queue.

---

## 5. Cost per request, and why one process cannot go faster

CPU was sampled from `/proc/<pid>/stat` across the measurement windows.

| Shape | Bun CPU | k6 CPU | whole box (2 cores) | throughput |
|---|---|---|---|---|
| 1 process, `/auth/me`, 10 VU | ~1.19 cores | 0.31 | 78% busy | 1,068/s |
| 1 process, `/auth/me`, 40 VU | ~1.19 cores | 0.32 | 78% busy | 1,061/s |
| **2 processes**, `/auth/me`, 40 VU | ~0.47 + ~0.49 cores | 0.33 | **101% busy** | 1,021/s |
| **2 processes**, `/auth/me`, 80 VU | ~0.45 + ~0.44 cores | 0.35 | **101% busy** | 1,107/s |
| 1 process, 404 route, 40 VU | ~0.82 cores | 0.84 | 91% busy | 3,038/s |

Two conclusions, and they are both true:

1. **Inside one Bun process, the JS thread is the unit of scale.** ~1.19 cores ÷ 1,061 req/s =
   **~1.12 ms of CPU per authenticated request** (vs ~0.30 ms for the 404 request — so auth + Redis + Postgres
   add **~0.82 ms of CPU** on top of plain HTTP). Practically: **~900–1,050 authenticated req/s per core.**
2. **A second process did not double anything, because on a 2-core box there was no second core for it.** Each
   Bun dropped from ~1.19 cores to ~0.47, and total throughput stayed the same. The remaining cores went to
   Redis, loopback packet handling and k6 — all of which are on the same tiny box.

So: horizontal scaling of the API *would* work, but **not on this VPS as configured.** You need cores for the
processes *and* cores that are not already taken by Redis and the network stack.

---

## 6. Converting that into "how many users"

Your question was 40–50k users on this topology. Derived arithmetic, clearly marked as derived:

| Basis | Number |
|---|---|
| Measured ceiling, authenticated reads, this box | **~1,050 req/s** |
| A parent on the shipped polling pattern (`/auth/me` every 30 s + bell every 60 s) | ~0.05 req/s |
| → parents this box can keep *signed in and polling* | **~20,000** |
| Measured request rate per mixed VU (local `MODE=mix` ramp: 200 VUs → 25.2 req/s) | 0.126 req/s |
| → simultaneously-active mixed users at the ceiling | **~8,300** |
| Registered users that implies, at a 10–15% simultaneous-activity peak | **55,000–83,000** |

**Verdict: 40–50k registered users is inside this box's read capacity with room to spare.** The read path is
not what will hurt you.

What will hurt you is **login**, and it is unchanged between the two environments because it is pure CPU:
argon2id costs **~215 ms of CPU and 64 MB of RAM per verify**. That caps a single core at **~4.6 logins/s**.
5,000 parents signing in over a 10-minute 08:00 peak is 8.3 logins/s — already 2× over what one core can do,
and the login rate limiter (Fix 3 below) blocks you at 0.83/s per school IP long before the hardware matters.

---

## 7. What we need to fix

### 7a. New from the VPS run — infrastructure and the auth path

| # | Fix | Why, with the number | Do it when |
|---|---|---|---|
| **N1** | **Do not put Redis on the app box.** Move it to the managed tier or its own small node. | 2 API processes produced the same total throughput as 1 because the box was 101% busy — Redis, softirq and k6 were eating the second core. Freeing ~0.5–0.75 core is the difference between "2 processes = 2×" and "2 processes = 1×". | Before GA, cheap |
| **N2** | **Size the app box in cores, using ~1.1 ms CPU per authenticated request.** | 1,050 req/s per core. A 2 vCPU box is worth ~1 process; a 4 vCPU box ≈ ~2,000/s; 8 vCPU ≈ ~4,000/s with Redis elsewhere. | Sizing decision, now |
| **N3** | **Kill the per-request work in the auth path.** `src/lib/auth.ts` runs `jwtVerify` + a Redis `GET` + a `User` SELECT on *every* request; that is the ~0.82 ms. | Cache the `{updatedAt, isActive, tenantId, name, role}` tuple in-process for 3–5 s keyed by `jti`, and check the denylist with a local bloom/TTL set. Saves ~2/3 of per-request CPU. **Trade-off: a deactivating admin takes up to 5 s to take effect instead of instantly** — that is a security call, yours to make. | Post-GA unless you disagree |
| **N4** | **Login is the real ceiling, not reads.** | ~4.6 logins/s per core, ~215 ms CPU + 64 MB RAM each, measured locally. Mobile+web both stampede at 08:00. | Before GA |
| **N5** | **`shared_buffers` is still 128 MB on a 16 GB database.** | Postgres default on a 4 vCPU/16 GB managed node. The correct ballpark is ~4 GB, plus `effective_cache_size`. Also untested: PgBouncer transaction mode vs `prepare: true`. | **Needs a database restart — I will not touch it without your go-ahead.** |
| **N6** | Run workers on the app box costs CPU these runs deliberately excluded. | Every VPS number here is `START_WORKERS=false`. A real 08:00 peak has BullMQ workers competing for the same 2 cores. | Fold into N2 sizing |

### 7b. From the local run — ten code-level issues, five now patched

All ten were re-read on the VPS and every one applied unchanged, so the priority order held. Fixes **1, 3, 4, 6
and 9** are now applied and unit-tested (`17 pass, 1 fail` — the failure is a pre-existing environmental one, a
local DB/Redis-down 503). **2, 5, 7, 8 and 10 are still open**: 2, 5 and 7 need a decision from you, not a patch.

| # | Issue | Severity | State |
|---|---|---|---|
| 1 | `src/auth/login.ts` — `getClientIp(request)` was missing the `server` argument, so **every login on the planet shared one 5-attempt lockout key**. 5 wrong passwords = front door closed for everyone for 15 min. The same bug was in `src/auth/refresh.ts`. | **critical**, two lines | **fixed** — both call sites now pass `server`; `src/lib/ip.test.ts` asserts a real Elysia route handler resolves a peer address, because `app.handle()` leaves `server` null and would not catch this |
| 2 | `src/lib/ip.ts` trusts `x-forwarded-for` with no proxy check, so **any client can bypass both limiters by setting a header**. (My own harness used exactly that trick to get through.) | high | **open — needs your decision.** See "Why Fix 2 is not done" below. |
| 3 | `/auth/login` limited to **50 attempts/min/IP** and counted *successes*, so one school behind one NAT address could sign in 0.83 people/s. | high | **fixed** — split into two budgets in `src/lib/ratelimit.ts`: **5 failures per account** per 15 min (what stops password stuffing) and **50 failures per IP** per 15 min (flood containment only). Failures only are counted; successes no longer consume anyone's budget. `ratelimit.test.ts` proves a blocked account cannot lock out its school. |
| 4 | 10,000 req/min/IP general limiter = 166 req/s shared by a whole school Wi-Fi; and the counter is **in-process**, so it multiplies per instance. | medium | **raised, not cured** — general limit now 30,000/min/IP (500 req/s) and the login flood cap 1,200/min/IP (20/s), both env-overridable (`RATE_LIMIT_MAX`, `LOGIN_FLOOD_MAX`). The per-IP counter is **still in-process**, so with 2–3 Bun processes it is effectively 2–3× the stated number. That is acceptable while these are flood caps and not fairness controls; a shared (Redis) counter is the fix if you ever need per-school fairness. |
| 5 | argon2 defaults leave login at ~5/s; retry jitter on the clients, and a deliberate `memoryCost` decision. | medium | open — needs your decision on the security/per CPU trade-off |
| 6 | `getPoolStats()` returned `active: 0` and a hardcoded `max: 20` — **pool pressure was invisible from the app's own metrics.** | medium | **fixed** — `getPoolStats()` now reads real counts from `pg_stat_activity` (active / idle / idle-in-transaction / lock-blocked / total) and returns `available: false` when it cannot measure. `/performance` reports `connectionPool: 'unmeasured'` instead of a fabricated `0/20`. The fake `waiting: 0` is gone. |
| 7 | `Attendance.date` / `month` are **TEXT**, and both `'2025-04-01'` and `'2026-06-20T00:00:00.000Z'` shapes are already in the column, so whether a screen returns rows depends on which write created them. | medium, correctness | **open — needs a migration plan.** You have ~1.08 M rows in two date shapes; converting the column type and normalising the existing values is a data migration with a rollback question, not a code edit. I did not move data without your go-ahead. |
| 8 | `Attendance` carries **13 indexes** — 404 MB of index against a 147 MB heap for 1.08 M rows (73% of the table). Every insert pays for all 13. | low, write tax | open — needs `pg_stat_user_indexes` from production to see which of the 13 are actually read before dropping any |
| 9 | Per-request `logger.info` on every route; no `LOG_LEVEL` set in production. | low | **fixed in compose** — `server/docker-compose.yml` sets `LOG_LEVEL=warn` in place of `DISABLE_PRETTY_LOG=true` for both services. The per-request log calls themselves are untouched; the level now suppresses them. |
| 10 | `.env:43` holds a **live PostHog project key**, so a load-test server ships events to production analytics. | low, hygiene | open — that is your live key in your live `.env`; moving it to a separate analytics key is a one-line change once you have a second project |

**Why Fix 2 is not done.** The correct fix is to stop trusting `x-forwarded-for` unconditionally and instead
trust it only from a *listed* proxy — but the list has to name your real front door, and I don't know it yet.
If I hardened it now and you sit behind Cloudflare or an nginx that rewrites the header, every one of your
users would arrive carrying the proxy's single IP. The per-IP counters would then group your entire customer
base together — which is **exactly the outage Fix 1 just removed**, reintroduced from the other side. So the
question I need answered before touching `src/lib/ip.ts` is: *what terminates TLS and forwards to Bun in
production — Cloudflare, a VPS nginx, the provider's load balancer, or nothing?* Once you tell me, the fix is
`TRUSTED_PROXY_IPS` (or a CIDR) plus taking the address from `server.requestIP()` unless the connection
actually came from one of those.

One local conclusion is now **withdrawn**: "Postgres costs 4.5× the API per request, and the database is the
wall." On your production topology that is simply not true — the database was never the constraint; the
Docker-VM-on-a-laptop was. The 4.5× figure is kept in the local report only as a description of that box.

---

## 8. Recommended sizing for 40–50k users, on this provider

| Tier | Now | Recommended | Why |
|---|---|---|---|
| App | 2 vCPU / 7.8 GB, Redis co-located, 1 Bun process | **4 vCPU / 8 GB**, Redis **moved off**, 2–3 Bun processes behind a local socket proxy | N1 + N2: without moving Redis, more app cores buy nothing |
| Database | 4 vCPU / 16 GB managed, `shared_buffers=128 MB` | same node, **`shared_buffers≈4 GB`, `effective_cache_size≈10 GB`, `wal_compression=on`** (restart required) | The node is already right-sized; it is configured at install defaults |
| Workers | co-located, disabled in every test | separate small node, or keep on the app box and count it in N2 | N6 |
| Login path | ~4.6/s per core, limiter fixed but unproven end-to-end | treat logins/s as a capacity metric of its own; run the login knee on the VPS | N4 + issue 3 |

---

## 9. Recorded as not-run, not as passing

Honest gaps in the VPS numbers:

- **`MODE=mix`, `MODE=login`, `MODE=write` were never run on the VPS.** The concurrent-user table in §6 is
  arithmetic on a measured read ceiling plus a locally-measured request-per-user rate. It is an estimate.
- **The load generator shared the box with the app and Redis.** That is why §5 shows 78–101% box busy. Every
  "this box caps at N" number here is an *under*-estimate of the app and an *over*-estimate of what a clean
  app-only box would do. The next run needs a separate generator (or `--tag-system-tests`-style off-box load).
- **Which shared resource binds 2 processes is inferred, not proven.** §5's CPU accounting says "no core left",
  but I did not get to finish the two microbenchmarks that would separate Redis from Postgres — the VPS closed
  the SSH session mid-run. Run §10's two commands to close it.
- Redis persistence (`appendonly`?) and maxmemory policy were never checked; an eviction here would break the
  token denylist, not just a cache.
- Multi-tenant contention (all VPS traffic hit one tenant), TLS, HTTP/2, reverse proxy, real mobile networks,
  FCM sends (`loadtest` DB has 0 `NotificationToken` rows on purpose) and any soak/leak test: all still untested.
- `pg_stat_statements` not installed, so no per-query timing from the managed node.

---

## 10. Reproduce the VPS numbers

```bash
# on the VPS, from ~/app/cwd (needs ~/app/load/tokens.json copied to ./load/)
~/k6 run -q --compatibility-mode=base --no-thresholds load/tight2.js \
  --env PATH=/auth/me --env VUS=10  --env DUR=20s --env BASES=http://localhost:4222/api   # 1 VU .. 320 VU sweep
~/k6 run -q --compatibility-mode=base --no-thresholds load/tight2.js \
  --env PATH=/nope-is-not-a-route --env VUS=80 --env DUR=20s \
  --env BASES=http://localhost:4222/api,http://localhost:4223/api                          # 2-process run

# API instances
cd ~/app && nohup env HOST=127.0.0.1 PG_POOL_MAX=20 PATH=$HOME/.bun/bin:$PATH bun run src/index.ts > ~/api.log 2>&1 &
cd ~/app && nohup env HOST=127.0.0.1 PORT=4223   PG_POOL_MAX=20 PATH=$HOME/.bun/bin:$PATH bun run src/index.ts > ~/api2.log 2>&1 &
```

Scripts this session (all throwaway, none in the repo): `load/tight.js`, `load/tight2.js` on the VPS,
plus `~/vps-sweep.sh`, `~/vps-cpu3.sh`, `~/vps-attr.sh`, `~/vps-2proc.sh`, `~/pgbench3.mjs`.

**To finish §9's open item** — these two decide whether the shared serializer is Redis or Postgres:

```bash
redis-benchmark -h 127.0.0.1 -p 6379 -t get -n 200000 -c 20 -P 1 -q
cd ~/app && $HOME/.bun/bin/bun run ~/pgbench3.mjs    # raw "User" PK SELECT at conc 1/10/40/100
```

---

## 11. Housekeeping

**Done after this report was written (2026-09-26, later):**

1. **Local temp artifacts deleted.** ~70 MB plus 103 result files from the local run are gone; what survives is
   listed in the local report's §4. Nothing of mine is in the repo's source tree.
2. **`PG_POOL_MAX` is reverted.** `src/lib/db.ts` is back to a plain `max: 20` — the tuning knob is not in the
   code. It had already proven its point (20/60/100 gave 286/261/253 req/s), so it stayed no more than a
   measurement tool. `getPoolStats()`'s rewrite is separate and *is* kept (Fix 6).
3. **Fixes 1, 3, 4, 6 and 9 applied**, typecheck clean, `bun test` → 17 pass / 1 fail (the failure is the
   pre-existing route-resolution 503 that needs local Postgres and Redis running). See §7b.
4. **`server/docker-compose.yml`** now sets `LOG_LEVEL=warn` instead of `DISABLE_PRETTY_LOG=true`.

**Still needs you:**

5. **Rotate these three secrets.** All of them appeared in this chat: the managed-DB password you gave me,
   the second DB credential from your screenshot, and the app password the seeder generated for the
   `loadtest` accounts. Also `.env:43`'s live PostHog project key (issue 10).
6. **Answer the Fix 2 question** — what forwards to Bun in production — and I can close the header-spoofing hole.
7. **Delete the throwaway SSH key** — `~/.ssh/drizzelfull_vps_loadtest` locally and the matching line in
   `~/.ssh/authorized_keys` on the VPS.
8. **The VPS teardown is blocked.** The box stopped answering on port 22 mid-run (`Connection timed out` three
   times), so `~/app`, `~/.env`, Redis there, the seeded `loadtest` database and the `schoolapp` role on the
   managed node are **all still live**. I could not delete them from here. Once SSH is back, or from the
   provider console, that is the remaining cleanup — say the word and I run it.
9. I did **not** change `max_connections`, `shared_buffers` or any other database setting, because all of them
   need a restart. Nor did I restart anything on your `:4000` dev server, and **nothing has been committed** —
   this directory is not a git repo, so every edit and deletion above is unrecoverable from here.
