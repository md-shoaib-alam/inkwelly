import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, desc, count, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { requirePermission } from '../lib/permissions';
import { dataCache } from '../lib/cache';
import { posthog, captureError } from '../lib/monitoring/posthog';
import { exams } from '../db/schema';

// Helper function to sync exam results to schema.grades
export async function syncExamResultsToGrades(examId: string, tenantId: string, activeUserId?: string) {
  try {
    const exam = await db.query.exams.findFirst({
      where: and(eq(schema.exams.id, examId), eq(schema.exams.tenantId, tenantId)),
      with: {
        subject: true
      }
    });

    if (!exam) {
      console.warn(`[SYNC_EXAM_RESULTS_TO_GRADES] Exam ${examId} not found under tenant ${tenantId}`);
      return;
    }

    // Resolve teacher ID: 1. Current user if they are a teacher, 2. Subject teacher, 3. Fallback to 'system'
    let resolvedTeacherId = exam.subject?.teacherId || 'system';
    if (activeUserId) {
      const teacher = await db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, activeUserId),
        columns: { id: true }
      });
      if (teacher) {
        resolvedTeacherId = teacher.id;
      }
    }

    // Query all results for this exam
    const results = await db.query.examResults.findMany({
      where: eq(schema.examResults.examId, examId)
    });

    if (results.length === 0) {
      return;
    }

    const calcGrade = (marks: number, max: number) => {
      if (!max || max <= 0) return 'D';
      const pct = (marks / max) * 100;
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+';
      if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';
      return 'D';
    };

    const gradesToInsert = results.map(res => ({
      tenantId,
      studentId: res.studentId,
      subjectId: exam.subjectId,
      teacherId: resolvedTeacherId,
      examType: exam.examType,
      marks: res.marksObtained ?? 0,
      maxMarks: exam.totalMarks || 100,
      grade: calcGrade(res.marksObtained ?? 0, exam.totalMarks || 100),
      remarks: res.remarks || '',
    }));

    await db.transaction(async (tx) => {
      if (gradesToInsert.length > 0) {
        await tx.insert(schema.grades).values(gradesToInsert).onConflictDoUpdate({
          target: [schema.grades.studentId, schema.grades.subjectId, schema.grades.examType],
          set: {
            marks: sql`EXCLUDED.marks`,
            maxMarks: sql`EXCLUDED."maxMarks"`,
            grade: sql`EXCLUDED.grade`,
            remarks: sql`EXCLUDED.remarks`,
            teacherId: sql`EXCLUDED."teacherId"`,
            updatedAt: new Date()
          }
        });
      }
    });

    console.log(`[SYNC_EXAM_RESULTS_TO_GRADES] Synced ${results.length} results to grades for exam ${exam.name} (${examId})`);
  } catch (error) {
    console.error(`[SYNC_EXAM_RESULTS_TO_GRADES_ERROR]`, error);
    throw error;
  }
}

