# Scan-to-Sign-In (QR Login) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable admins to sign into a school computer by scanning a QR code with their phone, plus list and revoke signed-in devices from both web and mobile.

**Architecture:** Three endpoints manage challenge lifecycle (create, poll, approve) stored in Redis with a 90 s TTL; three more expose device/session management backed by the existing `RefreshToken` table, which gains three nullable columns (`sessionFamily`, `lastSeenAt`, `isShared`). A seventh route approves by code alone, for the path where the camera will not focus. Session minting is extracted into one `issueSession()` helper called from both password login and scan-approve.

**Tech Stack:** Bun monorepo (Elysia server, Next.js web, Expo mobile), Drizzle ORM/Postgres, Redis with in-memory fallback, `qrcode` (web, already installed), `expo-camera` (mobile, already installed).

**Spec:** `docs/superpowers/specs/2026-10-01-scan-to-sign-in-design.md` — reachable, binding.

## Global Constraints

- Every route is added **inside `authRoutes`** (`apps/server/src/modules/auth/index.ts`, which has `prefix: '/auth'`). `authRoutes` is `.use()`d in **both** API groups (`apps/server/src/index.ts` `/api/v1` group and legacy `/api` group), so a sub-route lands on both. A sub-instance must **not** re-declare `prefix: '/auth'` — that yields `/auth/auth/...`.
- Authenticated handlers read the caller from the guard's derive: `.use(requireAuth)` puts `user: AccessTokenPayload` (`{ id, email, role, tenantId, iat, jti }`) in the handler context. **Never** parse the `authorization` header by hand in a handler. `requireRoles(['admin'])` is the approve gate.
- Challenge state is Redis-only with an in-memory fallback. Redis is `import { redis } from '../../lib/redis'` and is gated on `redis.status === 'ready'` (`apps/server/src/lib/ratelimit.ts:82` pattern). The fallback Map **must be module-level**; a Map created per call makes every challenge vanish before the next poll.
- `challengeId` = 24 chars from `crypto.getRandomValues` (not `Math.random`). `code` = 5 chars from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (no `0O1IL`), rendered hyphenated `AB-CDE`, compared after uppercasing and stripping `-`.
- Poll interval: 2 s, skipped while `document.visibilityState === 'hidden'`, cleared on unmount, stopped on `approved`/`expired`/`consumed`. **No timer-based regeneration** — a new challenge is created only on mount and on an explicit button press.
- Rate limits use one new primitive, `hitLimit(key, windowSeconds)` in `lib/ratelimit.ts`: create ≤ 30 per IP per 15 min; approve ≤ 10 per user per 60 s; 5 wrong codes per challenge then consumed-as-failed.
- `Cache-Control: no-store` on challenge create and poll responses.
- No `challengeId`, `code`, `token`, or `refreshToken` in any log line.
- Extract **one** `issueSession(user, ctx)` from `apps/server/src/modules/auth/login.ts:103-127` and call it from both password login and scan-approve; do not copy the block. `POST /auth/login`'s response body must stay **byte-identical** (every `tenant*`, `phone`, `address`, `customRole` key) — clients read those fields.
- The `current` device row comes from a new optional `sid` claim in the access token, set to the `sessionFamily` minted at sign-in. There is no other way to tie a request to a session family: the access token carries no session id today.
- Shared-computer mode: the web client keeps the access **and** refresh tokens in module memory (`apps/web/src/lib/api.ts`) and writes **no** `localStorage` entry and a **session** cookie. `setCookie(name, value, days)` from `@/lib/cookies` computes `expires = now + days`, so passing `0` *deletes* the cookie — shared mode must write `document.cookie` without an `expires` attribute.
- No GeoIP exists in this repo (`lib/ip.ts` exports `getClientIp`, `ipInCidr`, `isTrustedProxy` only). The confirm sheet shows the captured `device · browser · IP · relative time`. Never invent a city name.
- Migration is a committed SQL file under `apps/server/drizzle/` **plus** an entry in `apps/server/drizzle/meta/_journal.json` (next `idx` is 20). Apply it by running the committed SQL directly: this repo's `bun run db:migrate` exits 1 locally (`drizzle.__drizzle_migrations` is 6 entries behind the journal — established ruling in the classLevel ledger).
- Server tests hit the real database: import the sub-route Elysia instance and call `.handle(new Request(...))` with a `jose`-signed bearer, exactly as `apps/server/src/modules/academics/classes.routes.test.ts:20-45` does. Docker Desktop gates these; a 5000 ms route timeout means Docker is paused, not that the code broke.
- `cd apps/web && bun test` runs `.ts` logic tests only — there is no `.test.tsx` component suite in this repo. Verify React behaviour in the browser via the network log, never by rendered text alone.
- Typecheck per app (`cd apps/<name> && bun run typecheck`), never root turbo (exit 134), never `npx tsc` (decoy).
- Absolute paths for every Grep; a positive control for every empty result.
- Stage with explicit paths; never `git add -A`; another window shares this tree. Do not push.

---

### Task 1: Database migration and schema for session tracking

**Files:**
- Create: `apps/server/drizzle/0020_session_tracking.sql`
- Modify: `apps/server/drizzle/meta/_journal.json` (append one entry)
- Modify: `apps/server/src/db/schema.ts:82-94` (the `refreshTokens` table)

**Interfaces:**
- Consumes: existing `RefreshToken` table (`apps/server/src/db/schema.ts:82`)
- Produces: columns `sessionFamily text NULL`, `lastSeenAt timestamp NULL`, `isShared boolean DEFAULT false`, index `RefreshToken_userId_sessionFamily_idx`, and the matching Drizzle fields so Tasks 2-4 can insert/select them without `as any`.

- [ ] **Step 1: Write the migration SQL**

```sql
-- apps/server/drizzle/0020_session_tracking.sql
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "sessionFamily" text;
--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "lastSeenAt" timestamp;
--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "isShared" boolean DEFAULT false;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_sessionFamily_idx" ON "RefreshToken" ("userId", "sessionFamily");
```

`IF NOT EXISTS` is required because this file is applied by hand (Step 4) and may be re-run.

- [ ] **Step 2: Register it in the drizzle journal**

Read the tail of `apps/server/drizzle/meta/_journal.json` (its last entry is `idx: 19`, `tag: "0019_class_level_rename"`), then append inside the `entries` array:

```json
    {
      "idx": 20,
      "version": "7",
      "when": <paste the output of `bun -e "console.log(Date.now())"`>,
      "tag": "0020_session_tracking",
      "breakpoints": true
    }
```

Keep the file valid JSON: a comma after the previous entry, no trailing comma. Verify:

Run: `cd apps/server && bun -e "const j=require('./drizzle/meta/_journal.json'); console.log(j.entries.length, j.entries[j.entries.length-1].tag)"`
Expected: `21 0020_session_tracking` (21 = the 20 already there plus this one, since `idx` is 0-based)

- [ ] **Step 3: Add the Drizzle columns**

In `apps/server/src/db/schema.ts`, inside `export const refreshTokens = pgTable('RefreshToken', { … })`, add after `createdAt` (`:90`):

```ts
  sessionFamily: text('sessionFamily'),
  lastSeenAt: timestamp('lastSeenAt'),
  isShared: boolean('isShared').default(false),
```

and in the same table's index callback add alongside the existing two (`:92-93`):

```ts
  userIdFamilyIdx: index('RefreshToken_userId_sessionFamily_idx').on(table.userId, table.sessionFamily),
```

`boolean` must be in the file's `drizzle-orm/pg-core` import list — grep for that import in `D:\per\inkwelly\apps\server\src\db\schema.ts` and add it if missing.

- [ ] **Step 4: Apply the committed SQL directly**

