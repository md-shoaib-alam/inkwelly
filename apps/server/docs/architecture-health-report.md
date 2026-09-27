# Architecture Health Report — `server` (School SaaS Backend API)

- **Scope**: `D:\per\drizzelfull\server` (git: `github.com/md-shoai…/eylisia-server`, working tree clean at commit `b06ebff`)
- **Date**: 2026-09-22
- **Produced by**: `architecture-visualization:architecture-health` (validation only; no prior architecture model/diagram existed — this is the first health baseline)
- **Artifacts under validation**: `README.md`, `SERVER_SETUP.md`, `TRAEFIK_SETUP.md`, `docker-compose.yml`, `Dockerfile`, `.env.example`, `.github/workflows/build-push.yml`, `package.json`
- **Controlling evidence**: `src/**` (code), `drizzle/**` (migrations), `bun.lock`, git history
- **Method**: static cross-check of every documented architecture claim against code/config, plus git last-touch analysis for staleness. No runtime execution.

---

## 1. Executive verdict

| Artifact | Freshness | Trust | Reason |
| --- | --- | --- | --- |
| `docker-compose.yml` | 2026-09-15 | **High** | Matches code: services, env vars, `START_WORKERS` toggle all consumed by `src/index.ts` |
| `Dockerfile` / `.dockerignore` / `.gitignore` | 2026-06-16 | **High** | Multi-stage distroless build; `.env` and `*service-account.json` excluded from image and git |
| CI `build-push.yml` | current | **High** | Builds and pushes to GHCR on `main`; no quality gates (see finding M4) |
| `src/lib/env.ts` (env contract) | 2026-06-18 | **High (with 1 defect)** | Enforced via zod at boot; phantom `zod` dependency (finding M1) |
| `README.md` | **2026-05-27 — 108 commits stale** | **Low** | Its "Production Readiness Audit" describes code that no longer exists |
| `SERVER_SETUP.md` / `TRAEFIK_SETUP.md` | 2026-06-03 | **Low–Medium** | Mount a `firebase-service-account.json` that no longer exists; image names drift from CI |
| `.env.example` | 2026-08-29 | **Medium** | Variable set matches `env.ts`, but header says "RENDER" while the in-repo compose is self-hosted |

**Bottom line**: the *executable architecture* (code, compose, Dockerfile, CI) is coherent and can be trusted. The *documented architecture* (README audit + both setup guides) is significantly stale and will mislead a new operator: several "must fix before production" items it lists were already fixed months ago, while its deployment instructions reference a deleted credentials file and image names that the CI never produces.

---

## 2. Confirmed (docs match code — safe to trust)

| # | Claim | Evidence (sourceRef) | Confidence |
| --- | --- | --- | --- |
| C1 | Stack: Bun + Elysia + Drizzle ORM (postgres-js driver) + GraphQL Yoga + BullMQ/ioredis + Sentry + PostHog | `package.json:28-54`, `src/index.ts:7-24`, `src/lib/db.ts:1-5` | high |
| C2 | API listens on port 4000 (default), bound `0.0.0.0`, 50 MB body limit | `src/lib/env.ts:5`, `src/index.ts:410-414`, `Dockerfile:30` | high |
| C3 | Swagger UI at `/swagger` | `src/index.ts:93-94`, `README.md:230-232` | high |
| C4 | GraphQL served at `/api/graphql` **and** `/graphql`, JWT via Bearer token, `x-tenant-id` override for super_admin | `src/graphql/route.ts:93-95`, `src/graphql/route.ts:9-31` | high |
| C5 | REST mounted twice: `/api/v1/*` (full) and `/api/*` (legacy compat, nearly identical) | `src/index.ts:254-338` | high |
| C6 | Compose stack: Postgres 16 + PgBouncer (txn mode) + Redis 7 (512 MB, allkeys-lru) + backend + worker containers from the same image; worker selected via `START_WORKERS=true` | `docker-compose.yml:1-136`, `src/index.ts:417-421` | high |
| C7 | Firebase Admin initialized **from env vars**, not a JSON file | `src/lib/firebase-admin.ts:8-17` | high |
| C8 | Docker image: `bun build --compile --minify` → distroless release; `.env`/`.git`/`node_modules` excluded | `Dockerfile:16-38`, `.dockerignore:1-13` | high |
| C9 | CI builds and pushes `ghcr.io/md-shoaib-alam/eylisia-server` (tags: `latest` + short SHA) on push to `main` | `.github/workflows/build-push.yml:1-55` | high |
| C10 | DB schema and migrations are in sync: `src/db/schema.ts` and `drizzle/` were last touched in the **same commit** (`2f26551`, 2026-07-13); working tree clean | git history | high |
| C11 | Redis client is resilient: lazy connect, retry with 1-min backoff, 2 s command timeout — server boots without Redis | `src/lib/redis.ts:9-29` | high |
| C12 | Env validation fails fast (`process.exit(1)`) on invalid config | `src/lib/env.ts:37-52` | high |

