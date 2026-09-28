import { Elysia, t } from 'elysia';
import { db } from '../../lib/db';
import { refreshTokens } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT, denyToken, hashToken } from '../../lib/jwt';
import { captureError } from '../../lib/monitoring/posthog';
import logger from '../../lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const logoutRoute = new Elysia()
  .derive(({ request }) => {
    const reqId = uuidv4();
    const reqLogger = logger.child({ reqId, route: '/auth/logout' });
    return { reqId, log: reqLogger };
  })
  .post('/logout', async ({ body, headers, set, log }) => {
    try {
      // 1. Deny the current access token (add jti to Redis blocklist)
      const authHeader = headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const payload = await verifyJWT(token);
          if (payload?.jti && payload.exp) {
            // TTL = remaining life of the token in seconds
            const remainingSeconds = Math.max(
              Math.floor((payload.exp as number) - Date.now() / 1000),
              1
            );
            await denyToken(payload.jti as string, remainingSeconds);
          }
        } catch (redisErr) {
          log.error({ redisErr }, 'Failed to add token to denylist during logout');
          // Gracefully continue to allow logout even if Redis fails
        }
      }

      // 2. Delete the specific refresh token if provided
      if (body?.refreshToken) {
        try {
          const refreshPayload = await verifyJWT(body.refreshToken);
          if (refreshPayload?.jti) {
            const hashedJti = hashToken(refreshPayload.jti);
            await db.delete(refreshTokens).where(
              eq(refreshTokens.token, hashedJti)
            );
          }
        } catch (dbErr) {
          log.error({ dbErr }, 'Failed to delete refresh token from DB during logout');
          // Gracefully continue to allow logout even if DB fails
        }
      }

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/auth/logout' });
      log.error({ error }, 'Unexpected logout error');
      // Always return success: true to ensure idempotency and client-side logout
      return { success: true };
    }
  }, {
    body: t.Optional(
      t.Object({
        refreshToken: t.Optional(t.String()),
      })
    ),
  });