Run from `apps/server`, using `Bun.env.DATABASE_URL` (never `apps/server/.env`'s first `DATABASE_URL` match — that line is a commented-out remote Render URL):

```bash
cd apps/server && psql "$(bun -e 'console.log(Bun.env.DATABASE_URL)')" -v ON_ERROR_STOP=1 -1 -f drizzle/0020_session_tracking.sql
```
Expected: 4 statements, no errors.

- [ ] **Step 5: Verify against `information_schema`, not the file**

```bash
cd apps/server && psql "$(bun -e 'console.log(Bun.env.DATABASE_URL)')" -c "SELECT column_name FROM information_schema.columns WHERE table_name='RefreshToken' AND column_name IN ('sessionFamily','lastSeenAt','isShared') ORDER BY column_name;"
```
Expected: three rows — `isShared`, `lastSeenAt`, `sessionFamily`.

```bash
cd apps/server && psql "$(bun -e 'console.log(Bun.env.DATABASE_URL)')" -c "SELECT indexname FROM pg_indexes WHERE tablename='RefreshToken' AND indexname='RefreshToken_userId_sessionFamily_idx';"
```
Expected: one row.

Positive control for the column query (proves the pattern can return rows): the same SELECT with `column_name IN ('token','userId')` must return 2 rows.

- [ ] **Step 6: Typecheck the server**

Run: `cd apps/server && bun run typecheck`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/server/drizzle/0020_session_tracking.sql apps/server/drizzle/meta/_journal.json apps/server/src/db/schema.ts
git commit -m "feat(db): track session family, last-seen and shared mode on RefreshToken" -- apps/server/drizzle/0020_session_tracking.sql apps/server/drizzle/meta/_journal.json apps/server/src/db/schema.ts
```

---

### Task 2: Server — extract `issueSession()`

**Files:**
- Create: `apps/server/src/modules/auth/session.ts`
- Modify: `apps/server/src/lib/jwt.ts:73-88` (`signAccessToken` gains an optional `sid` claim)
- Modify: `apps/server/src/modules/auth/login.ts:103-140` (call the helper)
- Test: `apps/server/src/modules/auth/session.test.ts` (new)

**Interfaces:**
- Consumes: `signAccessToken`, `signRefreshToken`, `hashToken` (all three from `../../lib/jwt`), `db` from `../../lib/db`, `refreshTokens` from `../../db/schema`, `posthog` from `../../lib/monitoring/posthog`, default `logger` from `../../lib/logger`
- Produces:
  - `issueSession(user: LoginUserRecord, ctx: { ip: string; userAgent: string | null; shared?: boolean }): Promise<{ token: string; refreshToken: string; user: SessionUser }>`
  - `type LoginUserRecord` — the user row exactly as `login.ts:49-63` loads it (`with: { tenant, customRole }`)
  - `type SessionUser` — the `user` object `POST /auth/login` returns today
  - `SHARED_SESSION_HOURS = 12`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/server/src/modules/auth/session.test.ts
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { verifyJWT } from '../lib/jwt';
import { issueSession } from './session';

/**
 * Session minting is now shared by password login and scan-approve, so the row it
 * writes IS the device list. These pin the three new columns and the `sid` claim that
 * makes "This device" resolvable — a mint that loses either would otherwise rename the
 * device list every few minutes.
 */
let admin: any;
const startedAt = new Date();

async function loadAdmin() {
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.role, 'admin'), eq(schema.users.isActive, true)),
    with: {
      tenant: { columns: { id: true, name: true, slug: true, logo: true } },
      customRole: { columns: { id: true, name: true, color: true, permissions: true } },
    },
  });
  if (!user?.tenantId) throw new Error('this database needs an active admin user with a tenant');
  return user;
}

async function newestRow() {
  const row = await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.userId, admin.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  if (!row) throw new Error('issueSession inserted no refresh row');
  return row;
}

beforeAll(async () => {
  admin = await loadAdmin();
});

afterAll(async () => {
  await db.delete(schema.refreshTokens).where(
    and(eq(schema.refreshTokens.userId, admin.id), gte(schema.refreshTokens.createdAt, startedAt)),
  );
});

test('issueSession writes a family, a last-seen stamp and the matching sid claim', async () => {
  const session = await issueSession(await loadAdmin(), {
    ip: '203.0.113.9',
    userAgent: 'SessionTest/1.0',
  });

  expect(session.token).toContain('.');
  expect(session.refreshToken).toContain('.');
  // The response contract password login already has — clients read these keys.
  expect(session.user.tenantSlug).toBe(admin.tenant?.slug ?? null);
  expect(session.user.email).toBe(admin.email);

  const row = await newestRow();
  expect(row.sessionFamily).toBeTruthy();
  expect(row.lastSeenAt).toBeInstanceOf(Date);
  expect(row.isShared).toBe(false);
  expect(row.ipAddress).toBe('203.0.113.9');

  const claims = await verifyJWT(session.token);
  expect((claims as any)?.sid).toBe(row.sessionFamily);
});

test('shared mode issues a 12-hour row, not the 7-day default', async () => {
  const before = Date.now();
  await issueSession(await loadAdmin(), {
    ip: '203.0.113.9',
    userAgent: 'SessionTest/1.0',
    shared: true,
  });

  const row = await newestRow();
  expect(row.isShared).toBe(true);

  const hoursOut = (row.expiresAt.getTime() - before) / 3_600_000;
  expect(hoursOut).toBeGreaterThan(11.9);
  expect(hoursOut).toBeLessThan(12.1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/server && bun test src/modules/auth/session.test.ts`
Expected: FAIL — `Cannot find module './session'`. (If it fails with a Postgres connection error instead, Docker Desktop is paused; start it before continuing.)

- [ ] **Step 3: Write the helper**

```typescript
// apps/server/src/modules/auth/session.ts
import { signAccessToken, signRefreshToken, hashToken } from '../../lib/jwt';
import { db } from '../../lib/db';
import { refreshTokens } from '../../db/schema';
import { posthog } from '../../lib/monitoring/posthog';
import logger from '../../lib/logger';

export const SHARED_SESSION_HOURS = 12;

/** The user row as `login.ts` loads it: the base columns plus the two joins. */
export interface LoginUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  tenant: { id: string; name: string; slug: string; logo: string | null } | null;
  customRole: { id: string; name: string; color: string | null; permissions: string | null } | null;
}

/** The `user` object every client reads out of `POST /auth/login`. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  tenantLogo: string | null;
  phone: string | null;
  address: string | null;
  customRole: { id: string; name: string; color: string | null; permissions: Record<string, unknown> } | null;
}

/**
 * Mints the one session shape this app has: an access token whose `sid` claim names the
 * family, and a refresh row that survives rotation by carrying that family forward.
 * Password login and scan-approve both come through here, so a scanned session is never
 * a lesser session.
 */
export async function issueSession(
  user: LoginUserRecord,
  ctx: { ip: string; userAgent: string | null; shared?: boolean },
): Promise<{ token: string; refreshToken: string; user: SessionUser }> {
  const tenantId = user.tenant?.id || null;
  // Generated first: the access token has to carry it, because a later request can only
  // name "this device" from its own bearer.
  const sessionFamily = crypto.randomUUID();

  const token = await signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId,
    sid: sessionFamily,
  });

  const { token: refreshTokenRaw, jti: refreshJti } = await signRefreshToken({
    userId: user.id,
    tenantId,
  });

  const expiresAt = ctx.shared
    ? new Date(Date.now() + SHARED_SESSION_HOURS * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    token: hashToken(refreshJti),
    userId: user.id,
    tenantId,
    userAgent: ctx.userAgent,
    ipAddress: ctx.ip,
    expiresAt,
    sessionFamily,
    lastSeenAt: new Date(),
    isShared: ctx.shared ?? false,
  });

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    tenantId,
    tenantSlug: user.tenant?.slug || null,
    tenantName: user.tenant?.name || null,
    tenantLogo: user.tenant?.logo || null,
    phone: user.phone,
    address: user.address,
    customRole: user.customRole ? {
      id: user.customRole.id,
      name: user.customRole.name,
      color: user.customRole.color,
      permissions: JSON.parse(user.customRole.permissions || '{}'),
    } : null,
  };

  logger.info({ userId: user.id, shared: ctx.shared ?? false }, 'Session issued');

  posthog.capture({
    distinctId: user.id,
    event: 'user_logged_in',
    properties: {
      email: user.email,
      role: user.role,
      tenantId,
      tenantName: user.tenant?.name || null,
      shared: ctx.shared ?? false,
    },
  });

  return { token, refreshToken: refreshTokenRaw, user: sessionUser };
}
```

- [ ] **Step 4: Let `signAccessToken` carry the family**

In `apps/server/src/lib/jwt.ts`, the `signAccessToken` payload parameter (`:73-78`) gains one optional field. The `SignJWT({ ...payload, typ, jti })` spread at `:81` already forwards it — no other change:

```ts
export async function signAccessToken(
  payload: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
    sid?: string;
  },
  expiresIn: string = ACCESS_TOKEN_EXPIRY
): Promise<string> {
```

If `AccessTokenPayload` (`lib/jwt.ts:17`) lists its fields explicitly, add `sid?: string;` there too — Task 4 reads `user.sid`.

- [ ] **Step 5: Refactor `login.ts` onto the helper**

Replace `apps/server/src/modules/auth/login.ts` lines 103-140 — the inline `signAccessToken`, `signRefreshToken`, `hashToken`, `db.insert(refreshTokens)`, `log.info`, `posthog.capture`, and the `return { success: true, token, refreshToken, user: {…} }` block — with:

```typescript
      const session = await issueSession(user, {
        ip,
        userAgent: request.headers.get('user-agent') || null,
      });

      return { success: true, ...session };
```

Add `import { issueSession } from './session';`. Leave everything above line 103 (rate limiting, user lookup, `isActive`, the plaintext-password refusal, `verifyPassword`, `clearLoginAttempts`, the rehash) untouched, and leave the route's `catch` and body schema untouched. Remove imports that become unused (`signAccessToken`, `signRefreshToken`, `hashToken`, `posthog`) — grep the file for each before removing it.

- [ ] **Step 6: Run the tests**

Run: `cd apps/server && bun test src/modules/auth/session.test.ts`
Expected: 2 pass.

Run: `cd apps/server && bun test src/modules/auth`
Expected: no new failures (compare against the same command run before the change if anything is already red).

- [ ] **Step 7: Prove the response body did not change**

Password login's body is the contract every client reads. With the server on :4000 (`cd apps/server && bun run dev`):

```bash
curl -s -X POST http://localhost:4000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"<admin email from the db>","password":"<its password>"}' \
  | bun -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(Object.keys(j.user).sort().join(','))})"
```
Expected: `address,avatar,customRole,email,id,name,phone,role,tenantId,tenantLogo,tenantName,tenantSlug` — all twelve keys plus `id`.

- [ ] **Step 8: Typecheck and commit**

Run: `cd apps/server && bun run typecheck` → exit 0.

```bash
git add apps/server/src/modules/auth/session.ts apps/server/src/modules/auth/session.test.ts apps/server/src/modules/auth/login.ts apps/server/src/lib/jwt.ts
git commit -m "refactor(auth): one issueSession path for every sign-in" -- apps/server/src/modules/auth/session.ts apps/server/src/modules/auth/session.test.ts apps/server/src/modules/auth/login.ts apps/server/src/lib/jwt.ts
```

---

### Task 3: Server — challenge create, poll and approve

**Files:**
- Create: `apps/server/src/modules/auth/challenge.ts`
- Create: `apps/server/src/lib/user-agent.ts` (shared by Tasks 3 and 4)
- Modify: `apps/server/src/lib/ratelimit.ts` (add `hitLimit`)
- Modify: `apps/server/src/modules/auth/index.ts` (mount both sub-instances)
- Test: `apps/server/src/modules/auth/challenge.test.ts`, `apps/server/src/lib/user-agent.test.ts`

**Interfaces:**
- Consumes: `redis` from `../lib/redis`, `getClientIp(request, server)` from `../lib/ip`, `issueSession` + `LoginUserRecord` from `./session`, `db` from `../lib/db`, `users` from `../db/schema`, `requireRoles` from `../lib/auth`
- Produces:
  - `challengePublicRoutes` — `POST /auth/login-challenge`, `GET /auth/login-challenge/:id`
  - `challengeApproveRoutes` — `POST /auth/login-challenge/approve`, `POST /auth/login-challenge/:id/approve`
  - `APPROVE_ROLES: readonly ['admin']`
  - `parseUserAgent(ua: string | null): { device: string; browser: string }` from `lib/user-agent.ts`
  - `hitLimit(key: string, windowSeconds: number): Promise<number>` from `lib/ratelimit.ts`
  - Pending poll body `{ status:'pending', request: { device, browser, ip, createdAt } }` — the phone needs it to show the approver what they are approving, and it is not secret: the challenge id is in the QR, so all a thief could read is the attacker's own browser data.

- [ ] **Step 1: Add the shared limiter**

Append to `apps/server/src/lib/ratelimit.ts`:

```typescript
/**
 * One fixed-window hit against Redis, or against process RAM when Redis is down, so an
 * endpoint's limiter cannot silently become "no limiter" during an outage. Returns the
 * running count for the window, including this call.
 */
export async function hitLimit(key: string, windowSeconds: number): Promise<number> {
  if (redis.status === 'ready') {
    try {
      return await incrWithWindow(`ratelimit:${key}`, windowSeconds);
    } catch {
      // Fall through to the local counter.
    }
  }
  return localHit(key, windowSeconds * 1000);
}
```

Add one test to `apps/server/src/lib/ratelimit.test.ts`:

```typescript
test('hitLimit counts up inside its window', async () => {
  const key = `test:hitlimit:${crypto.randomUUID()}`;
  expect(await hitLimit(key, 60)).toBe(1);
  expect(await hitLimit(key, 60)).toBe(2);
});
```

Run: `cd apps/server && bun test src/lib/ratelimit.test.ts` → all pass.

- [ ] **Step 2: Add the shared UA parser, with its test**

```typescript
// apps/server/src/lib/user-agent.ts
/**
 * The device list is shown on a phone, so the raw `userAgent` string stored at sign-in
 * must not be the thing the phone has to interpret. Coarse labels only.
 */
export function parseUserAgent(ua: string | null): { device: string; browser: string } {
  const text = ua || '';

  let browser = 'Unknown browser';
  if (/Edg\//.test(text)) browser = 'Edge';
  else if (/Firefox\//.test(text)) browser = 'Firefox';
  else if (/Chrome\//.test(text)) browser = 'Chrome';
  else if (/Safari\//.test(text)) browser = 'Safari';

  let device = 'Desktop';
  if (/Android|iPhone|iPad|iPod|Mobile/.test(text)) device = 'Mobile';
  if (!text) { device = 'Unknown device'; browser = 'Unknown browser'; }

  return { device, browser };
}
```

```typescript
// apps/server/src/lib/user-agent.test.ts
import { expect, test } from 'bun:test';
import { parseUserAgent } from './user-agent';

test('labels a desktop Chrome and a mobile Safari', () => {
  expect(parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36'))
    .toEqual({ device: 'Desktop', browser: 'Chrome' });
  expect(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'))
    .toEqual({ device: 'Mobile', browser: 'Safari' });
  expect(parseUserAgent(null).device).toBe('Unknown device');
});
```

- [ ] **Step 3: Write the failing route tests**

```typescript
// apps/server/src/modules/auth/challenge.test.ts
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { SignJWT } from 'jose';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { challengeApproveRoutes, challengePublicRoutes } from './challenge';

/**
 * A login challenge is a 90-second secret that must burn on use: a code that can be used
 * twice is a code that can be relayed. These pin create, poll, single delivery, the
 * wrong-code budget and the admin-only gate.
 */
const startedAt = new Date();
let adminToken = '';
let teacherToken = '';
let adminId = '';

async function tokenFor(role: 'admin' | 'teacher') {
  const user = await db.query.users.findFirst({ where: eq(schema.users.role, role) });
  if (!user) throw new Error(`this database needs a ${role} user`);
  // authPlugin refuses a token issued before the row's own updatedAt.
  const iat = Math.floor(user.updatedAt.getTime() / 1000) + 5;
  const jwt = await new SignJWT({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, typ: 'access', jti: `challenge-test-${role}` })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  return { jwt, id: user.id };
}

async function create() {
  const res = await challengePublicRoutes.handle(new Request('http://localhost/login-challenge', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
  }));
  return { res, body: await res.json() as any };
}
const poll = (id: string) => challengePublicRoutes.handle(new Request(`http://localhost/login-challenge/${id}`));
const approve = (id: string, code: string, token: string) =>
  challengeApproveRoutes.handle(new Request(`http://localhost/login-challenge/${id}/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  }));

beforeAll(async () => {
  const a = await tokenFor('admin');
  adminToken = a.jwt;
  adminId = a.id;
  teacherToken = (await tokenFor('teacher')).jwt;
});

afterAll(async () => {
  await db.delete(schema.refreshTokens).where(
    and(eq(schema.refreshTokens.userId, adminId), gte(schema.refreshTokens.createdAt, startedAt)),
  );
});

test('create returns a 24-char id, a hyphenated 5-char code and no-store', async () => {
  const { res, body } = await create();
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe('no-store');
  expect(body.challengeId).toHaveLength(24);
  expect(body.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{2}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/);
  expect(new Date(body.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(90_000);
});

test('a fresh challenge polls as pending and carries the requesting device', async () => {
  const { body } = await create();
  const polled = await (await poll(body.challengeId)).json() as any;
  expect(polled.status).toBe('pending');
  expect(polled.request.device).toBeTypeOf('string');
  expect(polled.request.createdAt).toBeTypeOf('string');
});

test('an unknown id is 410 expired, never 404', async () => {
  const res = await poll('no-such-challenge-id-xx');
  expect(res.status).toBe(410);
  expect((await res.json() as any).status).toBe('expired');
});

test('approve needs a bearer and the admin role', async () => {
  const { body } = await create();
  const anon = await challengeApproveRoutes.handle(new Request(
    `http://localhost/login-challenge/${body.challengeId}/approve`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: body.code }),
    }));
  expect(anon.status).toBe(401);
  expect((await approve(body.challengeId, body.code, teacherToken)).status).toBe(403);
});

