// apps/server/src/modules/auth/sessions.ts
import { Elysia, t } from 'elysia';
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { refreshTokens } from '../../db/schema';
import { denyAllRefreshTokens } from '../../lib/jwt';
import { parseUserAgent } from '../../lib/user-agent';
import { requireAuth } from '../../lib/auth';

export interface SessionRow {
  id: string;
  device: string;
  browser: string;
  os: string;
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
  if (value instanceof Date) return value.toISOString();
  // The raw DISTINCT ON query (db.execute) returns `timestamp without time zone` columns as
  // naive UTC wall-clock strings ("2026-10-08 17:21:14.661") with no zone marker. A bare
  // `new Date(...)` parses those as LOCAL time, which shifts every family row's timestamps
  // by the server's UTC offset (5.5 h on this Asia/Kolkata machine). Treat the naive form
  // as the UTC it already is.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)) {
    const normalized = value.replace(' ', 'T');
    // Only append the UTC marker when the string does not already carry an offset —
    // "…+05:30Z" is unparseable. (timestamp-without-tz never emits one today.)
    return new Date(/[+-]\d{2}:?\d{2}$|Z$/i.test(normalized) ? normalized : normalized + 'Z').toISOString();
  }
  return new Date(value).toISOString();
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
      const { device, browser, os } = parseUserAgent(row.ua);
      return {
        id: row.family as string,
        device,
        browser,
        os,
        ip: row.ip ?? null,
        signedInAt: iso(row.signed_in_at),
        lastSeenAt: iso(row.last_seen_at ?? row.signed_in_at),
        expiresAt: iso(row.expires_at),
        isShared: Boolean(row.is_shared),
        current: row.family === currentFamily,
        known: true,
      };
    }),
    ...orphans.map((row) => {
      const { device, browser, os } = parseUserAgent(row.userAgent);
      return {
        id: row.id,
        device,
        browser,
        os,
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
    const current = user.sid;
    if (!current) {
      // A token without an sid claim can't name this device, so nothing can be spared:
      // this deletes every row AND bumps users.updatedAt, which is why it is immediate —
      // lib/auth.ts compares the JWT's iat to updatedAt, and that is whole-account by nature.
      await denyAllRefreshTokens(user.id);
      return { revoked: true };
    }
    // Spare this device's family and leave users.updatedAt alone — that bump is the
    // whole-account sign-out lever. Revoked devices lose refresh immediately; their
    // access tokens die within 15 min (same semantics as a single-device revoke).
    await db.delete(refreshTokens).where(and(
      eq(refreshTokens.userId, user.id),
      or(isNull(refreshTokens.sessionFamily), ne(refreshTokens.sessionFamily, current)),
    ));
    return { revoked: true };
  });
