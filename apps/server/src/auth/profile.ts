import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { dataCache } from '../lib/cache';
import { requireAuth } from '../lib/auth';
import { denyToken, denyAllRefreshTokens, verifyJWT } from '../lib/jwt';

export const profileRoute = new Elysia()
  .use(requireAuth)
  .put('/profile', async ({ body, user: sessionUser, set }) => {
    try {
      const { name, phone, address, avatar } = body as { name?: string, phone?: string, address?: string, avatar?: string };
      const userId = sessionUser.id;

      await db.update(users).set({
        name,
        phone,
        address,
        avatar,
        updatedAt: new Date()
      }).where(eq(users.id, userId));

      // Clear the cache
      const cacheKey = `user_me:${userId}`;
      await dataCache.deleteMatch(cacheKey);

      // Fetch updated user to return
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          tenant: { columns: { id: true, name: true, slug: true, logo: true } },
          customRole: { columns: { id: true, name: true, color: true, permissions: true } },
        }
      });

      return {
        success: true,
        user: updatedUser ? {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          tenantId: updatedUser.tenant?.id || null,
          tenantSlug: updatedUser.tenant?.slug || null,
          tenantName: updatedUser.tenant?.name || null,
          tenantLogo: updatedUser.tenant?.logo || null,
          phone: updatedUser.phone,
          address: updatedUser.address,
        } : null
      };
    } catch (error) {
      console.error('Update profile error:', error);
      set.status = 500;
      return { error: 'Failed to update profile' };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      address: t.Optional(t.String()),
      avatar: t.Optional(t.String()),
    })
  })
  .delete('/delete-account', async ({ user: sessionUser, headers, set }) => {
    try {
      const userId = sessionUser.id;

      // Denylist current access token and delete all refresh tokens
      const authHeader = headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token);
        if (payload?.jti && payload.exp) {
          const remainingSeconds = Math.max(
            Math.floor((payload.exp as number) - Date.now() / 1000),
            1
          );
          await denyToken(payload.jti as string, remainingSeconds);
        }
      }
      await denyAllRefreshTokens(userId);

      await db.delete(users).where(eq(users.id, userId));
      const cacheKey = `user_me:${userId}`;
      await dataCache.deleteMatch(cacheKey);
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      set.status = 500;
      return { error: 'Failed to delete account' };
    }
  });