test('five wrong codes burn the challenge', async () => {
  const { body } = await create();
  const wrong = body.code[0] === 'A' ? `B${body.code.slice(1)}` : `A${body.code.slice(1)}`;
  for (let i = 0; i < 5; i++) {
    const res = await approve(body.challengeId, wrong, adminToken);
    expect([400, 410]).toContain(res.status);
  }
  const last = await approve(body.challengeId, body.code, adminToken);
  expect(last.status).toBe(410);
  expect((await last.json() as any).status).toBe('consumed');
});

test('the right code approves once and the poll delivers the session once', async () => {
  const { body } = await create();
  const res = await approve(body.challengeId, body.code, adminToken);
  expect(res.status).toBe(200);
  const approval = await res.json() as any;
  expect(approval.status).toBe('approved');
  expect(approval.user.email).toBeTypeOf('string');

  const first = await (await poll(body.challengeId)).json() as any;
  expect(first.status).toBe('approved');
  expect(first.token).toBeTypeOf('string');
  expect(first.user.tenantSlug || first.user.tenantId).toBeTruthy();

  const second = await poll(body.challengeId);
  expect(second.status).toBe(410);
  expect((await second.json() as any).status).toBe('consumed');
});

test('the minted row describes the browser, not the phone that approved', async () => {
  const { body } = await create();
  await approve(body.challengeId, body.code, adminToken);
  const row = await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.userId, adminId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  // `create()` sent no user-agent, so the stored UA is the browser's (empty here); the
  // approve call's own agent must not have overwritten it.
  expect(row?.userAgent).toBe('');
  expect(row?.isShared).toBe(false);
});

test('approve by code alone resolves the same challenge', async () => {
  const { body } = await create();
  const res = await challengeApproveRoutes.handle(new Request('http://localhost/login-challenge/approve', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ code: body.code }),
  }));
  expect(res.status).toBe(200);
  expect((await res.json() as any).status).toBe('approved');
});
```

- [ ] **Step 4: Run them to verify they fail**

Run: `cd apps/server && bun test src/modules/auth/challenge.test.ts`
Expected: FAIL — `Cannot find module './challenge'`.

- [ ] **Step 5: Write the challenge module**

```typescript
// apps/server/src/modules/auth/challenge.ts
import { Elysia, t } from 'elysia';
import { redis } from '../../lib/redis';
import { getClientIp } from '../../lib/ip';
import { hitLimit } from '../../lib/ratelimit';
import { parseUserAgent } from '../../lib/user-agent';
import { requireRoles } from '../../lib/auth';
import { db } from '../../lib/db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { issueSession, type LoginUserRecord } from './session';
import logger from '../../lib/logger';

const CHALLENGE_TTL_SEC = 90;
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 5;
const MAX_WRONG_ATTEMPTS = 5;
const CREATE_MAX_PER_IP = 30;
const CREATE_WINDOW_SEC = 15 * 60;
const APPROVE_MAX_PER_USER = 10;
const APPROVE_WINDOW_SEC = 60;

/** Widening sign-in approval past tenant admins is this one list's business. */
export const APPROVE_ROLES = ['admin'] as const;

const challengeKey = (id: string) => `login_challenge:${id}`;
const codeKey = (code: string) => `login_challenge:code:${code}`;

interface ChallengeState {
  code: string;
  status: 'pending' | 'approved' | 'consumed';
  shared: boolean;
  ua: string;
  ip: string;
  createdAt: string;
  /** Absolute deadline; writes reuse the *remaining* life so polling cannot extend the TTL. */
  expiresAt: number;
  wrongAttempts: number;
  token?: string;
  refreshToken?: string;
  user?: unknown;
}

/**
 * Process-local fallback, deliberately module-level: a Map built per call would forget
 * the challenge between the create and the next poll.
 */
const localChallenges = new Map<string, { value: string; expiry: number }>();

async function readState<T>(key: string): Promise<T | null> {
  if (redis.status === 'ready') {
    try {
      const raw = await redis.get(key);
      if (raw === null || raw === undefined) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Redis read failed; the local map is the only remaining truth.
    }
  }
  const entry = localChallenges.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    localChallenges.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

async function writeState(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const raw = JSON.stringify(value);
  const ttl = Math.max(1, Math.ceil(ttlSeconds));
  if (redis.status === 'ready') {
    try {
      await redis.setex(key, ttl, raw);
      return;
    } catch {
      // fall through to local
    }
  }
  localChallenges.set(key, { value: raw, expiry: Date.now() + ttl * 1000 });
}

function remainingTtl(challenge: ChallengeState): number {
  return (challenge.expiresAt - Date.now()) / 1000;
}

function newChallengeId(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(18))).toString('base64url').slice(0, 24);
}

function newCode(): string {
  const chars = Array.from(
    crypto.getRandomValues(new Uint8Array(CODE_LENGTH)),
    (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
  );
  return `${chars.slice(0, 2).join('')}-${chars.slice(2).join('')}`;
}

/** Codes are typed and read aloud: compare on the alphabet, ignoring layout and case. */
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/-/g, '');
}

function noStore(set: any) {
  set.headers['Cache-Control'] = 'no-store';
}

export const challengePublicRoutes = new Elysia()
  .post('/login-challenge', async ({ body, request, server, set }) => {
    const ip = getClientIp(request, server);
    if (await hitLimit(`challenge:create:${ip}`, CREATE_WINDOW_SEC) > CREATE_MAX_PER_IP) {
      set.status = 429;
      return { error: 'Too many sign-in requests from this network. Try again in a few minutes.' };
    }

    const challengeId = newChallengeId();
    const code = newCode();
    const now = Date.now();
    const state: ChallengeState = {
      code,
      status: 'pending',
      shared: body.shared ?? false,
      ua: request.headers.get('user-agent') || '',
      ip,
      createdAt: new Date(now).toISOString(),
      expiresAt: now + CHALLENGE_TTL_SEC * 1000,
      wrongAttempts: 0,
    };

    await writeState(challengeKey(challengeId), state, CHALLENGE_TTL_SEC);
    // The code-only route resolves the same challenge through this index.
    await writeState(codeKey(normalizeCode(code)), challengeId, CHALLENGE_TTL_SEC);

    noStore(set);
    return { challengeId, code, expiresAt: new Date(state.expiresAt).toISOString() };
  }, { body: t.Object({ shared: t.Optional(t.Boolean()) }) })

  .get('/login-challenge/:id', async ({ params, set }) => {
    noStore(set);
    const challenge = await readState<ChallengeState>(challengeKey(params.id));

    if (!challenge || Date.now() > challenge.expiresAt) {
      set.status = 410;
      return { status: 'expired' };
    }

    if (challenge.status === 'approved') {
      const session = {
        status: 'approved',
        token: challenge.token,
        refreshToken: challenge.refreshToken,
        user: challenge.user,
      };
      // Single delivery: burn it now, so the next poll of the same id is a consumed 410
      // rather than a second copy of a live session.
      challenge.status = 'consumed';
      await writeState(challengeKey(params.id), challenge, remainingTtl(challenge));
      return session;
    }

    if (challenge.status === 'consumed') {
      set.status = 410;
      return { status: 'consumed' };
    }

    const { device, browser } = parseUserAgent(challenge.ua);
    return {
      status: 'pending',
      request: { device, browser, ip: challenge.ip, createdAt: challenge.createdAt },
    };
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 64 }) }) });

/**
 * Approve is the only privileged step, and both of its shapes — by id from the QR, by
 * code when the camera will not focus — run through this body, so neither path can drift
 * past the role gate or the wrong-code budget.
 */
async function approveChallenge(
  challenge: ChallengeState | null,
  presentedCode: string,
  approverId: string,
  keyId: string,
) {
  if (!challenge || Date.now() > challenge.expiresAt) {
    return { status: 410 as const, body: { status: 'expired' as const } };
  }
  if (challenge.status !== 'pending') {
    return { status: 410 as const, body: { status: challenge.status as 'approved' | 'consumed' } };
  }

  if (challenge.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
    challenge.status = 'consumed';
    await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
    return { status: 410 as const, body: { status: 'consumed' as const, error: 'Too many failed attempts' } };
  }

  if (normalizeCode(presentedCode) !== normalizeCode(challenge.code)) {
    challenge.wrongAttempts += 1;
    if (challenge.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      challenge.status = 'consumed';
      await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
      return { status: 410 as const, body: { status: 'consumed' as const, error: 'Too many failed attempts' } };
    }
    await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
    return {
      status: 400 as const,
      body: { error: 'Invalid code', remainingAttempts: MAX_WRONG_ATTEMPTS - challenge.wrongAttempts },
    };
  }

  // The session is minted for the approver, never for whoever created the challenge —
  // creating one is anonymous by design.
  const approver = await db.query.users.findFirst({
    where: eq(users.id, approverId),
    with: {
      tenant: { columns: { id: true, name: true, slug: true, logo: true } },
      customRole: { columns: { id: true, name: true, color: true, permissions: true } },
    },
  });
  if (!approver) return { status: 404 as const, body: { error: 'Approver not found' } };

  const session = await issueSession(approver as unknown as LoginUserRecord, {
    // The browser keeps the session, so the row must describe the browser, not the phone
    // that tapped Approve.
    ip: challenge.ip,
    userAgent: challenge.ua,
    shared: challenge.shared,
  });

  challenge.status = 'approved';
  challenge.token = session.token;
  challenge.refreshToken = session.refreshToken;
  challenge.user = session.user;
  await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
  await writeState(codeKey(normalizeCode(challenge.code)), '', 1);

  logger.info({ userId: approver.id, shared: challenge.shared }, 'Login challenge approved');

  return {
    status: 200 as const,
    body: { status: 'approved' as const, user: { name: approver.name, email: approver.email } },
  };
}

