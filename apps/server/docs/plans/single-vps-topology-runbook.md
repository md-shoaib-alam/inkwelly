# Single-VPS Topology Runbook (spec §6)

Traefik + 3 core-pinned Bun APIs + worker on one 4 vCPU box. Files:
`docker-compose.yml` (base: redis, pgbouncer, postgres-for-dev, worker) and
`docker-compose.ha.yml` (override: traefik, backend1-3, pinned worker; the base
single `backend` service is switched off via a compose profile).

## Prerequisites

- **Box: 4 vCPU / 8 GB minimum.** The ₹450 Plus tier is 4 GB — spec §6 says do
  NOT run this stack on it (argon2 login bursts + 3 Bun heaps + Redis do not fit
  comfortably). Prefer 4 vCPU/**8 GB** or the current 2 vCPU/7.8 GB box with
  backend3 removed (2 API procs = vCPUs − 1 rule still holds).
- Docker + compose v2 on the VPS.
- Managed Postgres reachable at its private IP (`10.0.0.13`); Redis from the
  base compose file (loopback traffic inside the docker network).
- DNS: `API_HOST` (e.g. `api.yourschool.app`) pointed at the VPS public IP
  before first Traefik start (Let's Encrypt needs it).

## .env additions

```bash
# docker-compose.ha.yml requires:
ACME_EMAIL=you@example.com          # Let's Encrypt notices
API_HOST=api.yourschool.app         # Host() rule for the /api router
TRUSTED_PROXY_IPS=172.18.0.0/16     # Traefik's docker network; verify with:
                                    #   docker network inspect <net> --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'
DATABASE_URL=postgresql://schoolapp:PASSWORD@10.0.0.13:5432/appdb   # least-privilege role
DIRECT_URL=postgresql://schoolapp:PASSWORD@10.0.0.13:5432/appdb
# Optional knobs (defaults shown):
AUTH_CACHE_TTL_MS=5000              # 0 disables the auth cache (rollback lever)
ARGON2_MEMORY_COST=19456
ARGON2_TIME_COST=2
# plus everything the base backend service already needs (JWT_SECRET, R2_*, POSTHOG_*, ...)
```

## Bring-up order

```bash
cd ~/app   # repo checkout on the VPS
docker compose -f docker-compose.yml -f docker-compose.ha.yml config >/dev/null   # fail fast on env
mkdir -p traefik-data && touch traefik-data/acme.json && chmod 600 traefik-data/acme.json
docker compose -f docker-compose.yml -f docker-compose.ha.yml up -d redis pgbouncer
docker compose -f docker-compose.yml -f docker-compose.ha.yml up -d backend1 backend2 backend3
docker compose -f docker-compose.yml -f docker-compose.ha.yml up -d traefik worker
```

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.ha.yml ps      # all healthy
curl -s https://$API_HOST/api/health                                   # {"status":"ok"}
docker logs school-traefik 2>&1 | grep -i backend                      # 3 servers registered
for p in 1 2 3; do docker exec school-saas-api-$p sh -c 'echo core: $(cat /sys/fs/cgroup/cpuset.cpus.effective 2>/dev/null || echo n/a)'; done
```

Then run the k6 gates from `optimization-verification-runbook.md` **from a
separate machine** (never from the VPS itself — that flaw invalidated the
2-process measurement in the capacity study).

## Rollback

```bash
docker compose -f docker-compose.yml -f docker-compose.ha.yml down traefik backend1 backend2 backend3
docker compose -f docker-compose.yml up -d backend    # single-process stack returns
```

Auth-cache-only rollback (no redeploy): set `AUTH_CACHE_TTL_MS=0` and restart
the backends.

## Scaling notes

- **API processes = vCPUs − 1.** On an 8 vCPU box: backend1-7 pinned to cores
  1-7, traefik+redis+worker on core 0.
- Redis `appendonly yes` is now in the base compose — after `up`, confirm with
  `docker exec school-cache redis-cli CONFIG GET appendonly`.
- `PG_POOL_MAX` math: 3 procs × 20 = 60 server connections; the managed node
  allows 200 and pgbouncer (transaction mode, pool 50) sits between. No change
  needed at this scale (spec §6).