export const examsRoutes = new Elysia({ prefix: '/exams' })
  .use(requireAuth)
  .use(requirePermission('exams'))
  
  // â”€â”€ Get All Exams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      const { id, classId, status, page = '1', limit = '50', mine } = query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);
      
      let mineSubjectIds: string[] | null = null;
      if (mine === 'true') {
        const teacher = await db.query.teachers.findFirst({
          where: eq(schema.teachers.userId, user.id),
          columns: { id: true }
        });
        if (teacher) {
          const teacherSubjects = await db.query.subjects.findMany({
            where: eq(schema.subjects.teacherId, teacher.id),
            columns: { id: true }
          });
          mineSubjectIds = teacherSubjects.map((s) => s.id);
        } else {
          mineSubjectIds = [];
        }
      }

      const conditions: any[] = [eq(schema.exams.tenantId, tenantId!)];
      if (id) conditions.push(eq(schema.exams.id, id as string));
      if (classId && classId !== 'all') conditions.push(eq(schema.exams.classId, classId as string));
      if (status && status !== 'all') conditions.push(eq(schema.exams.status, status as string));
      
      if (mine === 'true') {
        if (mineSubjectIds && mineSubjectIds.length > 0) {
          conditions.push(inArray(schema.exams.subjectId, mineSubjectIds));
        } else {
          conditions.push(sql`1 = 0`);
        }
      }

      // Enforce current class/academic year for students and parents
      if (user.role === 'student') {
        const student = await db.query.students.findFirst({
          where: eq(schema.students.userId, user.id),
          columns: { classId: true, academicYear: true }
        });
        if (student) {
          conditions.push(eq(schema.exams.classId, student.classId));
          conditions.push(eq(schema.exams.academicYear, student.academicYear));
        } else {
          conditions.push(sql`1 = 0`);
        }
      } else if (user.role === 'parent') {
        const parent = await db.query.parents.findFirst({
          where: eq(schema.parents.userId, user.id),
          columns: { id: true }
        });
        if (parent) {
          const children = await db.query.students.findMany({
            where: eq(schema.students.parentId, parent.id),
            columns: { classId: true, academicYear: true }
          });
          if (children.length > 0) {
            conditions.push(inArray(schema.exams.classId, children.map(c => c.classId)));
            conditions.push(inArray(schema.exams.academicYear, children.map(c => c.academicYear)));
          } else {
            conditions.push(sql`1 = 0`);
          }
        } else {
          conditions.push(sql`1 = 0`);
        }
      }

      const whereClause = and(...conditions);

      const [examsList, totalResult] = await Promise.all([
        db.query.exams.findMany({
          where: whereClause,
          with: {
            class: { 
              columns: { id: true, name: true, section: true },
              with: {
                students: {
                  columns: { id: true, status: true }
                }
              }
            },
            subject: { 
              columns: { id: true, name: true, teacherId: true },
              with: {
                teacher: {
                  with: {
                    user: { columns: { name: true } }
                  }
                }
              }
            },
            results: {
              columns: { id: true, marksObtained: true, status: true }
            }
          },
          orderBy: [desc(schema.exams.date), desc(schema.exams.id)],
          limit: take,
          offset: skip,
        }),
        db.select({ count: count() }).from(schema.exams).where(whereClause)
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        data: examsList.map(e => {
          const rawName = e.name || '';
          const subName = e.subject?.name || '';
          let cleanExamName = rawName;
          if (subName && rawName.toLowerCase().endsWith(` - ${subName.toLowerCase()}`)) {
            cleanExamName = rawName.slice(0, rawName.length - (subName.length + 3)).trim();
          }

          const activeStudents = (e.class as any)?.students?.filter((s: any) => s.status !== 'inactive' && s.status !== 'transferred') ?? ((e.class as any)?.students || []);
          const totalStudents = activeStudents.length;
          const marksEnteredCount = (e.results as any)?.length || 0;
          const teacherName = (e.subject as any)?.teacher?.user?.name || '';

          return {
            id: e.id,
            classId: e.classId,
            className: e.class.name,
            classSection: e.class.section,
            subjectId: e.subjectId,
            subjectName: e.subject.name,
            name: cleanExamName,
            rawName: e.name,
            examType: e.examType,
            academicYear: e.academicYear,
            totalMarks: e.totalMarks,
            passingMarks: e.passingMarks,
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime,
            status: e.status,
            teacherName,
            totalStudents,
            marksEnteredCount,
            isPublished: e.status === 'published',
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          };
        }),
        pagination: {
          total: Number(total),
          page: parseInt(page as string),
          limit: take,
          totalPages: Math.ceil(Number(total) / take)
        }
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/exams', tenantId });
      console.error('[EXAMS_GET]', error);
      set.status = 500;
      return { error: 'Failed to fetch exams' };
    }
  })
 
  // â”€â”€ Create Exam (Single or Bulk) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;

      // Bulk Create logic moved to /bulk but kept here for backward compatibility
      if (data.bulk) {
        const { classId, examType, name, exams, academicYear } = data;
        
        const cls = await db.query.classes.findFirst({
          where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId!))
        });
        if (!cls) {
          set.status = 400;
          return { error: 'Invalid class ID or access denied' };
        }

        const subjectIds = exams.map((e: any) => e.subjectId);
        if (subjectIds.length > 0) {
          const validSubjects = await db.select({ count: count() })
            .from(schema.subjects)
            .where(and(
              inArray(schema.subjects.id, subjectIds),
              eq(schema.subjects.tenantId, tenantId!)
            ));
          if ((validSubjects[0]?.count || 0) !== subjectIds.length) {
            set.status = 403;
            return { error: 'Access denied: one or more subjects do not belong to your school' };
          }
        }

        const created = await db.transaction(async (tx) => {
          const items = [];
          for (const exam of exams) {
            const currentYear = new Date().getFullYear();
            const fallbackYear = `${currentYear}-${currentYear + 1}`;
            const [newExam] = await tx.insert(schema.exams).values({
              tenantId: tenantId!,
              classId,
              subjectId: exam.subjectId,
              examType,
              name: name.trim(),
              academicYear: academicYear || fallbackYear,
              date: exam.date,
              startTime: exam.startTime,
              endTime: exam.endTime,
              totalMarks: exam.totalMarks,
              passingMarks: exam.passingMarks,
              status: 'scheduled'
            }).returning();
            items.push(newExam);
          }
          return items;
        });

        return { success: true, totalCreated: created.length };
      }

      // Single Create
      const cls = await db.query.classes.findFirst({
        where: and(eq(schema.classes.id, data.classId), eq(schema.classes.tenantId, tenantId!))
      });
      if (!cls) {
        set.status = 400;
        return { error: 'Invalid class ID or access denied' };
      }

      const sub = await db.query.subjects.findFirst({
        where: and(eq(schema.subjects.id, data.subjectId), eq(schema.subjects.tenantId, tenantId!))
      });
      if (!sub) {
        set.status = 400;
        return { error: 'Invalid subject ID or access denied' };
      }

      const singleFallbackYear = (() => { const y = new Date().getFullYear(); return `${y}-${y + 1}`; })();
      const [exam] = await db.insert(schema.exams).values({
        tenantId: tenantId!,
        classId: data.classId,
        subjectId: data.subjectId,
        name: data.name,
        examType: data.examType,
        academicYear: data.academicYear || singleFallbackYear,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        status: 'scheduled'
      }).returning();

      if (!exam) throw new Error('Failed to create exam');

      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'exam_created',
        properties: {
          tenantId,
          examId: exam.id,
          name: exam.name,
          classId: exam.classId
        }
      });

      return exam;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/exams', tenantId });
      console.error('[EXAMS_POST]', error);
      set.status = 500;
      return { error: 'Failed to create exam' };
    }
  })

  // â”€â”€ Bulk Create Exams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  .post('/bulk', async ({ body, tenantId, set }) => {
    try {
      const { classId, examType, name, exams, academicYear } = body as any;

      if (!classId || !examType || !name || !exams || !Array.isArray(exams)) {
        set.status = 400;
        return { error: 'classId, examType, name, and exams array are required' };
      }

      const cls = await db.query.classes.findFirst({
        where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId!))
      });
      if (!cls) {
        set.status = 400;
        return { error: 'Invalid class ID or access denied' };
      }

      const subjectIds = exams.map((e: any) => e.subjectId);
      if (subjectIds.length > 0) {
        const validSubjects = await db.select({ count: count() })
          .from(schema.subjects)
          .where(and(
            inArray(schema.subjects.id, subjectIds),
            eq(schema.subjects.tenantId, tenantId!)
          ));
        if ((validSubjects[0]?.count || 0) !== subjectIds.length) {
          set.status = 403;
          return { error: 'Access denied: one or more subjects do not belong to your school' };
        }
      }

      const currentYear = new Date().getFullYear();
      const fallbackYear = `${currentYear}-${currentYear + 1}`;
      const created = await db.transaction(async (tx) => {
        const items = [];
        for (const exam of exams) {
          const [newExam] = await tx.insert(schema.exams).values({
            tenantId: tenantId!,
            classId,
            subjectId: exam.subjectId,
            examType,
            name: name.trim(),
            academicYear: academicYear || fallbackYear,
            date: exam.date,
            startTime: exam.startTime,
            endTime: exam.endTime,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            status: 'scheduled'
          }).returning();
          items.push(newExam);
        }
        return items;
      });

      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'exams_bulk_created',
        properties: {
          tenantId,
          classId,
          count: created.length,
          examType
        }
      });

      set.status = 201;
      return { success: true, totalCreated: created.length };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/exams/bulk', tenantId });
      console.error('[EXAMS_BULK_POST]', error);
      set.status = 500;
      return { error: 'Failed to create exams' };
    }
  })

  // â”€â”€ Update Exam â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  .put('/', async ({ body, tenantId, user, set }) => {
    try {
      const data = body as any;
      const { id, rawIds, subjectUpdates, applyToAllSubjects, ...updateData } = data;

      const existing = await db.query.exams.findFirst({ where: and(eq(schema.exams.id, id), eq(schema.exams.tenantId, tenantId!)) });
      if (!existing) {
        set.status = 404;
        return { error: 'Exam not found' };
      }

      const [updated] = await db.update(schema.exams).set({
        classId: updateData.classId || existing.classId,
        subjectId: updateData.subjectId || existing.subjectId,
        name: updateData.name !== undefined ? updateData.name : existing.name,
        examType: updateData.examType || existing.examType,
        academicYear: updateData.academicYear || existing.academicYear,
        date: updateData.date !== undefined ? updateData.date : existing.date,
        startTime: updateData.startTime !== undefined ? updateData.startTime : existing.startTime,
        endTime: updateData.endTime !== undefined ? updateData.endTime : existing.endTime,
        totalMarks: updateData.totalMarks !== undefined ? Number(updateData.totalMarks) : existing.totalMarks,
        passingMarks: updateData.passingMarks !== undefined ? Number(updateData.passingMarks) : existing.passingMarks,
        status: updateData.status || existing.status,
      }).where(eq(schema.exams.id, id)).returning();

      if (!updated) throw new Error('Failed to update exam');

      // If exam is part of an exam cycle (rawIds), sync common properties across all subjects
      if (Array.isArray(rawIds) && rawIds.length > 0) {
        const commonPayload: any = {};
        if (updateData.name !== undefined) commonPayload.name = updateData.name;
        if (updateData.academicYear) commonPayload.academicYear = updateData.academicYear;
        if (updateData.examType) commonPayload.examType = updateData.examType;
        if (applyToAllSubjects) {
          if (updateData.date) commonPayload.date = updateData.date;
          if (updateData.startTime) commonPayload.startTime = updateData.startTime;
          if (updateData.endTime) commonPayload.endTime = updateData.endTime;
          if (updateData.totalMarks !== undefined) commonPayload.totalMarks = Number(updateData.totalMarks);
          if (updateData.passingMarks !== undefined) commonPayload.passingMarks = Number(updateData.passingMarks);
        }
        if (Object.keys(commonPayload).length > 0) {
          await db.update(schema.exams)
            .set(commonPayload)
            .where(and(inArray(schema.exams.id, rawIds), eq(schema.exams.tenantId, tenantId!)));
        }
      }

      // If specific subject timetable updates were supplied
      if (Array.isArray(subjectUpdates) && subjectUpdates.length > 0) {
        for (const sub of subjectUpdates) {
          if (sub.id) {
            await db.update(schema.exams).set({
              ...(sub.date ? { date: sub.date } : {}),
              ...(sub.startTime ? { startTime: sub.startTime } : {}),
              ...(sub.endTime ? { endTime: sub.endTime } : {}),
              ...(sub.totalMarks !== undefined ? { totalMarks: Number(sub.totalMarks) } : {}),
              ...(sub.passingMarks !== undefined ? { passingMarks: Number(sub.passingMarks) } : {}),
            }).where(and(eq(schema.exams.id, sub.id), eq(schema.exams.tenantId, tenantId!)));
          }
        }
      }

      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'exam_updated',
        properties: {
          tenantId,
          examId: updated.id,
          name: updated.name
        }
      });

      if (updated.status === 'completed') {
        await syncExamResultsToGrades(updated.id, tenantId!, user.id);
      }

      return updated;
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/exams', tenantId });
      console.error('[EXAMS_PUT]', error);
      set.status = 500;
      return { error: 'Failed to update exam' };
    }
  })

  // ── Delete Exam ──────────────────────────────────────────────────────────
  .delete('/', async ({ query, tenantId, set }) => {
    try {
      const { id } = query;
      if (!id) {
        set.status = 400;
        return { error: 'ID is required' };
      }

      const ids = (id as string).split(',').map(s => s.trim()).filter(Boolean);
      await db.delete(schema.exams).where(and(inArray(schema.exams.id, ids), eq(schema.exams.tenantId, tenantId!)));
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'exam_deleted',
        properties: {
          tenantId,
          count: ids.length
        }
      });

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/exams', tenantId });
      console.error('[EXAMS_DELETE]', error);
      set.status = 500;
      return { error: 'Failed to delete exam' };
    }
  })

  // ── Publish Exam Results ──────────────────────────────────────────
  .post('/publish', async ({ body, tenantId, user, set }) => {
    try {
      const { examIds, classId, examName, publishToStudents = true, publishToParents = true } = body as any;

      let targetExamIds: string[] = [];
      if (Array.isArray(examIds) && examIds.length > 0) {
        targetExamIds = examIds;
      } else if (classId && examName) {
        const found = await db.query.exams.findMany({
          where: and(
            eq(schema.exams.tenantId, tenantId!),
            eq(schema.exams.classId, classId),
          ),
          columns: { id: true, name: true }
        });
        targetExamIds = found
          .filter(e => {
            const raw = e.name.toLowerCase();
            const target = examName.toLowerCase();
            return raw === target || raw.startsWith(`${target} - `);
          })
          .map(e => e.id);
      }

      if (targetExamIds.length === 0) {
        set.status = 400;
        return { error: 'No matching exams found to publish' };
      }

      // 1. Mark exam status as 'published' (or completed)
      await db.update(schema.exams)
        .set({ status: 'published', updatedAt: new Date() })
        .where(and(
          inArray(schema.exams.id, targetExamIds),
          eq(schema.exams.tenantId, tenantId!)
        ));

      // 2. Mark exam results as 'published'
      await db.update(schema.examResults)
        .set({ status: 'published', updatedAt: new Date() })
        .where(inArray(schema.examResults.examId, targetExamIds));

      // 3. Sync to schema.grades
      for (const eid of targetExamIds) {
        try {
          await syncExamResultsToGrades(eid, tenantId!, user?.id);
        } catch (e) {
          console.warn(`[SYNC_ERROR_ON_PUBLISH] ${eid}:`, e);
        }
      }

      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      return {
        success: true,
        publishedCount: targetExamIds.length,
        publishToStudents,
        publishToParents,
        message: 'Exam results published successfully!'
      };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/exams/publish', tenantId });
      console.error('[EXAMS_PUBLISH]', error);
      set.status = 500;
      return { error: 'Failed to publish exam results' };
    }
  })

  // â”€â”€ Get Exam Results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  .get('/results', async ({ query, tenantId, set }) => {
    try {
      const { examId } = query;
      if (!examId) {
        set.status = 400;
        return { error: 'Exam ID is required' };
      }

      // Security: Check if exam belongs to tenant
      const exam = await db.query.exams.findFirst({
        where: and(eq(schema.exams.id, examId as string), eq(schema.exams.tenantId, tenantId!)),
        columns: { id: true }
      });

      if (!exam) {
        set.status = 404;
        return { error: 'Exam not found' };
      }

      const results = await db.query.examResults.findMany({
        where: eq(schema.examResults.examId, examId as string),
        with: {
          student: { with: { user: { columns: { name: true } } } }
        }
      });

      return {
        results: results.map(r => ({
          studentId: r.studentId,
          studentName: r.student.user.name,
          marksObtained: r.marksObtained,
          status: r.status,
          remarks: r.remarks,
        }))
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/exams/results', tenantId });
      console.error('[EXAM_RESULTS_GET]', error);
      set.status = 500;
      return { error: 'Failed to fetch results' };
    }
  })

  // â”€â”€ Save Exam Results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  .post('/results', async ({ body, tenantId, user, set }) => {
    try {
      const { examId, results } = body as any;

      if (!examId || !results) {
        set.status = 400;
        return { error: 'Exam ID and results are required' };
      }

      // Security: Check if exam belongs to tenant
      const exam = await db.query.exams.findFirst({
        where: and(eq(schema.exams.id, examId), eq(schema.exams.tenantId, tenantId!)),
        columns: { id: true, status: true }
      });

      if (!exam) {
        set.status = 404;
        return { error: 'Exam not found' };
      }

      // Security: Check if all student IDs belong to this tenant
      const studentIds = results.map((r: any) => r.studentId);
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

      const savedCount = await db.transaction(async (tx) => {
        let count = 0;
        for (const res of results) {
          await tx.insert(schema.examResults).values({
            examId,
            studentId: res.studentId,
            marksObtained: res.marksObtained,
            status: res.status,
            remarks: res.remarks,
          }).onConflictDoUpdate({
            target: [schema.examResults.examId, schema.examResults.studentId],
            set: {
              marksObtained: res.marksObtained,
              status: res.status,
              remarks: res.remarks,
            }
          });
          count++;
        }
        return count;
      });

      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      if (exam.status === 'completed') {
        await syncExamResultsToGrades(examId, tenantId!, user.id);
      }

      return { success: true, created: savedCount, total: results.length };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/exams/results', tenantId });
      console.error('[EXAM_RESULTS_POST]', error);
      set.status = 500;
      return { error: 'Failed to save results' };
    }
  });

export const examRoutes = exams;