async function approveFromContext(keyId: string, presentedCode: string, userId: string, set: any) {
  if (await hitLimit(`challenge:approve:${userId}`, APPROVE_WINDOW_SEC) > APPROVE_MAX_PER_USER) {
    set.status = 429;
    return { error: 'Too many approval attempts. Try again in a minute.' };
  }
  const challenge = await readState<ChallengeState>(challengeKey(keyId));
  const result = await approveChallenge(challenge, presentedCode, userId, keyId);
  set.status = result.status;
  return result.body;
}

export const challengeApproveRoutes = new Elysia()
  .use(requireRoles([...APPROVE_ROLES]))

  .post('/login-challenge/approve', async ({ body, user, set }) => {
    const keyId = await readState<string>(codeKey(normalizeCode(body.code)));
    if (!keyId) {
      set.status = 410;
      return { status: 'expired' };
    }
    return approveFromContext(keyId, body.code, user.id, set);
  }, { body: t.Object({ code: t.String({ minLength: 3, maxLength: 12 }) }) })

  .post('/login-challenge/:id/approve', async ({ params, body, user, set }) =>
    approveFromContext(params.id, body.code, user.id, set), {
    params: t.Object({ id: t.String({ minLength: 1, maxLength: 64 }) }),
    body: t.Object({ code: t.String({ minLength: 3, maxLength: 12 }) }),
  });
```

`requireRoles` is built on `requireAuth`, whose derive is `{ as: 'global' }`, so `user` is in these handlers' context. The guard is registered on the **same instance that declares the routes**, which is what makes it fire — a guard mounted on a different instance enforces nothing (`lib/auth.ts`'s scoped-hooks comment). The `approve needs a bearer and the admin role` test is the proof, not the reading.

- [ ] **Step 6: Mount both sub-instances**

In `apps/server/src/modules/auth/index.ts`, add to the imports:

```typescript
import { challengeApproveRoutes, challengePublicRoutes } from './challenge';
```

mount the public pair with the other public routes (after `.use(refreshRoute)` at `:24`) and the privileged pair with the protected ones after `.use(requireAuth)` at `:53`:

```typescript
  .use(challengePublicRoutes)
  // …
  .use(requireAuth)
  .use(challengeApproveRoutes)
  .use(meRoute)
```

No `prefix` on either — `authRoutes` already carries `/auth`.

- [ ] **Step 7: Run the tests**

Run: `cd apps/server && bun test src/modules/auth/challenge.test.ts src/lib/user-agent.test.ts`
Expected: 9 pass. A 5000 ms timeout on the first call means Docker is paused.

Run: `cd apps/server && bun test src/modules/auth` → no new failures.

- [ ] **Step 8: Prove no secret reaches a log**

```bash
cd apps/server && grep -rn "logger\.\|log\." src/modules/auth/challenge.ts src/modules/auth/session.ts
```
Expected: exactly the two lines this plan writes, logging `{ userId, shared }` — no `challengeId`, `code`, `token` or `refreshToken` in any argument. Positive control: the same grep over `src/modules/auth/login.ts` prints several lines.

- [ ] **Step 9: Typecheck and commit**

Run: `cd apps/server && bun run typecheck` → exit 0.

```bash
git add apps/server/src/modules/auth/challenge.ts apps/server/src/modules/auth/challenge.test.ts apps/server/src/modules/auth/index.ts apps/server/src/lib/user-agent.ts apps/server/src/lib/user-agent.test.ts apps/server/src/lib/ratelimit.ts apps/server/src/lib/ratelimit.test.ts
git commit -m "feat(auth): login challenge endpoints with single-use burn and admin gate" -- apps/server/src/modules/auth/challenge.ts apps/server/src/modules/auth/challenge.test.ts apps/server/src/modules/auth/index.ts apps/server/src/lib/user-agent.ts apps/server/src/lib/user-agent.test.ts apps/server/src/lib/ratelimit.ts apps/server/src/lib/ratelimit.test.ts
```

---

### Task 4: Server — signed-in devices endpoints and rotation carry-forward

**Files:**
- Create: `apps/server/src/modules/auth/sessions.ts`
- Modify: `apps/server/src/modules/auth/index.ts` (mount with the protected routes)
- Modify: `apps/server/src/modules/auth/refresh.ts` (carry `sessionFamily` and `isShared`, stamp `lastSeenAt`)
- Test: `apps/server/src/modules/auth/sessions.test.ts`

**Interfaces:**
- Consumes: `requireAuth` (`user.id`, `user.sid`), the `refreshTokens` table with Task 1's columns, `denyAllRefreshTokens(userId)` from `../lib/jwt`, `parseUserAgent` from `../lib/user-agent`
- Produces:
  - `GET /auth/sessions` → `SessionRow[]`, `SessionRow = { id, device, browser, ip, signedInAt, lastSeenAt, expiresAt, isShared, current, known }`
  - `DELETE /auth/sessions/:ref` → `{ revoked: number }` (`ref` is a `sessionFamily`, or a row `id` for a pre-migration orphan)
  - `POST /auth/sessions/revoke-all` → `{ revoked: true }`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/server/src/modules/auth/sessions.test.ts
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { SignJWT } from 'jose';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { issueSession } from './session';
import { sessionsRoutes } from './sessions';

/**
 * The device list is the admin's revocation surface, so two things must hold: one user's
 * family never lists another's rows, and a revoke that is not yours revokes nothing.
 */
const startedAt = new Date();
let admin: any;
let other: any;
let adminJwt = '';
let otherJwt = '';

async function bearerFor(user: any, claims: Record<string, unknown> = {}) {
  // authPlugin refuses a token issued before the row's own updatedAt.
  const iat = Math.floor(user.updatedAt.getTime() / 1000) + 5;
  return new SignJWT({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, typ: 'access', jti: `sessions-${user.id}`, ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
}

async function fullUser(id: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, id),
    with: {
      tenant: { columns: { id: true, name: true, slug: true, logo: true } },
      customRole: { columns: { id: true, name: true, color: true, permissions: true } },
    },
  });
}

async function newestRow(userId: string) {
  const row = await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.userId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  if (!row) throw new Error('no refresh row was written');
  return row;
}

const list = (token: string) => sessionsRoutes.handle(new Request('http://localhost/sessions', {
  headers: { authorization: `Bearer ${token}` },
}));
const del = (ref: string, token: string) => sessionsRoutes.handle(new Request(`http://localhost/sessions/${ref}`, {
  method: 'DELETE', headers: { authorization: `Bearer ${token}` },
}));

beforeAll(async () => {
  admin = await db.query.users.findFirst({ where: eq(schema.users.role, 'admin') });
  other = await db.query.users.findFirst({ where: eq(schema.users.role, 'teacher') });
  if (!admin || !other) throw new Error('this database needs an admin and a teacher user');
  adminJwt = await bearerFor(admin);
  otherJwt = await bearerFor(other);
});

afterAll(async () => {
  for (const u of [admin, other]) {
    await db.delete(schema.refreshTokens).where(
      and(eq(schema.refreshTokens.userId, u.id), gte(schema.refreshTokens.createdAt, startedAt)),
    );
  }
});

test('listing needs a bearer', async () => {
  const res = await sessionsRoutes.handle(new Request('http://localhost/sessions'));
  expect(res.status).toBe(401);
});

test('the list shows one row per family and marks the caller own family current', async () => {
  const minted = await issueSession(await fullUser(admin.id) as any, {
    ip: '198.51.100.7',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  });
  expect(minted.user.id).toBe(admin.id);

  const row = await newestRow(admin.id);
  // The minted token carries its own family; re-bear it to see `current`.
  const withSid = await bearerFor(admin, { sid: row.sessionFamily });

  const body = await (await list(withSid)).json() as any[];
  const mine = body.find((s) => s.id === row.sessionFamily);
  expect(mine).toBeTruthy();
  expect(mine.current).toBe(true);
  expect(mine.browser).toBe('Chrome');
  expect(mine.ip).toBe('198.51.100.7');
  expect(mine.known).toBe(true);

  const otherView = await (await list(otherJwt)).json() as any[];
  expect(otherView.some((s) => s.id === row.sessionFamily)).toBe(false);
});

test('revoke one deletes that family for the caller only', async () => {
  const row = await newestRow(admin.id);

  const refused = await del(row.sessionFamily as string, otherJwt);
  expect(refused.status).toBe(200);
  expect((await refused.json() as any).revoked).toBe(0);
  expect(await db.query.refreshTokens.findFirst({ where: eq(schema.refreshTokens.id, row.id) })).toBeTruthy();

  const res = await del(row.sessionFamily as string, adminJwt);
  expect(res.status).toBe(200);
  expect((await res.json() as any).revoked).toBeGreaterThanOrEqual(1);
  expect(await db.query.refreshTokens.findFirst({ where: eq(schema.refreshTokens.id, row.id) })).toBeUndefined();
});

test('revoke-all drops every row for the caller', async () => {
  const res = await sessionsRoutes.handle(new Request('http://localhost/sessions/revoke-all', {
    method: 'POST', headers: { authorization: `Bearer ${otherJwt}` },
  }));
  expect(res.status).toBe(200);
  expect(await db.query.refreshTokens.findFirst({ where: eq(schema.refreshTokens.userId, other.id) })).toBeUndefined();
});
```

Run: `cd apps/server && bun test src/modules/auth/sessions.test.ts`
Expected: FAIL — `Cannot find module './sessions'`.

- [ ] **Step 2: Write the sessions module**

```typescript
// apps/server/src/modules/auth/sessions.ts
import { Elysia, t } from 'elysia';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { refreshTokens } from '../../db/schema';
import { denyAllRefreshTokens } from '../../lib/jwt';
import { parseUserAgent } from '../../lib/user-agent';
import { requireAuth } from '../../lib/auth';

export interface SessionRow {
  id: string;
  device: string;
  browser: string;
  ip: string | null;
  signedInAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isShared: boolean;
  /** True for the family that served this request, from the bearer's `sid` claim. */
  current: boolean;
  /** False for pre-migration rows, which have no family to group by. */
  known: boolean;
}

