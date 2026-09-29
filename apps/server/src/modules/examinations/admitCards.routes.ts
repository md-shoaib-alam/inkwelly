import { Elysia, t } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, inArray, count, asc } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const admitCardsRoutes = new Elysia({ prefix: '/admit-cards' })
  .use(requireAuth)
  
  // ── Get Data for Admit Card Generation ──────────────────────────────────
  .get('/', async ({ query, tenantId, set }) => {
    try {
      const { classId } = query as any;
      if (!classId) {
        set.status = 400;
        return { error: 'Class ID is required' };
      }

      const cacheKey = `admit-cards:data:${tenantId}:${classId}`;
      const cached = await dataCache.get(cacheKey);
      if (cached) return cached;

      const [classDetails, school, exams, students] = await Promise.all([
        db.query.classes.findFirst({
          where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId!)),
          columns: { id: true, name: true, section: true, grade: true }
        }),
        db.query.tenants.findFirst({
          where: eq(schema.tenants.id, tenantId!),
          columns: { name: true, address: true, phone: true }
        }),
        db.query.exams.findMany({
          where: and(eq(schema.exams.classId, classId), eq(schema.exams.tenantId, tenantId!)),
          with: { subject: { columns: { name: true, code: true } } },
          orderBy: [asc(schema.exams.date)]
        }),
        db.query.students.findMany({
          where: eq(schema.students.classId, classId),
          with: { 
            user: { columns: { name: true, tenantId: true } },
            parent: { with: { user: { columns: { name: true } } } }
          },
          orderBy: [asc(schema.students.rollNumber)]
        })
      ]);

      if (!classDetails) {
        set.status = 404;
        return { error: 'Class not found' };
      }

      // Security: verify student tenant matches
      const tenantStudents = students.filter(s => s.user.tenantId === tenantId);

      const examTypes = Array.from(new Set(exams.map(e => e.examType)));

      const result = {
        class: classDetails,
        school,
        examTypes,
        exams: exams.map(e => ({
          id: e.id,
          name: e.name,
          examType: e.examType,
          subjectName: e.subject.name,
          subjectCode: e.subject.code,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          totalMarks: e.totalMarks,
          passingMarks: e.passingMarks,
          status: e.status,
          resultPublished: e.status === 'completed',
        })),
        students: tenantStudents.map(s => ({
          id: s.id,
          rollNumber: s.rollNumber,
          name: s.user.name,
          class: classDetails,
          parentName: s.parent?.user.name || '—',
        }))
      };

      await dataCache.set(cacheKey, result, 600); // 10 minutes cache
      return result;

    } catch (error) {
      captureError(error, { method: 'GET', path: '/admit-cards', tenantId });
      console.error('[ADMIT_CARDS_GET]', error);
      set.status = 500;
      return { error: 'Failed to fetch admit card data' };
    }
  })

  // ── Generate Admit Cards ────────────────────────────────────────────────
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const { classId, examType, studentIds, examIds } = body as any;

      if (!classId || !studentIds || !Array.isArray(studentIds)) {
        set.status = 400;
        return { error: 'Invalid request data' };
      }

      const examConditions = [
        eq(schema.exams.classId, classId),
        eq(schema.exams.tenantId, tenantId!)
      ];
      if (examIds && Array.isArray(examIds) && examIds.length > 0) {
        examConditions.push(inArray(schema.exams.id, examIds));
      } else if (examType && examType !== 'all') {
        examConditions.push(eq(schema.exams.examType, examType));
      }

      const [classDetails, school, exams, studentsRaw] = await Promise.all([
        db.query.classes.findFirst({
          where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId!)),
          columns: { id: true, name: true, section: true, grade: true }
        }),
        db.query.tenants.findFirst({
          where: eq(schema.tenants.id, tenantId!),
          columns: { name: true, address: true, phone: true, logo: true }
        }),
        db.query.exams.findMany({
          where: and(...examConditions),
          with: { subject: { columns: { name: true, code: true } } },
          orderBy: [asc(schema.exams.date)]
        }),
        db.query.students.findMany({
          where: inArray(schema.students.id, studentIds),
          with: { 
            user: { columns: { name: true, avatar: true, tenantId: true } },
            parent: { with: { user: { columns: { name: true } } } }
          }
        })
      ]);

      if (!classDetails) {
        set.status = 404;
        return { error: 'Class not found' };
      }

      // Security: filter by tenantId
      const students = studentsRaw.filter(s => s.user.tenantId === tenantId);

      const generatedAt = new Date().toISOString();
      const currentYear = new Date().getFullYear();

      const admitCards = students.map(student => {
        // Generate a pseudo-random unique card number
        const random = Math.floor(1000 + Math.random() * 9000);
        const cardNumber = `ADM-${currentYear}-${student.rollNumber}-${random}`;

        return {
          cardNumber,
          student: {
            id: student.id,
            rollNumber: student.rollNumber,
            name: student.user.name,
            avatar: student.user.avatar,
            initials: student.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            dateOfBirth: student.dateOfBirth,
            parentName: student.parent?.user.name || '—',
          },
          class: classDetails,
          school,
          exams: exams.map(e => ({
            id: e.id,
            name: e.name,
            examType: e.examType,
            subjectName: e.subject.name,
            subjectCode: e.subject.code,
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime,
            totalMarks: e.totalMarks,
            passingMarks: e.passingMarks,
            status: e.status,
            resultPublished: e.status === 'completed',
          })),
          generatedAt
        };
      });

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'admit_cards_generated',
        properties: {
          tenantId,
          count: admitCards.length
        }
      });

      return {
        success: true,
        totalGenerated: admitCards.length,
        admitCards
      };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/admit-cards', tenantId });
      console.error('[ADMIT_CARDS_POST]', error);
      set.status = 500;
      return { error: 'Failed to generate admit cards' };
    }
  });

