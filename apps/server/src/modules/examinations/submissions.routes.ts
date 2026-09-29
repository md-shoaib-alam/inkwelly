import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, inArray, count } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const submissionsRoutes = new Elysia({ prefix: '/submissions' })
  .use(requireAuth)
  .get('/', async ({ query, tenantId, set }) => {
    try {
      const assignmentId = query.assignmentId as string;
      const submissionsList = await db.query.submissions.findMany({
        where: (submissions, { eq, and }) => {
          const conditions = [eq(submissions.tenantId, tenantId!)];
          if (assignmentId) conditions.push(eq(submissions.assignmentId, assignmentId));
          if (query.studentId) conditions.push(eq(submissions.studentId, query.studentId as string));
          return and(...conditions);
        },
        with: {
          student: { 
            with: { 
              user: { columns: { name: true, email: true } }, 
              class: { columns: { name: true, section: true } } 
            } 
          },
          assignment: { 
            with: { 
              subject: { columns: { name: true } }, 
              teacher: { with: { user: { columns: { name: true } } } } 
            } 
          },
        },
        orderBy: [desc(schema.submissions.submittedAt)],
      });

      const formattedSubmissions = submissionsList.map(s => ({
        id: s.id, assignmentId: s.assignmentId, studentId: s.studentId,
        content: s.content, status: s.status, submittedAt: s.submittedAt,
        grade: s.grade, feedback: s.feedback,
        studentName: s.student.user.name,
        studentRollNumber: s.student.rollNumber,
        studentClass: `${s.student.class.name}-${s.student.class.section}`,
        assignmentTitle: s.assignment.title, assignmentDescription: s.assignment.description,
        assignmentDueDate: s.assignment.dueDate,
        subjectName: s.assignment.subject.name, teacherName: s.assignment.teacher.user.name,
      }));

      if (assignmentId && !query.studentId) {
        const assignment = await db.query.assignments.findFirst({
          where: and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.tenantId, tenantId!)),
          with: {
            class: {
              columns: { name: true, section: true },
              with: {
                students: {
                  where: eq(schema.students.status, 'active'),
                  with: {
                    user: { columns: { name: true, email: true } }
                  }
                }
              }
            },
            subject: { columns: { name: true } },
            teacher: { with: { user: { columns: { name: true } } } }
          }
        });

        if (assignment) {
          const submittedStudentIds = new Set(formattedSubmissions.map(s => s.studentId));
          const notSubmitted = assignment.class.students.filter(s => !submittedStudentIds.has(s.id));

          const formattedNotSubmitted = notSubmitted.map(s => ({
            id: `not_sub_${s.id}`,
            assignmentId: assignment.id,
            studentId: s.id,
            content: null,
            status: 'not_submitted',
            submittedAt: new Date().toISOString(),
            grade: null,
            feedback: null,
            studentName: s.user.name,
            studentRollNumber: s.rollNumber,
            studentClass: `${assignment.class.name}-${assignment.class.section}`,
            assignmentTitle: assignment.title,
            assignmentDescription: assignment.description,
            assignmentDueDate: assignment.dueDate,
            subjectName: assignment.subject.name,
            teacherName: assignment.teacher.user.name,
          }));

          return {
            success: true,
            data: [...formattedSubmissions, ...formattedNotSubmitted]
          };
        }
      }

      return {
        success: true,
        data: formattedSubmissions,
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/submissions', tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to fetch submissions' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      if (!data.assignmentId) { set.status = 400; return { success: false, message: 'assignmentId is required' }; }
      if (!data.studentId) { set.status = 400; return { success: false, message: 'studentId is required' }; }

      // SECURITY: Verify assignment belongs to tenant
      const assignment = await db.query.assignments.findFirst({ where: and(eq(schema.assignments.id, data.assignmentId), eq(schema.assignments.tenantId, tenantId!)) });
      if (!assignment) { set.status = 403; return { success: false, message: 'Access denied' }; }

      // 🛡️ SECURITY: Verify student belongs to tenant
      const student = await db.query.students.findFirst({
        where: eq(schema.students.id, data.studentId),
        with: { user: { columns: { tenantId: true } } }
      });
      if (!student || student.user.tenantId !== tenantId) {
        set.status = 403;
        return { success: false, message: 'Access denied: student does not belong to your school' };
      }

      const [submission] = await db.insert(schema.submissions).values({ 
        tenantId: tenantId!,
        assignmentId: data.assignmentId, studentId: data.studentId, 
        content: data.content || null, status: data.status || 'submitted',
        grade: data.grade || null,
        feedback: data.feedback || null
      }).returning();

      if (!submission) throw new Error('Failed to create submission');

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'submission_recorded',
        properties: {
          tenantId,
          assignmentId: submission.assignmentId,
          studentId: submission.studentId
        }
      });

      return { success: true, data: { id: submission.id, assignmentId: submission.assignmentId, studentId: submission.studentId, content: submission.content, status: submission.status, submittedAt: submission.submittedAt, grade: submission.grade, feedback: submission.feedback } };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/submissions', tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to create submission' };
    }
  })
  .put('/bulk', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      const updates = data.updates;
      if (!updates || !Array.isArray(updates)) {
        set.status = 400;
        return { success: false, message: 'updates array is required' };
      }

      // Collect all studentIds and assignmentIds to check
      const studentIdsToCheck = new Set<string>();
      const assignmentIdsToCheck = new Set<string>();

      for (const u of updates) {
        if (!u.id) continue;
        if (u.id.startsWith('not_sub_')) {
          const assignmentId = data.assignmentId || u.assignmentId;
          if (assignmentId) {
            assignmentIdsToCheck.add(assignmentId);
          }
          studentIdsToCheck.add(u.id.replace('not_sub_', ''));
        }
      }

      // 🛡️ SECURITY: Validate all target assignments belong to tenant
      if (assignmentIdsToCheck.size > 0) {
        const validAssignments = await db.select({ count: count() })
          .from(schema.assignments)
          .where(and(
            inArray(schema.assignments.id, Array.from(assignmentIdsToCheck)),
            eq(schema.assignments.tenantId, tenantId!)
          ));
        if ((validAssignments[0]?.count || 0) !== assignmentIdsToCheck.size) {
          set.status = 403;
          return { success: false, message: 'Access denied: one or more assignments do not belong to your school' };
        }
      }

      // 🛡️ SECURITY: Validate all target students belong to tenant
      if (studentIdsToCheck.size > 0) {
        const studentIdsArray = Array.from(studentIdsToCheck);
        const validStudents = await db.select({ count: count() })
          .from(schema.students)
          .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
          .where(and(
            inArray(schema.students.id, studentIdsArray),
            eq(schema.users.tenantId, tenantId!)
          ));
        if ((validStudents[0]?.count || 0) !== studentIdsArray.length) {
          set.status = 403;
          return { success: false, message: 'Access denied: one or more students do not belong to your school' };
        }
      }

      await db.transaction(async (tx) => {
        for (const u of updates) {
          if (!u.id) continue;

          if (u.id.startsWith('not_sub_')) {
            if (u.status === 'not_submitted') continue;
            const assignmentId = data.assignmentId || u.assignmentId;
            if (!assignmentId) continue;
            const studentId = u.id.replace('not_sub_', '');
            await tx.insert(schema.submissions).values({
              tenantId: tenantId!,
              assignmentId: assignmentId,
              studentId: studentId,
              content: null,
              status: u.status || 'submitted',
              grade: u.grade || null,
              feedback: u.feedback || null
            });
            continue;
          }

          if (u.status === 'not_submitted') {
            await tx.delete(schema.submissions)
              .where(and(
                eq(schema.submissions.id, u.id),
                eq(schema.submissions.tenantId, tenantId!)
              ));
            continue;
          }

          const updateData: any = {};
          if (u.grade !== undefined) updateData.grade = u.grade;
          if (u.status !== undefined) updateData.status = u.status;
          if (u.feedback !== undefined) updateData.feedback = u.feedback;

          await tx.update(schema.submissions)
            .set(updateData)
            .where(and(
              eq(schema.submissions.id, u.id),
              eq(schema.submissions.tenantId, tenantId!)
            ));
        }
      });

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/submissions/bulk', tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to bulk update submissions' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      if (!data.id) { set.status = 400; return { success: false, message: 'id is required' }; }

      if (data.id.startsWith('not_sub_')) {
        const assignmentId = data.assignmentId;
        if (!assignmentId) { set.status = 400; return { success: false, message: 'assignmentId is required for new entries' }; }
        const studentId = data.id.replace('not_sub_', '');

        // 🛡️ SECURITY: Verify assignment belongs to tenant
        const assignment = await db.query.assignments.findFirst({
          where: and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.tenantId, tenantId!)),
          columns: { id: true }
        });
        if (!assignment) {
          set.status = 403;
          return { success: false, message: 'Access denied: assignment not found' };
        }

        // 🛡️ SECURITY: Verify student belongs to tenant
        const student = await db.query.students.findFirst({
          where: eq(schema.students.id, studentId),
          with: { user: { columns: { tenantId: true } } }
        });
        if (!student || student.user.tenantId !== tenantId) {
          set.status = 403;
          return { success: false, message: 'Access denied: student does not belong to your school' };
        }

        const [submission] = await db.insert(schema.submissions).values({
          tenantId: tenantId!,
          assignmentId: assignmentId,
          studentId: studentId,
          content: null,
          status: data.status || 'graded',
          grade: data.grade || null,
          feedback: data.feedback || null
        }).returning();
        if (!submission) throw new Error('Failed to insert submission');
        return { success: true, data: { id: submission.id, assignmentId: submission.assignmentId, studentId: submission.studentId, content: submission.content, status: submission.status, submittedAt: submission.submittedAt, grade: submission.grade, feedback: submission.feedback } };
      }

      // SECURITY: Verify submission belongs to tenant
      const sub = await db.query.submissions.findFirst({ where: and(eq(schema.submissions.id, data.id), eq(schema.submissions.tenantId, tenantId!)) });
      if (!sub) { set.status = 403; return { success: false, message: 'Access denied' }; }

      const updateData: any = {};
      if (data.content !== undefined) updateData.content = data.content;
      if (data.grade !== undefined) updateData.grade = data.grade;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.feedback !== undefined) updateData.feedback = data.feedback;

      const [submission] = await db.update(schema.submissions).set(updateData).where(eq(schema.submissions.id, data.id)).returning();
      if (!submission) throw new Error('Failed to update submission');
      return { success: true, data: { id: submission.id, assignmentId: submission.assignmentId, studentId: submission.studentId, content: submission.content, status: submission.status, submittedAt: submission.submittedAt, grade: submission.grade, feedback: submission.feedback } };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/submissions', tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to update submission' };
    }
  })
  .delete('/', async ({ query, tenantId, set }) => {
    try {
      const id = query.id as string;
      if (!id) { set.status = 400; return { success: false, message: 'id is required' }; }

      // SECURITY: Verify ownership
      const sub = await db.query.submissions.findFirst({ where: and(eq(schema.submissions.id, id), eq(schema.submissions.tenantId, tenantId!)) });
      if (!sub) { set.status = 403; return { success: false, message: 'Access denied' }; }

      await db.delete(schema.submissions).where(eq(schema.submissions.id, id));
      return { success: true, data: { id } };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/submissions', tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to delete submission' };
    }
  });