function iso(value: Date | string | null): string {
  if (!value) return new Date(0).toISOString();
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

async function listSessions(userId: string, currentFamily?: string): Promise<SessionRow[]> {
  // Tokens rotate, so one device owns many rows. `DISTINCT ON` keeps the row that can
  // still sign somebody in, which is the one with the latest expiry.
  const families = await db.execute(sql`
    SELECT DISTINCT ON ("sessionFamily")
      "sessionFamily" AS family, "userAgent" AS ua, "ipAddress" AS ip,
      "createdAt" AS signed_in_at, "lastSeenAt" AS last_seen_at,
      "expiresAt" AS expires_at, "isShared" AS is_shared
    FROM "RefreshToken"
    WHERE "userId" = ${userId} AND "sessionFamily" IS NOT NULL
    ORDER BY "sessionFamily", "expiresAt" DESC, "createdAt" DESC
  `);

  // Rows minted before this feature have no family. Listing one row per token is the
  // honest display — and it is the thing that can actually be revoked.
  const orphans = await db.query.refreshTokens.findMany({
    where: and(eq(refreshTokens.userId, userId), isNull(refreshTokens.sessionFamily)),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return [
    ...(families as any[]).map((row) => {
      const { device, browser } = parseUserAgent(row.ua);
      return {
        id: row.family as string,
        device,
        browser,
        ip: row.ip ?? null,
        signedInAt: iso(row.signed_in_at),
        lastSeenAt: iso(row.last_seen_at ?? row.signed_in_at),
        expiresAt: iso(row.expires_at),
        isShared: Boolean(row.is_shared),
        current: Boolean(currentFamily) && row.family === currentFamily,
        known: true,
      };
    }),
    ...orphans.map((row) => {
      const { device, browser } = parseUserAgent(row.userAgent);
      return {
        id: row.id,
        device,
        browser,
        ip: row.ipAddress ?? null,
        signedInAt: iso(row.createdAt),
        lastSeenAt: iso(row.createdAt),
        expiresAt: iso(row.expiresAt),
        isShared: Boolean(row.isShared),
        current: false,
        known: false,
      };
    }),
  ];
}

export const sessionsRoutes = new Elysia()
  .use(requireAuth)

  .get('/sessions', async ({ user }) => listSessions(user.id, user.sid))

  .delete('/sessions/:ref', async ({ params, user }) => {
    // The `userId` predicate is not optional: a family is a UUID, but authorising by the
    // UUID alone is how a cross-tenant read gets written. A ref may name a family, or an
    // orphan row id for sessions minted before this feature.
    const deleted = await db.delete(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, user.id),
        or(
          eq(refreshTokens.sessionFamily, params.ref),
          and(isNull(refreshTokens.sessionFamily), eq(refreshTokens.id, params.ref)),
        ),
      ))
      .returning({ id: refreshTokens.id });

    return { revoked: deleted.length };
  }, { params: t.Object({ ref: t.String({ minLength: 1, maxLength: 64 }) }) })

  .post('/sessions/revoke-all', async ({ user }) => {
    // Deletes every row AND bumps users.updatedAt, which is why revoke-all is immediate
    // while a single-device revoke is not: lib/auth.ts compares the JWT's iat to
    // updatedAt, and that mechanism is whole-account by nature.
    await denyAllRefreshTokens(user.id);
    return { revoked: true };
  });
```

- [ ] **Step 3: Carry the family through rotation**

Read `apps/server/src/modules/auth/refresh.ts:110-150`. The rotation deletes the presented row and inserts a new one — which is exactly why a device list keyed on row ids would rename itself every few minutes. In that insert's `values({ … })`, add:

```typescript
        sessionFamily: existing.sessionFamily ?? null,
        isShared: existing.isShared ?? false,
        lastSeenAt: new Date(),
```

where `existing` is the row the preceding delete returned via `.returning()` (the rotation already reads it to authorise the refresh — use that variable's real name, and extend the `returning()` selection if it does not already carry these three columns). `expiresAt` keeps its existing computation: do not shorten a rotated session, and do not mint a new family here — a fresh family per rotation is the bug this column exists to prevent.

- [ ] **Step 4: Mount the routes**

`apps/server/src/modules/auth/index.ts`: `import { sessionsRoutes } from './sessions';` and mount it in the protected block after `.use(requireAuth)`. `sessionsRoutes` carries its own guard, so position is not load-bearing — keep it readable.

- [ ] **Step 5: Run the tests**

Run: `cd apps/server && bun test src/modules/auth/sessions.test.ts`
Expected: 4 pass.

Run: `cd apps/server && bun test src/modules/auth` → no new failures. If no existing test covers refresh rotation, record that as a residual in the report rather than inventing an assertion that proves nothing; Task 9 case 14 covers rotation live.

- [ ] **Step 6: Typecheck and commit**

Run: `cd apps/server && bun run typecheck` → exit 0.

```bash
git add apps/server/src/modules/auth/sessions.ts apps/server/src/modules/auth/sessions.test.ts apps/server/src/modules/auth/index.ts apps/server/src/modules/auth/refresh.ts
git commit -m "feat(auth): signed-in device list backed by stable session families" -- apps/server/src/modules/auth/sessions.ts apps/server/src/modules/auth/sessions.test.ts apps/server/src/modules/auth/index.ts apps/server/src/modules/auth/refresh.ts
```

---

### Task 5: Web — scan-to-sign-in panel and one shared post-login path

**Files:**
- Modify: `apps/web/src/lib/api.ts` (memory-only tokens, challenge helpers, typed session payload)
- Create: `apps/web/src/modules/auth/lib/apply-session.ts`
- Create: `apps/web/src/modules/auth/components/ScanToSignInPanel.tsx`
- Modify: `apps/web/src/modules/auth/components/Login.tsx` (use `applySession`, mount the panel)
- Test: `apps/web/src/modules/auth/lib/__tests__/apply-session.test.ts`

**Interfaces:**
- Consumes: `POST /auth/login-challenge`, `GET /auth/login-challenge/:id`, `qrcode` (already a dependency, `apps/web/package.json:52`), `useAppStore.getState().login` (`store/app-store/store.ts:94`, typed at `types.ts:37`), `setCookie` from `@/lib/cookies`, `SESSION_EXPIRY_DAYS` from `@/store/app-store/utils`
- Produces:
  - `createLoginChallenge(shared: boolean): Promise<LoginChallenge>`
  - `pollLoginChallenge(id: string): Promise<ChallengePoll>` — normalises the server's 410 into `{ status: 'expired' | 'consumed' }`
  - `applySession(data: SessionPayload, opts?: { shared?: boolean }): void`
  - `<ScanToSignInPanel />`

- [ ] **Step 1: Give the api client a memory-only token pair**

`apps/web/src/lib/api.ts` authenticates from `localStorage` (`getToken` at `:11`), so a shared session that skips `localStorage` today would send **no** `Authorization` header and 401 on its first request. Replace the four token helpers (`:11-28`) with:

```typescript
// A shared-computer session lives only in this document: a reload signs out, which is
// what "leaves nothing on this machine" costs.
let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_token') ?? memoryToken;
}

function setToken(token: string, persist = true): void {
  if (typeof window === 'undefined') return;
  if (persist) localStorage.setItem('school_token', token);
  else memoryToken = token;
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_refresh_token') ?? memoryRefreshToken;
}

function setRefreshToken(token: string, persist = true): void {
  if (typeof window === 'undefined') return;
  if (persist) localStorage.setItem('school_refresh_token', token);
  else memoryRefreshToken = token;
}

/** Called by logout so an in-memory session cannot outlive the sign-out. */
export function clearSessionTokens(): void {
  memoryToken = null;
  memoryRefreshToken = null;
  if (typeof window === 'undefined') return;
  localStorage.removeItem('school_token');
  localStorage.removeItem('school_refresh_token');
}
```

Keep the existing names and the export line at `:373`, and add `clearSessionTokens` to it. Then find every place `logout()` deletes these keys (`grep -n "school_token" apps/web/src/lib/api.ts`) and call `clearSessionTokens()` there instead of the partial removal.

- [ ] **Step 2: Add the typed payload and the two challenge helpers**

Append to `apps/web/src/lib/api.ts`:

```typescript
export interface SessionPayload {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    tenantId: string | null;
    tenantSlug: string | null;
    tenantName: string | null;
    tenantLogo: string | null;
    phone: string | null;
    address: string | null;
    customRole: { id: string; name: string; color: string | null; permissions: Record<string, unknown> } | null;
  };
}

export interface LoginChallenge {
  challengeId: string;
  code: string;
  expiresAt: string;
}

export type ChallengePoll =
  | { status: 'pending'; request: { device: string; browser: string; ip: string; createdAt: string } }
  | { status: 'approved'; token: string; refreshToken: string; user: SessionPayload['user'] }
  | { status: 'expired' }
  | { status: 'consumed' };

export const createLoginChallenge = (shared: boolean) =>
  api.post<LoginChallenge>('/auth/login-challenge', { shared });

/**
 * The server answers an expired or burned challenge with 410 and `request()` throws on
 * any non-2xx, so the terminal states are read from the error body instead of being
 * dressed up as a network failure.
 */
export async function pollLoginChallenge(challengeId: string): Promise<ChallengePoll> {
  try {
    return await api.get<ChallengePoll>(`/auth/login-challenge/${challengeId}`);
  } catch (err) {
    const e = err as { status?: number; body?: { status?: string } };
    if (e.status === 410) {
      return { status: e.body?.status === 'consumed' ? 'consumed' : 'expired' };
    }
    throw err;
  }
}
```

- [ ] **Step 3: Write the failing test**

```typescript
// apps/web/src/modules/auth/lib/__tests__/apply-session.test.ts
import { beforeEach, describe, expect, it } from 'bun:test';

const store = new Map<string, string>();
const cookieWrites: string[] = [];

(globalThis as any).window = {
  location: { href: '' },
  localStorage: {
    setItem: (k: string, v: string) => store.set(k, v),
    getItem: (k: string) => store.get(k) ?? null,
    removeItem: (k: string) => store.delete(k),
  },
};
(globalThis as any).localStorage = (globalThis as any).window.localStorage;
(globalThis as any).document = {};
Object.defineProperty((globalThis as any).document, 'cookie', {
  get: () => cookieWrites.join('; '),
  set: (v: string) => { cookieWrites.push(v); },
});

const { applySession } = await import('../apply-session');
const { useAppStore } = await import('@/store/use-app-store');

const payload = {
  token: 'access.jwt',
  refreshToken: 'refresh.jwt',
  user: {
    id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'admin', avatar: null,
    tenantId: 't1', tenantSlug: 'demo-academy', tenantName: 'Demo', tenantLogo: null,
    phone: null, address: null, customRole: null,
  },
};

beforeEach(() => {
  store.clear();
  cookieWrites.length = 0;
  (globalThis as any).window.location.href = '';
});

describe('applySession', () => {
  it('persists the tokens and seeds the store for a normal computer', () => {
    applySession(payload as any, { shared: false });
    expect(store.get('school_token')).toBe('access.jwt');
    expect(store.get('school_refresh_token')).toBe('refresh.jwt');
    expect(cookieWrites.some((c) => c.startsWith('school_token=access.jwt') && /expires=/i.test(c))).toBe(true);
    expect(useAppStore.getState().currentUser?.id).toBe('u1');
    expect((globalThis as any).window.location.href).toBe('/demo-academy');
  });

  it('writes nothing to disk for a shared computer', () => {
    applySession(payload as any, { shared: true });
    expect(store.size).toBe(0);
    expect(cookieWrites.some((c) => c.startsWith('school_token=access.jwt'))).toBe(true);
    expect(cookieWrites.some((c) => /expires=|max-age=/i.test(c))).toBe(false);
    expect(useAppStore.getState().currentUser?.tenantSlug).toBe('demo-academy');
  });
});
```

Run: `cd apps/web && bun test src/modules/auth/lib/__tests__/apply-session.test.ts`
Expected: FAIL — the module does not exist yet. (If the store's state key is not spelt `currentUser`, read `store/app-store/store.ts` and use the real key — do not weaken the assertion to make it pass.)

- [ ] **Step 4: Write `applySession`**

```typescript
// apps/web/src/modules/auth/lib/apply-session.ts
import { setCookie } from '@/lib/cookies';
import { SESSION_EXPIRY_DAYS } from '@/store/app-store/utils';
import { setRefreshToken, setToken, type SessionPayload } from '@/lib/api';
import { useAppStore, type UserRole } from '@/store/use-app-store';

/**
 * The single post-login path. Password login and scan login both land here, so the
 * tenant launcher, sidebar gating and refresh loop cannot behave differently between the
 * two. `shared` is the one deliberate difference: a shared computer keeps the session in
 * memory and in a session cookie, and writes nothing to disk.
 */
