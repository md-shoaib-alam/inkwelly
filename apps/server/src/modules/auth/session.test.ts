// apps/server/src/modules/auth/session.test.ts
import { afterAll, beforeAll, expect, spyOn, test } from 'bun:test';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { verifyJWT } from '../../lib/jwt';
import logger from '../../lib/logger';
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

/**
 * The 'Session issued' line is the audit trail for every sign-in (password and, from
 * Task 3, scan-approve). It has to land on the caller's per-request child logger so it
 * keeps the `reqId` binding that ties an issuance back to the request that caused it.
 */
test('issueSession routes the audit line through an injected per-request logger', async () => {
  const calls: Array<{ fields: unknown; msg: string | undefined }> = [];
  await issueSession(await loadAdmin(), {
    ip: '203.0.113.9',
    userAgent: 'SessionTest/1.0',
    log: {
      info: (fields: unknown, msg?: string) => {
        calls.push({ fields, msg });
      },
    },
  });

  const issued = calls.find((c) => c.msg === 'Session issued');
  expect(issued).toBeDefined();
  // Same message and fields as before ({ userId, shared }) — only the sink changes.
  expect(issued!.fields).toEqual({ userId: admin.id, shared: false });
});

test('issueSession falls back to the module logger when no log is injected', async () => {
  const info = spyOn(logger, 'info');
  try {
    await issueSession(await loadAdmin(), {
      ip: '203.0.113.9',
      userAgent: 'SessionTest/1.0',
    });
    const issued = info.mock.calls.find((c: unknown[]) => c[1] === 'Session issued');
    expect(issued).toBeDefined();
    expect(issued![0]).toEqual({ userId: admin.id, shared: false });
  } finally {
    info.mockRestore();
  }
});
