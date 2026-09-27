import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, desc, inArray, count } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { requirePermission } from '../lib/permissions';
import { posthog, captureError } from '../lib/monitoring/posthog';

export const promotionsRoutes = new Elysia({ prefix: '/promotions' })
  .use(requireAuth)
  .use(requirePermission('promotions'))
  .get('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const page = parseInt((query as any).page || '1');
      const limit = parseInt((query as any).limit || '50');
      const offset = (page - 1) * limit;

      const { type, academicYear, classId, status } = query as any;

      const conditions = [
        eq(schema.promotions.tenantId, tenantId as string),
        eq(schema.promotions.type, type || 'promotion')
      ];

      if (academicYear && academicYear !== 'all') conditions.push(eq(schema.promotions.academicYear, academicYear));
      if (classId && classId !== 'all') conditions.push(eq(schema.promotions.fromClassId, classId));
      if (status && status !== 'all') conditions.push(eq(schema.promotions.status, status));

      const [records, totalResult] = await Promise.all([
        db.query.promotions.findMany({
          where: and(...conditions),
          with: {
            student: {
              with: {
                user: true,
              },
            },
            fromClass: true,
            toClass: true,
          },
          orderBy: [desc(schema.promotions.createdAt)],
          offset,
          limit
        }),
        db.select({ count: count() }).from(schema.promotions).where(and(...conditions))
      ]);

      const total = Number(totalResult[0]?.count || 0);

      return {
        items: records.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          studentName: r.student.user.name,
          studentEmail: r.student.user.email,
          rollNumber: r.student.rollNumber,
          fromClassId: r.fromClassId,
          fromClassName: `${r.fromClass.name}-${r.fromClass.section}`,
          fromClassGrade: r.fromClass.grade,
          toClassId: r.toClassId,
          toClassName: r.toClass ? `${r.toClass.name}-${r.toClass.section}` : '-',
          toClassGrade: r.toClass?.grade || '-',
          academicYear: r.academicYear,
          status: r.status,
          remarks: r.remarks,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/promotions', tenantId });
      set.status = 500;
      return { error: 'Failed to load promotions' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const payload = body as any;

      // Handle Graduation
      if (payload.graduation) {
        const { fromClassId, academicYear, remarks, studentIds } = payload;
        
        const results = await db.transaction(async (tx) => {
          if (!studentIds || studentIds.length === 0) {
            return [];
          }

          // Fetch student records to check their current status
          const targetStudents = await tx.select({ id: schema.students.id, status: schema.students.status })
            .from(schema.students)
            .where(inArray(schema.students.id, studentIds));
          
          const nonGraduatedStudentIds = targetStudents
            .filter(s => s.status !== 'graduated')
            .map(s => s.id);

          if (nonGraduatedStudentIds.length === 0) {
            return [];
          }

          const promoResults = await tx.insert(schema.promotions).values(
            nonGraduatedStudentIds.map((id: string) => ({
              tenantId: tenantId as string,
              studentId: id,
              fromClassId,
              academicYear,
              remarks,
              type: 'graduation',
              status: 'graduated',
            }))
          ).returning();

          await tx.update(schema.students)
            .set({ status: 'graduated' })
            .where(inArray(schema.students.id, nonGraduatedStudentIds));
          
          return promoResults;
        });

        return { graduated: results.length };
      }

      // Handle Bulk Promotion
      if (payload.bulk) {
        const { fromClassId, toClassId, academicYear, remarks } = payload;

        const students = await db.query.students.findMany({
          where: and(
            eq(schema.students.classId, fromClassId),
            eq(schema.students.status, 'active')
          ),
          with: {
            class: { columns: { tenantId: true } }
          }
        });

        // Filter by tenantId (since classId doesn't guarantee tenantId in simple where)
        const tenantStudents = students.filter(s => s.class.tenantId === tenantId);

        if (tenantStudents.length === 0) {
          return { created: 0, total: 0 };
        }

        const studentIds = tenantStudents.map(s => s.id);

        const results = await db.transaction(async (tx) => {
          const promoResults = await tx.insert(schema.promotions).values(
            studentIds.map((id: string) => ({
              tenantId: tenantId as string,
              studentId: id,
              fromClassId,
              toClassId,
              academicYear,
              remarks,
              type: 'promotion',
              status: 'approved',
            }))
          ).returning();

          await tx.update(schema.students)
            .set({ classId: toClassId, academicYear })
            .where(inArray(schema.students.id, studentIds));
          
          return promoResults;
        });

        return { created: results.length, total: tenantStudents.length };
      }

      // Individual Promotion Request
      const { studentId, fromClassId, toClassId, academicYear, remarks } = payload;
      
      const [promo] = await db.insert(schema.promotions).values({
        tenantId: tenantId as string,
        studentId,
        fromClassId,
        toClassId,
        academicYear,
        remarks,
        type: 'promotion',
        status: 'pending',
      }).returning();

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'promotion_recorded',
        properties: {
          tenantId,
          type: (body as any).bulk ? 'bulk' : 'individual',
          academicYear: (body as any).academicYear
        }
      });

      return (body as any).bulk ? { success: true } : promo;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/promotions', tenantId });
      set.status = 500;
      return { error: 'Failed to save promotions' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { id, status, remarks } = body as any;

      const promo = await db.query.promotions.findFirst({
        where: and(
          eq(schema.promotions.id, id),
          eq(schema.promotions.tenantId, tenantId)
        )
      });

      if (!promo) {
        set.status = 404;
        return { error: 'Promotion record not found' };
      }

      const [updated] = await db.update(schema.promotions).set({ 
        status, 
        remarks: remarks || promo.remarks,
      }).where(eq(schema.promotions.id, id)).returning();

      // If approved, update the student record
      if (status === 'approved' && promo.toClassId) {
        await db.update(schema.students).set({ 
          classId: promo.toClassId,
          academicYear: promo.academicYear 
        }).where(eq(schema.students.id, promo.studentId));
      }

      return updated;
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/promotions', tenantId });
      set.status = 500;
      return { error: 'Failed to update promotions' };
    }
  });

