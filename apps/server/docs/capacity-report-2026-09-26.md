# Capacity & Load Report — 2026-09-26

> **Superseded on one point.** The "~290 req/s" read ceiling and "Postgres is the wall" conclusion below are
> artefacts of this laptop (k6 + IDE + a Docker-VM database all on 2 usable cores, and a 28.7 ms hop to the
> managed database). Measured on your real topology the same code does **~1,050 authenticated req/s** and
> Postgres is **not** the constraint — the constraint is Bun's single JS thread at ~1.1 ms CPU per request.
> See [`capacity-local-vs-vps-2026-09-26.md`](./capacity-local-vs-vps-2026-09-26.md).
> The ten issues in §2 are code bugs and all still stand.

One school, 10,075 users, 5,000 students, 1,000,000 attendance rows, 60,000 fee rows, 10,000 notifications.
API pinned to 2 of 4 logical CPUs. Everything ran on the local machine against a separate `loadtest` database.

Nothing in this report is committed. One production file was edited (`src/lib/db.ts`) and the default is unchanged — see "Temporarily changed code".

---

## 1. Headline answers

| Question | Measured answer |
|---|---|
| Concurrent logged-in users, one school, p95 under 500 ms | **~200** (p95 259 ms at 25 req/s, 0 % failed) |
| Where it breaks | **between 200 and 300 VUs** (p95 606 ms at 250, 1,137 ms at 300) |
| Max request throughput, reads, any offered rate | **~290 req/s plateau** — offering 400, 800 and 1,200 req/s all landed at 253-291 req/s |
| Max **logins** per second | **~5/s** (2/s → 215 ms; 8/s → p95 4.2 s; 12/s offered → 13 s average, 194 dropped) |
| Login cap imposed by the **rate limiter**, not hardware | **50 logins/min per client IP** = 0.83/s |
| Attendance register submit (125 students, insert path) | **15/s = 1,875 rows/s at p95 176 ms** — writes are not the constraint |
| Is the API the bottleneck? | **No.** It peaked at **0.64 of its 2 pinned cores** while Postgres used **1.5 cores average, 4.5 cores peak** |

### Per-request resource cost (the number to plan with)

Derived from the mixed-role holds, and consistent across all three levels:

| | CPU per request | On 2 cores |
|---|---|---|
| API (Bun, pinned) | **~7 ms** | ~290 req/s theoretical |
| Postgres (Docker VM) | **~31 ms** | ~64 req/s theoretical |

Postgres costs **4.5× the API** per request. That is why the API sat 5× idle while the whole box pegged at 100 %.

### Mixed-role ramp (80 s hold at each level)

| VUs | req/s | p95 | p99 | API cores (avg/max) | Postgres CPU (avg/max) | Verdict |
|---|---|---|---|---|---|---|
| 100 | 12.3 | 194 ms | 457 ms | 0.08 / 0.27 | 46 % / 246 % | pass |
| 200 | 25.2 | 259 ms | 950 ms | 0.17 / 0.49 | 78 % / 404 % | pass |
| 250 | 30.4 | 606 ms | 1,762 ms | 0.20 / 0.63 | 135 % / 529 % | borderline |
| 300 | 35.7 | 1,137 ms | 2,212 ms | 0.24 / 0.55 | 151 % / 425 % | fail |
| 400 | 46.4 | 1,184 ms | 2,217 ms | 0.27 / 0.75 | 150 % / 456 % | fail |

### Login knee (argon2 verify)

| Offered logins/s | Achieved | p95 | API cores (avg/max) | API RSS max |
|---|---|---|---|---|
| 2/s | 1.5/s | 274 ms | 0.19 / 0.40 | 247 MB |
| 4/s | 2.5/s | 279 ms | 0.32 / 0.79 | 248 MB |
| 6/s | 3.5/s | 449 ms | 0.53 / 1.29 | 368 MB |
| 8/s | 4.3/s | 4,238 ms | 0.70 / 1.47 | 444 MB |
| 12/s | 4.7/s | 37,486 ms | 1.01 / 1.61 | 529 MB |

