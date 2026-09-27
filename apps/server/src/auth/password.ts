import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import { users, refreshTokens } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { denyToken } from '../lib/jwt';
import { invalidateForUser } from '../lib/authCache';
import { hashPassword, verifyPassword } from '../lib/passwords';
import { dataCache } from '../lib/cache';

export const passwordRoute = new Elysia()
  .use(requireAuth)
  .post('/change-password', async ({ body, user: sessionUser, headers, set }) => {
    try {
      const { oldPassword, newPassword } = body;
      const userId = sessionUser.id;

      const dbUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!dbUser) {
        set.status = 404;
        return { error: 'User not found' };
      }

      const isValid = dbUser.password.startsWith('$')
        ? (await verifyPassword(oldPassword, dbUser.password)).valid
        : dbUser.password === oldPassword;

      if (!isValid) {
        set.status = 400;
        return { error: 'Incorrect current password' };
      }

      // 1. Revoke the current access token first.
      // If Redis is offline/fails, this throws and aborts the password change, maintaining fail-closed behavior.
      if (sessionUser?.jti && sessionUser?.exp) {
        const remainingSeconds = Math.max(
          Math.floor((sessionUser.exp as number) - Date.now() / 1000),
          1
        );
        await denyToken(sessionUser.jti, remainingSeconds);
      }

      const hashedPassword = await hashPassword(newPassword);

      // 2. Perform password update and refresh token revocation in a single database transaction
      await db.transaction(async (tx) => {
        await tx.update(users)
          .set({ password: hashedPassword, updatedAt: new Date() })
          .where(eq(users.id, userId));
        await tx.delete(refreshTokens)
          .where(eq(refreshTokens.userId, userId));
      });

      // 3. Best-effort local auth-cache invalidation; other processes ride
      // out their ≤5 s TTL (approved trade-off).
      invalidateForUser(userId);

      // 4. Clear profile cache
      const cacheKey = `user_me:${userId}`;
      await dataCache.deleteMatch(cacheKey).catch(() => {});

      return { success: true, message: 'Password updated successfully. Please login again.' };
    } catch (error) {
      console.error('Change password error:', error);
      set.status = 500;
      return { error: 'Failed to update password' };
    }
  }, {
    body: t.Object({
      oldPassword: t.String(),
      newPassword: t.String(),
    }),
  });