---

## 3. Stale findings (docs describe code that changed)

| # | Stale claim | Current reality | Evidence |
| --- | --- | --- | --- |
| S1 | README:14-17 — "hardcoded password `strongpassword123` in docker-compose.yml" | Compose enforces `${DB_PASSWORD:?…}` with no default | `docker-compose.yml:10,43`; fixed in commit `81881b5` |
| S2 | README:19-20 — "Redis … `--maxmemory-policy noeviction`" | `redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru` | `docker-compose.yml:26` |
| S3 | README:24 — "CORS `origin: true` at src/index.ts:90" | CORS driven by `CORS_ORIGIN` env: `*` → allow-all, otherwise comma-separated whitelist | `src/index.ts:110-118` |
| S4 | README:27 — "rate limit `max: 100000` per minute" | Custom hybrid limiter: local RAM 10 000/min general (tunable `RATE_LIMIT_MAX`), Redis 50/min for `/auth/login`+`/auth/register`; `elysia-rate-limit` plugin is no longer imported | `src/index.ts:120-161` |
| S5 | README:35-36 — "repo contains `firebase-service-account.json`" | File absent; gitignored (`*service-account.json`); init via env vars | filesystem, `.gitignore:36`, `src/lib/firebase-admin.ts:8-17` |
| S6 | SERVER_SETUP:109 / TRAEFIK:106 — instruct mounting `./firebase-service-account.json:/app/firebase-service-account.json:ro` | Mount target doesn't exist and isn't read by code; following the guide verbatim fails (Docker would create a stray directory) | `SERVER_SETUP.md:107-109`, `TRAEFIK_SETUP.md:105-106` |
| S7 | README:50-116 — recommended compose lacks `pgbouncer` and `worker` services | Both exist and are load-bearing (`START_WORKERS` split) | `docker-compose.yml:34-56,101-136` |

**Still-valid open items from the README audit** (not yet fixed — keep them flagged):
- Redis runs without `requirepass` (`docker-compose.yml:22-26`).
- Compose default DB URLs use `sslmode=disable` (`docker-compose.yml:78-79,115-116`) — acceptable on the private bridge network, not if pointed at a managed DB.
- General rate limit default of 10 000 req/min/IP remains very permissive (`src/index.ts:123-125`).

---

## 4. Conflicting / ambiguous findings

| # | Conflict | Detail | Confidence |
| --- | --- | --- | --- |
| X1 | **Three deployment stories** | `.env.example:1` header says "INFRASTRUCTURE (RENDER)" (external managed DB/Redis); in-repo `docker-compose.yml` is a self-hosted full stack; `SERVER_SETUP.md`/`TRAEFIK_SETUP.md` describe GHCR images on a VPS with DB unspecified. No document states the canonical production topology. | high |
| X2 | **Three image names** | Compose builds locally as `school-backend:secure` (`docker-compose.yml:63`); CI pushes `ghcr.io/md-shoaib-alam/eylisia-server`; setup guides say `ghcr.io/<user>/school-backend`. Only the CI name is real. | high |
| X3 | **Duplicate health/ping endpoints** | `/api/health` and `/api/ping` are each registered **twice** with different behavior: rich service-level check (DB/Redis/Firebase/storage, 5 s cache) via `healthRoutes` under both `/api` and `/api/v1` groups, *and* lightweight throttled versions at top level. Which handler actually serves depends on Elysia route-resolution order — unverified at runtime. | medium |
| X4 | **Horizontal scaling vs rate limiter** | TRAEFIK guide scales `backend=2`; the general limiter is in-process RAM, so the per-IP limit effectively doubles (and is per-instance). Only auth routes use shared Redis. | medium |

---

## 5. Missing / contract-gap findings (code-level)