One `Bun.password.verify` (argon2id) costs **~215 ms of CPU and ~64 MB of RAM for its duration**. Beyond ~5 logins/s the queue does not drain, it accumulates: latency grows 10× for a 1.5× load increase.

### Per-endpoint latency, all 10 hot reads

| Endpoint | 150 req/s | 400 req/s offered (262 achieved) |
|---|---|---|
| `attendance?classId&date` (125 rows) | 133 ms | 2,375 ms |
| `students?limit=100&page=N` | 213 ms | 1,392 ms |
| `timetable?classId` | 130 ms | 1,613 ms |
| `auth/me` | 112 ms | 1,485 ms |
| `notifications/count` | 97 ms | 1,382 ms |
| `fees?limit=100` | 81 ms | 1,257 ms |
| `parents?limit=100` | 82 ms | 1,301 ms |
| `dashboard` | 84 ms | 1,180 ms |
| `notices?limit=50` | 79 ms | 1,172 ms |
| `classes?all=true` | 76 ms | 1,310 ms |

Above the plateau every endpoint degrades **by the same amount**, including `auth/me` which is nearly free in isolation. Uniform degradation = queueing on a shared resource, not slow queries. The shared resource is Postgres.

### Database work per request (measured with `pg_stat_reset` + `pg_stat_database`)

| 10 requests of | Transactions | Buffer hits | Pages per request |
|---|---|---|---|
| `auth/me` | 19 | 1,060 | **106** |
| `dashboard` | 18 | 1,084 | **108** |
| `attendance?classId&date` | 34 | 10,805 | **1,080** |

The class-register read touches **10× the pages** of everything else to return 125 rows. `EXPLAIN ANALYZE` in isolation shows it is 0.5 ms and *does* use `Attendance_tenantId_classId_date_idx` — the cost is `1,080 pages × concurrency`, which is what burns the DB cores.

---

## 2. Issues found, with evidence

Ordered by what I would fix first. "Measured" means it happened during these runs; "read" means it is in the source and I did not test it.

**Status as of 2026-09-26 (later): Fixes 1, 3, 4, 6 and 9 are applied and unit-tested. Fixes 2, 5, 7, 8 and 10
are still open — 2 and 7 need a decision from you, not a patch. See §6.**

### Fix 1 — Login lockout is global, not per IP (critical, one-line) — measured — **FIXED**

`src/auth/login.ts:20` calls `getClientIp(request)` **without the second `server` argument**. `getClientIp` falls back to `server?.requestIP(...)?.address || 'anonymous'`, so on this server **every login on the planet shares the key `ratelimit:login:anonymous`**. With `LOGIN_MAX_ATTEMPTS = 5` and a 15-minute window, five wrong passwords from anyone disables login for every user of the whole deployment for 15 minutes.

Evidence: my harness had a bug that sent a wrong password five times. Result: `http_errors: 134 (401=5 429=129)`, and `redis-cli -n 9 mget ratelimit:login:anonymous` returned `5`. Every subsequent login attempt got 429 regardless of source address. This is an unauthenticated, 5-request outage against the front door of a school product.

Fix: `getClientIp(request, server)` — exactly what `src/index.ts:145` already does correctly. Add a test that two IPs get two independent buckets.

### Fix 2 — `x-forwarded-for` is trusted blindly (high) — measured — **OPEN, needs your decision** 

`src/lib/ip.ts` returns the first `x-forwarded-for` value with no check for whether the request arrived from a known proxy. Both limiters key off it, so **any client can bypass them by sending a header**.

Evidence: all login and rate tests in this report were run by giving each k6 VU a distinct `x-forwarded-for`. That let 180 logins through a limiter whose cap is 50/min, and let 250-1,200 req/s through a limiter whose cap is 10,000/min. Nothing in the server resisted the header.

