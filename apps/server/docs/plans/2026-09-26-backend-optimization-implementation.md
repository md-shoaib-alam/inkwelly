# Backend Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the authenticated read ceiling from ~1,050 req/s (measured 2026-09-26) to ~5,000–7,500 req/s on a single 8–10 vCPU VPS, roughly double login rate, and close the `x-forwarded-for` limiter bypass — without changing the stack.

**Architecture:** Four independent code slices (in-process 5s auth cache → argon2 helper with rehash-on-login → trusted-proxy IP resolution → multi-process Traefik topology), plus a user-scheduled Postgres tuning runbook and a k6 verification runbook. Each slice lands, is unit-tested, and is benchmark-gated before the next.

**Tech Stack:** Bun, Elysia, Drizzle (unchanged), postgres.js, Redis (ioredis), Docker Compose, Traefik, k6.

**Spec:** `server/docs/plans/2026-09-26-backend-optimization-design.md` — read it first; it carries the approved decisions and the "why" behind every number here.

## Global Constraints

- **No git repo** at `D:\per\drizzelfull` (root or `server/`). The template's "Commit" steps become **Checkpoint** steps: run `bun test` + `node node_modules/typescript/bin/tsc --noEmit` (in `server/`) and report; never commit unless the user says so.
- **No endpoint contract changes.** The Expo app is shipped and pins request/response shapes (mobile release constraint).
- **Drizzle stays.** No ORM removal, no language change (spec §8).
- Tests run with `bun test` from `server/`. One pre-existing failure (`route-resolution.test.ts`, needs local DB/Redis) is the known exception — everything else green.
- Env vars go in `process.env` reads (NOT `src/lib/env.ts`'s zod schema) wherever a value must be optional in tests, because `env.ts` calls `process.exit(1)` on a failed parse and would kill unit tests.
- Acceptance gates use k6 **from a separate machine** (the shared-box generator flaw in all current numbers).

---

### Task 1: `authCache.ts` — the 5s in-process cache module

**Files:**
- Create: `server/src/lib/authCache.ts`
- Test: `server/src/lib/authCache.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (Task 2 depends on these exact names):
  - `authCacheKey(token: string): string`
  - `getAuthCache(key: string): AuthCacheEntry | null`
  - `setAuthCache(key: string, entry: Omit<AuthCacheEntry,'expiresAt'>): void`
  - `invalidateForUser(userId: string): void`
  - `clearAuthCache(): void`
  - `authCacheStats(): { size: number; ttlMs: number }`
  - `interface AuthCacheEntry { user: { id: string; exp?: number; [k: string]: any }; tenantId: string | null; dbUser: { name: string; tenantId: string | null }; expiresAt: number }`

- [ ] **Step 1: Write the failing tests**

```ts
// server/src/lib/authCache.test.ts
import { test, expect, beforeEach } from 'bun:test';
import {
  authCacheKey, getAuthCache, setAuthCache,
  invalidateForUser, clearAuthCache, authCacheStats,
} from './authCache';

const entry = (id: string) => ({
  user: { id, exp: Math.floor(Date.now() / 1000) + 600 },
  tenantId: 't1',
  dbUser: { name: 'n', tenantId: 't1' },
});

beforeEach(() => clearAuthCache());

test('miss returns null, hit returns the entry', () => {
  const k = authCacheKey('tok1');
  expect(getAuthCache(k)).toBeNull();
  setAuthCache(k, entry('u1'));
  expect(getAuthCache(k)?.user.id).toBe('u1');
});

test('entries expire after the TTL', async () => {
  process.env.AUTH_CACHE_TTL_MS = '50';
  // module re-reads TTL per call, so no re-import needed
  const k = authCacheKey('tok2');
  setAuthCache(k, entry('u2'));
  await Bun.sleep(80);
  expect(getAuthCache(k)).toBeNull();
  delete process.env.AUTH_CACHE_TTL_MS;
});

test('an entry whose token exp has passed is a miss even inside the TTL', () => {
  const k = authCacheKey('tok3');
  setAuthCache(k, { ...entry('u3'), user: { id: 'u3', exp: Math.floor(Date.now() / 1000) - 1 } });
  expect(getAuthCache(k)).toBeNull();
});

test('invalidateForUser removes every cached token for that user', () => {
  setAuthCache(authCacheKey('a'), entry('u4'));
  setAuthCache(authCacheKey('b'), entry('u4'));
  setAuthCache(authCacheKey('c'), entry('other'));
  invalidateForUser('u4');
  expect(getAuthCache(authCacheKey('a'))).toBeNull();
  expect(getAuthCache(authCacheKey('c'))?.user.id).toBe('other');
});

test('TTL 0 disables caching entirely (rollback knob)', () => {
  process.env.AUTH_CACHE_TTL_MS = '0';
  setAuthCache(authCacheKey('d'), entry('u5'));
  expect(getAuthCache(authCacheKey('d'))).toBeNull();
  expect(authCacheStats().ttlMs).toBe(0);
  delete process.env.AUTH_CACHE_TTL_MS;
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd server && bun test src/lib/authCache.test.ts`
Expected: FAIL — cannot find module `./authCache`.

- [ ] **Step 3: Implement `authCache.ts`**

```ts
// server/src/lib/authCache.ts
// In-process auth result cache. Approved trade-off (spec §2): a logout,
// deactivation or password change takes up to AUTH_CACHE_TTL_MS (default 5000)
// to bite instead of instantly. TTL=0 disables the cache entirely.
import { createHash } from 'node:crypto';

const DEFAULT_TTL_MS = 5000;
const MAX_ENTRIES = 5000;

export interface AuthCacheEntry {
  user: { id: string; exp?: number; [k: string]: any };
  tenantId: string | null;
  dbUser: { name: string; tenantId: string | null };
  expiresAt: number;
}

const cache = new Map<string, AuthCacheEntry>();

function ttlMs(): number {
  const raw = process.env.AUTH_CACHE_TTL_MS;
  const n = raw === undefined ? DEFAULT_TTL_MS : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_MS;
}

export function authCacheKey(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getAuthCache(key: string): AuthCacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const now = Date.now();
  // Belt to the TTL's braces: never outlive the token itself.
  if (now >= entry.expiresAt || (entry.user.exp ?? Infinity) * 1000 <= now) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setAuthCache(key: string, entry: Omit<AuthCacheEntry, 'expiresAt'>): void {
  const ttl = ttlMs();
  if (ttl <= 0) return;
  cache.set(key, { ...entry, expiresAt: Date.now() + ttl });
  if (cache.size > MAX_ENTRIES) {
    // Map iterates insertion-order: dropping from the front evicts oldest-first.
    const now = Date.now();
    for (const [k, e] of cache) {
      if (now >= e.expiresAt || cache.size > MAX_ENTRIES) cache.delete(k);
      else break;
    }
  }
}

export function invalidateForUser(userId: string): void {
  for (const [k, e] of cache) {
    if (e.user?.id === userId) cache.delete(k);
  }
}

export function clearAuthCache(): void {
  cache.clear();
}

export function authCacheStats(): { size: number; ttlMs: number } {
  return { size: cache.size, ttlMs: ttlMs() };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd server && bun test src/lib/authCache.test.ts`
Expected: 5 pass.

- [ ] **Step 5: Checkpoint** — `cd server && bun test` (only the known route-resolution failure) and `node node_modules/typescript/bin/tsc --noEmit`. Report numbers; no commit (no git).

---

### Task 2: Wire the cache into `auth.ts` + invalidation hooks

**Files:**
- Modify: `server/src/lib/auth.ts` (derive at lines 17–106)
- Modify: `server/src/auth/password.ts` (after the transaction, ~line 50)
- Modify: `server/src/graphql/resolvers/auth.resolvers.ts` (`toggleUserStatus`, ~line 118)
- Test: `server/src/lib/auth-cache-flow.test.ts`

**Interfaces:**
- Consumes: Task 1's `authCacheKey/getAuthCache/setAuthCache/invalidateForUser`.
- Produces: `authPlugin` derive returns the identical context shape (`{ user, tenantId, dbUser, _authFailed }`) — unchanged contract. Cache is hit **before** `verifyJWT` (which contains the Redis denylist GET) so hits cost zero IO.

**Rule: only fill the cache when `payload.tenantId` came from the token.** The super-admin dynamic tenant-resolution branch (`auth.ts:73–98`) reads request headers, so its result is not cacheable — those tokens always take the full path (rare, cold path).

- [ ] **Step 1: Write the failing flow test**

The derive closure is not injectable, so the flow test boots a real Elysia app on `listen(0)` (the `ip.test.ts` pattern — `app.handle()` leaves `server` null and skips lifecycle truth). It is integration-flavored and skips without local DB/Redis:

```ts
// server/src/lib/auth-cache-flow.test.ts
import { test, expect } from 'bun:test';
import { authCacheStats, clearAuthCache } from './authCache';
import { signAccessToken } from './jwt';

const hasInfra = !process.env.SKIP_INTEGRATION;

test.skipIf(!hasInfra)('second request for the same token is served from cache (DB/Redis untouched)', async () => {
  const { requireAuth } = await import('./auth');
  const { Elysia } = await import('elysia');
  clearAuthCache();

  // A token for a user that does NOT exist in the DB: first request 401s
  // (proves the DB path ran), and nothing is cached for failures.
  const token = await signAccessToken({ id: 'no-such-user', email: 'x@y.z', role: 'staff', tenantId: 't1' });
  const app = new Elysia().use(requireAuth).get('/probe', () => ({ ok: true })).listen({ port: 0, hostname: '127.0.0.1' });
  try {
    const r = await fetch(`http://127.0.0.1:${(app.server as any).port}/probe`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(401);
    expect(authCacheStats().size).toBe(0); // failures are never cached
  } finally {
    await app.stop();
  }
});
```

The positive-path proof (hit skips IO, deactivation dies ≤5.5 s) is the k6/manual gate in Task 7 — it needs a seeded user; do not fake it here.

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && bun test src/lib/auth-cache-flow.test.ts`
Expected: FAIL or no-op — cache not wired yet (`authCacheStats().size` stays 0 trivially; the test passes only *after* wiring proves failures aren't cached AND Task 7 proves successes are). If it passes pre-wiring, that's expected for this specific assertion — the wiring is still required; proceed.

- [ ] **Step 3: Wire `auth.ts` derive**

Replace the top of the derive (after the `Bearer ` extraction, before `verifyJWT`) and the success return:

```ts
// at top of file
import { authCacheKey, getAuthCache, setAuthCache } from './authCache';

// inside derive, immediately after: const token = authHeader.substring(7);
const cacheKey = authCacheKey(token);
const cached = getAuthCache(cacheKey);
if (cached) {
  return {
    user: cached.user as unknown as AccessTokenPayload,
    tenantId: cached.tenantId,
    dbUser: cached.dbUser,
    _authFailed: false,
  };
}

// replace the final success return (lines ~100–105) with:
if (payload.tenantId) {
  setAuthCache(cacheKey, {
    user: payload as { id: string; exp?: number },
    tenantId,
    dbUser: { name: dbUser.name, tenantId: dbUser.tenantId },
  });
}
return {
  user: payload,
  tenantId,
  dbUser: { name: dbUser.name, tenantId: dbUser.tenantId },
  _authFailed: false,
};
```

All `_authFailed: true` returns stay exactly as they are — failures are never cached.

- [ ] **Step 4: Invalidation hooks**

`server/src/auth/password.ts` — after the `db.transaction` block succeeds (~line 50), before the dataCache clear:

```ts
import { invalidateForUser } from '../lib/authCache';
// ...
invalidateForUser(userId);
```

`server/src/graphql/resolvers/auth.resolvers.ts` — inside `toggleUserStatus`, right after the `db.update(...).set({ isActive })` (~line 118):

```ts
import { invalidateForUser } from '../../lib/authCache';
// ...
invalidateForUser(id);
```

Both are best-effort *local-process* invalidation; cross-process staleness ≤5 s is the approved trade-off.

- [ ] **Step 5: Tests + checkpoint**

Run: `cd server && bun test && node node_modules/typescript/bin/tsc --noEmit`
Expected: all green except the known route-resolution failure. Manual smoke if local DB/Redis are up: log in via `/auth/login`, hit `/auth/me` twice, second hit ~0 DB queries (watch `pg_stat_activity` or logs).

---

### Task 3: `passwords.ts` — argon2 tune + rehash-on-login

**Files:**
- Create: `server/src/lib/passwords.ts`
- Test: `server/src/lib/passwords.test.ts`
- Modify (replace bare `Bun.password.*`): `server/src/auth/login.ts:83`, `server/src/auth/password.ts:23,41`, `server/src/graphql/resolvers/auth.resolvers.ts:43,93,96,170`, `server/src/routes/teachers.ts:42`, `server/src/routes/super-admins.ts:167,215`, `server/src/routes/students.ts:315`, `server/src/routes/staff.ts:128,177`, `server/src/routes/parents.ts:96`, `server/src/routes/exports.ts:317,479`
- Seeds (`src/db/seed*.ts`) keep defaults — test data, not a login path.

**Interfaces:**
- Consumes: nothing.
- Produces: `hashPassword(pw: string): Promise<string>`, `verifyPassword(pw: string, stored: string): Promise<{ valid: boolean; needsRehash: boolean }>`, `PASSWORD_OPTS` (exported for tests).

- [ ] **Step 1: Failing tests**

```ts
// server/src/lib/passwords.test.ts
import { test, expect } from 'bun:test';
import { hashPassword, verifyPassword, PASSWORD_OPTS } from './passwords';

test('hashed password verifies', async () => {
  const h = await hashPassword('S3cret!pass');
  expect(h.startsWith('$argon2')).toBe(true);
  const r = await verifyPassword('S3cret!pass', h);
  expect(r.valid).toBe(true);
  expect(r.needsRehash).toBe(false);
});

test('wrong password is invalid and never asks for a rehash', async () => {
  const h = await hashPassword('S3cret!pass');
  const r = await verifyPassword('wrong', h);
  expect(r.valid).toBe(false);
  expect(r.needsRehash).toBe(false);
});

test('a hash made with Bun defaults needs a rehash under the tuned opts', async () => {
  const legacy = await Bun.password.hash('S3cret!pass'); // 64MB default
  const r = await verifyPassword('S3cret!pass', legacy);
  expect(r.valid).toBe(true);
  expect(r.needsRehash).toBe(true);
  // The upgrade path: rehash output verifies clean afterwards.
  const upgraded = await hashPassword('S3cret!pass');
  expect((await verifyPassword('S3cret!pass', upgraded)).needsRehash).toBe(false);
});

test('opts are the documented tuned values unless env overrides', () => {
  expect(PASSWORD_OPTS.memoryCost).toBe(19456);
  expect(PASSWORD_OPTS.timeCost).toBe(2);
});
```

- [ ] **Step 2: Run, verify FAIL** (module missing).

- [ ] **Step 3: Implement**

```ts
// server/src/lib/passwords.ts
// Single entry point for password hashing. Tuned argon2id (~19 MB) is the
// approved "moderate tune" (spec §4): ~2x faster logins than Bun defaults,
// ~3x less RAM per in-flight login, still an OWASP-grade floor. Old hashes
// stay valid and upgrade themselves via needsRehash on next successful login.
// Env reads stay out of lib/env.ts on purpose: optional in tests.
export const PASSWORD_OPTS = {
  algorithm: 'argon2id' as const,
  memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? 19456),
  timeCost: Number(process.env.ARGON2_TIME_COST ?? 2),
  parallelism: 1,
};

export function hashPassword(pw: string): Promise<string> {
  return Bun.password.hash(pw, PASSWORD_OPTS);
}

export async function verifyPassword(
  pw: string,
  stored: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const valid = await Bun.password.verify(pw, stored);
  return { valid, needsRehash: valid && Bun.password.needsRehash(stored, PASSWORD_OPTS) };
}
```

- [ ] **Step 4: Swap the 16 call sites**

Mechanical: `Bun.password.hash(x)` → `hashPassword(x)`; `await Bun.password.verify(a,b)` → `(await verifyPassword(a,b)).valid` except in `login.ts` (next step). Add the import per file. **`auth/password.ts:22-24` keeps its plaintext-fallback branch** (`dbUser.password === oldPassword` for legacy rows) — only the `$`-prefixed branch changes to `verifyPassword`.

- [ ] **Step 5: Rehash-on-login in `login.ts`**

```ts
// replace line 83:
const { valid: isValid, needsRehash } = await verifyPassword(password, user.password);
// after clearLoginAttempts(ip, account) succeeds (~line 92), fire-and-forget:
if (needsRehash) {
  hashPassword(password)
    .then((fresh) => db.update(users).set({ password: fresh }).where(eq(users.id, user.id)))
    .catch((err) => log.warn({ err, userId: user.id }, 'password rehash failed — login unaffected'));
}
```

A rehash failure must never fail the login (spec §4).

- [ ] **Step 6: Tests + checkpoint** — `bun test`, `tsc --noEmit`, all green.

---

### Task 4: `ip.ts` — trusted-proxy resolution (kills the XFF bypass)

**Files:**
- Modify: `server/src/lib/ip.ts` (full rewrite, 8 lines → ~45)
- Test: `server/src/lib/ip.test.ts` (existing file — first test flips meaning, rest kept)
- Modify: `server/docker-compose.yml` (backend + worker env: `TRUSTED_PROXY_IPS=${TRUSTED_PROXY_IPS:-}`)

**Interfaces:**
- Consumes: `process.env.TRUSTED_PROXY_IPS` (comma list of IPs and/or IPv4 CIDRs; empty/unset = trust nobody = XFF always ignored).
- Produces: `getClientIp(request, server?)` same signature; new exports `isTrustedProxy(ip)`, `ipInCidr(ip, cidr)` for tests.

- [ ] **Step 1: Update the failing tests first**

```ts
// top of server/src/lib/ip.test.ts — add, and REWRITE the first test:
process.env.TRUSTED_PROXY_IPS = '172.18.0.0/16, 127.0.0.1';

test('XFF is honored only when the peer is a listed proxy', () => {
  expect(getClientIp(req({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }), peerServer('172.18.0.5')))
    .toBe('203.0.113.9');
});

test('a non-proxy peer cannot spoof its IP via XFF (the old bypass)', () => {
  expect(getClientIp(req({ 'x-forwarded-for': '1.2.3.4' }), peerServer('203.0.113.9')))
    .toBe('203.0.113.9');
});

test('trusted proxy with no XFF falls back to the peer', () => {
  expect(getClientIp(req(), peerServer('127.0.0.1'))).toBe('127.0.0.1');
});

test('ipInCidr matches correctly', () => {
  expect(ipInCidr('172.18.0.5', '172.18.0.0/16')).toBe(true);
  expect(ipInCidr('172.19.0.5', '172.18.0.0/16')).toBe(false);
  expect(ipInCidr('garbage', '172.18.0.0/16')).toBe(false);
});
```

Keep the existing `omitting server…` and `listen(0)` tests unchanged. Import `ipInCidr` too.

- [ ] **Step 2: Run, verify FAIL** (current code trusts XFF from everyone — the spoof test fails).

- [ ] **Step 3: Implement**

```ts
// server/src/lib/ip.ts
// XFF is trusted ONLY from listed proxies (Traefik in production). Any client
// could otherwise set the header and bypass both login limiters (capacity
// study issue #2). Env read stays out of lib/env.ts on purpose: optional in tests.
function trustedProxies(): string[] {
  return (process.env.TRUSTED_PROXY_IPS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
}

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  if (ipInt === null || baseInt === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((ipInt & mask) >>> 0) === ((baseInt & mask) >>> 0);
}

export function isTrustedProxy(ip: string | null | undefined): boolean {
  if (!ip) return false;
  return trustedProxies().some((e) => (e.includes('/') ? ipInCidr(ip, e) : ip === e));
}

export function getClientIp(request: Request, server?: any): string {
  const peer: string | null = server?.requestIP(request)?.address || null;
  const xff = request.headers.get('x-forwarded-for');
  if (xff && isTrustedProxy(peer)) {
    return xff.split(',')[0]?.trim() || peer || 'anonymous';
  }
  return peer || 'anonymous';
}
```

- [ ] **Step 4: Run, verify PASS.** Then `bun test` + `tsc --noEmit` full checkpoint.

- [ ] **Step 5: Deploy note (goes into Task 5's compose):** production sets `TRUSTED_PROXY_IPS` to Traefik's container IP / docker-network CIDR (e.g. `172.18.0.0/16`). Until it is set, limiter IPs come from the socket — safe default, no bypass.

---

### Task 5: Single-VPS topology — `docker-compose.ha.yml` + runbook

**Files:**
- Create: `server/docker-compose.ha.yml`
- Create: `server/docs/plans/single-vps-topology-runbook.md`
- Modify: `server/docker-compose.yml` — Redis gains `--appendonly yes` (spec §6: must verify persistence; currently absent).

**Interfaces:**
- Consumes: `/api/health` endpoint (`src/index.ts:383`, 503 when degraded) for health checks; `TRUSTED_PROXY_IPS` from Task 4.
- Produces: a compose stack that boots Traefik + 3 pinned Bun APIs + worker on one 4-core box (pinning values are parameterized for bigger boxes).

- [ ] **Step 1: Write `docker-compose.ha.yml`**

```yaml
# 4 vCPU layout (scale up = add backendN, bump cpuset). Rule: API procs = vCPUs - 1.
# Core 0: Traefik + Redis + OS. Cores 1-3: one Bun API each. Worker floats on core 0.
services:
  traefik:
    image: traefik:v3.1
    restart: always
    cpuset: "0"
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.le.acme.tlschallenge=true
      - --certificatesresolvers.le.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
    ports: ["80:80", "443:443"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik-data:/letsencrypt
    networks: [app-network]

  backend1: &backend
    build: { context: ., dockerfile: Dockerfile }
    image: school-backend:secure
    restart: always
    expose: ["4000"]
    cpuset: "1"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=warn
      - TZ=Asia/Kolkata
      - START_WORKERS=false
      - TRUSTED_PROXY_IPS=${TRUSTED_PROXY_IPS:-172.18.0.0/16}
      # …identical env block as docker-compose.yml's backend service…
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:4000/api/health"]
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 20s
    labels:
      - traefik.enable=true
      - traefik.http.routers.api.rule=Host(`${API_HOST}`) && PathPrefix(`/api`)
      - traefik.http.routers.api.entrypoints=websecure
      - traefik.http.routers.api.tls.certresolver=le
      - traefik.http.services.api.loadbalancer.server.port=4000
      - traefik.http.services.api.loadbalancer.healthcheck.path=/api/health
      - traefik.http.services.api.loadbalancer.healthcheck.interval=5s
    networks: [app-network]

  backend2:
    <<: *backend
    cpuset: "2"
    labels:
      - traefik.enable=true
      # Router/service labels declared once on backend1; peers only join the service:
      - traefik.http.services.api.loadbalancer.server.port=4000

  backend3:
    <<: *backend
    cpuset: "3"
    labels:
      - traefik.enable=true
      - traefik.http.services.api.loadbalancer.server.port=4000

  worker:
    image: school-backend:secure
    restart: always
    cpuset: "0"
    environment:
      - START_WORKERS=true
      # …identical env block, START_WORKERS=true…
    networks: [app-network]

networks:
  app-network: { driver: bridge }
```

Notes for the implementer: copy the full env block from `docker-compose.yml`'s `backend` service into the `&backend` anchor (do not abbreviate in the real file); `redis` stays in the base compose (add `--appendonly yes` to its command); Postgres is NOT in this stack (managed node, or see spec §6b for all-in-one).

- [ ] **Step 2: Runbook `single-vps-topology-runbook.md`**

Sections: prerequisites (4 vCPU/**8 GB**+ box — spec §6; `docker compose config` validation), `.env` additions (`TRUSTED_PROXY_IPS`, `API_HOST`, `ACME_EMAIL`, `DATABASE_URL` → private DB IP `10.0.0.13`), bring-up order (redis → backends → traefik → worker), verify (`curl https://$API_HOST/api/health` ×3 peers via `docker logs traefik`), rollback (stop ha stack, start plain `docker-compose.yml`), and the RAM warning for the ₹450 4 GB tier (spec §6).

- [ ] **Step 3: Validate** — `docker compose -f docker-compose.ha.yml config` parses clean; `docker compose up -d` locally if Docker is available (it may not be on this Windows box — then validation is config-parse only, recorded as such, real bring-up happens on the VPS with the user).

- [ ] **Step 4: Checkpoint** — full `bun test` + `tsc --noEmit` (code untouched by this task, must stay green).

---

### Task 6: Postgres tuning runbook (user executes; DB restart is user-scheduled)

**Files:**
- Create: `server/docs/plans/postgres-tuning-runbook.md`

**Interfaces:**
- Consumes: nothing in code.
- Produces: exact SQL + verification queries the user runs in the provider panel / psql.

- [ ] **Step 1: Write the runbook**

```sql
-- Apply on the managed node (10.0.0.13). shared_buffers + pg_stat_statements
-- REQUIRE a restart — schedule the window first (spec §7). Nothing here is run
-- by the plan executor; the user runs it and reports back.
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '10GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET wal_compression = on;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- then: restart via provider panel
-- after restart, verify:
SHOW shared_buffers;              -- expect 4GB
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT count(*) FROM pg_stat_statements;  -- expect > 0 after some traffic
-- Baseline capture BEFORE the restart (for the before/after table):
SELECT now(), setting FROM pg_settings WHERE name IN
  ('shared_buffers','effective_cache_size','work_mem','wal_compression');
```

Plus: `pg_stat_user_indexes` capture query for deferred issue #8, and the off-box `pgbench` one-liner from the capacity doc §10.

- [ ] **Step 2: Checkpoint** — doc exists, nothing to test in code.

---

### Task 7: Verification runbook + acceptance gates (k6)

**Files:**
- Create: `server/docs/plans/optimization-verification-runbook.md`
- Modify: append a results section as gates are run.

**Interfaces:**
- Consumes: Tasks 1–6 landed and deployed; k6 on a **separate machine** (Global Constraint).

- [ ] **Step 1: Write the runbook** — commands copied from the capacity doc §10 (`tight2.js` sweep 10→320 VUs against `https://$API_HOST/api`, `MODE=login` and `MODE=mix` first-ever VPS runs) plus these gates verbatim from spec §11:

| # | Gate | Pass criterion |
| --- | --- | --- |
| G1 | Reads per core after Task 2 | ≥2,400 req/s/core, flat 10→320 VU |
| G2 | Total through Traefik (Task 5) | ≥5,000 req/s, median <50 ms @2,000/s, zero 5xx |
| G3 | `MODE=login` knee (Task 3) | ≥9 logins/s/core; seeded legacy hash shows `needsRehash` upgrade in a live login (check DB row changed) |
| G4 | XFF spoof from non-proxy IP (Task 4) | 5 failures from one spoofed header still hit 429 on the real socket IP |
| G5 | Redis down | fresh token ⇒ 401 immediately; pre-cached token ≤5 s then 401 (approved trade-off) |
| G6 | Deactivation lag | `toggleUserStatus(false)` ⇒ that user's requests 401 within ≤5.5 s |
| G7 | Postgres | `shared_buffers=4GB` live, `pg_stat_statements` counting |

- [ ] **Step 2: Record the not-run list honestly** — any gate not executed (no VPS access this session, generator not off-box, etc.) is written into the runbook as **not-run**, never as passing (capacity-study house rule).

---

## Out of scope (do not drift into these)

Spec §9 deferred: Attendance TEXT-date migration (issue 7), index audit (issue 8), PostHog key (issue 10), Redis-backed fairness limiting, PgBouncer changes, any Drizzle removal or language change.
