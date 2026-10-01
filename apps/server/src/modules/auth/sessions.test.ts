// apps/server/src/modules/auth/sessions.test.ts
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { SignJWT, jwtVerify } from 'jose';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { hashToken, signRefreshToken } from '../../lib/jwt';
import { randomUUID } from 'node:crypto';
import { issueSession, SHARED_SESSION_HOURS } from './session';
import { sessionsRoutes } from './sessions';
import { refreshRoute } from './refresh';
import { authRoutes } from './index';

/**
 * The device list is the admin's revocation surface, so two things must hold: one user's
 * family never lists another's rows, and a revoke that is not yours revokes nothing.
 */
const startedAt = new Date();
let admin: any;
let other: any;
let adminJwt = '';
let otherJwt = '';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function bearerFor(user: any, claims: Record<string, unknown> = {}) {
  // authPlugin refuses a token issued before the row's own updatedAt.
  const iat = Math.floor(user.updatedAt.getTime() / 1000) + 5;
  return new SignJWT({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, typ: 'access', jti: `sessions-${user.id}`, ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime('5m')
    .sign(secret);
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
const rotate = (refreshToken: string) => refreshRoute.handle(new Request('http://localhost/refresh', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken }),
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

test('revoke-all with a current family spares this device and revokes the rest', async () => {
  await issueSession(await fullUser(admin.id) as any, {
    ip: '198.51.100.20', userAgent: 'Mozilla/5.0 Chrome/126.0',
  });
  const rowA = await newestRow(admin.id);
  await issueSession(await fullUser(admin.id) as any, {
    ip: '198.51.100.21', userAgent: 'Mozilla/5.0 Firefox/128.0',
  });
  const rowB = await newestRow(admin.id);
  expect(rowB.sessionFamily).not.toBe(rowA.sessionFamily);

  const withSidA = await bearerFor(admin, { sid: rowA.sessionFamily });
  const res = await sessionsRoutes.handle(new Request('http://localhost/sessions/revoke-all', {
    method: 'POST', headers: { authorization: `Bearer ${withSidA}` },
  }));
  expect(res.status).toBe(200);

  expect(await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.sessionFamily, rowA.sessionFamily as string),
  })).toBeTruthy();
  expect(await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.sessionFamily, rowB.sessionFamily as string),
  })).toBeUndefined();
  // The survivor must stay signed in: bumping users.updatedAt is what logs the whole
  // account out, so revoke-all-with-sid must leave it untouched.
  const after = await db.query.users.findFirst({ where: eq(schema.users.id, admin.id) });
  expect(after!.updatedAt.getTime()).toBe(admin.updatedAt.getTime());
});

// ── Rotation carry-forward (amended Step 3): family, sign-in instant, shared cap, sid ──

test('a shared rotation keeps the family, the sign-in instant, and holds the 12-hour deadline', async () => {
  const minted = await issueSession(await fullUser(admin.id) as any, {
    ip: '198.51.100.9', userAgent: 'Mozilla/5.0 Chrome/126.0', shared: true,
  });
  const first = await newestRow(admin.id);
  expect(first.isShared).toBe(true);
  expect(first.sessionFamily).toBeTruthy();

  const res = await rotate(minted.refreshToken);
  expect(res.status).toBe(200);
  const body = await res.json() as any;
  expect(body.success).toBe(true);

  // Rotation deletes the presented row and inserts one with the SAME family, so the live
  // row of this family IS the rotated row — read it by family, not by "newest".
  const next = await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.sessionFamily, first.sessionFamily as string),
  });
  expect(next).toBeTruthy();
  expect(next!.sessionFamily).toBe(first.sessionFamily);        // family survives
  expect(next!.isShared).toBe(true);                            // shared flag survives
  expect(next!.createdAt.getTime()).toBe(first.createdAt.getTime()); // sign-in instant carried, not restamped
  expect(next!.lastSeenAt).toBeInstanceOf(Date);                // lastSeenAt written explicitly (no DB default)

  // (c) the cap: a shared rotated row is pinned to sign-in + 12h, never the plain 7 days.
  const fromSignIn = next!.expiresAt.getTime() - next!.createdAt.getTime();
  expect(Math.abs(fromSignIn - SHARED_SESSION_HOURS * 3_600_000)).toBeLessThan(1_000);
  expect(next!.expiresAt.getTime()).toBeLessThanOrEqual(first.expiresAt.getTime() + 1_000);

  // (b) the rotated access token still names the family, so "this device" survives a refresh.
  const claims = await jwtVerify(body.token, secret);
  expect((claims.payload as any).sid).toBe(first.sessionFamily);
});

