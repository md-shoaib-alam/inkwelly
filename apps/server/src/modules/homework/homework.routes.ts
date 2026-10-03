import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { academicYearForNewRow } from '../../lib/dashboardCache';
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

      const a = schema.assignments;
      const conditions = [
        eq(a.tenantId, tenantId!),
        eq(a.status, statusFilter)
      ];
      if (query.classId) conditions.push(eq(a.classId, query.classId as string));
      if (teacherIdFilter) conditions.push(eq(a.teacherId, teacherIdFilter));
      if (query.academicYear) conditions.push(eq(a.academicYear, query.academicYear as string));

      if (user.role === 'student') {
        conditions.push(sql`EXISTS (
          SELECT 1 FROM ${schema.students} s
          WHERE s."classId" = ${a.classId} AND s."userId" = ${user.id}
        )`);
      } else if (user.role === 'parent') {
        conditions.push(sql`EXISTS (
          SELECT 1 FROM ${schema.students} s
          JOIN ${schema.parents} p ON s."parentId" = p.id
          WHERE s."classId" = ${a.classId} AND p."userId" = ${user.id}
        )`);
      }

      const homeworkList = await db.select({
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        mode: a.mode,
        academicYear: a.academicYear,
        createdAt: a.createdAt,
        subjectName: schema.subjects.name,
        className: schema.classes.name,
        section: schema.classes.section,
        teacherName: schema.users.name,
        submissions: sql<number>`(select count(*)::int from "Submission" sub where sub."assignmentId" = ${a.id})`,
        totalStudents: sql<number>`(select count(*)::int from "Student" s where s."classId" = ${a.classId})`,
        ungradedSubmissions: sql<number>`(select count(*)::int from "Submission" sub where sub."assignmentId" = ${a.id} and sub."status" = 'submitted')`,
      }).from(a)
        .innerJoin(schema.subjects, eq(a.subjectId, schema.subjects.id))
        .innerJoin(schema.classes, eq(a.classId, schema.classes.id))
        .innerJoin(schema.teachers, eq(a.teacherId, schema.teachers.id))
        .leftJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
        .where(and(...conditions))
        .orderBy(desc(a.createdAt));

      return homeworkList.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        subjectName: row.subjectName,
        className: `${row.className}-${row.section}`,
        teacherName: row.teacherName,
        dueDate: row.dueDate,
        submissions: row.submissions,
        totalStudents: row.totalStudents,
        ungradedSubmissions: row.ungradedSubmissions,
        mode: row.mode,
        academicYear: row.academicYear,
        createdAt: row.createdAt,
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

      const academicYear = await academicYearForNewRow(tenantId!);
      if (!academicYear) {
        set.status = 400;
        return { error: 'Create the academic session first — homework is filed under it' };
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
        academicYear,
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
