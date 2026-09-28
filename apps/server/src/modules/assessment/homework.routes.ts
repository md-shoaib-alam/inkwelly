import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const homeworkRoutes = new Elysia({ prefix: '/homework' })
  .use(requireAuth)
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      let teacherIdFilter = query.teacherId as string;
      if (query.mine === 'true' && user.role === 'teacher') {
        const teacher = await db.query.teachers.findFirst({
          where: eq(schema.teachers.userId, user.id),
          columns: { id: true },
        });
        if (teacher) {
          teacherIdFilter = teacher.id;
        }
      }

      const statusFilter = query.status as string || 'active';

      const homeworkList = await db.query.assignments.findMany({
        where: (assignments, { eq, and }) => {
          const conditions = [
            eq(assignments.tenantId, tenantId!),
            eq(assignments.status, statusFilter)
          ];
          if (query.classId) conditions.push(eq(assignments.classId, query.classId as string));
          if (teacherIdFilter) conditions.push(eq(assignments.teacherId, teacherIdFilter));
          
          if (user.role === 'student') {
            conditions.push(sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              WHERE s."classId" = ${assignments.classId} AND s."userId" = ${user.id}
            )`);
          } else if (user.role === 'parent') {
            conditions.push(sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              JOIN ${schema.parents} p ON s."parentId" = p.id
              WHERE s."classId" = ${assignments.classId} AND p."userId" = ${user.id}
            )`);
          }
          return and(...conditions);
        },
        with: {
          subject: { columns: { name: true } },
          class: { 
            columns: { name: true, section: true },
            with: { students: { columns: { id: true } } }
          },
          teacher: { with: { user: { columns: { name: true } } } },
          submissions: { columns: { status: true } }
        },
        orderBy: [desc(schema.assignments.createdAt)]
      });

      return homeworkList.map(a => ({
        id: a.id, 
        title: a.title, 
        description: a.description,
        subjectName: a.subject.name, 
        className: `${a.class.name}-${a.class.section}`,
        teacherName: a.teacher.user.name, 
        dueDate: a.dueDate,
        submissions: a.submissions.length, 
        totalStudents: a.class.students.length,
        ungradedSubmissions: a.submissions.filter(s => s.status === 'submitted').length,
        mode: a.mode,
        createdAt: a.createdAt,
      }));
    } catch (error) {
      captureError(error, { method: 'GET', path: '/homework', tenantId });
      set.status = 500;
      return { error: 'Failed to load homework' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      
      // SECURITY: Verify class belongs to tenant
      const cls = await db.query.classes.findFirst({ where: eq(schema.classes.id, data.classId) });
      if (!cls || cls.tenantId !== tenantId) {
        set.status = 403;
        return { error: 'Invalid class ID or access denied' };
      }

      const [assignment] = await db.insert(schema.assignments).values({
        tenantId: tenantId!,
        subjectId: data.subjectId, 
        classId: data.classId, 
        teacherId: data.teacherId,
        title: data.title, 
        description: data.description, 
        dueDate: data.dueDate,
        mode: data.mode || 'offline',
      }).returning();

      if (!assignment) throw new Error('Failed to create homework');

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'homework_created',
        properties: {
          tenantId,
          homeworkId: assignment.id,
          title: assignment.title
        }
      });

      return { id: assignment.id };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/homework', tenantId });
      set.status = 500;
      return { error: 'Failed to save homework' };
    }
  })
  .put('/:id/complete', async ({ params, tenantId, set }) => {
    try {
      const { id } = params;
      const [updated] = await db.update(schema.assignments)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(and(eq(schema.assignments.id, id), eq(schema.assignments.tenantId, tenantId!)))
        .returning();

      if (!updated) {
        set.status = 404;
        return { success: false, message: 'Homework not found' };
      }

      return { success: true, data: updated };
    } catch (error) {
      captureError(error, { method: 'PUT', path: `/homework/${params.id}/complete`, tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to complete homework' };
    }
  });
