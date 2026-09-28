import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import { hashPassword } from '../../lib/passwords';
import * as schema from '../../db/schema';
import { eq, and, desc, isNull, isNotNull, asc } from 'drizzle-orm';
import { requireSuperAdmin, requireAuth } from '../../lib/auth';
import { requireRootPlatformAdmin, invalidateUserPermissions } from '../../lib/permissions';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { isRedisHealthy, redis } from '../../lib/redis';

async function getRootAdminId(): Promise<string | null> {
  const root = await db.query.users.findFirst({ 
    where: and(eq(schema.users.role, 'super_admin'), isNull(schema.users.platformRoleId)), 
    orderBy: [asc(schema.users.createdAt)], 
    columns: { id: true } 
  });
  return root?.id || null;
}

/**
 * Manually queries BullMQ keys using the general-purpose Redis connection.
 * The general-purpose connection is configured with commandTimeout: 2000 and maxRetriesPerRequest: 3,
 * ensuring hung commands are aborted at the protocol/socket level to avoid resource accumulation.
 */
async function getJobCountsManual(queueName: string): Promise<{
  active: number;
  waiting: number;
  delayed: number;
  failed: number;
  completed: number;
}> {
  const prefix = `bull:${queueName}`;
  const pipeline = redis.pipeline();
  pipeline.llen(`${prefix}:active`);
  pipeline.llen(`${prefix}:wait`);
  pipeline.zcard(`${prefix}:delayed`);
  pipeline.zcard(`${prefix}:failed`);
  pipeline.zcard(`${prefix}:completed`);
  pipeline.zcard(`${prefix}:prioritized`);

  const results = await pipeline.exec();
  if (!results) {
    throw new Error('Pipeline execution failed');
  }

  const getValue = (res: any) => {
    if (!res) return 0;
    if (res[0]) throw res[0]; // Propagate command error
    return typeof res[1] === 'number' ? res[1] : 0;
  };

  const active = getValue(results[0]);
  const wait = getValue(results[1]);
  const delayed = getValue(results[2]);
  const failed = getValue(results[3]);
  const completed = getValue(results[4]);
  const prioritized = getValue(results[5]);

  return {
    active,
    waiting: wait + prioritized,
    delayed,
    failed,
    completed,
  };
}