| # | Finding | Evidence | Severity |
| --- | --- | --- | --- |
| M1 | **Phantom dependency**: `zod` is imported by `src/lib/env.ts:1` but **not declared in `package.json`**. It resolves only as a transitive dep of `@scalar/themes/@scalar/types` (pulled by `@elysiajs/swagger`). Any swagger-plugin upgrade that drops/rehoms zod breaks env validation → boot-time `process.exit(1)`. | `package.json:16-57`, `bun.lock:824,842,948` | **high** |
| M2 | **Unused declared dependencies**: `pg` (driver is `postgres`), `@elysiajs/jwt` (JWT handled by `jose`), `elysia-rate-limit` (replaced by custom limiter). No imports anywhere in `src/`. | grep over `src/`, `package.json:31,36,42` | medium |
| M3 | **Dead env var**: `DIRECT_URL` is injected into backend and worker containers but never read by `src/` or `drizzle.config.ts` (which uses `DATABASE_URL`). | `docker-compose.yml:79,116`, `drizzle.config.ts:12` | low |
| M4 | **No quality gates**: 3 test files exist (`src/lib/compression.test.ts`, `date-utils.test.ts`, `plans.test.ts`) but `package.json` has no `test` script and CI only builds/pushes the image — no test, typecheck, or lint stage. | `package.json:6-15`, `.github/workflows/build-push.yml` | medium |
| M5 | **Split env contract**: `env.ts` validates 22 vars, but `RATE_LIMIT_MAX`, `LOG_LEVEL`, `START_WORKERS`, `DISABLE_PRETTY_LOG`, and `RAZORPAY_WEBHOOK_SECRET` are read as raw `process.env` elsewhere — partially validated contract. `RAZORPAY_WEBHOOK_SECRET` is used for webhook verification at `src/routes/subscriptions.ts:708` but not schema-checked; behavior when unset is unverified. | `src/index.ts:123,173,417`, `src/routes/subscriptions.ts:708` | low–medium |
| M6 | `@types/uuid` sits in `dependencies` instead of `devDependencies`. | `package.json:35` | trivial |

---

## 6. Recommended remediation (priority order)

1. **Declare `zod` in `dependencies`** (`^3.25.76`) — one-line fix, removes the only boot-breaking latent risk. (M1)
2. **Rewrite the README audit section**: mark S1–S5 as resolved, keep the three still-open security items (Redis password, `sslmode`, rate-limit default) as the live checklist. (S1–S5)
3. **Update SERVER_SETUP.md / TRAEFIK_SETUP.md**: delete the `firebase-service-account.json` volume mounts (use `FIREBASE_*` env vars), replace placeholder image names with the real `ghcr.io/md-shoaib-alam/eylisia-server`, and state where Postgres/Redis run in that topology. (S6, X1, X2)
4. **Resolve the duplicate `/api/health` + `/api/ping` registrations** — delete either the top-level lightweight handlers (`src/index.ts:341-402`) or the `healthRoutes` mounts; verify with `curl` which one currently wins first. (X3)
5. **Add a `test` script (`bun test`) and a CI job** that runs tests + `bunx tsc --noEmit` before the docker build. (M4)
6. **Prune dead weight**: remove `pg`, `@elysiajs/jwt`, `elysia-rate-limit` (or wire them in), move `@types/uuid` to devDependencies, drop `DIRECT_URL` from compose or start using it in `drizzle.config.ts`. (M2, M3, M6)
7. **Decide the canonical deployment topology** (self-hosted compose vs Render vs VPS+GHCR) and align `.env.example`'s header and all three guides to it. (X1)

## 7. Living-architecture checks (keep this healthy)

Deterministic checks that can run in CI or locally, no manual steps:

```bash
# 1. Declared-vs-imported dependency audit (catches phantom deps like zod)
bunx depcheck --ignores="@types/bun"

# 2. Schema/migration drift (fails when schema.ts changed without a generated migration)
bun run db:generate && git diff --exit-code drizzle/

# 3. Env contract drift (fails when compose/docs pass vars env.ts doesn't know, or vice versa)
#    lightweight: grep the union of env vars across docker-compose.yml, .env.example, src/ and diff against src/lib/env.ts

# 4. Doc freshness gate
#   fail CI if README.md/SERVER_SETUP.md/TRAEFIK_SETUP.md last-touch is >50 commits behind src/ (git log -1 per file)
```

## 8. Limitations

- Static analysis only — the server was not booted, so X3 (which health handler wins) and M5 (unset webhook secret behavior) remain unverified at runtime.
- Runtime evidence (logs, traces, container state) was not available; trust levels are based on code/config/git only.
- The sibling `school-web` frontend and `prd`/`test-app` folders were out of scope.

## 9. Skill transparency

Validated by `architecture-visualization:architecture-health`. No diagram source was produced (validation-only run); if you want the confirmed current-state model as a diagram, run `architecture-visualization:system-modeler` next and use section 2's traceability table as its evidence base.
