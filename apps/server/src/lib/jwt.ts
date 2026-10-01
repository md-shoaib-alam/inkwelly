import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { redis } from './redis';
import { db } from './db';
import { refreshTokens, users } from '../db/schema';
import logger from './logger';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// ── Token expiry constants ──
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// ── Strongly typed payload interfaces ──
export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  sid?: string;
  typ: 'access';
  jti: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string | null;
  typ: 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}

export type DecodedTokenPayload = AccessTokenPayload | RefreshTokenPayload;

// ── Hashing Helpers ──
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function hashJti(jti: string): string {
  return `denylist:jti:${hashToken(jti)}`;
}

/**
 * Add a token's jti to the denylist (used on logout, password change, account delete).
 * TTL is in seconds — how long until the token would have expired naturally.
 */
export async function denyToken(jti: string | undefined, ttlSeconds: number): Promise<void> {
  if (!jti) return;
  if (redis.status !== 'ready') {
    throw new Error('Redis is offline: cannot add token to denylist');
  }
  const key = hashJti(jti);
  await redis.set(key, '1', 'EX', Math.max(ttlSeconds, 1));
}

/**
 * Deny ALL refresh tokens for a user by deleting from DB, and invalidate
 * all access tokens by updating the user's updatedAt timestamp.
 */
export async function denyAllRefreshTokens(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));
  });
}

// ── Access Token ──
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
  const jti = uuidv4();
  const token = await new SignJWT({ ...payload, typ: 'access', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
  return token;
}

// ── Refresh Token ──
export async function signRefreshToken(
  payload: {
    userId: string;
    tenantId: string | null;
  },
  expiresIn: string = REFRESH_TOKEN_EXPIRY
): Promise<{ token: string; jti: string }> {
  const jti = uuidv4();
  const token = await new SignJWT({ ...payload, typ: 'refresh', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
  return { token, jti };
}

// ── Verify ──
export async function verifyJWT(token: string): Promise<DecodedTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Check denylist if token has a jti
    if (payload.jti) {
      if (redis.status !== 'ready') {
        logger.error({ jti: payload.jti }, 'Redis not ready for denylist check during token verification');
        return null; // Fail closed for security
      }
      const key = hashJti(payload.jti as string);
      const denied = await redis.get(key);
      if (denied) {
        logger.warn({ jti: payload.jti }, 'Token denied — found in blocklist');
        return null;
      }
    }

    return payload as unknown as DecodedTokenPayload;
  } catch (err: any) {
    if (err?.code === 'ERR_JWT_EXPIRED') {
      logger.debug({ code: err.code }, 'JWT token expired (client will auto-refresh)');
    } else {
      logger.error({ err }, 'JWT verification failed');
    }
    return null;
  }
}

// ── Legacy wrapper (kept for backward compat — unused after migration) ──
export async function signJWT(payload: any): Promise<string> {
  return signAccessToken(payload);
}