export function applySession(data: SessionPayload, opts: { shared?: boolean } = {}): void {
  const shared = opts.shared ?? false;

  setToken(data.token, !shared);
  if (data.refreshToken) setRefreshToken(data.refreshToken, !shared);

  if (shared) {
    // setCookie(name, value, 0) would DELETE the cookie (it computes expires=now), so
    // shared mode writes the attribute-free form directly.
    document.cookie = `school_token=${data.token}; path=/; SameSite=Lax`;
  } else {
    setCookie('school_token', data.token, SESSION_EXPIRY_DAYS);
  }

  const u = data.user;
  useAppStore.getState().login({
    id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar,
    tenantId: u.tenantId, tenantSlug: u.tenantSlug, tenantName: u.tenantName,
    tenantLogo: u.tenantLogo || null, customRole: u.customRole || null,
  });

  const tenantId = u.tenantSlug || u.tenantId;
  // The tenant root, not `/modules`: only the root dispatcher knows how to find this
  // school's active year (the same reason Login.tsx sends it there).
  window.location.href = tenantId ? `/${tenantId}` : '/modules';
}
```

Verify the two imports before writing: `setToken`/`setRefreshToken` are exported from `@/lib/api` (`:373`), and `useAppStore` + `UserRole` come from the same path `Login.tsx:6` uses. If `AppUser` requires `phone`/`address`, pass them from `u` rather than dropping them.

- [ ] **Step 5: Refactor `Login.tsx` onto the shared path**

In `apps/web/src/modules/auth/components/Login.tsx`, replace the whole `success:` callback body of `toast.promise(loginPromise, { … })` (`:90-108`) with:

```typescript
      success: (data) => {
        applySession(data);
        return `Welcome back, ${data.user.name}!`;
      },
```

add `import { applySession } from '../lib/apply-session';`, and remove the imports that block made exclusive (`setCookie`, `SESSION_EXPIRY_DAYS`, `setRefreshToken`, and `login` from the `:42` destructure if nothing else in the component uses it) — grep the file for each before removing.

- [ ] **Step 6: Write the panel**

```tsx
// apps/web/src/modules/auth/components/ScanToSignInPanel.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';
import { createLoginChallenge, pollLoginChallenge } from '@/lib/api';
import { applySession } from '../lib/apply-session';
import { Button } from '@/components/ui/button';

const POLL_MS = 2000;

type PanelState = 'starting' | 'live' | 'expired' | 'consumed' | 'unavailable';

/**
 * A separate panel, never a second login form: it only ever hands a finished session to
 * applySession(). Regenerating a challenge is always a human press — an unattended login
 * page must not mint a code, poll it 45 times, expire and repeat.
 */