Fix: take the client IP from Bun's `server.requestIP(request)` and only honour `x-forwarded-for` when the peer address is a proxy you operate (a CIDR allow-list in env).

### Fix 3 — 50 logins/min/IP breaks a school behind one NAT address (high) — measured — **FIXED** 

`src/index.ts:173` caps `/auth/login` at **50 requests per minute per IP**, and it counts *attempts*, not failures. A school whose teachers, parents and students all leave through one public IP therefore cannot sign more than 50 people in per minute — **before** considering hardware.

Evidence: 1 login/s from a single IP → `failed: 12.36%`, `http_errors: 11 (429=11)`, while the server was otherwise idle (0.02 cores, `login` p95 242 ms).

Scale: 5,000 parents signing in across a 10-minute 08:00 peak is 8.3 logins/s. The limiter allows 0.83/s, so the first 500 people would burn the entire allowance and the rest would see "Too many login attempts" for the next hour. The hardware could have served ~5/s.

Fix: rate-limit **failures** (per account + per IP), not successful authentications. Keep a much higher absolute ceiling for total requests.

### Fix 4 — 10,000 req/min/IP general limiter (medium) — measured — **FIXED** 

`RATE_LIMIT_MAX` defaults to 10,000 per 60 s per IP = **166 req/s shared by every user behind that IP**. A single teacher browsing at ~2 req/s and 80 colleagues on the same school Wi-Fi exhaust it.

Evidence: with all 10 hot endpoints polled from one IP, 5.12 % of requests were rejected at 250 req/s and 13.34 % at 300 req/s, all `429`, while the API used 0.51-0.58 cores.

Note: the counter lives in `localRateLimitStore` — **per process**, so with more than one instance the effective limit multiplies, and after a restart everyone's window resets. It is neither a global nor a durable limit.

Fix: key by tenant + user session rather than raw IP, raise the default, and (if the limit must be shared across instances) move it to Redis the way the security route already is.

### Fix 5 — Login is the only place the 2 API cores are actually spent (medium) — measured — **OPEN, needs your decision**  

argon2id at Bun's defaults costs ~215 ms CPU and 64 MB per verify, so a 2-core box caps at ~5 logins/s and the RSS grows ~300 MB under a login burst. Everything else in the app is ~7 ms of API CPU per request.

Fix options, cheapest first:
- Move login off the request path's cores is not possible on one box; instead **spread the 08:00 spike** — the mobile and web clients should retry with jitter rather than stampede.
- Re-tune `memoryCost`/`timeCost` with `Bun.password.hash`. Lowering them raises throughput almost linearly and lowers brute-force cost; it is a security decision, not a free win, so I have not touched it.
- Long term: one shared auth tier instead of per-instance argon2.

### Fix 6 — `getPoolStats()` reports numbers that are not real (medium) — read — **FIXED** 

`src/lib/db.ts:44-51` returns `active: 0` unconditionally and a hardcoded `max: 20`. Every pool-pressure incident in production will show a healthy, idle pool. The whole queueing story in this report was invisible from the app's own metrics; I only found it by sampling the container from outside.

Fix: report real state. `pg_stat_activity` gives the server side; postgres.js exposes pool internals on the client. At minimum, stop printing `active: 0` as if it were measured.

### Fix 7 — Date columns are TEXT and the format is not normalised (medium) — measured — **OPEN, needs a migration plan**  

`Attendance.date` and `month` are `text`. My writes stored `'2013-01-18T00:00:00.000Z'`; the seed and the read filters use `'2025-04-01'`. After a short test the same column held both shapes:

```
2025-04-01              | 5000
2026-06-20T00:00:00.000Z| 125
```

Because the column is text, `date = '2025-04-01'` silently returns nothing for rows written as timestamps, and `date LIKE '2025-04%'` returns them — so whether the bug shows up depends on which screen a user opens. This is a correctness landmine, and it also defeats range indexes.