export const superAdminsRoutes = new Elysia({ prefix: '/super-admins' })
  .use(requireSuperAdmin)
  .get('/queue-status', async () => {
    const queues = [
      { name: 'General Tasks', id: 'general-tasks' },
      { name: 'Emails', id: 'email-notifications' },
      { name: 'Reports', id: 'report-generation' },
      { name: 'Notifications', id: 'system-notifications' },
      { name: 'Push Delivery', id: 'push-notifications' },
      { name: 'Audit Logs', id: 'audit-logs' }
    ];

    // Verify Redis connection first to prevent queries from hanging
    const redisHealthy = await isRedisHealthy();
    if (!redisHealthy) {
      return {
        queues: queues.map((q) => ({
          name: q.name,
          active: 0,
          waiting: 0,
          delayed: 0,
          failed: 0,
          completed: 0,
          success: false,
          error: 'Redis connection is offline or not configured'
        }))
      };
    }

    const data = await Promise.all(
      queues.map(async (q) => {
        try {
          const counts = await getJobCountsManual(q.id);
          return {
            name: q.name,
            active: counts.active,
            waiting: counts.waiting,
            delayed: counts.delayed,
            failed: counts.failed,
            completed: counts.completed,
            success: true
          };
        } catch (err: any) {
          return {
            name: q.name,
            active: 0,
            waiting: 0,
            delayed: 0,
            failed: 0,
            completed: 0,
            success: false,
            error: err.message || String(err)
          };
        }
      })
    );

    return { queues: data };
  })
  // Who holds a platform role, and who may hold one, is the owner's business:
  // a scoped admin who could edit that list could widen themselves from below.
  .use(requireRootPlatformAdmin())
  .get('/', async ({ query, set }) => {
    try {
      const type = query.type;
      const conditions = [eq(schema.users.role, 'super_admin')];
      
      if (type === 'staff') conditions.push(isNotNull(schema.users.platformRoleId));
      else if (type === 'admins') conditions.push(isNull(schema.users.platformRoleId));

      const admins = await db.query.users.findMany({
        where: and(...conditions),
        with: {
          platformRole: {
            columns: { id: true, name: true, color: true, permissions: true }
          }
        },
        columns: {
          id: true, name: true, email: true, phone: true, avatar: true, isActive: true, createdAt: true, platformRoleId: true
        },
        orderBy: [asc(schema.users.createdAt)],
      });
      return admins;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/super-admins' });
      set.status = 500;
      return { error: 'Failed to load super admins' };
    }
  })
  .post('/', async ({ body, set }) => {
    try {
      const b = body as any;
      if (!b.name || !b.email || !b.password) { set.status = 400; return { error: 'name, email, and password are required' }; }

      const existing = await db.query.users.findFirst({ where: eq(schema.users.email, b.email.trim().toLowerCase()) });
      if (existing) { set.status = 409; return { error: 'A user with this email already exists' }; }

      const [user] = await db.insert(schema.users).values({ 
        name: b.name.trim(), 
        email: b.email.trim().toLowerCase(), 
        password: await hashPassword(b.password.trim()), 
        phone: b.phone?.trim() || null, 
        role: 'super_admin', 
        isActive: true, 
        platformRoleId: b.platformRoleId || null 
      }).returning();

      if (!user) throw new Error('Failed to create super admin');

      const fullUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
        with: {
          platformRole: {
            columns: { id: true, name: true, color: true, permissions: true }
          }
        },
        columns: {
          id: true, name: true, email: true, phone: true, avatar: true, isActive: true, createdAt: true, platformRoleId: true
        }
      });

      posthog.capture({
        distinctId: 'super_admin_system',
        event: 'super_admin_created',
        properties: {
          adminId: user.id,
          email: user.email
        }
      });

      return { success: true, admin: fullUser };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/super-admins' });
      set.status = 500;
      return { error: 'Failed to save super admins' };
    }
  })
  .put('/', async ({ body, user: sessionUser, set }) => {
    try {
      const b = body as any;
      const existing = await db.query.users.findFirst({ where: eq(schema.users.id, b.id) });
      if (!existing || existing.role !== 'super_admin') { set.status = 404; return { error: 'Super admin not found' }; }

      const rootId = await getRootAdminId();
      if (rootId && b.id === rootId && sessionUser.id !== rootId) { set.status = 403; return { error: 'Only the root owner can modify themselves' }; }

      const updateData: any = {};
      if (b.name !== undefined) updateData.name = b.name.trim();
      if (b.password !== undefined && b.password.trim() !== '') updateData.password = await hashPassword(b.password.trim());
      if (b.isActive !== undefined) updateData.isActive = b.isActive;
      if (b.platformRoleId !== undefined) updateData.platformRoleId = b.platformRoleId || null;

      await db.update(schema.users).set(updateData).where(eq(schema.users.id, b.id));
      if (updateData.platformRoleId !== undefined) await invalidateUserPermissions([b.id]);

      const updated = await db.query.users.findFirst({
        where: eq(schema.users.id, b.id),
        with: {
          platformRole: {
            columns: { id: true, name: true, color: true, permissions: true }
          }
        },
        columns: {
          id: true, name: true, email: true, phone: true, avatar: true, isActive: true, createdAt: true, platformRoleId: true
        }
      });

      return { success: true, admin: updated };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/super-admins' });
      set.status = 500;
      return { error: 'Failed to update super admins' };
    }
  })
  .delete('/', async ({ query, set }) => {
    try {
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const rootId = await getRootAdminId();
      if (rootId && id === rootId) { set.status = 403; return { error: 'Cannot delete the root platform owner' }; }

      await db.delete(schema.users).where(eq(schema.users.id, id));
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/super-admins' });
      set.status = 500;
      return { error: 'Failed to delete super admins' };
    }
  });