export function ScanToSignInPanel() {
  const [state, setState] = useState<PanelState>('starting');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [shared, setShared] = useState(false);
  const [reason, setReason] = useState<'expired' | 'shared-changed'>('expired');
  // The create call must not re-fire when the checkbox changes, so the value it sends
  // lives in a ref and is absent from the effect's dependency list.
  const sharedRef = useRef(shared);
  sharedRef.current = shared;

  const start = useCallback(async () => {
    setState('starting');
    setQrSrc('');
    setCode('');
    setChallengeId(null);
    try {
      const challenge = await createLoginChallenge(sharedRef.current);
      setCode(challenge.code);
      setQrSrc(await QRCode.toDataURL(`inkwelly://login?c=${challenge.challengeId}`, { width: 200, margin: 1 }));
      setChallengeId(challenge.challengeId);
      setState('live');
    } catch {
      setState('unavailable');
    }
  }, []);

  // One create per mount.
  useEffect(() => { void start(); }, [start]);

  useEffect(() => {
    if (state !== 'live' || !challengeId) return;
    let cancelled = false;

    const tick = async () => {
      // A login page left in a background tab stays silent.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const result = await pollLoginChallenge(challengeId);
        if (cancelled) return;
        if (result.status === 'approved') {
          applySession(
            { token: result.token, refreshToken: result.refreshToken, user: result.user },
            { shared: sharedRef.current },
          );
          return;
        }
        if (result.status === 'expired') { setState('expired'); return; }
        if (result.status === 'consumed') { setState('consumed'); return; }
      } catch {
        // Transient poll failure: keep polling. The challenge dies on its own TTL.
      }
    };

    const timer = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [state, challengeId]);

  const showNewCode = () => { setReason('expired'); void start(); };

  const toggleShared = (next: boolean) => {
    setShared(next);
    // `shared` is stamped on the challenge at create time, so a pending challenge no
    // longer describes what the user just asked for. Stop on the manual regenerate
    // rather than minting a request nobody asked for.
    if (state === 'live') { setReason('shared-changed'); setState('expired'); }
  };

  if (state === 'starting') {
    return (
      <div className="flex h-52 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (state !== 'live') {
    const blocked = state === 'unavailable';
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          {blocked
            ? 'Scan sign-in is unavailable'
            : reason === 'shared-changed'
              ? 'Shared-computer setting changed'
              : 'Code expired'}
        </p>
        <p className="max-w-[28ch] text-xs text-slate-500">
          {blocked
            ? 'Use the password form, or try again in a few minutes.'
            : 'Show a new code and scan it within 90 seconds.'}
        </p>
        {!blocked && <Button size="sm" onClick={showNewCode}>Show a new code</Button>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Have the app?</p>
      <h3 className="text-lg font-semibold text-slate-900">Scan to sign in</h3>
      <p className="max-w-[30ch] text-center text-xs text-slate-500">
        No OTP to wait for. Your phone confirms it&apos;s you.
      </p>

      <img src={qrSrc} alt="Sign-in QR code" className="size-44 rounded-lg border border-slate-200 bg-white p-1" />

      <div className="text-center">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Or type this code</p>
        <p className="font-mono text-xl font-semibold tracking-[0.2em] text-slate-900">{code}</p>
      </div>

      <ol className="w-full space-y-1 text-[11px] text-slate-500">
        <li>1. Open the app and sign in</li>
        <li>2. Tap More, then &quot;Sign in on web&quot;</li>
        <li>3. Scan the code, or type the 5 characters</li>
      </ol>

      <label className="flex w-full items-start gap-2 rounded-lg border border-slate-200 p-2.5">
        <input type="checkbox" checked={shared} onChange={(e) => toggleShared(e.target.checked)} className="mt-0.5" />
        <span className="text-[11px] leading-snug text-slate-600">
          <span className="font-medium text-slate-800">This is a shared computer</span>
          <br />
          Signs out after 12 hours and leaves nothing on this machine. Reloading the page signs you out.
        </span>
      </label>

      <p className="text-[10px] text-slate-400">
        {shared ? 'Shared computer · ' : ''}Code lives for 90 seconds.
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Mount the panel beside the credentials card**

In `Login.tsx`, render `<ScanToSignInPanel />` as the sibling card next to the form — outside `<form>`, on the same card surface the credentials form uses so the two columns match. The panel must not receive `onSubmit`, `router`, or any form state; if it needs them, the split is wrong.

- [ ] **Step 8: Verify**

Run: `cd apps/web && bun test src/modules/auth/lib/__tests__/apply-session.test.ts` → 2 pass.
Run: `cd apps/web && bun run typecheck` → exit 0.

Browser pass (server :4000, `cd apps/web && bun run dev`), read from the **network log**:
1. exactly one `POST /auth/login-challenge` on load;
2. `GET /auth/login-challenge/<id>` every ~2 s while live;
3. the visible code matches the create response's `code`;
4. toggling the checkbox sends **no** POST; clicking "Show a new code" sends exactly one;
5. password login still reaches the tenant root (the shared `applySession` path).

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/modules/auth/lib/apply-session.ts apps/web/src/modules/auth/lib/__tests__/apply-session.test.ts apps/web/src/modules/auth/components/ScanToSignInPanel.tsx apps/web/src/modules/auth/components/Login.tsx
git commit -m "feat(web): scan-to-sign-in panel over one shared post-login path" -- apps/web/src/lib/api.ts apps/web/src/modules/auth/lib/apply-session.ts apps/web/src/modules/auth/lib/__tests__/apply-session.test.ts apps/web/src/modules/auth/components/ScanToSignInPanel.tsx apps/web/src/modules/auth/components/Login.tsx
```

---

### Task 6: Web — signed-in devices dialog

**Files:**
- Modify: `apps/web/src/lib/api.ts` (session helpers)
- Create: `apps/web/src/components/modals/SignedInDevicesModal.tsx`
- Modify: `apps/web/src/components/layout/header.tsx` (account dropdown row)
- Modify: `apps/web/src/components/layout/sidebar/SidebarFooter.tsx` (footer row)
- Modify: `apps/web/src/components/layout/app-layout.tsx` (mount + event listener)

**Interfaces:**
- Consumes: `GET /auth/sessions`, `DELETE /auth/sessions/:ref`, `POST /auth/sessions/revoke-all`; the `open-change-password` event pattern (`app-layout.tsx:386-392`, mounted at `:486-489`)
- Produces: `<SignedInDevicesModal open onOpenChange />` and a `open-signed-in-devices` window event

- [ ] **Step 1: Add the helpers**

Append to `apps/web/src/lib/api.ts` (`del` is this client's delete verb):

```typescript
export interface SignedInDevice {
  id: string;
  device: string;
  browser: string;
  ip: string | null;
  signedInAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isShared: boolean;
  current: boolean;
  known: boolean;
}

export const listSessions = () => api.get<SignedInDevice[]>('/auth/sessions');
export const revokeSession = (ref: string) => api.del<{ revoked: number }>(`/auth/sessions/${ref}`);
export const revokeAllSessions = () => api.post<{ revoked: boolean }>('/auth/sessions/revoke-all');
```

A component must never read the token: `api`'s `buildHeaders()` attaches it and refreshes on a 401.

- [ ] **Step 2: Write the modal**

Read `apps/web/src/components/modals/change-password-modal.tsx` first and match its `Dialog` structure, `Button` usage and toast handling.

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { listSessions, revokeAllSessions, revokeSession, type SignedInDevice } from '@/lib/api';

function remaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours} hours`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

export function SignedInDevicesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [devices, setDevices] = useState<SignedInDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDevices(await listSessions());
    } catch (err) {
      toast.error((err as Error).message || 'Could not load your signed-in devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) void refresh(); }, [open, refresh]);

  const revokeOne = async (d: SignedInDevice) => {
    setBusy(d.id);
    try {
      const { revoked } = await revokeSession(d.id);
      if (revoked === 0) toast.error('That device is no longer signed in');
      else if (d.current) toast.success('This browser will be signed out within 15 minutes');
      else toast.success('Device signed out');
      await refresh();
    } catch (err) {
      toast.error((err as Error).message || 'Could not sign that device out');
    } finally {
      setBusy(null);
    }
  };

  const revokeAll = async () => {
    setBusy('all');
    try {
      await revokeAllSessions();
      onOpenChange(false);
      // denyAllRefreshTokens bumps users.updatedAt, which invalidates access tokens
      // immediately — this browser really is signed out now.
      window.location.href = '/login';
    } catch (err) {
      toast.error((err as Error).message || 'Could not sign out your devices');
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Signed-in devices</DialogTitle>
          <DialogDescription>
            Every machine signed in to this account. Signing one out stops it renewing; the
            session it already holds ends within 15 minutes.
          </DialogDescription>
        </DialogHeader>

        {loading && devices.length === 0 ? (
          <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
        ) : devices.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">No other devices are signed in.</p>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {devices.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {d.browser} · {d.device}{d.current ? ' — this device' : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {d.ip ?? 'no address'} · signed in {new Date(d.signedInAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">last seen {new Date(d.lastSeenAt).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">
                    {d.isShared ? 'Shared computer · ' : ''}expires in {remaining(d.expiresAt)}
                    {d.known ? '' : ' · recorded before device tracking'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-red-600"
                  disabled={busy !== null}
                  onClick={() => void revokeOne(d)}
                >
                  {busy === d.id
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : d.current ? 'Sign out of this browser' : 'Sign out'}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {devices.length > 0 && (
          <Button variant="outline" className="text-red-600" disabled={busy !== null} onClick={() => void revokeAll()}>
            {busy === 'all' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Sign out of all devices
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

No `window.confirm()` and no `console.error` — this repo signals with `toast` from `sonner`.

- [ ] **Step 3: Wire the two entry points and the mount**

Read the "Change password" row at `apps/web/src/components/layout/header.tsx:354` and add a sibling `DropdownMenuItem` labelled **Signed-in devices** whose handler dispatches `new Event('open-signed-in-devices')`, copying that row's icon/className shape. Read `apps/web/src/components/layout/sidebar/SidebarFooter.tsx:88` and add the same row there.

In `apps/web/src/components/layout/app-layout.tsx`:
1. `const [isDevicesOpen, setIsDevicesOpen] = useState(false);` beside the existing `isChangePasswordOpen` state;
2. a listener beside the `open-change-password` one (`:386-392`) that sets it, with matching `removeEventListener` cleanup;
3. `<SignedInDevicesModal open={isDevicesOpen} onOpenChange={setIsDevicesOpen} />` rendered right after `<ChangePasswordModal … />` (`:486-489`).

- [ ] **Step 4: Verify in the browser, from the network log**

Sign in, open the account menu, click **Signed-in devices**, confirm `GET /api/proxy/auth/sessions` returned **200 with an array body** (an empty list and a failure look identical in the DOM). Mint a second session (`curl` the login endpoint) and confirm its row appears; revoke it and confirm the list refreshes without it. Watch the console for hydration/key warnings.

- [ ] **Step 5: Typecheck and commit**

Run: `cd apps/web && bun run typecheck` → exit 0.

```bash
git add apps/web/src/lib/api.ts apps/web/src/components/modals/SignedInDevicesModal.tsx apps/web/src/components/layout/header.tsx apps/web/src/components/layout/sidebar/SidebarFooter.tsx apps/web/src/components/layout/app-layout.tsx
git commit -m "feat(web): signed-in devices dialog on the account affordances" -- apps/web/src/lib/api.ts apps/web/src/components/modals/SignedInDevicesModal.tsx apps/web/src/components/layout/header.tsx apps/web/src/components/layout/sidebar/SidebarFooter.tsx apps/web/src/components/layout/app-layout.tsx
```

---

### Task 7: Mobile — "Sign in on web" screen

**Files:**
- Create: `apps/mobile/src/app/(admin)/(tabs)/sign-in-on-web.tsx`
- Modify: `apps/mobile/src/lib/api.ts` (typed challenge helpers)
- Modify: `apps/mobile/src/app/(admin)/(tabs)/more.tsx` (one admin-only row)

**Interfaces:**
- Consumes: `expo-camera` (`CameraView`, `useCameraPermissions`) as used in `apps/mobile/src/modules/attendance/components/TeacherQRScanModal.tsx`; `ThemedView`/`ThemedText`; `Colors[activeTheme]` from `@/constants/theme` + `useSettings` from `@/store/settings-context`; `api` from `@/lib/api`
- Produces: the pushed route `/(admin)/(tabs)/sign-in-on-web`, plus `getChallengeRequest`, `approveChallengeById`, `approveChallengeByCode`, `approvalErrorMessage`, `ChallengeApproval`

Why a pushed screen and not a sheet: every other More-tab row is a label matched in `more.tsx`'s `onPress` chain (`:200-250`) that calls `router.push('/(admin)/(tabs)/<route>')`. A pushed screen is how this app presents a full-screen flow; a sheet would be the only one.

- [ ] **Step 1: Add the typed helpers**

Append to `apps/mobile/src/lib/api.ts`. `api` already attaches the bearer in `getHeaders()` (`:60-68`), so **no helper takes a token argument**:

```typescript
// ── Scan-to-sign-in ────────────────────────────────────────────────
export interface ChallengeRequestInfo {
  device: string;
  browser: string;
  ip: string | null;
  createdAt: string;
}

export interface ChallengeApproval {
  status: 'approved';
  user: { name: string; email: string };
}

/** Reads the pending challenge's captured browser so the approver sees what they approve. */
export async function getChallengeRequest(challengeId: string): Promise<ChallengeRequestInfo> {
  const body = await api.get<{ status: string; request?: ChallengeRequestInfo }>(
    `/auth/login-challenge/${encodeURIComponent(challengeId)}`,
  );
  if (!body.request) throw new Error('That code is no longer valid.');
  return body.request;
}

export const approveChallengeById = (challengeId: string, code: string) =>
  api.post<ChallengeApproval>(`/auth/login-challenge/${encodeURIComponent(challengeId)}/approve`, { code });

export const approveChallengeByCode = (code: string) =>
  api.post<ChallengeApproval>('/auth/login-challenge/approve', { code });

/** Turns the server's 410/400/403 shapes into what the admin should read. */
export function approvalErrorMessage(err: unknown): string {
  const e = err as { status?: number; body?: { error?: string; status?: string; remainingAttempts?: number } };
  if (e.status === 410) return 'That code is no longer valid. Show a new one on the computer.';
  if (e.status === 400 && typeof e.body?.remainingAttempts === 'number') {
    return `Wrong code. ${e.body.remainingAttempts} attempts left.`;
  }
  if (e.status === 403) return 'Only a school admin can sign in a computer.';
  return e.body?.error || 'Could not sign the browser in. Check your connection.';
}
```

Confirm first that mobile's `request()` attaches `status`/`body` to the errors it throws (`grep -n "status =\|body =" apps/mobile/src/lib/api.ts`). If it exposes only a message, simplify `approvalErrorMessage` to pass the server's message through and say so in the report.

- [ ] **Step 2: Write the screen**

```tsx
// apps/mobile/src/app/(admin)/(tabs)/sign-in-on-web.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useRouter } from 'expo-router';
import {
  approvalErrorMessage,
  approveChallengeByCode,
  approveChallengeById,
  getChallengeRequest,
  type ChallengeApproval,
  type ChallengeRequestInfo,
} from '@/lib/api';

const CHALLENGE_PREFIX = 'inkwelly://login?c=';
const CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{2}-?[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/i;

type Mode = 'camera' | 'code' | 'confirm';

/** A school attendance QR must say "not a sign-in code", not post something. */
function parseChallengeId(data: string): string | null {
  if (!data.startsWith(CHALLENGE_PREFIX)) return null;
  const id = data.slice(CHALLENGE_PREFIX.length).trim();
  return /^[A-Za-z0-9_-]{16,64}$/.test(id) ? id : null;
}

export default function SignInOnWebScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('camera');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<ChallengeRequestInfo | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const confirmChallenge = async (id: string) => {
    setBusy(true);
    try {
      setRequestInfo(await getChallengeRequest(id));
      setChallengeId(id);
      setMode('confirm');
    } catch {
      Alert.alert('Code expired', 'Show a new code on the computer and scan it again.');
    } finally {
      setBusy(false);
    }
  };

  const onScanned = (result: BarcodeScanningResult) => {
    const id = parseChallengeId(result.data);
    if (!id) {
      Alert.alert('Not a sign-in code', 'This QR code is not for signing in on web.');
      return;
    }
    void confirmChallenge(id);
  };

  // Both paths hit the same endpoint with the same code requirement, so no role can be
  // reachable by one path and not the other.
  const approve = async (run: () => Promise<ChallengeApproval>) => {
    setBusy(true);
    try {
      const res = await run();
      Alert.alert('Signed in', `${res.user.name} is signed in on that computer.`);
      router.back();
    } catch (err) {
      Alert.alert('Could not sign in', approvalErrorMessage(err));
      setBusy(false);
    }
  };

  const submitCodeOnly = () => {
    if (!CODE_PATTERN.test(code.trim())) {
      Alert.alert('Wrong format', 'The code is 5 characters, like 2JR-YMP.');
      return;
    }
    void approve(() => approveChallengeByCode(code.trim()));
  };

  const approveScanned = () => {
    if (!challengeId) return;
    if (!CODE_PATTERN.test(code.trim())) {
      Alert.alert('Type the code', 'Enter the 5 characters shown beside the QR code.');
      return;
    }
    void approve(() => approveChallengeById(challengeId, code.trim()));
  };

  if (!permission) {
    return <ThemedView style={styles.center}><ActivityIndicator /></ThemedView>;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.body}>Camera access lets you scan the code instead of typing it.</ThemedText>
        <TouchableOpacity style={styles.primary} onPress={() => void requestPermission()}>
          <ThemedText style={styles.primaryText}>Allow camera</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('code')}>
          <ThemedText style={styles.link}>Type the code instead</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (mode === 'confirm') {
    const ageSec = requestInfo
      ? Math.max(0, Math.round((Date.now() - new Date(requestInfo.createdAt).getTime()) / 1000))
      : 0;
    return (
      <ThemedView style={styles.screen} safeAreaTop>
        <ScrollView contentContainerStyle={styles.padding}>
          <ThemedText type="title">Sign this computer in?</ThemedText>
          <ThemedText style={[styles.body, styles.gap]}>
            {requestInfo
              ? `${requestInfo.browser} · ${requestInfo.device} · ${requestInfo.ip ?? 'unknown address'} · ${ageSec} seconds ago`
              : 'This computer.'}
          </ThemedText>
          <ThemedText style={[styles.muted, styles.gap]}>
            Only approve a machine in front of you. Typing the code proves you can see this
            computer's screen, so a code relayed over a call is not enough.
          </ThemedText>

          <ThemedText type="defaultSemiBold" style={[styles.label, styles.gap]}>Code on the screen</ThemedText>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="2JR-YMP"
            autoCapitalize="characters"
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />

          <TouchableOpacity style={[styles.primary, styles.gap]} onPress={approveScanned} disabled={busy}>
            <ThemedText style={styles.primaryText}>{busy ? 'Approving…' : 'Approve'}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gap} onPress={() => { setMode('camera'); setCode(''); }}>
            <ThemedText style={styles.link}>Cancel</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  if (mode === 'code') {
    return (
      <ThemedView style={styles.screen} safeAreaTop>
        <ScrollView contentContainerStyle={styles.padding}>
          <ThemedText type="title">Type the code</ThemedText>
          <ThemedText style={[styles.body, styles.gap]}>The 5 characters beside the QR code on the computer.</ThemedText>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="2JR-YMP"
            autoCapitalize="characters"
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
          <TouchableOpacity style={[styles.primary, styles.gap]} onPress={submitCodeOnly} disabled={busy}>
            <ThemedText style={styles.primaryText}>{busy ? 'Approving…' : 'Approve'}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gap} onPress={() => setMode('camera')}>
            <ThemedText style={styles.link}>Scan instead</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen} safeAreaTop>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={busy ? undefined : onScanned}
      />
      <View style={styles.footer}>
        <ThemedText type="defaultSemiBold">Point at the QR code on the computer</ThemedText>
        {busy && <ActivityIndicator />}
        <TouchableOpacity onPress={() => setMode('code')}>
          <ThemedText style={styles.link}>Camera not focusing? Type the code</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  padding: { padding: 20, gap: 8 },
  camera: { flex: 1 },
  footer: { padding: 20, gap: 10 },
  body: { fontSize: 14, opacity: 0.8 },
  muted: { fontSize: 12, opacity: 0.65 },
  label: { fontSize: 13 },
  gap: { marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, letterSpacing: 3 },
  primary: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: '#007AFF', fontSize: 14, textAlign: 'center' },
});
```

Check `Colors` really exposes `border` and `text` (`apps/mobile/src/constants/theme.ts`) and use the keys that exist. Gate the **row**, not the screen: a super-admin who reaches the route by any means gets a 403 from `requireRoles(['admin'])`, surfaced by `approvalErrorMessage`.

- [ ] **Step 3: Add the row**

In `apps/mobile/src/app/(admin)/(tabs)/more.tsx`, the *Account Settings* group (`:129-134`) is **not** role-gated today; add the row behind its own condition the way `:136` splices a gated group into an ungated section:

```tsx
      items: [
        { icon: 'person-circle-outline', label: 'Profile Settings', color: '#007AFF' },
        { icon: 'key-outline', label: 'Change Password', color: '#007AFF' },
        ...(user?.role === 'admin' ? [
          { icon: 'desktop-outline', label: 'Sign in on web', color: '#007AFF' },
        ] : []),
      ]
```

`role === 'admin'` **alone**, not the file's `isAdmin` (`:57`, which also matches `super_admin`): showing a button the server will refuse is the defect. Then in the `onPress` label chain (`:200-250`), next to the `Change Password` branch:

```typescript
                    } else if (item.label === 'Sign in on web') {
                      router.push('/(admin)/(tabs)/sign-in-on-web');
```

- [ ] **Step 4: Verify**

Run: `cd apps/mobile && bun run typecheck` → exit 0.
Run: `cd apps/mobile && grep -c "Authorization\|authToken" "src/app/(admin)/(tabs)/sign-in-on-web.tsx"`
Expected: `0` — the screen must not touch the bearer. Positive control: the same grep over `src/lib/api.ts` returns a non-zero count.

Device/emulator pass if a simulator is available; if not, say so in the report rather than claiming it: allow camera, scan a live web panel's QR, confirm the confirm sheet names the browser and IP, approve with the typed code, see the web page reach the tenant root.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/src/app/(admin)/(tabs)/sign-in-on-web.tsx" "apps/mobile/src/app/(admin)/(tabs)/more.tsx" apps/mobile/src/lib/api.ts
git commit -m "feat(mobile): admin-only Sign in on web scanner with typed-code path" -- "apps/mobile/src/app/(admin)/(tabs)/sign-in-on-web.tsx" "apps/mobile/src/app/(admin)/(tabs)/more.tsx" apps/mobile/src/lib/api.ts
```

---

### Task 8: Mobile — Signed-in devices screen

**Files:**
- Create: `apps/mobile/src/app/(admin)/(tabs)/signed-in-devices.tsx`
- Modify: `apps/mobile/src/lib/api.ts` (session helpers)
- Modify: `apps/mobile/src/app/(admin)/(tabs)/more.tsx` (second admin-only row)

**Interfaces:**
- Consumes: `GET /auth/sessions`, `DELETE /auth/sessions/:ref`, `POST /auth/sessions/revoke-all`; the fetch/refresh pattern of `apps/mobile/src/app/(admin)/(tabs)/school-settings.tsx` (`useSettings`, `Colors[activeTheme]`, `RefreshControl`, `Alert`)
- Produces: the pushed route `/(admin)/(tabs)/signed-in-devices`

- [ ] **Step 1: Add the helpers**

Append to `apps/mobile/src/lib/api.ts`:

```typescript
export interface SignedInDevice {
  id: string;
  device: string;
  browser: string;
  ip: string | null;
  signedInAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isShared: boolean;
  current: boolean;
  known: boolean;
}

export const listSignedInDevices = () => api.get<SignedInDevice[]>('/auth/sessions');
export const revokeSignedInDevice = (ref: string) =>
  api.delete<{ revoked: number }>(`/auth/sessions/${encodeURIComponent(ref)}`);
export const revokeAllSignedInDevices = () =>
  api.post<{ revoked: boolean }>('/auth/sessions/revoke-all');
```

- [ ] **Step 2: Write the screen**

```tsx
// apps/mobile/src/app/(admin)/(tabs)/signed-in-devices.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import {
  listSignedInDevices,
  revokeAllSignedInDevices,
  revokeSignedInDevice,
  type SignedInDevice,
} from '@/lib/api';

function remaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours} hours`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

export default function SignedInDevicesScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const [devices, setDevices] = useState<SignedInDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDevices(await listSignedInDevices());
    } catch (err) {
      setError((err as Error).message || 'Could not load your devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const signOneOut = (d: SignedInDevice) => {
    Alert.alert(
      d.current ? 'Sign out of this device?' : 'Sign this device out?',
      d.current
        ? 'This phone stops being able to renew its session, and signs out within 15 minutes.'
        : 'That machine stops renewing. Its current session ends within 15 minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { revoked } = await revokeSignedInDevice(d.id);
              if (revoked === 0) Alert.alert('Already signed out', 'That device is no longer in the list.');
              await load();
            } catch (err) {
              Alert.alert('Could not sign it out', (err as Error).message);
            }
          },
        },
      ],
    );
  };

  const signAllOut = () => {
    Alert.alert(
      'Sign out of every device?',
      'Every machine including this one is signed out immediately. You will need your password again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out everywhere',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeAllSignedInDevices();
              await load();
            } catch (err) {
              Alert.alert('Could not sign out', (err as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.screen} safeAreaTop>
      <ScrollView
        contentContainerStyle={styles.padding}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(); }}
            colors={['#007AFF']}
            tintColor={colors.text}
          />
        )}
      >
        <ThemedText type="title">Signed-in devices</ThemedText>
        <ThemedText style={styles.muted}>
          Every machine holding a session for this account. Signing one out stops it renewing;
          the session it already holds ends within 15 minutes.
        </ThemedText>

        {error && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: '#FF3B30' }]}>
            <ThemedText style={styles.body}>{error}</ThemedText>
            <TouchableOpacity onPress={() => void load()}>
              <ThemedText style={styles.link}>Try again</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {!error && !loading && devices.length === 0 && (
          <ThemedText style={[styles.body, styles.gap]}>No devices are signed in.</ThemedText>
        )}

        {devices.map((d) => (
          <View key={d.id} style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.body}>
              {d.browser} · {d.device}{d.current ? '  (this device)' : ''}
            </ThemedText>
            <ThemedText style={styles.muted}>
              {d.ip ?? 'no address'} · signed in {new Date(d.signedInAt).toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.muted}>last seen {new Date(d.lastSeenAt).toLocaleString()}</ThemedText>
            <ThemedText style={styles.muted}>
              {d.isShared ? 'Shared computer · ' : ''}expires in {remaining(d.expiresAt)}
              {d.known ? '' : ' · recorded before device tracking'}
            </ThemedText>
            <TouchableOpacity style={styles.revoke} onPress={() => signOneOut(d)}>
              <Ionicons name="close-circle-outline" size={16} color="#FF3B30" />
              <ThemedText style={styles.revokeText}>{d.current ? 'Sign out of this device' : 'Sign out'}</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {devices.length > 0 && (
          <TouchableOpacity style={styles.revoke} onPress={signAllOut}>
            <Ionicons name="log-out-outline" size={16} color="#FF3B30" />
            <ThemedText style={styles.revokeText}>Sign out of all devices</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padding: { padding: 16, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  body: { fontSize: 14 },
  muted: { fontSize: 12, opacity: 0.65 },
  gap: { marginTop: 8 },
  revoke: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  revokeText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  link: { color: '#007AFF', fontSize: 14 },
});
```

Unlike the web row, revoking **this** phone is offered: the warning states the 15-minute cost before the destructive tap, and the phone is not the only way back into the tool the way a shared browser is.

- [ ] **Step 3: Add the row**

Extend the same `user?.role === 'admin'` spread from Task 7:

```tsx
          { icon: 'laptop-outline', label: 'Signed-in devices', color: '#007AFF' },
```

and in the `onPress` label chain:

```typescript
                    } else if (item.label === 'Signed-in devices') {
                      router.push('/(admin)/(tabs)/signed-in-devices');
```

- [ ] **Step 4: Verify**

Run: `cd apps/mobile && bun run typecheck` → exit 0.
Device pass (or state the gap in the report): rows carry a browser, an address and an expiry; the phone's own row reads "(this device)"; revoking another row drops it from the list **and** from the web dialog.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/src/app/(admin)/(tabs)/signed-in-devices.tsx" "apps/mobile/src/app/(admin)/(tabs)/more.tsx" apps/mobile/src/lib/api.ts
git commit -m "feat(mobile): signed-in devices screen with per-device and full revoke" -- "apps/mobile/src/app/(admin)/(tabs)/signed-in-devices.tsx" "apps/mobile/src/app/(admin)/(tabs)/more.tsx" apps/mobile/src/lib/api.ts
```

---

### Task 9: End-to-end verification pass

**Files:** none — verification only. A failure here is a finding for the task that owns the code, not something to patch in this task.

**Interfaces:**
- Consumes: Tasks 1-8
- Produces: the recorded verification report and an honest residual list

- [ ] **Step 1: Full test and typecheck sweep**

```bash
cd apps/server && bun run typecheck && bun test src/modules/auth src/lib/ratelimit.test.ts src/lib/user-agent.test.ts 2>&1 | tail -20
cd apps/web && bun run typecheck && bun test src/modules/auth 2>&1 | tail -20
cd apps/mobile && bun run typecheck
```
Expected: every command exits 0.

- [ ] **Step 2: Live HTTP cases**

With the server on :4000, read **status and body** for each — never just a 200:

| # | Case | Expected |
|---|---|---|
| 1 | `POST /api/auth/login-challenge {}` | 200, `challengeId` 24 chars, `code` `XX-XXX`, `cache-control: no-store` |
| 2 | `GET /api/auth/login-challenge/<id>` | 200 `{status:'pending', request:{device,browser,ip,createdAt}}` |
| 3 | `POST …/approve` on that id, no bearer | 401 |
| 4 | same with a teacher bearer | 403 |
| 5 | admin bearer, wrong code ×5 | 400 ×4 then 410 `consumed`; the correct code after that is refused |
| 6 | fresh challenge, admin bearer, right code | 200 `{status:'approved', user:{name,email}}` |
| 7 | poll that id twice | first 200 with `token`/`refreshToken`/`user`; second 410 `consumed` |
| 8 | `POST /api/v1/auth/login-challenge {}` | 200 — both API groups serve it |
| 9 | `GET /api/auth/sessions` with the minted token | 200 array; the new family flagged `current: true` |
| 10 | `DELETE /api/auth/sessions/<family>` with a **different** user's bearer | `{revoked:0}` and the row survives |
| 11 | same with the owning bearer | `{revoked:1}` and the row is gone |
| 12 | `POST /api/v1/auth/sessions/revoke-all` | 200, and a guarded request with the old bearer now fails |
| 13 | `POST /api/auth/login-challenge {shared:true}` → approve → poll → read the DB | newest row `isShared = true`, `expiresAt ≈ 12 h` out |
| 14 | rotate: sign in normally, `POST /api/auth/refresh` twice | `GET /auth/sessions` still shows **one** row for that family, with `lastSeenAt` moved |

DB read for 13/14: `SELECT "sessionFamily","isShared","lastSeenAt","expiresAt" FROM "RefreshToken" ORDER BY "createdAt" DESC LIMIT 3;`

- [ ] **Step 3: Browser pass, proven from the network log**

Complete one real scan flow (web panel → phone → typed code → Approve → tenant root). Then confirm:
- one `POST /auth/login-challenge` per "Show a new code" click, none on a checkbox toggle;
- polls stop while the tab is hidden (hide it ~10 s and count requests);
- password login returns the same `user` keys it did before Task 2;
- shared mode: `localStorage.getItem('school_token')` is `null`, the cookie has no `expires`, and a hard reload lands on the login page.

- [ ] **Step 4: Runtime proof of the `sid` claim**

`sid` is load-bearing for "This device", so prove it at runtime rather than by typecheck:

```bash
cd apps/server && bun -e "const t='<access token from the poll>';const c=JSON.parse(Buffer.from(t.split('.')[1],'base64url'));console.log(c.sid)"
```
Expected: the value equals a `sessionFamily` in `GET /auth/sessions`' body.

- [ ] **Step 5: Secret-leak audit with a positive control**

```bash
cd apps/server && grep -rn "logger\.\|log\." src/modules/auth/challenge.ts src/modules/auth/sessions.ts src/modules/auth/session.ts
cd apps/server && grep -rn "challengeId\|refreshToken" src/modules/auth/challenge.ts | grep -i "logger\.\|log\."
```
Expected: the first prints the two `{ userId, shared }` lines only; the second prints nothing. Positive control for the second: drop the `| grep -i "logger…"` filter and it prints many lines.

- [ ] **Step 6: Record residuals honestly**

List every check not run and why (no simulator, Docker paused, a case skipped). Never describe an unrun check as passing. Write the report to the SDD workspace as `task-9-report.md`.

- [ ] **Step 7: Commit nothing**

This task produces no commit. If a fix is genuinely needed, report it with the file and line; it belongs to the task that owns it.
