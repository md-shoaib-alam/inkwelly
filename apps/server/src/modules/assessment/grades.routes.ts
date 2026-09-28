import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, sql, inArray, count } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const gradesRoutes = new Elysia({ prefix: '/grades' })
  .use(requireAuth)
  .use(requirePermission('grades'))
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      const page = parseInt(query.page || '1');
      const limit = Math.min(parseInt(query.limit || '100'), 200);
      const skip = (page - 1) * limit;
      
      // Flat join, not `db.query.grades.findMany({ with: ... })`: the relational
      // mapper costs ~9ms of JS per page versus ~4ms here, and this route only
      // needs two joined names.
      const gradesList = await db
        .select({
          id: schema.grades.id,
          studentId: schema.grades.studentId,
          studentName: schema.users.name,
          subjectName: schema.subjects.name,
          examType: schema.grades.examType,
          marks: schema.grades.marks,
          maxMarks: schema.grades.maxMarks,
          grade: schema.grades.grade,
          remarks: schema.grades.remarks,
        })
        .from(schema.grades)
        .leftJoin(schema.students, eq(schema.grades.studentId, schema.students.id))
        .leftJoin(schema.users, eq(schema.students.userId, schema.users.id))
        .leftJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
        .where(and(
          eq(schema.grades.tenantId, tenantId!),

          user.role === 'parent' ? sql`EXISTS (
            SELECT 1 FROM ${schema.students} s
            JOIN ${schema.parents} p ON s."parentId" = p.id
            JOIN ${schema.subjects} sub ON sub.id = ${schema.grades.subjectId}
            WHERE s.id = ${schema.grades.studentId} AND p."userId" = ${user.id} AND sub."classId" = s."classId"
          )` : undefined,

          user.role === 'student' ? sql`EXISTS (
            SELECT 1 FROM ${schema.students} s
            JOIN ${schema.subjects} sub ON sub.id = ${schema.grades.subjectId}
            WHERE s.id = ${schema.grades.studentId} AND s."userId" = ${user.id} AND sub."classId" = s."classId"
          )` : undefined,

          query.studentId ? eq(schema.grades.studentId, query.studentId as string) : undefined,
          query.subjectId ? eq(schema.grades.subjectId, query.subjectId as string) : undefined,
          query.examType ? eq(schema.grades.examType, query.examType as string) : undefined,
          query.classId ? sql`EXISTS (
            SELECT 1 FROM ${schema.subjects} sub
            WHERE sub.id = ${schema.grades.subjectId} AND sub."classId" = ${query.classId as string}
          )` : undefined,
        ))
        .orderBy(desc(schema.grades.createdAt), desc(schema.grades.id))
        .limit(limit)
        .offset(skip);

      return gradesList.map(g => ({
        id: g.id, studentId: g.studentId, studentName: g.studentName,
        subjectName: g.subjectName, examType: g.examType,
        marks: g.marks, maxMarks: g.maxMarks, grade: g.grade, remarks: g.remarks,
      }));
    } catch (error) {
      captureError(error, { method: 'GET', path: '/grades', tenantId });
      set.status = 500;
      return { error: 'Failed to load grades' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      const data = body as any;

      if (typeof data.studentId !== 'string' || typeof data.subjectId !== 'string' || typeof data.examType !== 'string') {
        set.status = 400;
        return { error: 'studentId, subjectId and examType are required' };
      }
      // maxMarks 0 makes every marks value grade as A+ via division by zero.
      if (!Number.isFinite(data.marks) || !Number.isFinite(data.maxMarks) || data.maxMarks <= 0) {
        set.status = 400;
        return { error: 'marks and maxMarks must be numbers, and maxMarks must be positive' };
      }

      // SECURITY: Verify the student belongs to this tenant
      const student = await db.query.students.findFirst({
        where: eq(schema.students.id, data.studentId),
        with: { user: { columns: { tenantId: true } } }
      });
      if (!student || student.user.tenantId !== tenantId) {
        set.status = 403;
        return { error: 'Invalid student ID or access denied' };
      }

      // SECURITY: Automatically resolve teacherId from active session
      const teacher = await db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, user.id),
        columns: { id: true }
      });
      if (!teacher) {
        set.status = 403;
        return { error: 'Only authenticated teachers can post grades' };
      }
      const resolvedTeacherId = teacher.id;

      const calcGrade = (marks: number, max: number) => {
        const pct = (marks / max) * 100;
        if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B+';
        if (pct >= 60) return 'B'; if (pct >= 50) return 'C'; return 'D';
      };

      // (studentId, subjectId, examType) is unique, so re-recording a mark is an
      // update, not an insert. A plain insert threw a 23505 and returned 500.
      const [grade] = await db.insert(schema.grades).values({
        tenantId: tenantId!,
        studentId: data.studentId,
        subjectId: data.subjectId,
        teacherId: resolvedTeacherId,
        examType: data.examType,
        marks: data.marks,
        maxMarks: data.maxMarks,
        grade: calcGrade(data.marks, data.maxMarks),
        remarks: data.remarks,
      }).onConflictDoUpdate({
        target: [schema.grades.studentId, schema.grades.subjectId, schema.grades.examType],
        set: {
          marks: data.marks,
          maxMarks: data.maxMarks,
          grade: calcGrade(data.marks, data.maxMarks),
          remarks: data.remarks,
          teacherId: resolvedTeacherId,
        }
      }).returning();
      if (!grade) {
        set.status = 500;
        return { error: 'Failed to save grade' };
      }
      await dataCache.deleteMatch(`reports:${tenantId}:*`);
      return { id: grade.id };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/grades', tenantId });
      set.status = 500;
      return { error: 'Failed to save grade' };
    }
  })
  .post('/bulk', async ({ body, tenantId, user, set }) => {
    try {
      const { classId, subjectId, examType, maxMarks, records } = body as any;

      if (!Array.isArray(records) || records.length === 0) {
        set.status = 400;
        return { error: 'records must be a non-empty array' };
      }
      // One class-size round trip; anything larger is a client bug or an abuse attempt.
      if (records.length > 500) {
        set.status = 400;
        return { error: 'records cannot exceed 500 per request' };
      }
      // maxMarks 0 would make every marks value grade as A+ via division by zero.
      if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
        set.status = 400;
        return { error: 'maxMarks must be a positive number' };
      }

      // 1. Shape-check records first: this collapses duplicate students, which
      // Postgres' ON CONFLICT DO UPDATE cannot accept in a single statement.
      const byStudent = new Map<string, any>();
      for (const r of records) {
        if (typeof r?.studentId !== 'string' || !Number.isFinite(r.marks)) {
          set.status = 400;
          return { error: 'Each record needs a studentId and a numeric marks value' };
        }
        byStudent.set(r.studentId, r);
      }

      // 2. Verify class ownership
      const cls = await db.query.classes.findFirst({ where: eq(schema.classes.id, classId) });
      if (!cls || cls.tenantId !== tenantId) {
        set.status = 403;
        return { error: 'Access denied to this class' };
      }

      // 2.5 Validate all student IDs belong to this tenant
      const studentIds = [...byStudent.keys()];
      const validStudents = await db.select({ count: count() })
        .from(schema.students)
        .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
        .where(and(
          inArray(schema.students.id, studentIds),
          eq(schema.users.tenantId, tenantId!)
        ));
      if ((validStudents[0]?.count || 0) !== studentIds.length) {
        set.status = 403;
        return { error: 'Access denied: one or more students do not belong to your school' };
      }

      // 3. SECURITY: Automatically resolve teacherId from active session
      const teacher = await db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, user.id),
        columns: { id: true }
      });
      if (!teacher) {
        set.status = 403;
        return { error: 'Only authenticated teachers can post grades' };
      }
      const resolvedTeacherId = teacher.id;

      // 4. Map grades helper
      const calcGrade = (marks: number, max: number) => {
        const pct = (marks / max) * 100;
        if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B+';
        if (pct >= 60) return 'B'; if (pct >= 50) return 'C'; return 'D';
      };

      // 5. Upsert in one statement
      await db.insert(schema.grades).values([...byStudent.values()].map((r) => ({
        tenantId: tenantId!,
        studentId: r.studentId,
        subjectId,
        teacherId: resolvedTeacherId,
        examType,
        marks: r.marks,
        maxMarks,
        grade: calcGrade(r.marks, maxMarks),
        remarks: r.remarks
      }))).onConflictDoUpdate({
        target: [schema.grades.studentId, schema.grades.subjectId, schema.grades.examType],
        set: {
          tenantId: tenantId!,
          marks: sql`excluded.marks`,
          maxMarks: sql`excluded."maxMarks"`,
          grade: sql`excluded.grade`,
          remarks: sql`excluded.remarks`,
          teacherId: sql`excluded."teacherId"`
        }
      });

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'grades_bulk_recorded',
        properties: {
          tenantId,
          classId,
          subjectId,
          examType,
          count: records.length
        }
      });

      await dataCache.deleteMatch(`reports:${tenantId}:*`);
      return { success: true, count: records.length };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/grades/bulk', tenantId });
      console.error('[GRADES_BULK_POST]', error);
      set.status = 500;
      return { error: 'Failed to save grades' };
    }
  });

