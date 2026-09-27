import { Elysia } from 'elysia';
import { db } from '../lib/db';
import { hashPassword } from '../lib/passwords';
import * as schema from '../db/schema';
import { eq, and, or, ilike, count, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { requirePermission } from '../lib/permissions';
import { dataCache } from '../lib/cache';
import { posthog, captureError } from '../lib/monitoring/posthog';
import { ParentService } from '../services/parent.service';

export const parentsRoutes = new Elysia({ prefix: '/parents' })
  .use(requireAuth)
  .use(requirePermission('parents'))
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }

      return await ParentService.list({
        tenantId,
        search: query.search || undefined,
        page: parseInt(query.page || '1'),
        limit: Math.min(parseInt(query.limit || '50'), 100),
        callerUserId: user.id,
        callerRole: user.role,
      });
    } catch (error) {
      captureError(error, { method: 'GET', path: '/parents', tenantId });
      set.status = 500;
      return { error: 'Failed to load parents' };
    }
  })
  .get('/:id', async ({ params: { id }, tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }

      const parent = await ParentService.getById(id, tenantId);
      if (!parent) {
        set.status = 404;
        return { error: 'Parent not found' };
      }
      return parent;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/parents/:id', tenantId });
      set.status = 500;
      return { error: 'Failed to load parents' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const b = body as any;
      let result: any = { success: false };

      if (b.action === 'create') {
        let parentUsername = typeof b.username === 'string' ? b.username.trim() : '';
        
        if (parentUsername) {
          const existingUser = await db.query.users.findFirst({
            where: and(eq(schema.users.username, parentUsername), eq(schema.users.tenantId, tenantId!))
          });
          if (existingUser) {
            set.status = 400;
            return { error: `The Login ID "${parentUsername}" is already taken.` };
          }
        } else {
          const currentYear = new Date().getFullYear();
          let isUnique = false;
          let attempts = 0;
          
          while (!isUnique && attempts < 10) {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            parentUsername = `PRN${currentYear}${randomNum}`;
            const existingUser = await db.query.users.findFirst({
              where: and(eq(schema.users.username, parentUsername), eq(schema.users.tenantId, tenantId!))
            });
            if (!existingUser) {
              isUnique = true;
            }
            attempts++;
          }
          
          if (!isUnique) {
            parentUsername = `prn-${Date.now().toString().slice(-6)}`;
          }
        }

        const parentEmail = b.email && b.email.trim() ? b.email.trim() : `${parentUsername.toLowerCase()}@school.com`;

        const existingEmailUser = await db.query.users.findFirst({
          where: eq(schema.users.email, parentEmail)
        });
        if (existingEmailUser) {
          set.status = 400;
          return { error: `The email address "${parentEmail}" is already registered to another account.` };
        }

        const hashedPassword = await hashPassword(b.password || 'changeme123');
        const [user] = await db.insert(schema.users).values({ 
          email: parentEmail, 
          name: b.name, 
          role: 'parent', 
          phone: b.phone, 
          username: parentUsername,
          password: hashedPassword, 
          tenantId: tenantId!,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        if (!user) {
          set.status = 500;
          return { error: 'Failed to create user' };
        }

        const [parentRecord] = await db.insert(schema.parents).values({
          userId: user.id,
          occupation: b.occupation || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        if (!parentRecord) {
          set.status = 500;
          return { error: 'Failed to create parent profile' };
        }

        result = { success: true, id: parentRecord.id, name: user.name, username: user.username };
      }

      else if (b.action === 'link' || b.action === 'unlink' || b.action === 'link-child') {
        let { parentId, studentId } = b;
        const unlink = b.action === 'unlink' || !!b.unlink;

        // 🛡️ SMART LINKING: If parent is not yet in the 'Parent' table, create the record now
        if (!unlink && parentId && typeof parentId === 'string' && parentId.startsWith('unlinked-')) {
          const userId = parentId.replace('unlinked-', '');
          const parentUser = await db.query.users.findFirst({
            where: and(eq(schema.users.id, userId), eq(schema.users.tenantId, tenantId!))
          });
          if (!parentUser) {
            set.status = 403;
            return { error: 'Parent user not found or access denied' };
          }
          const [newParentRecord] = await db.insert(schema.parents).values({ userId }).returning();
          if (!newParentRecord) {
            set.status = 500;
            return { error: 'Failed to create parent record' };
          }
          parentId = newParentRecord.id;
        }

        // Verify standard parentId belongs to the active tenant if we are linking
        if (!unlink && parentId) {
          const parentRecord = await db.query.parents.findFirst({
            where: eq(schema.parents.id, parentId),
            with: { user: { columns: { tenantId: true } } }
          });
          if (!parentRecord || parentRecord.user.tenantId !== tenantId) {
            set.status = 403;
            return { error: 'Parent record not found or access denied' };
          }
        }

        const student = await db.query.students.findFirst({ 
          where: eq(schema.students.id, studentId), 
          with: { user: { columns: { tenantId: true } } } 
        });

        if (!student || student.user.tenantId !== tenantId) {
          set.status = 404;
          return { error: 'Student not found or access denied' };
        }

        await db.update(schema.students)
          .set({ parentId: unlink ? null : parentId })
          .where(eq(schema.students.id, studentId));
        
        result = { success: true };
      } else {
        set.status = 400;
        return { error: 'Invalid action' };
      }

      // BROAD PURGE (parallelized)
      await dataCache.deleteMatch([
        `parents:list:${tenantId}`,
        `parents:${tenantId}:*`,
        `*parents*${tenantId}*`,
        `gql:parents:${tenantId}:*`,
        `*students*${tenantId}*`,
        `gql:students:${tenantId}:*`,
        `dashboard:${tenantId}:*`
      ]);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'parent_student_linked',
        properties: {
          tenantId,
          action: (body as any).action,
          studentId: (body as any).studentId,
          parentId: (body as any).parentId
        }
      });

      return result;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/parents', tenantId });
      set.status = 500;
      return { error: 'Failed to save parents' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      const { id, name, email, phone, occupation } = data;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const parent = await db.query.parents.findFirst({ 
        where: eq(schema.parents.id, id), 
        with: { user: { columns: { tenantId: true, id: true, email: true } } } 
      });
      if (!parent || parent.user.tenantId !== tenantId) { set.status = 404; return { error: 'Parent not found or access denied' }; }

      if (email && email !== parent.user.email) {
        const existingEmailUser = await db.query.users.findFirst({
          where: eq(schema.users.email, email)
        });
        if (existingEmailUser && existingEmailUser.id !== parent.userId) {
          set.status = 400;
          return { error: `The email address "${email}" is already registered to another account.` };
        }
      }

      const updateUserData: any = { name, email, phone };
      if (data.address !== undefined) {
        updateUserData.address = data.address;
      }

      await db.update(schema.users).set(updateUserData).where(eq(schema.users.id, parent.userId));
      await db.update(schema.parents).set({ occupation }).where(eq(schema.parents.id, id));

      // BROAD PURGE (parallelized)
      await dataCache.deleteMatch([
        `parents:list:${tenantId}`,
        `parents:${tenantId}:*`,
        `*parents*${tenantId}*`,
        `dashboard:${tenantId}:*`
      ]);

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/parents', tenantId });
      set.status = 500;
      return { error: 'Failed to update parents' };
    }
  })
  .delete('/', async ({ query, tenantId, set }) => {
    try {
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const parent = await db.query.parents.findFirst({ 
        where: eq(schema.parents.id, id), 
        with: { user: { columns: { tenantId: true, id: true } } } 
      });

      if (!parent || parent.user.tenantId !== tenantId) {
        set.status = 404;
        return { error: 'Parent not found or access denied' };
      }

      await db.transaction(async (tx) => {
        await tx.update(schema.students).set({ parentId: null }).where(eq(schema.students.parentId, id));
        await tx.delete(schema.subscriptions).where(eq(schema.subscriptions.parentId, id));
        await tx.delete(schema.ticketMessages).where(eq(schema.ticketMessages.userId, parent.userId));
        await tx.delete(schema.tickets).where(eq(schema.tickets.createdBy, parent.userId));
        await tx.delete(schema.parents).where(eq(schema.parents.id, id));
        await tx.delete(schema.users).where(eq(schema.users.id, parent.userId));
      });

      // BROAD PURGE (parallelized)
      await dataCache.deleteMatch([
        `parents:list:${tenantId}`,
        `parents:${tenantId}:*`,
        `*parents*${tenantId}*`,
        `*students*${tenantId}*`,
        `dashboard:${tenantId}:*`
      ]);

      return { success: true };
    } catch (error: any) {
      captureError(error, { method: 'DELETE', path: '/parents', tenantId });
      console.error('[PARENTS_DELETE_ERROR] Full error:', error);
      set.status = error.code === '23503' ? 400 : 500;
      return {
        error: error.code === '23503'
          ? 'Cannot delete this parent: other records still reference them.'
          : 'Failed to delete parent'
      };
    }
  });