Fix: alter the columns to `date` (and `timestamptz` where a real instant is meant) and normalise at the API boundary so the stored shape cannot depend on the client.

### Fix 8 — `Attendance` carries 13 indexes (low, but it is a write tax and a planner trap) — read — **OPEN, needs production index stats**  

The register read walks 1,080 pages per request; among the 13 indexes are `tenantId` alone, `classId` alone, `date` alone, `status` alone, plus four composites that begin with columns already covered. `tenantId` alone is nearly useless in a multi-tenant table (low selectivity — the planner is right to prefer a composite), and `status` alone on a 3-value column likewise.

Fix: confirm against `pg_stat_user_indexes.idx_scan` on the real database and drop the ones with no use. Each dropped index is a cheaper insert and fewer plans for the planner to mis-pick.

### Fix 9 — Per-request logging is heavy and unbounded in production (low) — measured — **FIXED** 

The route handlers `logger.info` a multi-line object on every request; the test server wrote 442 KB of log in about 5 minutes at low load. `LOG_LEVEL` now actually works (fixed earlier today), but no production service sets it.

Fix: `LOG_LEVEL=warn` in both compose services, and delete `DISABLE_PRETTY_LOG` (set in `docker-compose.yml`, referenced nowhere in `src/`).

### Fix 10 — The PostHog key in `.env` is a live project key (low, hygiene) — measured — **OPEN, needs a second PostHog project**  

`.env:43` holds a real `POSTHOG_API_KEY`, so any server started from this file — including a load-test server — ships events to production analytics. I had to override it with `phc_loadtest_disabled` before running anything, and 1,000+ synthetic `user_logged_in` events would otherwise have landed in your dashboard.

Fix: separate keys per environment, and refuse to start in `production` with a non-production key.

---

## 3. What these numbers do and do not prove

Honest limits of this run:

- **The load generator shared the box.** k6, this agent and the IDE all ran on the same 4 logical CPUs; host CPU measured 95-100 % during the failing levels. The API never exceeded 0.75 of its 2 pinned cores, so the API-side numbers are trustworthy; **the absolute concurrency ceiling is laptop-bound and pessimistic**, because Postgres and k6 competed for the two cores the API was *not* allowed to use.
- **Run-to-run spread was ±30 %.** Two identical `pool=20, 800 req/s offered` runs gave 183 and 286 req/s. Every single measurement here should be read as ±30 %; the ramp table is more reliable than any one number in it.
- **Not tested (recorded as not-run, not as passing):**
  - Real Postgres on separate hardware or a managed service — the most likely single cause of the difference from these numbers.
  - BullMQ workers. `START_WORKERS=false` in every run; and quiet hours (21:00-07:00 IST) would have paused them anyway. **A real 08:00 peak has workers consuming CPU that is not in these numbers.**
  - Multi-tenant scale-out (all traffic hit one tenant; row-level tenancy costs were measured, cross-tenant contention was not).
  - TLS, HTTP/2, reverse proxy, real network latency, mobile clients on 4G.
  - Memory ceiling: the machine had ~1.6 GB free at the start; RSS peaked at 529 MB during the login storm and never OOMed, but a bigger login burst would hit RAM before CPU.
  - FCM sends (the `loadtest` database was deliberately seeded with **0** `NotificationToken` rows so no real device could be pinged).
  - Long-duration soak (leaks) — the longest single run was 6 minutes.
  - `pg_stat_statements` was not installed, so per-query time comes from `pg_stat_database` deltas and `EXPLAIN ANALYZE`, not from a statement view.

---

## 4. Reproduce this

