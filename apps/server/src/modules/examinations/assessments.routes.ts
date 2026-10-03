import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, inArray, count, sql } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const assessmentsRoutes = new Elysia({ prefix: '/assessments' })
  .use(requireAuth)
  
  // ── Get All Assessments for a Class/Subject ───────────────────────────
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      const { classId, subjectId, status } = query;

      let teacherId: string | undefined;
      if (!classId || !subjectId) {
        const teacher = await db.query.teachers.findFirst({
          where: eq(schema.teachers.userId, user.id),
          columns: { id: true }
        });
        if (teacher) teacherId = teacher.id;
      }

      const assessmentsList = await db.query.assessments.findMany({
        where: (assessments, { eq, and }) => {
          const conditions = [
            eq(assessments.tenantId, tenantId!)
          ];
          if (classId) conditions.push(eq(assessments.classId, classId as string));
          if (subjectId) conditions.push(eq(assessments.subjectId, subjectId as string));
          if (status) conditions.push(eq(assessments.status, status as string));
          if (!classId && !subjectId && teacherId) conditions.push(eq(assessments.teacherId, teacherId));
          return and(...conditions);
        },
        with: {
          grades: {
            columns: { id: true }
          },
          subject: {
            columns: { name: true }
          },
          class: {
            columns: { id: true, name: true, section: true },
            with: { students: { columns: { id: true } } }
          }
        },
        orderBy: [desc(schema.assessments.createdAt)]
      });


      return assessmentsList;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/assessments', tenantId });
      set.status = 500;
      return { error: 'Failed to load assessments' };
    }
  })

  // ── Get Assessment Grades for a Student ──────────────────────────────
  .get('/student-grades', async ({ query, tenantId, user, set }) => {
    try {
      let targetStudentId = query.studentId as string;

      if (!targetStudentId && user.role === 'student') {
        const student = await db.query.students.findFirst({
          where: eq(schema.students.userId, user.id),
          columns: { id: true }
        });
        if (student) targetStudentId = student.id;
      }

      if (!targetStudentId) {
        set.status = 400;
        return { error: 'Student ID is required' };
      }

      const grades = await db.query.assessmentGrades.findMany({
        where: (g, { eq, and }) => and(
          eq(g.studentId, targetStudentId),
          eq(g.tenantId, tenantId!)
        ),
        with: {
          assessment: {
            with: {
              subject: { columns: { name: true } }
            }
          }
        },
        orderBy: [desc(schema.assessmentGrades.createdAt)]
      });

      return grades.map(g => ({
        id: g.id,
        assessmentId: g.assessmentId,
        title: g.assessment.title,
        type: g.assessment.type,
        subjectName: g.assessment.subject.name,
        marksObtained: g.marksObtained,
        totalMarks: g.assessment.totalMarks,
        passingMarks: g.assessment.passingMarks,
        remarks: g.remarks,
        createdAt: g.createdAt
      }));
    } catch (error) {
      captureError(error, { method: 'GET', path: '/assessments/student-grades', tenantId });
      console.error('[STUDENT_ASSESSMENT_GRADES]', error);
      set.status = 500;
      return { error: 'Failed to load student grades' };
    }
  })

  // ── Create New Assessment ──────────────────────────────────────────
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      const data = body as any;

      // Resolve the teacherId automatically
      const teacher = await db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, user.id),
        columns: { id: true }
      });
      if (!teacher) {
        set.status = 403;
        return { error: 'Only teachers can create assessments' };
      }

      // 🛡️ SECURITY: Validate class ownership
      const cls = await db.query.classes.findFirst({
        where: and(eq(schema.classes.id, data.classId), eq(schema.classes.tenantId, tenantId!))
      });
      if (!cls) {
        set.status = 400;
        return { error: 'Invalid class ID or access denied' };
      }

      // 🛡️ SECURITY: Validate subject ownership
      const sub = await db.query.subjects.findFirst({
        where: and(eq(schema.subjects.id, data.subjectId), eq(schema.subjects.tenantId, tenantId!))
      });
      if (!sub) {
        set.status = 400;
        return { error: 'Invalid subject ID or access denied' };
      }

      const [newAssessment] = await db.insert(schema.assessments).values({
        tenantId: tenantId!,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: teacher.id,
        title: data.title,
        type: data.type, // e.g. 'unit_test' | 'quiz' | 'practical'
        totalMarks: parseFloat(data.totalMarks),
        passingMarks: parseFloat(data.passingMarks),
      }).returning();

      posthog.capture({
        distinctId: user.id,
        event: 'assessment_created',
        properties: {
          tenantId,
          classId: data.classId,
          subjectId: data.subjectId,
          type: data.type
        }
      });

      return newAssessment;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/assessments', tenantId });
      console.error('[ASSESSMENT_CREATE_POST]', error);
      set.status = 500;
      return { error: 'Failed to save assessments' };
    }
  })

  // ── Get Existing Grades for an Assessment ──────────────────────────────
  .get('/:id/grades', async ({ params: { id }, tenantId, set }) => {
    try {
      // 🛡️ SECURITY: Verify the assessment belongs to the tenant
      const assessment = await db.query.assessments.findFirst({
        where: and(eq(schema.assessments.id, id), eq(schema.assessments.tenantId, tenantId!)),
        columns: { id: true }
      });
      if (!assessment) {
        set.status = 404;
        return { error: 'Assessment not found or unauthorized' };
      }

      const grades = await db.query.assessmentGrades.findMany({
        where: and(eq(schema.assessmentGrades.assessmentId, id), eq(schema.assessmentGrades.tenantId, tenantId!)),
      });
      return grades;
    } catch (error) {
      captureError(error, { method: 'GET', path: `/assessments/${id}/grades`, tenantId });
      set.status = 500;
      return { error: 'Failed to load assessment grades' };
    }
  })

  // ── Bulk Insert/Update Assessment Grades ─────────────────────────────────
  .post('/bulk-grades', async ({ body, tenantId, user, set }) => {
    try {
      const { assessmentId, records } = body as any;

      // 1. Fetch Assessment context to verify tenant ownership
      const assessment = await db.query.assessments.findFirst({
        where: eq(schema.assessments.id, assessmentId)
      });
      if (!assessment || assessment.tenantId !== tenantId) {
        set.status = 404;
        return { error: 'Assessment not found or unauthorized' };
      }

      // 1.5 Security: Check if all student IDs belong to this tenant
      const studentIds = records.map((r: any) => r.studentId);
      if (studentIds.length > 0) {
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
      }

      // 2. Upsert all rows in one statement (marksObtained/remarks vary per row → EXCLUDED)
      if (records.length > 0) {
        await db.insert(schema.assessmentGrades).values(records.map((r: any) => ({
          tenantId: tenantId!,
          assessmentId,
          studentId: r.studentId,
          marksObtained: parseFloat(r.marksObtained),
          remarks: r.remarks || '',
        }))).onConflictDoUpdate({
          target: [schema.assessmentGrades.assessmentId, schema.assessmentGrades.studentId],
          set: {
            marksObtained: sql`EXCLUDED."marksObtained"`,
            remarks: sql`EXCLUDED."remarks"`,
            updatedAt: new Date(),
          }
        });
      }

      posthog.capture({
        distinctId: user.id,
        event: 'assessment_grades_bulk_recorded',
        properties: {
          tenantId,
          assessmentId,
          count: records.length
        }
      });

      return { success: true, count: records.length };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/assessments/bulk-grades', tenantId });
      console.error('[ASSESSMENT_GRADES_BULK_POST]', error);
      set.status = 500;
      return { error: 'Failed to save grades' };
    }
  })

  // ── Mark Assessment Completed ──────────────────────────────────────────
  .put('/:id/complete', async ({ params, tenantId, set }) => {
    try {
      const { id } = params;
      const [updated] = await db.update(schema.assessments)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(and(eq(schema.assessments.id, id), eq(schema.assessments.tenantId, tenantId!)))
        .returning();

      if (!updated) {
        set.status = 404;
        return { success: false, message: 'Assessment not found' };
      }

      return { success: true, data: updated };
    } catch (error) {
      captureError(error, { method: 'PUT', path: `/assessments/${params.id}/complete`, tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to complete assessment' };
    }
  });