test('a non-shared rotation keeps the family but still gets the full 7-day window', async () => {
  const minted = await issueSession(await fullUser(admin.id) as any, {
    ip: '198.51.100.10', userAgent: 'Mozilla/5.0 Chrome/126.0',
  });
  const first = await newestRow(admin.id);
  expect(first.isShared).toBe(false);

  const res = await rotate(minted.refreshToken);
  expect(res.status).toBe(200);

  const next = await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.sessionFamily, first.sessionFamily as string),
  });
  expect(next).toBeTruthy();
  expect(next!.sessionFamily).toBe(first.sessionFamily);        // family survives (no new family per rotation)
  expect(next!.isShared).toBe(false);
  expect(next!.createdAt.getTime()).toBe(first.createdAt.getTime()); // carried, not restamped
  // non-shared extends to a fresh 7-day window measured from the rotation instant —
  // this pair with the shared test above is what proves the cap applies to shared mode only.
  expect(next!.expiresAt.getTime()).toBeGreaterThan(first.expiresAt.getTime());
  expect(next!.expiresAt.getTime() - Date.now()).toBeGreaterThan(6 * 24 * 3_600_000);

  // (b) prove the rotated access token decodes with sid === sessionFamily (do not assume it).
  const body = await res.json() as any;
  const claims = await jwtVerify(body.token, secret);
  expect((claims.payload as any).sid).toBe(first.sessionFamily);
});

test('a family with several live rows lists as exactly one entry (latest expiry wins)', async () => {
  const minted = await issueSession(await fullUser(admin.id) as any, {
    ip: '198.51.100.11', userAgent: 'Mozilla/5.0 Firefox/128.0',
  });
  const anchor = await newestRow(admin.id);
  const family = anchor.sessionFamily as string;
  const earlier = new Date(Date.now() + 3_600_000);
  const later = new Date(Date.now() + 9_600_000);

  // Rotation never leaves two live rows in one family (it deletes the presented row), so
  // synthetic rows are the only way to observe DISTINCT ON collapsing several to one.
  await db.insert(schema.refreshTokens).values([
    { token: hashToken('sessions-synthetic-a'), userId: admin.id, userAgent: 'Firefox',
      ipAddress: '198.51.100.11', expiresAt: earlier, sessionFamily: family, lastSeenAt: new Date(), isShared: false },
    { token: hashToken('sessions-synthetic-b'), userId: admin.id, userAgent: 'Firefox',
      ipAddress: '198.51.100.11', expiresAt: later, sessionFamily: family, lastSeenAt: new Date(), isShared: false },
  ]);

  const body = await (await list(adminJwt)).json() as any[];
  const matches = body.filter((s) => s.id === family);
  expect(matches.length).toBe(1);
  // The kept row is the one that can still sign somebody in: the anchor (7 days out) is the
  // latest expiry, beating the two synthetic hours-out rows.
  expect(matches[0].expiresAt).toBe(anchor.expiresAt.toISOString());
  expect(matches[0].known).toBe(true);
});

test('pre-migration orphan rows list with known:false instead of vanishing', async () => {
  const inserted = await db.insert(schema.refreshTokens).values({
    token: hashToken('sessions-orphan-probe'), userId: admin.id, userAgent: 'Mozilla/5.0 Safari/605.1.15',
    ipAddress: '203.0.113.5', expiresAt: new Date(Date.now() + 5 * 24 * 3_600_000),
    sessionFamily: null, lastSeenAt: null, isShared: false,
  }).returning({ id: schema.refreshTokens.id });
  const orphanId = inserted[0]?.id;
  if (!orphanId) throw new Error('orphan probe row was not written');

  const body = await (await list(adminJwt)).json() as any[];
  const orphan = body.find((s) => s.id === orphanId);
  expect(orphan).toBeTruthy();
  expect(orphan.known).toBe(false);
  expect(orphan.current).toBe(false);
  expect(orphan.browser).toBe('Safari');
  expect(orphan.ip).toBe('203.0.113.5');
});