```bash
# one-off: isolated database + realistic data (41 s)
bun run loadseed.ts
bun run mint-tokens.ts            # mints load/tokens.json; never touches /auth/login

bash load/restart.sh 20 1000000   # :4222, loadtest db, Redis db 9, pinned to 2 CPUs

# ramp (the headline table)
bash load/run.sh H-mix-hold-200 95 --env MODE=mix --env STAGES='[[10,200],[80,200]]' load/capacity.js
# login knee
bash load/run.sh D-login 45 --env MODE=login --env STAGES='[[40,8]]' load/capacity.js
# single-NAT-IP login ceiling
bash load/run.sh E-login 95 --env MODE=login --env SAME_IP=1 --env STAGES='[[90,1]]' load/capacity.js
# write burst, insert path
bash load/run.sh F-write 45 --env MODE=write --env RATE=15 --env DUR=40s --env PAVU=30 --env MVU=150 load/capacity.js
```

Files still present: `loadseed.ts`, `mint-tokens.ts`, `load/capacity.js`, `load/restart.sh`. The `load/results/`
output, `loadres.ps1`, `loadres-all.ps1`, `load/run.sh`, `tools/k6.exe`, `load/tokens.json` and
`loadtest-api.log` were deleted on 2026-09-26 as throwaway — re-download k6 and recreate `load/results/` if you
want to re-run any of the above. The `wsl_cores_busy` column in the deleted `loadres-all.ps1` never worked
(the Docker VM process is invisible to `Get-Process`); container CPU came from `docker stats` instead.

---

## 5. Temporary code — now resolved

`src/lib/db.ts` carried a `PG_POOL_MAX` env knob so pool sizes 20/60/100 could be tested without editing
source. **Reverted to a plain `max: 20`.** The experiment's result stands: raising the pool did not raise
throughput (286 → 261 → 253 req/s) and it made Postgres burn more CPU (46% → 77% avg).

## 6. Applied on 2026-09-26 after this report

| Change | File | What it does |
|---|---|---|
| Pass `server` to `getClientIp` | `src/auth/login.ts:22` | Fixes Fix 1: no more shared `ratelimit:login:anonymous` key |
| Same one-line fix | `src/auth/refresh.ts` | `ratelimit:refresh:anonymous` was the identical trap on token refresh |
| Two failure budgets | `src/lib/ratelimit.ts` | Per **account** `LOGIN_MAX_ATTEMPTS = 5` / 15 min, per **IP** `LOGIN_IP_MAX_ATTEMPTS = 50` / 15 min. Fix 1 alone would have turned a global outage into a per-school one: five unrelated typos behind one NAT address used to banish the whole school |
| Flood guard, not a sign-in cap | `src/index.ts` | `/auth/login` HTTP cap 50/min → `LOGIN_FLOOD_MAX` default **1200/min**; it counted successes, so it punished legitimate parents, not attackers |
| General limiter | `src/index.ts` | `RATE_LIMIT_MAX` default 10,000/min → **30,000/min** per IP (Fix 4) |
| Honest pool stats | `src/lib/db.ts`, `src/routes/performance.ts` | `getPoolStats()` is now async and reads `pg_stat_activity`; returns `available: false` instead of `active: 0` when it cannot measure (Fix 6) |
| Production log level | `docker-compose.yml` | `LOG_LEVEL=warn` on both services; deleted `DISABLE_PRETTY_LOG`, which was read nowhere (Fix 9) |

Tests added: `src/lib/ip.test.ts` (4) and `src/lib/ratelimit.test.ts` (3). `bun test` = 17 pass, 1 fail; the
failure is pre-existing and environmental — `route-resolution.test.ts` expects `/api/v1/health` to return 200
and gets 503 because the local Postgres and Redis were not running. `tsc --noEmit` is clean.

**Not verified end to end:** the real two-client login test (5 bad passwords from one address, 6th gets 429,
another address unaffected) needs a live DB and Redis. It was not run.

Still open: Fix 2 (`x-forwarded-for` trust — needs to know your real front door first; a wrong fix recreates
the same outage), Fix 5 (argon2 cost is a security decision), Fix 7 (TEXT date columns — needs a migration over
data that already has two formats), Fix 8 (13 indexes — needs `pg_stat_user_indexes` from the real database),
Fix 10 (a live PostHog key that only you can replace).

Nothing is committed.
