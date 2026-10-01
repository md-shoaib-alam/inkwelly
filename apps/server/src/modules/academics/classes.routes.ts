import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, or, sql, count, inArray } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { ClassService } from './class.service';
import {
  ClassListQuerySchema, CreateClassSchema, UpdateClassSchema, AssignTeachersSchema,
  blankToUndefined, buildClassSlug, resolveSlugCollision, deriveClassName, formatZodError,
} from '../../lib/validation/class';

class ClassDeleteBlocked extends Error {}

const ADMIN_ONLY = (user: any) => !!user && (user.role === 'admin' || user.role === 'super_admin');

/** Slugs are unique per tenant, so the existing ones decide the next available suffix. */
async function takenSlugs(tenantId: string, exceptId?: string) {
  const rows = await db.query.classes.findMany({
    where: (cls, { eq: eqFn, and: andFn, ne }) =>
      andFn(eq(cls.tenantId, tenantId), exceptId ? ne(cls.id, exceptId) : undefined),
    columns: { slug: true },
  });
  return new Set(rows.map((r) => r.slug).filter(Boolean) as string[]);
}

async function invalidateClasses(tenantId: string) {
  await dataCache.deleteMatch([`classes:${tenantId}:*`, `*classes*${tenantId}*`, `dashboard:${tenantId}:*`]);
}

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

      const parsed = ClassListQuerySchema.safeParse(blankToUndefined(query as Record<string, unknown>));
      if (!parsed.success) {
        set.status = 400;
        return { error: formatZodError(parsed.error) };
      }

      const result = await ClassService.list({
        tenantId: tenantId!,
        teacherUserId: user.role === 'teacher' && query.all !== 'true' ? user.id : undefined,
        all: query.all === 'true',
        ...parsed.data,
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
  .get('/stats', async ({ tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      return await ClassService.stats(tenantId);
    } catch (error) {
      captureError(error, { method: 'GET', path: '/classes/stats', tenantId });
      set.status = 500;
      return { error: 'Failed to load class stats' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!ADMIN_ONLY(user)) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const parsed = CreateClassSchema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return { error: formatZodError(parsed.error) };
      }
      const data = parsed.data;

      const name = deriveClassName(data.classLevel);

      const existing = await db.query.classes.findFirst({
        where: and(
          eq(schema.classes.tenantId, tenantId!),
          eq(schema.classes.name, name),
          eq(schema.classes.section, data.section)
        )
      });

      if (existing) {
        set.status = 400;
        return { error: `Class "${name} - ${data.section}" already exists for this school` };
      }

      // The name is derived and the slug is derived from the name: the server is
      // the only slug author, so a client cannot point a class at someone else's URL.
      const taken = await takenSlugs(tenantId);
      const slug = resolveSlugCollision(buildClassSlug(name, data.section), taken);

      const [cls] = await db.insert(schema.classes).values({
        name,
        section: data.section,
        classLevel: data.classLevel,
        slug,
        medium: data.medium,
        isVocational: data.isVocational,
        isActive: data.isActive,
        capacity: data.capacity,
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

      await invalidateClasses(tenantId);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'class_created',
        properties: {
          tenantId,
          classId: cls.id,
          name: cls.name,
          section: cls.section,
          classLevel: cls.classLevel
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
      if (!ADMIN_ONLY(user)) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const parsed = UpdateClassSchema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return { error: formatZodError(parsed.error) };
      }
      const data = parsed.data;
      const { id } = data;

      const cls = await db.query.classes.findFirst({
        where: and(eq(schema.classes.id, id), eq(schema.classes.tenantId, tenantId!))
      });
      if (!cls) { set.status = 404; return { error: 'Class not found or access denied' }; }

      const classLevel = data.classLevel ?? cls.classLevel;
      const section = data.section ?? cls.section;
      const name = deriveClassName(classLevel);

      const duplicate = await db.query.classes.findFirst({
        where: and(
          eq(schema.classes.tenantId, tenantId!),
          eq(schema.classes.name, name),
          eq(schema.classes.section, section),
          sql`${schema.classes.id} != ${id}`
        )
      });

      if (duplicate) {
        set.status = 400;
        return { error: `Class "${name} - ${section}" already exists for this school` };
      }

      // Exactly the keys the caller sent — a mobile edit that knows nothing about
      // `medium` must not reset it to the column default. The name always tracks the
      // level, so it is written whenever the level or section moved.
      const patch: Record<string, unknown> = {};
      if (data.classLevel !== undefined) patch.classLevel = data.classLevel;
      if (data.section !== undefined) patch.section = data.section;
      if (data.medium !== undefined) patch.medium = data.medium;
      if (data.capacity !== undefined) patch.capacity = data.capacity;
      if (data.isVocational !== undefined) patch.isVocational = data.isVocational;
      if (data.isActive !== undefined) patch.isActive = data.isActive;

      if (name !== cls.name || section !== cls.section) {
        patch.name = name;
        const taken = await takenSlugs(tenantId, id);
        patch.slug = resolveSlugCollision(buildClassSlug(name, section), taken);
      }

      if (Object.keys(patch).length > 0) {
        await db.update(schema.classes).set(patch).where(eq(schema.classes.id, id));
      }

      if (data.classTeacherId !== undefined) {
        await db.delete(schema.classTeachers).where(
          and(
            eq(schema.classTeachers.classId, id),
            eq(schema.classTeachers.isClassTeacher, true)
          )
        );

        if (data.classTeacherId) {
          await db.insert(schema.classTeachers).values({
            classId: id,
            teacherId: data.classTeacherId,
            isClassTeacher: true,
          });
        }
      }

      await invalidateClasses(tenantId);
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/classes', tenantId });
      set.status = 500;
      return { error: 'Failed to update class' };
    }
  })
  /**
   * Replaces a class's whole teacher set in one transaction, which is what the
   * "Manage class teachers" dialog commits when it closes. Doing it per-row would
   * let a half-applied edit leave a class with two primaries.
   */
  .put('/teachers', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!ADMIN_ONLY(user)) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const parsed = AssignTeachersSchema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return { error: formatZodError(parsed.error) };
      }
      const { classId, teachers } = parsed.data;

      const cls = await db.query.classes.findFirst({
        where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId))
      });
      if (!cls) { set.status = 404; return { error: 'Class not found or access denied' }; }

      if (teachers.length > 0) {
        // Teacher rows carry no tenantId of their own — membership is on the User
        // behind them, so an id from another school must fail this join.
        const known = await db
          .select({ id: schema.teachers.id })
          .from(schema.teachers)
          .innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
          .where(and(
            inArray(schema.teachers.id, teachers.map((t) => t.id)),
            eq(schema.users.tenantId, tenantId),
          ));
        const knownIds = new Set(known.map((t) => t.id));
        const strays = teachers.filter((t) => !knownIds.has(t.id)).map((t) => t.id);
        if (strays.length > 0) {
          set.status = 400;
          return { error: `These teachers do not belong to your school: ${strays.join(', ')}` };
        }
      }

      // First flagged teacher wins the primary role; with no flag at all the
      // first teacher takes it, so a class never ends up teacher-less on paper.
      const primaryIndex = teachers.findIndex((t) => t.isPrimary);
      const resolved = teachers.map((t, i) => ({ ...t, isPrimary: i === (primaryIndex === -1 ? 0 : primaryIndex) }));

      await db.transaction(async (tx) => {
        await tx.delete(schema.classTeachers).where(eq(schema.classTeachers.classId, classId));
        if (resolved.length > 0) {
          await tx.insert(schema.classTeachers).values(
            resolved.map((t) => ({ classId, teacherId: t.id, isClassTeacher: t.isPrimary })),
          );
        }
      });

      await invalidateClasses(tenantId);
      return { success: true, count: resolved.length };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/classes/teachers', tenantId });
      set.status = 500;
      return { error: 'Failed to update class teachers' };
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

