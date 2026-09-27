# Optimization Verification Runbook (spec §10–11)

Every gate below is run **from a separate machine** against the VPS — the
shared-box generator is the known flaw that made the 2-process measurement lie
in the capacity study. Harness: the `tight2.js` k6 script from
`capacity-local-vs-vps-2026-09-26.md` §10 (throwaway scripts live in `~/app/load/`
on the VPS; copy to the generator box and point `BASES` at `https://$API_HOST/api`).

**Status ledger — honest by rule: a gate not run is recorded `not-run`, never
`pass`.** Update this table after each run.

| Gate | What | Command sketch | Pass criterion | Status |
| --- | --- | --- | --- | --- |
| G1 | Reads per core after auth cache | `tight2.js PATH=/auth/me VUS=10..320 DUR=20s` vs one backend proc | ≥2,400 req/s/core, throughput flat across the VU sweep | not-run (VPS); local relative G1′ below |
| G2 | Total through Traefik (3 procs) | same sweep, `BASES=https://$API_HOST/api` | ≥5,000 req/s total; median <50 ms at 2,000 req/s; zero 5xx | not-run |
| G3 | Login knee (first ever VPS run) | `MODE=login` (or tight2 against `/auth/login` with seeded users) | ≥9 logins/s/core; a seeded legacy (Bun-default) hash shows `m=19456` in the DB row after one successful login | pass (local functional: rehash ✓; rate not-run) |
| G4 | XFF spoof defeated | 6 failed logins from one real IP with rotating `x-forwarded-for` headers | 429 on attempt 6 (real socket IP keyed, not the spoof) | pass (local: counters keyed to real IP ✓; VPS 429 sweep not-run) |
| G5 | Redis-down fail-closed | stop redis container; hit `/auth/me` with fresh token, then with a token cached <5 s ago | fresh token ⇒ 401 immediately; pre-cached token ⇒ ≤5 s then 401 | pass (local: fresh-token 401 ✓ + health 503; pre-cached-drain half not-run) |
| G6 | Deactivation lag | `toggleUserStatus(id,false)` via GraphQL; victim's token polls `/auth/me` | 401 within ≤5.5 s | pass (local: 5,042 ms) |
| G7 | Postgres tuning live | `postgres-tuning-runbook.md` §2 verify queries | `shared_buffers=4GB`; `pg_stat_statements` counting | not-run (user restart window) |
| G8 | Mixed + write modes | `MODE=mix`, `MODE=write` (never run on VPS before) | no 5xx, no pool exhaustion (`/performance` `connectionPool.available=true`) | not-run |

## Pre-flight (once, before G1)

```bash
# on the generator box (NOT the VPS):
k6 --version || install k6
# tokens: copy ~/app/load/tokens.json from the VPS
# baseline re-check (should reproduce ~1,050/s if cache disabled):
AUTH_CACHE_TTL_MS=0 docker restart school-saas-api-1   # or set env + up -d
```

## Local (already run, 2026-09-26, Windows dev box)

- `bun test`: **30 pass / 1 fail** — the failure is the pre-existing
  `route-resolution.test.ts` env case (needs local DB+Redis), unchanged by this work.
- `tsc --noEmit`: clean.
- New unit coverage: authCache (5), passwords (4), ip trusted-proxy (6),
  auth-cache-flow (1, integration-guarded).

## Results log

_(append after each gate run: date, command, raw numbers, verdict)_

### 2026-09-26 — Local functional gate run (Windows dev box, NOT authoritative throughput)

Setup: throwaway API instances on 127.0.0.1:4310 (normal), :4311
(`REDIS_URL=redis://localhost:6399`, dead), :4312 (`AUTH_CACHE_TTL_MS=0`);
local Postgres + Redis; temp user `gate-test@local.test` (deleted after).
Generator on same box ⇒ absolute numbers are **relative evidence only**;
G1/G2/G8 on the VPS remain the authoritative gates.

- **G3 (rehash half) — pass.** Login 200; DB hash upgraded
  `m=65536,t=2,p=1` → `m=19456,t=2,p=1` after one successful login.
  The ≥9 logins/s/core half stays not-run (needs VPS + off-box k6).
- **G4 — pass (keying evidence).** Two failed logins carrying spoofed
  `x-forwarded-for: 1.2.3.4` / `5.6.7.8` produced Redis counters
  `ratelimit:login:ip:127.0.0.1 = 2` — keyed to the real socket peer, spoofs
  ignored (`TRUSTED_PROXY_IPS` unset ⇒ XFF never trusted). Full 6-attempt
  429 sweep to re-run on VPS behind Traefik with the real proxy subnet set.
- **G5 — pass (fresh-token half).** Dead-Redis instance: `/api/health` 503,
  valid token ⇒ `/api/auth/me` **401** (fail-closed); same token on the
  healthy instance ⇒ 200. The "pre-cached token drains ≤5 s" half not-run
  locally (needs Redis killed mid-flight on a warm instance) — fold into the
  VPS run.
- **G6 — pass.** Cache primed via `/auth/me` 200, then
  `UPDATE "User" SET "isActive"=false` directly in DB, poll every 500 ms:
  **401 after 5,042 ms** (criterion ≤5,500 ms). Matches the accepted ≤5 s
  staleness trade-off. User reactivated after the run.
- **G1′ (relative) — pass.** `GET /api/auth/me`, 3,000 reqs @ concurrency 32,
  two alternating rounds per arm, same token/DB/Redis:
  cache OFF (`AUTH_CACHE_TTL_MS=0`): 579 / 638 req/s;
  cache ON (default 5 s): 2,026 / 2,167 req/s; **ratio 3.45×**
  (projection was ~2.7×; /me's own Redis dataCache runs in both arms, so the
  delta is the auth path: JWT verify + denylist GET + User SELECT removed).
  Laptop absolutes are not comparable to the VPS baseline — ratio only.
- **Cleanup.** All three instances stopped; test user + refresh tokens
  deleted; `ratelimit:login:*` and `user_me:*` keys removed; gate logs and
  token files deleted.

Verdict: every locally-runnable gate passed. Remaining before GA:
G1/G2/G8 + G3-rate + G5-drain on the VPS (needs: deploy new code,
`docker-compose.ha.yml` up with real `TRUSTED_PROXY_IPS`, off-box k6), and
G7 in the user's scheduled Postgres restart window.
