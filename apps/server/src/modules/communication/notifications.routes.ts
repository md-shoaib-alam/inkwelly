import { Elysia, t } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { redis } from '../../lib/redis';
import { getDismissedIds, dismissTransientNotification, invalidateUnreadCount, COUNT_TTL_SECONDS } from '../../lib/notifications';
import { requireAuth } from '../../lib/auth';
import { captureError } from '../../lib/monitoring/posthog';

export const notificationsRoutes = new Elysia({ prefix: '/notifications' })
  .use(requireAuth)
  
  // GET /api/notifications/count - Unread count for the bell badge.
  // Cached in Redis for COUNT_TTL_SECONDS; every writer path invalidates the
  // key, so the cache is long but never stale. Platform notices are excluded:
  // they are broadcast, can't be marked read, and would pin the badge above
  // zero forever.
  .get('/count', async ({ user, set }) => {
    try {
      if (redis.status === 'ready') {
        const cached = await redis.get(`notifications:count:${user.id}`).catch(() => null);
        if (cached !== null && /^\d+$/.test(cached)) {
          return { unread: Number(cached) };
        }
      }

      const [dbCount, transientRaw, dismissed] = await Promise.all([
        db.select({ value: sql<number>`count(*)::int` })
          .from(schema.notifications)
          .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.isRead, false)))
          .then((rows) => Number(rows[0]?.value ?? 0)),
        redis.status === 'ready'
          ? redis.lrange(`notifications:transient:${user.id}`, 0, 49).catch(() => [] as string[])
          : Promise.resolve([] as string[]),
        getDismissedIds(user.id),
      ]);

      const visibleTransient = transientRaw.reduce((acc: number, raw) => {
        try {
          const parsed = JSON.parse(raw);
          return parsed?.id && dismissed.has(parsed.id) ? acc : acc + 1;
        } catch {
          return acc + 1;
        }
      }, 0);

      const unread = dbCount + visibleTransient;

      if (redis.status === 'ready') {
        await redis.set(`notifications:count:${user.id}`, String(unread), 'EX', COUNT_TTL_SECONDS).catch(() => {});
      }

      return { unread };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/notifications/count', tenantId: user.tenantId });
      set.status = 500;
      return { error: 'Failed to fetch notification count' };
    }
  })

  // GET /api/notifications - Get personal notification history
  .get('/', async ({ user, set }) => {
    try {
      // Parallelize all data fetching operations
      const [dbNotifications, cachedRaw, platformNoticesRaw, dismissed] = await Promise.all([
        // 1. Persistent notifications
        db.query.notifications.findMany({
          where: eq(schema.notifications.userId, user.id),
          orderBy: [desc(schema.notifications.createdAt)],
          limit: 50,
        }),
        // 2. Transient notifications from Redis
        redis.status === 'ready'
          ? redis.lrange(`notifications:transient:${user.id}`, 0, 49).catch((err) => {
              captureError(err, { method: 'GET', path: '/notifications (transient cache read fail)', tenantId: user.tenantId });
              return [] as string[];
            })
          : Promise.resolve([] as string[]),
        // 3. Platform Notices
        db.query.platformNotices.findMany({
          where: eq(schema.platformNotices.isActive, true),
          orderBy: [desc(schema.platformNotices.createdAt)],
          limit: 10,
        }),
        // 4. Ids the user dismissed from the transient list
        getDismissedIds(user.id),
      ]);

      const transientNotifications = cachedRaw.map((raw: string) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }).filter((n: any) => n && !dismissed.has(n.id));

      const platformNotices = platformNoticesRaw.filter((n: any) => {
        if (n.target === 'everyone') return true;
        if (n.target === 'all_schools' && (user.role === 'admin' || user.role === 'staff')) return true;
        if (n.target === 'all_parents' && user.role === 'parent') return true;
        if (n.target === 'all_super_admins' && user.role === 'super_admin') return true;
        return false;
      }).map((n: any) => ({
        id: `pn_${n.id}`,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        type: 'platform_notice',
        isRead: false,
      }));

      // Merge, sort and truncate in one efficient chain
      return [...transientNotifications, ...dbNotifications, ...platformNotices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
    } catch (error) {
      captureError(error, { method: 'GET', path: '/notifications', tenantId: user.tenantId });
      set.status = 500;
      return { error: 'Failed to fetch notifications' };
    }
  })

  // PATCH /api/notifications/:id/read - Mark a notification as read
  .patch('/:id/read', async ({ params: { id }, user, set }) => {
    try {
      await db.update(schema.notifications)
        .set({ isRead: true })
        .where(and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, user.id)
        ));

      await invalidateUnreadCount(user.id);
      
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PATCH', path: '/notifications/:id/read', tenantId: user.tenantId });
      set.status = 500;
      return { error: 'Failed to update notification' };
    }
  })

  // DELETE /api/notifications/transient/:id - Dismiss a Redis-only notification
  // (absence/fee/subscription alerts) so it stops appearing in the list
  .delete('/transient/:id', async ({ params: { id }, user, set }) => {
    try {
      await dismissTransientNotification(user.id, id);
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/notifications/transient/:id', tenantId: user.tenantId });
      set.status = 500;
      return { error: 'Failed to dismiss notification' };
    }
  })

  // PATCH /api/notifications/read-all - Mark all as read
  .patch('/read-all', async ({ user, set }) => {
    try {
      await db.update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.userId, user.id));

      // Transient items have no read flag, so clear them too — otherwise the
      // badge would never drop to zero.
      if (redis.status === 'ready') {
        await redis
          .del(`notifications:transient:${user.id}`, `notifications:dismissed:${user.id}`, `notifications:count:${user.id}`)
          .catch(() => {});
      }
      
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PATCH', path: '/notifications/read-all', tenantId: user.tenantId });
      set.status = 500;
      return { error: 'Failed to update notifications' };
    }
  })

  // DELETE /api/notifications - Clear all notifications
  .delete('/', async ({ user, set }) => {
    try {
      await Promise.all([
        // 1. Clear persistent notifications from DB
        db.delete(schema.notifications)
          .where(eq(schema.notifications.userId, user.id)),
        // 2. Clear transient notifications (and dismiss/count bookkeeping) from Redis
        redis.status === 'ready'
          ? redis.del(
              `notifications:transient:${user.id}`,
              `notifications:dismissed:${user.id}`,
              `notifications:count:${user.id}`
            ).catch((err) => {
              captureError(err, { method: 'DELETE', path: '/notifications (transient cache delete fail)', tenantId: user.tenantId });
              return 0;
            })
          : Promise.resolve(0)
      ]);
      
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/notifications', tenantId: user.tenantId });
      set.status = 500;
      return { error: 'Failed to clear notifications' };
    }
  });

