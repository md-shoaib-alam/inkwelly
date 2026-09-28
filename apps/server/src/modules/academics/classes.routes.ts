import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, or, sql, desc, count, exists, inArray } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { ClassService } from './class.service';

class ClassDeleteBlocked extends Error {}

export const classesRoutes = new Elysia({ prefix: '/classes' })
  .use(requireAuth)
  .use(requirePermission('classes'))
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      if (query.mode === 'min') {
        return await ClassService.listMin(
          tenantId!,
          user.role === 'teacher' && query.all !== 'true' ? user.id : undefined
        );
      }

      const result = await ClassService.list({
        tenantId: tenantId!,
        teacherUserId: user.role === 'teacher' && query.all !== 'true' ? user.id : undefined,
        all: query.all === 'true',
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });

      if (query.all === 'true' || (!query.page && !query.limit)) {
        return result.items;
      }
      return result;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/classes', tenantId });
      set.status = 500;
      return { error: 'Failed to load class' };
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
      const { name, section } = data;
      if (!name || !section) { set.status = 400; return { error: 'Name and section are required' }; }
      
      const existing = await db.query.classes.findFirst({
        where: and(
          eq(schema.classes.tenantId, tenantId!),
          eq(schema.classes.name, name),
          eq(schema.classes.section, section)
        )
      });
      
      if (existing) {
        set.status = 400;
        return { error: `Class "${name} - ${section}" already exists for this school` };
      }

      const [cls] = await db.insert(schema.classes).values({ 
        name, 
        section, 
        grade: data.grade, 
        capacity: data.capacity || 40, 
        tenantId: tenantId! 
      }).returning();

      if (!cls) {
        set.status = 500;
        return { error: 'Failed to create class' };
      }

      if (data.classTeacherId) {
        await db.insert(schema.classTeachers).values({
          classId: cls.id,
          teacherId: data.classTeacherId,
          isClassTeacher: true,
        });
      }
      
      await dataCache.deleteMatch(`classes:${tenantId}:*`);
      await dataCache.deleteMatch(`*classes*${tenantId}*`);
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
      
      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'class_created',
        properties: {
          tenantId,
          classId: cls.id,
          name: cls.name,
          section: cls.section,
          grade: cls.grade
        }
      });
      
      return { id: cls.id, name: cls.name };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/classes', tenantId });
      set.status = 500;
      return { error: 'Failed to save class' };
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
      const { id, name, section, grade, capacity, classTeacherId } = data;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const cls = await db.query.classes.findFirst({ 
        where: and(eq(schema.classes.id, id), eq(schema.classes.tenantId, tenantId!)) 
      });
      if (!cls) { set.status = 404; return { error: 'Class not found or access denied' }; }

      const existing = await db.query.classes.findFirst({
        where: and(
          eq(schema.classes.tenantId, tenantId!),
          eq(schema.classes.name, name),
          eq(schema.classes.section, section),
          sql`${schema.classes.id} != ${id}`
        )
      });
      
      if (existing) {
        set.status = 400;
        return { error: `Class "${name} - ${section}" already exists for this school` };
      }

      await db.update(schema.classes).set({ name, section, grade, capacity }).where(eq(schema.classes.id, id));

      await db.delete(schema.classTeachers).where(
        and(
          eq(schema.classTeachers.classId, id),
          eq(schema.classTeachers.isClassTeacher, true)
        )
      );

      if (classTeacherId) {
        await db.insert(schema.classTeachers).values({
          classId: id,
          teacherId: classTeacherId,
          isClassTeacher: true,
        });
      }

      await dataCache.deleteMatch(`classes:${tenantId}:*`);
      await dataCache.deleteMatch(`*classes*${tenantId}*`);
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/classes', tenantId });
      set.status = 500;
      return { error: 'Failed to update class' };
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

      const cls = await db.query.classes.findFirst({ 
        where: and(eq(schema.classes.id, id), eq(schema.classes.tenantId, tenantId!)) 
      });
      if (!cls) { 
        set.status = 404; 
        return { error: 'Class not found or access denied' }; 
      }

      await db.transaction(async (tx) => {
        // 1. Check for students
        const studentCountResult = await tx.select({ count: count() }).from(schema.students).where(eq(schema.students.classId, id));
        const studentCount = studentCountResult[0]?.count || 0;
        if (studentCount > 0) {
          throw new ClassDeleteBlocked(`Cannot delete class: ${studentCount} students are still enrolled. Please transfer or remove them first.`);
        }

        // 2. Clean up assignments and submissions
        const assignments = await tx.query.assignments.findMany({ 
          where: eq(schema.assignments.classId, id), 
          columns: { id: true } 
        });
        const assignmentIds = assignments.map((a: any) => a.id);
        if (assignmentIds.length > 0) {
          await tx.delete(schema.submissions).where(inArray(schema.submissions.assignmentId, assignmentIds));
          await tx.delete(schema.assignments).where(eq(schema.assignments.classId, id));
        }

        // 3. Clean up other related records
        await tx.delete(schema.attendance).where(eq(schema.attendance.classId, id));
        await tx.delete(schema.timetables).where(eq(schema.timetables.classId, id));
        
        const subjects = await tx.query.subjects.findMany({ 
          where: eq(schema.subjects.classId, id), 
          columns: { id: true } 
        });
        const subjectIds = subjects.map((s: any) => s.id);
        if (subjectIds.length > 0) {
          await tx.delete(schema.grades).where(inArray(schema.grades.subjectId, subjectIds));
          await tx.delete(schema.subjects).where(eq(schema.subjects.classId, id));
        }

        await tx.delete(schema.classTeachers).where(eq(schema.classTeachers.classId, id));
        await tx.delete(schema.promotions).where(or(eq(schema.promotions.fromClassId, id), eq(schema.promotions.toClassId, id)));

        // 4. Finally delete the class
        await tx.delete(schema.classes).where(eq(schema.classes.id, id));
      });

      await dataCache.deleteMatch(`classes:${tenantId}:*`);
      await dataCache.deleteMatch(`*classes*${tenantId}*`);
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
      return { success: true };
    } catch (error: any) {
      captureError(error, { method: 'DELETE', path: '/classes', tenantId });
      console.error('[CLASSES_DELETE_ERROR]', error);
      // This used to decide with `error.message.includes('students')`, which
      // also matched FK-violation text like `students_classId_fkey` and echoed
      // the raw SQL back at 400.
      if (error instanceof ClassDeleteBlocked) {
        set.status = 400;
        return { error: error.message };
      }
      if (error.code === '23503') {
        set.status = 400;
        return { error: 'Cannot delete this class: other records still reference it.' };
      }
      set.status = 500;
      return { error: 'Failed to delete class' };
    }
  });

