import { Elysia, t } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, inArray, count, isNull } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { posthog, captureError } from '../../lib/monitoring/posthog';

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
            eq(schema.students.status, 'active'),
            isNull(schema.students.deletedAt)
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

// ── Promotion runs ──
// A run is the unit the new Promotion screen manages: one wizard pass with a
// scope, a session pair, and an explicit student list. Only `draft` rows are
// editable or deletable; later slices move runs through the other statuses.

const RUN_STATUSES = ['draft', 'pending', 'executing', 'completed', 'reversed'] as const;
const RUN_SCOPES = ['one-class', 'multiple-classes', 'whole-school', 'custom-list', 'single-student'] as const;

promotionsRoutes
  .get('/runs', async ({ tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const rows = await db.query.promotionRuns.findMany({
        where: eq(schema.promotionRuns.tenantId, tenantId),
        orderBy: [desc(schema.promotionRuns.updatedAt)],
        limit: 200,
      });

      const counts: Record<string, number> = { draft: 0, pending: 0, executing: 0, completed: 0, reversed: 0 };
      for (const r of rows) {
        if (r.status in counts) counts[r.status] = (counts[r.status] ?? 0) + 1;
      }

      // Collect preview student IDs across returned runs (up to 8 per run)
      const previewStudentIds = Array.from(
        new Set(rows.flatMap((r) => (r.studentIds ?? []).slice(0, 8)))
      );

      const studentMap = new Map<string, { id: string; name: string; avatar: string | null; className: string | null }>();
      if (previewStudentIds.length > 0) {
        const studentRecords = await db.query.students.findMany({
          where: inArray(schema.students.id, previewStudentIds),
          with: { user: true, class: true },
        });

        for (const s of studentRecords) {
          const rawClass = s.class?.name || '';
          const section = s.class?.section || 'A';
          let formattedClass: string | null = null;
          if (rawClass) {
            formattedClass = rawClass.toLowerCase().startsWith('class') || rawClass.toLowerCase().startsWith('grade')
              ? `${rawClass} - ${section}`
              : `Class ${rawClass} - ${section}`;
          }

          const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || s.user?.name || 'Student';

          studentMap.set(s.id, {
            id: s.id,
            name: fullName,
            avatar: s.user?.avatar || null,
            className: formattedClass,
          });
        }
      }

      return {
        items: rows.map((r) => ({
          id: r.id,
          status: r.status,
          fromSession: r.fromSession,
          toSession: r.toSession,
          effectiveDate: r.effectiveDate,
          scope: r.scope,
          studentIds: r.studentIds ?? [],
          studentCount: (r.studentIds ?? []).length,
          students: (r.studentIds ?? []).slice(0, 8).map((id) => {
            return studentMap.get(id) || { id, name: `Student #${id.slice(0, 5)}`, avatar: null, className: null };
          }),
          remarks: r.remarks,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        counts,
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/promotions/runs', tenantId });
      set.status = 500;
      return { error: 'Failed to load promotion runs' };
    }
  })
  .post('/runs', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { scope, fromSession, toSession, effectiveDate, studentIds, remarks } = body as any;

      if (!RUN_SCOPES.includes(scope)) {
        set.status = 400;
        return { error: 'Unknown scope' };
      }
      if (typeof fromSession !== 'string' || !fromSession.trim()) {
        set.status = 400;
        return { error: 'fromSession is required' };
      }
      if (studentIds !== undefined && (!Array.isArray(studentIds) || studentIds.some((s: any) => typeof s !== 'string'))) {
        set.status = 400;
        return { error: 'studentIds must be an array of ids' };
      }

      const [run] = await db.insert(schema.promotionRuns).values({
        tenantId,
        status: 'draft',
        scope,
        fromSession: fromSession.trim(),
        toSession: typeof toSession === 'string' && toSession ? toSession : null,
        effectiveDate: typeof effectiveDate === 'string' && effectiveDate ? effectiveDate : null,
        studentIds: studentIds ?? [],
        remarks: typeof remarks === 'string' && remarks.trim() ? remarks.trim().slice(0, 500) : null,
        createdBy: user?.id ?? null,
      }).returning();

      if (!run) {
        set.status = 500;
        return { error: 'Failed to save promotion run' };
      }

      return { id: run.id, status: run.status, updatedAt: run.updatedAt.toISOString() };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/promotions/runs', tenantId });
      set.status = 500;
      return { error: 'Failed to save promotion run' };
    }
  })
  .put('/runs', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { id, toSession, effectiveDate, studentIds, remarks, scope, status } = body as any;

      const run = typeof id === 'string' ? await db.query.promotionRuns.findFirst({
        where: and(eq(schema.promotionRuns.id, id), eq(schema.promotionRuns.tenantId, tenantId)),
      }) : undefined;
      if (!run) {
        set.status = 404;
        return { error: 'Promotion run not found' };
      }
      if (run.status !== 'draft') {
        set.status = 409;
        return { error: 'Only draft runs can be edited' };
      }

      const patch: Record<string, unknown> = {};
      if (typeof toSession === 'string') patch.toSession = toSession || null;
      if (typeof effectiveDate === 'string') patch.effectiveDate = effectiveDate || null;
      if (typeof remarks === 'string') patch.remarks = remarks.trim().slice(0, 500) || null;
      if (scope !== undefined) {
        if (!RUN_SCOPES.includes(scope)) {
          set.status = 400;
          return { error: 'Unknown scope' };
        }
        patch.scope = scope;
      }
      if (studentIds !== undefined) {
        if (!Array.isArray(studentIds) || studentIds.some((s: any) => typeof s !== 'string')) {
          set.status = 400;
          return { error: 'studentIds must be an array of ids' };
        }
        patch.studentIds = studentIds;
      }
      if (status !== undefined) {
        if (!RUN_STATUSES.includes(status)) {
          set.status = 400;
          return { error: 'Unknown status' };
        }
        patch.status = status;
      }

      const [updated] = await db
        .update(schema.promotionRuns)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(schema.promotionRuns.id, id), eq(schema.promotionRuns.tenantId, tenantId)))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: 'Promotion run not found' };
      }

      return { id: updated.id, status: updated.status, updatedAt: updated.updatedAt.toISOString() };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/promotions/runs', tenantId });
      set.status = 500;
      return { error: 'Failed to update promotion run' };
    }
  })
  .delete('/runs', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { id } = body as any;

      const run = typeof id === 'string' ? await db.query.promotionRuns.findFirst({
        where: and(eq(schema.promotionRuns.id, id), eq(schema.promotionRuns.tenantId, tenantId)),
      }) : undefined;
      if (!run) {
        set.status = 404;
        return { error: 'Promotion run not found' };
      }
      if (run.status !== 'draft') {
        set.status = 409;
        return { error: 'Only draft runs can be deleted' };
      }

      await db
        .delete(schema.promotionRuns)
        .where(and(eq(schema.promotionRuns.id, id), eq(schema.promotionRuns.tenantId, tenantId)));

      return { deleted: id };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/promotions/runs', tenantId });
      set.status = 500;
      return { error: 'Failed to delete promotion run' };
    }
  });

