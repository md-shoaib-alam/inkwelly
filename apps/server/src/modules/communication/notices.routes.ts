import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const noticesRoutes = new Elysia({ prefix: '/notices' })
  .use(requireAuth)
  .use(requirePermission('notices'))
  .get('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) return []; // Return empty list instead of 403 if no tenant context

      const cacheKey = `notices:${tenantId}:${JSON.stringify(query)}`;
      const cached = await dataCache.get(cacheKey);
      if (cached) return cached;

      const noticesList = await db.query.notices.findMany({
        where: eq(schema.notices.tenantId, tenantId!),
        with: { author: { columns: { name: true } } },
        orderBy: [desc(schema.notices.createdAt)],
        limit: 100,
      });

      const result = noticesList.map((n) => ({
        id: n.id, title: n.title, content: n.content,
        authorName: n.author?.name || 'System', targetRole: n.targetRole,
        priority: n.priority, createdAt: n.createdAt,
      }));

      await dataCache.set(cacheKey, result, 300000);
      return result;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/notices', tenantId });
      set.status = 500;
      return { error: 'Failed to load notices' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      const data = body as any;
      
      const [notice] = await db.insert(schema.notices).values({
        title: data.title, 
        content: data.content, 
        tenantId,
        authorId: user!.id, 
        targetRole: data.targetRole || 'all', 
        priority: data.priority || 'normal',
      }).returning();

      if (notice) {
        // Trigger background notification job
        const { addJob } = await import('../../lib/queue');
        await addJob('NOTIFICATIONS', 'new-notice', {
          noticeId: notice.id,
          title: notice.title,
          tenantId,
          targetRole: notice.targetRole
        });

        posthog.capture({
          distinctId: tenantId || 'system',
          event: 'notice_created',
          properties: {
            tenantId,
            noticeId: notice.id,
            title: notice.title,
            targetRole: notice.targetRole
          }
        });

        // BROAD PURGE
        await dataCache.deleteMatch(`notices:${tenantId}:*`);
        await dataCache.deleteMatch(`*notices*${tenantId}*`);
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

        return { id: notice.id, title: notice.title };
      }
      
      set.status = 500;
      return { error: 'Failed to create notice' };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/notices', tenantId });
      set.status = 500;
      return { error: 'Failed to save notices' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      const data = body as any;
      const { id, title, content, priority, targetRole } = data;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const existing = await db.query.notices.findFirst({ where: and(eq(schema.notices.id, id), eq(schema.notices.tenantId, tenantId!)) });
      if (!existing) { set.status = 404; return { error: 'Notice not found or access denied' }; }

      await db.update(schema.notices).set({ title, content, priority, targetRole }).where(eq(schema.notices.id, id));

      // BROAD PURGE
      await dataCache.deleteMatch(`notices:${tenantId}:*`);
      await dataCache.deleteMatch(`*notices*${tenantId}*`);
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/notices', tenantId });
      set.status = 500;
      return { error: 'Failed to save notice' };
    }
  })
  .delete('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const existing = await db.query.notices.findFirst({ where: and(eq(schema.notices.id, id), eq(schema.notices.tenantId, tenantId!)) });
      if (!existing) { set.status = 404; return { error: 'Notice not found or access denied' }; }

      await db.delete(schema.notices).where(eq(schema.notices.id, id));

      // BROAD PURGE
      await dataCache.deleteMatch(`notices:${tenantId}:*`);
      await dataCache.deleteMatch(`*notices*${tenantId}*`);
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/notices', tenantId });
      set.status = 500;
      return { error: 'Failed to delete notice' };
    }
  });

