import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import { hashPassword } from '../../lib/passwords';
import * as schema from '../../db/schema';
import { eq, and, or, sql, desc, count, ilike, inArray } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { TeacherService } from './teacher.service';

export const teachersRoutes = new Elysia({ prefix: '/teachers' })
  .use(requireAuth)
  .use(requirePermission('teachers'))
  .get('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }

      if (query.mode === 'min') {
        return await TeacherService.listMin(tenantId, query.search || undefined);
      }

      return await TeacherService.list({
        tenantId,
        search: query.search || undefined,
        page: parseInt(query.page || '1'),
        limit: Math.min(parseInt(query.limit || '50'), 100),
      });
    } catch (error) {
      captureError(error, { method: 'GET', path: '/teachers', tenantId });
      set.status = 500;
      return { error: 'Failed to load teachers' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const data = body as any;
      const hashedPassword = await hashPassword(data.password || 'changeme123');
      
      const result = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(schema.users).values({ 
          email: data.email, 
          name: data.name, 
          role: 'teacher', 
          phone: data.phone, 
          password: hashedPassword, 
          tenantId: tenantId!,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        if (!newUser) throw new Error('Failed to create user');

        const [teacher] = await tx.insert(schema.teachers).values({ 
          userId: newUser.id, 
          qualification: data.qualification || null, 
          experience: data.experience || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        if (!teacher) throw new Error('Failed to create teacher');

        return { id: teacher.id, name: newUser.name };
      });
      
      // Parallelize cache invalidations
      await dataCache.deleteMatch([
        `teachers:list:${tenantId}:*`,
        `teachers:${tenantId}:*`,
        `*teachers*${tenantId}*`,
        `gql:teachers:${tenantId}:*`,
        `dashboard:${tenantId}:*`
      ]);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'teacher_created',
        properties: {
          tenantId,
          teacherId: result.id,
          name: result.name
        }
      });

      return result;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/teachers', tenantId });
      set.status = 500;
      return { error: 'Failed to save teachers' };
    }
  })
  .put('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const data = body as any;
      const { id, name, email, phone, qualification, experience } = data;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const teacher = await db.query.teachers.findFirst({ 
        where: eq(schema.teachers.id, id), 
        with: { user: { columns: { tenantId: true } } } 
      });
      
      if (!teacher || teacher.user.tenantId !== tenantId) {
        set.status = 404;
        return { error: 'Teacher not found or access denied' };
      }

      await db.transaction(async (tx) => {
        await tx.update(schema.users).set({ name, email, phone }).where(eq(schema.users.id, teacher.userId));
        await tx.update(schema.teachers).set({ qualification, experience }).where(eq(schema.teachers.id, id));
      });

      // Parallelize cache invalidations
      await dataCache.deleteMatch([
        `teachers:list:${tenantId}:*`,
        `teachers:${tenantId}:*`,
        `*teachers*${tenantId}*`,
        `gql:teachers:${tenantId}:*`,
        `dashboard:${tenantId}:*`
      ]);

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/teachers', tenantId });
      set.status = 500;
      return { error: 'Failed to update teachers' };
    }
  })
  .delete('/', async ({ query, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const teacher = await db.query.teachers.findFirst({ 
        where: eq(schema.teachers.id, id), 
        with: { user: { columns: { tenantId: true } } } 
      });

      if (!teacher || teacher.user.tenantId !== tenantId) {
        set.status = 404;
        return { error: 'Teacher not found or access denied' };
      }

      await db.transaction(async (tx) => {
        // 1. Unlink from subjects
        await tx.update(schema.subjects).set({ teacherId: null }).where(eq(schema.subjects.teacherId, id));

        // 2. Delete timetable slots
        await tx.delete(schema.timetables).where(eq(schema.timetables.teacherId, id));

        // 3. Delete classes taught/assigned
        await tx.delete(schema.classTeachers).where(eq(schema.classTeachers.teacherId, id));

        // 4. Delete grades awarded
        await tx.delete(schema.grades).where(eq(schema.grades.teacherId, id));

        // 5. Clean up assignments and their submissions
        const assignments = await tx.query.assignments.findMany({ 
          where: eq(schema.assignments.teacherId, id),
          columns: { id: true }
        });
        const assignmentIds = assignments.map((a: any) => a.id);
        
        if (assignmentIds.length > 0) {
          await tx.delete(schema.submissions).where(inArray(schema.submissions.assignmentId, assignmentIds));
          await tx.delete(schema.assignments).where(inArray(schema.assignments.id, assignmentIds));
        }

        // 6. Clean up User-related activity
        await tx.delete(schema.ticketMessages).where(eq(schema.ticketMessages.userId, teacher.userId));
        await tx.delete(schema.tickets).where(eq(schema.tickets.createdBy, teacher.userId));
        await tx.update(schema.tickets).set({ assignedTo: null }).where(eq(schema.tickets.assignedTo, teacher.userId));
        await tx.delete(schema.staffAttendance).where(eq(schema.staffAttendance.userId, teacher.userId));
        await tx.delete(schema.leaves).where(or(eq(schema.leaves.userId, teacher.userId), eq(schema.leaves.approvedBy, teacher.userId)));

        // 7. Finally delete the teacher and the user record
        await tx.delete(schema.teachers).where(eq(schema.teachers.id, id));
        await tx.delete(schema.users).where(eq(schema.users.id, teacher.userId));
      });

      // Parallelize cache invalidations
      await dataCache.deleteMatch([
        `teachers:list:${tenantId}:*`,
        `teachers:${tenantId}:*`,
        `*teachers*${tenantId}*`,
        `gql:teachers:${tenantId}:*`,
        `dashboard:${tenantId}:*`
      ]);

      return { success: true };
    } catch (error: any) {
      captureError(error, { method: 'DELETE', path: '/teachers', tenantId });

      set.status = error.code === '23503' ? 400 : 500;
      return {
        error: error.code === '23503'
          ? 'Cannot delete this teacher: other records still reference them.'
          : 'Failed to delete teacher'
      };
    }
  });

