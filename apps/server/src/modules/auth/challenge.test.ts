// apps/server/src/modules/auth/challenge.test.ts
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { SignJWT } from 'jose';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { redis } from '../../lib/redis';
import { getClientIp } from '../../lib/ip';
import { hitLimit, localClear } from '../../lib/ratelimit';
import {
  challengeApproveRoutes,
  challengePublicRoutes,
  localChallengeStore,
  sweepLocalChallenges,
} from './challenge';

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

/**
 * The limiters are real state keyed on this admin (approve) and on this test
 * process's peer address (create, which resolves to no peer under `.handle()`);
 * one suite run spends 9 of the admin's 10 approvals per 60 s. Deleting exactly
 * these two keys — not flushing `ratelimit:challenge:*` — makes the file
 * re-runnable inside the same minute while keeping the budgets themselves live.
 */
function testLimiterKeys(adminId: string) {
  const testIp = getClientIp(new Request('http://localhost/login-challenge'));
  return {
    approve: { redis: `ratelimit:challenge:approve:${adminId}`, local: `challenge:approve:${adminId}` },
    create: { redis: `ratelimit:challenge:create:${testIp}`, local: `challenge:create:${testIp}` },
  };
}

beforeAll(async () => {
  const a = await tokenFor('admin');
  adminToken = a.jwt;
  adminId = a.id;
  teacherToken = (await tokenFor('teacher')).jwt;

  const keys = testLimiterKeys(adminId);
  await redis.del(keys.approve.redis, keys.create.redis);
  localClear(keys.approve.local);
  localClear(keys.create.local);
});

afterAll(async () => {
  await db.delete(schema.refreshTokens).where(
    and(eq(schema.refreshTokens.userId, adminId), gte(schema.refreshTokens.createdAt, startedAt)),
  );
});

test('create returns a 24-char id, a hyphenated 6-char code and no-store', async () => {
  const { res, body } = await create();
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe('no-store');
  expect(body.challengeId).toHaveLength(24);
  expect(body.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/);
  expect(new Date(body.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(90_000);
});

test('a fresh challenge polls as pending and carries the requesting device', async () => {
  const { body } = await create();
  const polledRes = await poll(body.challengeId);
  // The plan's constraint is no-store on create AND poll; the create test above pins
  // only its own response, so poll's header is pinned here.
  expect(polledRes.headers.get('cache-control')).toBe('no-store');
  const polled = await polledRes.json() as any;
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

  // The burned record must not leave live credentials readable from the store for
  // the remainder of the ≤90 s TTL: re-read what is actually stored, not what the
  // route chose to answer with.
  const stored = await redis.get(`login_challenge:${body.challengeId}`);
  expect(stored).not.toBeNull();
  const burned = JSON.parse(stored!) as any;
  expect(burned.status).toBe('consumed');
  expect(burned.token).toBeUndefined();
  expect(burned.refreshToken).toBeUndefined();
  expect(burned.user).toBeUndefined();
  expect(stored).not.toContain(first.token);
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

test('a rate-limited create is 429 and still carries no-store', async () => {
  const keys = testLimiterKeys(adminId);
  // Walk the create limiter past its cap through the same hitLimit path the handler
  // uses (31 calls guarantee count > 30 regardless of this window's earlier suite
  // traffic), so the test is agnostic to Redis-vs-local backing.
  for (let i = 0; i < 31; i++) await hitLimit(keys.create.local, 15 * 60);

  const { res } = await create();
  expect(res.status).toBe(429);
  expect(res.headers.get('cache-control')).toBe('no-store');

  await redis.del(keys.create.redis);
  localClear(keys.create.local);
});

test('the fallback sweep drops expired local entries', () => {
  // The 60 s interval's callback is this exact exported function; drive it with an
  // already-expired entry rather than making the suite sleep for a minute.
  const key = 'login_challenge:sweep-probe';
  localChallengeStore.seed(key, -1);
  expect(localChallengeStore.has(key)).toBe(true);
  expect(sweepLocalChallenges()).toBe(1);
  expect(localChallengeStore.has(key)).toBe(false);

  // Control: a live entry survives the same sweep, so the deletion is expiry-driven,
  // not the sweep simply emptying the map.
  localChallengeStore.seed(key, 60_000);
  expect(sweepLocalChallenges()).toBe(0);
  expect(localChallengeStore.has(key)).toBe(true);
  localChallengeStore.drop(key);
});
