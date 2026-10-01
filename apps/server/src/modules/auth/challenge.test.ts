// apps/server/src/modules/auth/challenge.test.ts
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { SignJWT } from 'jose';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
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
