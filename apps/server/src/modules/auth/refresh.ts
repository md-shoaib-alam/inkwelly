import { Elysia, t } from 'elysia';
import { db } from '../../lib/db';
import { users, refreshTokens } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { signAccessToken, signRefreshToken, verifyJWT, hashToken, denyAllRefreshTokens } from '../../lib/jwt';
import { redis } from '../../lib/redis';
import { incrWithWindow } from '../../lib/ratelimit';
import { captureError } from '../../lib/monitoring/posthog';
import logger from '../../lib/logger';
import { getClientIp } from '../../lib/ip';
import { SHARED_SESSION_HOURS } from './session';
import { v4 as uuidv4 } from 'uuid';

const MAX_REFRESH_ATTEMPTS = 30;
const REFRESH_BAN_DURATION = 60; // 1 minute in seconds

export const refreshRoute = new Elysia()
  .derive(({ request }) => {
    const reqId = uuidv4();
    const reqLogger = logger.child({ reqId, route: '/auth/refresh' });
    return { reqId, log: reqLogger };
  })
  .post('/refresh', async ({ body, request, server, set, log }) => {
    // Same trap as login: no `server` means every header-less caller shares
    // ratelimit:refresh:anonymous, so one client exhausts MAX_REFRESH_ATTEMPTS
    // and token refresh fails for the whole deployment.
    const ip = getClientIp(request, server);
    const redisKey = `ratelimit:refresh:${ip}`;

    // Rate limit refresh attempts
    if (redis.status === 'ready') {
      try {
        const limitCountStr = await redis.get(redisKey);
        const limitCount = limitCountStr ? parseInt(limitCountStr, 10) : 0;
        if (limitCount >= MAX_REFRESH_ATTEMPTS) {
          set.status = 429;
          return { error: 'Too many refresh attempts. Please try again later.' };
        }
        await incrWithWindow(redisKey, REFRESH_BAN_DURATION);
      } catch (err) {
        log.error({ err }, 'Redis rate limit check failed for refresh');
      }
    }

    try {
      const { refreshToken } = body;

      if (!refreshToken) {
        set.status = 400;
        return { error: 'Refresh token is required' };
      }

      // Verify the refresh token
      const payload = await verifyJWT(refreshToken);
      if (!payload) {
        set.status = 401;
        return { error: 'Invalid or expired refresh token' };
      }

      // Ensure it's actually a refresh token (not an access token)
      if (payload.typ !== 'refresh') {
        set.status = 401;
        return { error: 'Invalid token type' };
      }

      const userId = payload.userId as string;
      const jti = payload.jti as string;
      const hashedJti = hashToken(jti);

      // --- Concurrent Request Race & Token Reuse Detection via Redis ---
      const rawCacheKey = `used_refresh_token:raw:${hashedJti}`;
      const markerCacheKey = `used_refresh_token:marker:${hashedJti}`;
      const lockKey = `lock:refresh:${hashedJti}`;

      if (redis.status === 'ready') {
        // 1. Check if token was already rotated (recently or in the past)
        const marker = await redis.get(markerCacheKey);
        if (marker) {
          // Check if the raw replacement token is still available in the 5-second grace window
          const rawCached = await redis.get(rawCacheKey);
          if (rawCached) {
            try {
              const data = JSON.parse(rawCached);
              log.info({ userId, jti }, 'Concurrent refresh race detected. Returning cached tokens.');
              return {
                success: true,
                token: data.newAccessToken,
                refreshToken: data.newRefreshToken,
              };
            } catch (jsonErr) {
              log.error({ jsonErr }, 'Failed to parse cached rotated token data');
            }
          }

          // Replay/Reuse attack! Marker exists but the 5-second raw cache has expired.
          log.warn({ userId, jti }, 'Refresh token reuse attack detected! Invalidating all user sessions.');
          await denyAllRefreshTokens(userId);
          set.status = 401;
          return { error: 'Security alert: Refresh token has already been used' };
        }

        // 2. Lock to prevent simultaneous database queries / insertions
        const locked = await redis.set(lockKey, '1', 'PX', 5000, 'NX');
        if (!locked) {
          set.status = 409;
          return { error: 'Refresh request already in progress' };
        }
      }

      try {
        // Fetch the user
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          with: {
            tenant: { columns: { id: true, name: true, slug: true, logo: true } },
            customRole: { columns: { id: true, name: true, color: true, permissions: true } },
          },
        });

        if (!user || !user.isActive) {
          set.status = 401;
          return { error: 'User not found or inactive' };
        }

        let newAccessToken = '';
        let newRefreshTokenRaw = '';
        let newJti = '';

        // Execute rotation in a database transaction atomically
        try {
          await db.transaction(async (tx) => {
            // Delete the old refresh token. Returning ensures we can check if it was successfully claimed.
            const deleted = await tx.delete(refreshTokens)
              .where(
                and(
                  eq(refreshTokens.token, hashedJti),
                  eq(refreshTokens.userId, userId),
                  gt(refreshTokens.expiresAt, new Date())
                )
              )
              .returning();

            // If no row was deleted, it has either expired or been claimed by a concurrent request.
            // The `!existing` clause is type-narrowing for noUncheckedIndexedAccess, not a new
            // runtime case: deleted.length === 1 already guarantees deleted[0] exists.
            const existing = deleted[0];
            if (deleted.length !== 1 || !existing) {
              throw new Error('CONCURRENCY_OR_REUSE');
            }

            // A row minted before the family column existed has none, and carrying that NULL
            // forward would strand the session: no family means no `sid` claim, so the bearer
            // can never name "this device" and revoke-all has nothing to spare. Rotation is
            // the one moment this row is already being replaced, so heal it here. Everything
            // else below — shared flag, sign-in instant, deadline — is inherited as it was.
            const family = existing.sessionFamily ?? uuidv4();

            // Issue new access token
            newAccessToken = await signAccessToken({
              id: user.id,
              email: user.email,
              role: user.role,
              tenantId: user.tenant?.id || null,
              // Carry the family so the browser keeps its "(this device)" marker past the
              // first rotation (~15 min after sign-in).
              sid: family,
            });

            // Issue new refresh token
            const signed = await signRefreshToken({
              userId: user.id,
              tenantId: user.tenant?.id || null,
            });
            newRefreshTokenRaw = signed.token;
            newJti = signed.jti;

            const hashedNewJti = hashToken(newJti);

            // Store the new refresh token (hashed)
            await tx.insert(refreshTokens).values({
              token: hashedNewJti,
              userId: user.id,
              tenantId: user.tenant?.id || null,
              userAgent: request.headers.get('user-agent') || null,
              ipAddress: ip,
              // (c) A shared session must not outlive its 12-hour promise: cap the rotated
              // row at the family's own sign-in + 12h. The delete's `gt(expiresAt, now)`
              // guard already proved the presented row had not passed that deadline, so a
              // shared row always resolves to sign-in + 12h. Non-shared keeps the 7-day window.
              expiresAt: existing.isShared
                ? new Date(Math.min(
                    existing.createdAt.getTime() + SHARED_SESSION_HOURS * 60 * 60 * 1000,
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                  ))
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              // (a) The family survives rotation, but no NEW family is minted for a row that
              // already has one — a fresh family per rotation is the bug this column exists
              // to prevent. `family` is the presented one, or a healed replacement for a
              // pre-migration NULL.
              sessionFamily: family,
              isShared: existing.isShared ?? false,
              // lastSeenAt has no DB default; every write path must stamp it.
              lastSeenAt: new Date(),
              // Carry the original sign-in instant: the device list publishes `createdAt`
              // as `signedInAt`, and it is the anchor the shared deadline is measured from.
              createdAt: existing.createdAt,
            });
          });
        } catch (err: any) {
          if (err.message === 'CONCURRENCY_OR_REUSE') {
            log.warn({ userId, jti }, 'Refresh token row missing or already deleted — possible reuse/concurrency');

            // Differentiate concurrency from confirmed token reuse
            let isRecentConcurrency = false;
            if (redis.status === 'ready') {
              try {
                const marker = await redis.get(markerCacheKey);
                if (marker) {
                  const markerData = JSON.parse(marker);
                  if (Date.now() - markerData.rotatedAt < 5000) {
                    isRecentConcurrency = true;
                  }
                }
                const lockExists = await redis.get(lockKey);
                if (lockExists) {
                  isRecentConcurrency = true;
                }
              } catch (checkErr) {
                log.error({ checkErr }, 'Failed to check concurrency state in Redis');
              }
            }

            if (isRecentConcurrency) {
              // Try to return the newly rotated tokens from the concurrently completed execution
              if (redis.status === 'ready') {
                try {
                  const rawCached = await redis.get(rawCacheKey);
                  if (rawCached) {
                    const data = JSON.parse(rawCached);
                    return {
                      success: true,
                      token: data.newAccessToken,
                      refreshToken: data.newRefreshToken,
                    };
                  }
                } catch (readErr) {
                  log.error({ readErr }, 'Failed to read concurrent tokens from cache');
                }
              }
              set.status = 409;
              return { error: 'Refresh request already processed concurrently' };
            }

            // Confirmed replay attack (not recent concurrency) — revoke all sessions (refresh + access)
            log.warn({ userId, jti }, 'Confirmed refresh token reuse/replay attack! Invalidating all user sessions.');
            await denyAllRefreshTokens(userId);
            set.status = 401;
            return { error: 'Invalid refresh token' };
          }
          throw err;
        }

        // Store rotated token details in Redis cache for concurrency & reuse detection (non-fatal)
        if (redis.status === 'ready') {
          try {
            const rawValue = JSON.stringify({
              newAccessToken,
              newRefreshToken: newRefreshTokenRaw,
            });
            const markerValue = JSON.stringify({
              userId: user.id,
              rotatedAt: Date.now(),
            });

            // Cache raw plaintext credentials ONLY for the 5-second concurrency window
            await redis.set(rawCacheKey, rawValue, 'EX', 5);
            // Retain a separate non-secret "used token" marker for replay detection (7 days)
            await redis.set(markerCacheKey, markerValue, 'EX', 7 * 24 * 60 * 60);
          } catch (redisErr) {
            log.error({ redisErr }, 'Failed to write rotated tokens to Redis cache (non-fatal)');
          }
        }

        log.info({ userId }, 'Token refreshed successfully');

        // Clear rate limit on success
        if (redis.status === 'ready') {
          try { await redis.del(redisKey); } catch { /* ignore */ }
        }

        return {
          success: true,
          token: newAccessToken,
          refreshToken: newRefreshTokenRaw,
        };
      } finally {
        // Release lock
        if (redis.status === 'ready') {
          await redis.del(lockKey).catch(() => {});
        }
      }
    } catch (error) {
      captureError(error, { method: 'POST', path: '/auth/refresh' });
      log.error({ error }, 'Token refresh error');
      set.status = 500;
      return { error: 'Token refresh failed. Please login again.' };
    }
  }, {
    body: t.Object({
      refreshToken: t.String(),
    }),
  });