test('a family-less session heals on rotation, so an old sign-in can name itself', async () => {
  // A session minted before the sessionFamily column has no family, and rotation used to
  // carry that NULL forward forever. With no family there is no `sid` claim, so the bearer
  // cannot name "this device" and revoke-all has nothing to spare — which is how signing
  // out of other devices also signed the phone out.
  const signed = await signRefreshToken({ userId: admin.id, tenantId: admin.tenantId ?? null });
  await db.insert(schema.refreshTokens).values({
    token: hashToken(signed.jti), userId: admin.id, userAgent: 'okhttp/4.9.3',
    ipAddress: '198.51.100.44', expiresAt: new Date(Date.now() + 5 * 24 * 3_600_000),
    sessionFamily: null, lastSeenAt: null, isShared: false,
  });

  const res = await rotate(signed.token);
  expect(res.status).toBe(200);
  const body = await res.json() as any;

  const rotated = await jwtVerify(body.refreshToken, secret);
  const next = await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.token, hashToken(rotated.payload.jti as string)),
  });
  expect(next).toBeTruthy();
  expect(next!.sessionFamily).toMatch(/^[0-9a-f-]{36}$/);   // a family was minted, not left NULL
  const healedSid = (await jwtVerify(body.token, secret)).payload.sid;
  expect(healedSid).toBe(next!.sessionFamily);              // and the access token names it

  // The point of healing: this device is now the one revoke-all spares.
  const otherFamily = randomUUID();
  await db.insert(schema.refreshTokens).values({
    token: hashToken(`heal-probe-${otherFamily}`), userId: admin.id, userAgent: 'Mozilla/5.0 Chrome/126.0',
    ipAddress: '198.51.100.45', expiresAt: new Date(Date.now() + 5 * 24 * 3_600_000),
    sessionFamily: otherFamily, lastSeenAt: new Date(), isShared: false,
  });
  const asHealed = await bearerFor(admin, { sid: healedSid as string });
  expect((await sessionsRoutes.handle(new Request('http://localhost/sessions/revoke-all', {
    method: 'POST', headers: { authorization: `Bearer ${asHealed}` },
  }))).status).toBe(200);

  expect(await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.sessionFamily, next!.sessionFamily as string),
  })).toBeTruthy();
  expect(await db.query.refreshTokens.findFirst({
    where: eq(schema.refreshTokens.sessionFamily, otherFamily),
  })).toBeUndefined();
  const after = await db.query.users.findFirst({ where: eq(schema.users.id, admin.id) });
  expect(after!.updatedAt.getTime()).toBe(admin.updatedAt.getTime()); // the whole-account lever stayed alone
});

test('the routes resolve under both /api and /api/v1 through the real authRoutes', async () => {
  // authRoutes carries prefix '/auth' and is .use()'d in both API groups in src/index.ts;
  // a sub-route must not re-declare the prefix or these would 404 at /auth/auth/sessions.
  const api = new Elysia()
    .group('/api/v1', (app) => app.use(authRoutes))
    .group('/api', (app) => app.use(authRoutes));

  const v1 = await api.handle(new Request('http://localhost/api/v1/auth/sessions', {
    headers: { authorization: `Bearer ${adminJwt}` },
  }));
  expect(v1.status).toBe(200);
  expect(Array.isArray(await v1.json())).toBe(true);

  const legacy = await api.handle(new Request('http://localhost/api/auth/sessions', {
    headers: { authorization: `Bearer ${adminJwt}` },
  }));
  expect(legacy.status).toBe(200);

  // The guard travels with the mount, not only with sessionsRoutes.handle(): an anonymous
  // request through the full /api group is refused — the documented "guard enforces nothing
  // when mounted" trap, proven against this route.
  const anon = await api.handle(new Request('http://localhost/api/auth/sessions'));
  expect(anon.status).toBe(401);
});
