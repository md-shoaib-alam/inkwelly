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

/**
 * Anything that logs in the pino call order the whole app already uses:
 * `log.info({ fields }, 'message')`. Callers hand in their per-request child logger
 * (which carries `reqId`) so the security-relevant 'Session issued' line stays tied to
 * the request that produced it; `issueSession` defaults to the module logger otherwise.
 */
export type SessionLogger = { info: (fields: unknown, msg?: string) => void };

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
  ctx: { ip: string; userAgent: string | null; shared?: boolean; log?: SessionLogger },
): Promise<{ token: string; refreshToken: string; user: SessionUser }> {
  const log: SessionLogger = ctx.log ?? logger;
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

  log.info({ userId: user.id, shared: ctx.shared ?? false }, 'Session issued');

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
