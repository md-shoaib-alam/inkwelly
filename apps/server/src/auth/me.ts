import { Elysia } from 'elysia';
import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { dataCache } from '../lib/cache';
import { captureError } from '../lib/monitoring/posthog';
import { requireAuth } from '../lib/auth';

export const meRoute = new Elysia()
  .use(requireAuth)
  .get('/me', async ({ user: sessionUser, set }) => {
    // Safety net: requireAuth's onBeforeHandle should have already blocked this,
    // but guard here too in case of Elysia plugin deduplication edge cases.
    if (!sessionUser) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    try {
      const userId = sessionUser.id;
      const cacheKey = `user_me:${userId}`;
      const cached = await dataCache.get(cacheKey);
      if (cached) return cached;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          tenant: { columns: { id: true, name: true, slug: true, logo: true } },
          customRole: { columns: { id: true, name: true, color: true, permissions: true } },
          platformRole: { columns: { id: true, name: true, color: true, permissions: true } },
        },
      });

      if (!user) {
        set.status = 404;
        return { error: 'User not found' };
      }

      if (!user.isActive) {
        set.status = 403;
        return { error: 'Account deactivated' };
      }

      const result = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        tenantId: user.tenant?.id || null,
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
        platformRole: user.platformRole ? {
          id: user.platformRole.id,
          name: user.platformRole.name,
          color: user.platformRole.color,
          permissions: JSON.parse(user.platformRole.permissions || '{}'),
        } : null,
      };

      // Cache for 10 seconds
      await dataCache.set(cacheKey, result, 10000);

      return result;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/auth/me' });
      console.error('Auth me error:', error);
      set.status = 500;
      return { error: 'Failed to fetch user data' };
    }
  });
