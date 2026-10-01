import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, or, sql, desc, count, sum, inArray, ilike, like, gte, lte, ne, exists } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { formatDate } from '../../lib/date-utils';
import { notificationQueue } from '../../lib/queue';
import { chunked } from '../../lib/batch';
import { invalidateFeeCaches, invalidateFeeAndStudentCaches } from '../../lib/fees-cache';
import {
  CreateFeeSchema,
  CreateReceiptSchema,
  CreateConcessionSchema,
  CreateFeeStructureSchema,
  CreateTransportAssignmentSchema,
  FeeAssignSchema,
  formatZodError,
} from '../../lib/validation/fees';
import { FeeService, type DbTransaction } from './fee.service';
import { FeeReceiptService } from './fee-receipt.service';
import type {
  FeeItem,
  FeeListResult,
  ConcessionRow,
  StructureRow,
  FeeReceiptStats,
} from './fees.types';

const applyConcessionToPendingFees = FeeService.applyConcessionToPendingFees;
const removeConcessionFromPendingFees = FeeService.removeConcessionFromPendingFees;

// A school-wide fee assignment carries one student id per student, and a school
// can realistically be at 50k. Postgres refuses more than 65535 bound
// parameters per statement, so every id list below is chunked first.
const FEE_ID_QUERY_CHUNK = 5000;
const FEE_INSERT_CHUNK = 500;
// Recipients per notification job: each job spends one inArray lookup, so
// smaller means more DB round-trips and larger means a fatter Redis payload.
const FEE_NOTIFY_BATCH = 200;
const QUEUE_ADD_BULK_CHUNK = 500;

// ─── Routes ───────────────────────────────────────────────────────────────────

export const feesRoutes = new Elysia()
  .use(requireAuth)

  // ── Existing Fee Records Route ───────────────────────────────────────────
  .group('/fees', (app) =>
    app.use(requirePermission('fees'))
      .get('/', async ({ query, tenantId, user, set }) => {
      try {
        if (!tenantId) {
          set.status = 401;
          return { error: 'Authentication required' };
        }

        const cacheKey = `fees:${tenantId}:${user.id}:${JSON.stringify(query)}`;
        const cached = query.refresh === 'true' ? null : await dataCache.get(cacheKey);
        if (cached) return cached;

        const page = parseInt((query as any).page || '1');
        const limit = Math.min(parseInt((query as any).limit || '100'), 1000);
        const skip = (page - 1) * limit;

        const { studentId, status, classId, search, mode } = query as any;

        const whereConditions = (fees: typeof schema.fees, { eq, and }: any) => {
          const conditions = [eq(fees.tenantId, tenantId!)];

          if (user.role === 'parent') {
            conditions.push(sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              JOIN ${schema.parents} p ON s."parentId" = p.id
              WHERE s.id = ${fees.studentId} AND p."userId" = ${user.id}
            )`);
          } else if (user.role === 'student') {
            conditions.push(sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              WHERE s.id = ${fees.studentId} AND s."userId" = ${user.id}
            )`);
          }

          if (studentId) conditions.push(eq(fees.studentId, studentId));
          if (status && status !== 'all') {
            const statusList = status.split(',');
            if (statusList.length > 1) {
              conditions.push(inArray(fees.status, statusList));
            } else {
              conditions.push(eq(fees.status, status));
            }
          }

          if (classId && classId !== 'all') {
            conditions.push(sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              WHERE s.id = ${fees.studentId} AND s."classId" = ${classId}
            )`);
          }

          if (search) {
            conditions.push(sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              JOIN ${schema.users} u ON s."userId" = u.id
              WHERE s.id = ${fees.studentId} AND u.name ILIKE ${'%' + search + '%'}
            )`);
          }

          return and(...conditions);
        };

        const [feesList, totalResult] = await Promise.all([
          db
            .select({
              id: schema.fees.id,
              studentId: schema.fees.studentId,
              studentName: schema.users.name,
              className: sql<string>`concat(${schema.classes.name}, '-', ${schema.classes.section})`,
              amount: schema.fees.amount,
              type: schema.fees.type,
              status: schema.fees.status,
              dueDate: schema.fees.dueDate,
              paidAmount: schema.fees.paidAmount,
              paidDate: schema.fees.paidDate,
              remarks: schema.fees.remarks,
              concession: schema.fees.concession,
              feeCategoryName: schema.feeCategories.name,
            })
            .from(schema.fees)
            .leftJoin(schema.students, eq(schema.fees.studentId, schema.students.id))
            .leftJoin(schema.users, eq(schema.students.userId, schema.users.id))
            .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
            .leftJoin(schema.feeCategories, eq(schema.fees.feeCategoryId, schema.feeCategories.id))
            .where(whereConditions(schema.fees, { eq, and }))
            .orderBy(desc(schema.fees.createdAt), desc(schema.fees.id))
            .limit(limit)
            .offset(skip),
          db.select({ count: count() })
            .from(schema.fees)
            .where(whereConditions(schema.fees, { eq, and })),
        ]);

        const totalRecords = totalResult[0]?.count || 0;

        const items: FeeItem[] = feesList.map((f) => ({
          id: f.id,
          studentId: f.studentId,
          studentName: f.studentName || 'Unknown Student',
          className: f.className || '-',
          amount: f.amount,
          type: f.feeCategoryName || f.type,
          status: f.status as FeeItem['status'],
          dueDate: f.dueDate,
          paidAmount: f.paidAmount,
          paidDate: f.paidDate ?? null,
          remark: f.remarks ?? null,
          concession: f.concession,
          feeCategoryName: f.feeCategoryName ?? null,
        }));

        let result: FeeListResult;

        if (mode === 'unified') {
          const [statsResult, classes] = await Promise.all([
            db.select({
              totalAmount: sum(schema.fees.amount),
              totalPaid: sum(schema.fees.paidAmount),
            })
            .from(schema.fees)
            .where(eq(schema.fees.tenantId, tenantId!)),

            db.query.classes.findMany({
              where: eq(schema.classes.tenantId, tenantId as string),
              columns: { id: true, name: true, section: true },
            }),
          ]);

          const totalCollection = Number(statsResult[0]?.totalAmount) || 0;
          const totalPaid = Number(statsResult[0]?.totalPaid) || 0;
          const pending = totalCollection - totalPaid;
          const rate = totalCollection > 0 ? Math.round((totalPaid / totalCollection) * 100) : 0;

          result = {
            items,
            total: totalRecords,
            totalPages: Math.ceil(Number(totalRecords) / limit),
            stats: { total: totalCollection, pending, rate },
            classes: classes.map((c) => ({ id: c.id, name: `${c.name}-${c.section}` })),
            students: [],
          };
        } else {
          result = {
            items,
            total: totalRecords,
            totalPages: Math.ceil(Number(totalRecords) / limit),
          };
        }

        await dataCache.set(cacheKey, result, 60000);
        return result;
      } catch (error) {
        captureError(error, { method: 'GET', path: '/fees', tenantId });
        set.status = 500;
        return { error: 'Failed to load fees' };
      }
    })
    .post('/', async ({ body, tenantId, user, set }) => {
      try {
        if (!tenantId) {
          set.status = 401;
          return { error: 'Authentication required' };
        }
        if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
          set.status = 403;
          return { error: 'Access denied: staff or administrator privileges required' };
        }

        const parsed = CreateFeeSchema.safeParse(body);
        if (!parsed.success) {
          set.status = 400;
          return { error: formatZodError(parsed.error) };
        }
        const { studentId, feeCategoryId, amount, type, dueDate, remarks } = parsed.data;

        // Verify student belongs to active tenant
        const student = await db.query.students.findFirst({
          where: eq(schema.students.id, studentId),
          with: { user: { columns: { tenantId: true } } },
        });
        if (!student || student.user.tenantId !== tenantId) {
          set.status = 403;
          return { error: 'Student does not belong to your school' };
        }

        const [newFee] = await db.insert(schema.fees).values({
          tenantId: tenantId!,
          studentId,
          feeCategoryId: feeCategoryId || null,
          amount: Number(amount),
          type,
          status: 'pending',
          dueDate: dueDate || formatDate(),
          concession: 0,
          paidAmount: 0,
          remarks: remarks || 'Manual Fee Entry',
        }).returning();

        if (newFee) {
          await notificationQueue.add(
            'fee-due',
            {
              tenantId: tenantId!,
              studentId,
              feeType: newFee.type,
              amount: newFee.amount,
              dueDate: newFee.dueDate,
            },
            { jobId: `fee-due-${newFee.id}-${Date.now()}` },
          ).catch(e => console.error('[QUEUE_ERROR] Failed to queue manual fee due alert:', e));
        }

        await invalidateFeeCaches(tenantId!);
        return newFee;
      } catch (error) {
        captureError(error, { method: 'POST', path: '/fees', tenantId });
        set.status = 500;
        return { error: 'Failed to save fees' };
      }
    })
  )

  // ── Fee Categories ───────────────────────────────────────────────────────
  .group('/fee-categories', (app) =>
    app
      .use(requirePermission('fees'))
      .get('/', async ({ tenantId }) => {
        // Was: `with: { fees: [{id}], structures: [{id}] }` — loaded every fee id
        // in the tenant (62k+ rows) through memory per request. No client reads
        // the id arrays (web renders `feesCount`/`structuresCount`, the Expo app
        // reads neither), so the arrays stay present-but-empty for shape
        // compatibility and the counts come from two index-backed GROUP BYs.
        const categories = await db.query.feeCategories.findMany({
          where: and(
            eq(schema.feeCategories.tenantId, tenantId as string),
            ne(schema.feeCategories.code, 'TRANSPORT'),
          ),
          orderBy: [schema.feeCategories.name],
        });

        const categoryIds = categories.map((c) => c.id);
        const [feeCounts, structureCounts] = await Promise.all([
          categoryIds.length > 0
            ? db.select({ id: schema.fees.feeCategoryId, n: count() })
                .from(schema.fees)
                .where(inArray(schema.fees.feeCategoryId, categoryIds))
                .groupBy(schema.fees.feeCategoryId)
            : Promise.resolve([]),
          categoryIds.length > 0
            ? db.select({ id: schema.feeStructures.feeCategoryId, n: count() })
                .from(schema.feeStructures)
                .where(inArray(schema.feeStructures.feeCategoryId, categoryIds))
                .groupBy(schema.feeStructures.feeCategoryId)
            : Promise.resolve([]),
        ]);
        const feeCountMap = new Map(feeCounts.map((r) => [r.id, Number(r.n)]));
        const structureCountMap = new Map(structureCounts.map((r) => [r.id, Number(r.n)]));

        return categories.map((c) => ({
          ...c,
          fees: [],
          structures: [],
          feesCount: feeCountMap.get(c.id) ?? 0,
          structuresCount: structureCountMap.get(c.id) ?? 0,
        }));
      })
      .post('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { name, code, description, frequency } = body as { name: string; code: string; description?: string; frequency?: string };
        if (code.toUpperCase() === 'TRANSPORT') {
          set.status = 400;
          return { error: 'TRANSPORT code is reserved for system use' };
        }
        const [result] = await db.insert(schema.feeCategories).values({
          tenantId: tenantId as string,
          name,
          code: code.toUpperCase(),
          description,
          frequency,
          status: 'active',
        }).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
      .put('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id, ...data } = body as { id: string; [key: string]: unknown };
        const category = await db.query.feeCategories.findFirst({
          where: and(eq(schema.feeCategories.id, id), eq(schema.feeCategories.tenantId, tenantId!)),
        });
        if (!category) { set.status = 404; return { error: 'Not found' }; }
        if (category.code === 'TRANSPORT' || (typeof data.code === 'string' && data.code.toUpperCase() === 'TRANSPORT')) {
          set.status = 400;
          return { error: 'TRANSPORT category cannot be modified manually' };
        }
        const [result] = await db.update(schema.feeCategories).set(data).where(eq(schema.feeCategories.id, id)).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
      .delete('/', async ({ query, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id } = query as { id: string };
        const category = await db.query.feeCategories.findFirst({
          where: and(eq(schema.feeCategories.id, id), eq(schema.feeCategories.tenantId, tenantId!)),
        });
        if (!category) { set.status = 404; return { error: 'Not found' }; }
        if (category.code === 'TRANSPORT') {
          set.status = 400;
          return { error: 'TRANSPORT category cannot be deleted' };
        }
        const [result] = await db.delete(schema.feeCategories).where(eq(schema.feeCategories.id, id)).returning();
        await invalidateFeeCaches(tenantId!);
        return result;
      })
  )

  // ── Fee Structures ───────────────────────────────────────────────────────
  .group('/fee-structures', (app) =>
    app
      .use(requirePermission('fees'))
      .get('/', async ({ tenantId }) => {
        const structures = await db.query.feeStructures.findMany({
          where: (feeStructures) => {
            return exists(
              db.select()
                .from(schema.feeCategories)
                .where(and(
                  eq(schema.feeCategories.id, feeStructures.feeCategoryId),
                  eq(schema.feeCategories.tenantId, tenantId!),
                )),
            );
          },
          with: {
            category: { columns: { name: true, code: true, status: true } },
            class: { columns: { name: true, section: true, classLevel: true } },
          },
          orderBy: [desc(schema.feeStructures.academicYear)],
        });
        return structures.map((s): StructureRow => ({
          id: s.id,
          feeCategoryId: s.feeCategoryId,
          feeCategoryName: s.category.name,
          feeCategoryCode: s.category.code,
          feeCategoryStatus: s.category.status,
          classId: s.classId,
          className: `${s.class.name}-${s.class.section}`,
          classLevel: s.class.classLevel ?? null,
          amount: s.amount,
          academicYear: s.academicYear,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
      })
      .post('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const parsed = CreateFeeStructureSchema.safeParse(body);
        if (!parsed.success) {
          set.status = 400;
          return { error: formatZodError(parsed.error) };
        }
        const { feeCategoryId, classId, amount, academicYear } = parsed.data;

        const category = await db.query.feeCategories.findFirst({
          where: and(eq(schema.feeCategories.id, feeCategoryId), eq(schema.feeCategories.tenantId, tenantId!)),
        });
        if (!category) { set.status = 400; return { error: 'Invalid category' }; }
        if (category.code === 'TRANSPORT') {
          set.status = 400;
          return { error: 'TRANSPORT category cannot be configured via Fee Structures' };
        }
        if (category.status === 'inactive') {
          set.status = 400;
          return { error: 'Cannot add fee structure for an inactive category' };
        }

        // 🛡️ SECURITY: Verify class belongs to tenant
        const cls = await db.query.classes.findFirst({
          where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId!)),
        });
        if (!cls) { set.status = 400; return { error: 'Invalid class ID or access denied' }; }

        const [result] = await db.insert(schema.feeStructures).values({
          feeCategoryId,
          classId,
          amount: Number(amount),
          academicYear,
        }).returning();
        await invalidateFeeCaches(tenantId!);
        return result;
      })
      .put('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id, amount } = body as { id: string; amount: number };
        const structure = await db.query.feeStructures.findFirst({
          where: eq(schema.feeStructures.id, id),
          with: { category: { columns: { tenantId: true } } },
        });
        if (!structure || structure.category.tenantId !== tenantId) { set.status = 404; return { error: 'Not found' }; }
        const [result] = await db.update(schema.feeStructures).set({ amount: Number(amount) }).where(eq(schema.feeStructures.id, id)).returning();
        await invalidateFeeCaches(tenantId!);
        return result;
      })
      .delete('/', async ({ query, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id } = query as { id: string };
        const structure = await db.query.feeStructures.findFirst({
          where: eq(schema.feeStructures.id, id),
          with: { category: { columns: { tenantId: true } } },
        });
        if (!structure || structure.category.tenantId !== tenantId) { set.status = 404; return { error: 'Not found' }; }
        const [result] = await db.delete(schema.feeStructures).where(eq(schema.feeStructures.id, id)).returning();
        await invalidateFeeCaches(tenantId!);
        return result;
      })
  )


  // ── Fee Concessions ──────────────────────────────────────────────────────
  .group('/fee-concessions', (app) =>
    app
      .use(requirePermission('fees'))
      .get('/', async ({ query, tenantId }) => {
        const { studentId, status } = query as { studentId?: string; status?: string };
        const concessions = await db.query.feeConcessions.findMany({
          where: (feeConcessions, { and, eq }) => {
            const conditions = [eq(feeConcessions.tenantId, tenantId!)];
            if (studentId) conditions.push(eq(feeConcessions.studentId, studentId));
            if (status && status !== 'all') conditions.push(eq(feeConcessions.status, status));
            return and(...conditions);
          },
          with: {
            student: {
              with: {
                user: { columns: { name: true } },
                class: { columns: { name: true, section: true } },
              },
            },
            category: { columns: { name: true } },
          },
          orderBy: [desc(schema.feeConcessions.createdAt), desc(schema.feeConcessions.id)],
        });

        return concessions.map((c): ConcessionRow => ({
          id: c.id,
          studentId: c.studentId,
          studentName: c.student.user.name,
          studentClass: `${c.student.class.name}-${c.student.class.section}`,
          feeCategoryId: c.feeCategoryId ?? null,
          feeCategoryName: c.category?.name || 'All Fees',
          concessionType: c.concessionType as ConcessionRow['concessionType'],
          amount: c.amount,
          reason: c.reason ?? null,
          status: c.status,
          validFrom: c.validFrom ?? null,
          validUntil: c.validUntil ?? null,
          approvedBy: c.approvedBy ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
      })
      .post('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const parsed = CreateConcessionSchema.safeParse(body);
        if (!parsed.success) {
          set.status = 400;
          return { error: formatZodError(parsed.error) };
        }
        const data = parsed.data;

        // 🛡️ SECURITY: Verify student belongs to tenant
        const student = await db.query.students.findFirst({
          where: eq(schema.students.id, data.studentId),
          with: { user: { columns: { tenantId: true } } },
        });
        if (!student || student.user.tenantId !== tenantId) {
          set.status = 403;
          return { error: 'Access denied: student does not belong to your school' };
        }

        // 🛡️ SECURITY: Verify category belongs to tenant if provided
        if (data.feeCategoryId) {
          const category = await db.query.feeCategories.findFirst({
            where: and(eq(schema.feeCategories.id, data.feeCategoryId), eq(schema.feeCategories.tenantId, tenantId!)),
          });
          if (!category) {
            set.status = 403;
            return { error: 'Access denied: category does not belong to your school' };
          }
        }

        const [result] = await db.insert(schema.feeConcessions).values({
          ...data,
          tenantId: tenantId!,
          amount: Number(data.amount),
        }).returning();

        if (result && result.status === 'active') {
          await applyConcessionToPendingFees(db as unknown as DbTransaction, result.studentId, result.feeCategoryId, result.concessionType, result.amount);
        }

        await invalidateFeeCaches(tenantId!);
        return result;
      })
      .put('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id, ...data } = body as { id: string; [key: string]: unknown };

        // 🛡️ SECURITY: Verify target concession exists and student belongs to tenant
        const concession = await db.query.feeConcessions.findFirst({
          where: eq(schema.feeConcessions.id, id),
          with: { student: { with: { user: { columns: { tenantId: true } } } } },
        });
        if (!concession || concession.student.user.tenantId !== tenantId) {
          set.status = 403;
          return { error: 'Concession not found or access denied' };
        }

        const [result] = await db.update(schema.feeConcessions).set(data).where(eq(schema.feeConcessions.id, id)).returning();

        if (result) {
          if (result.status === 'active') {
            await applyConcessionToPendingFees(db as unknown as DbTransaction, result.studentId, result.feeCategoryId, result.concessionType, result.amount);
          } else {
            await removeConcessionFromPendingFees(db as unknown as DbTransaction, result.studentId, result.feeCategoryId);
          }
        }

        await invalidateFeeCaches(tenantId!);
        return result;
      })
      .delete('/', async ({ query, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id } = query as { id: string };

        // 🛡️ SECURITY: Verify target concession exists and student belongs to tenant
        const concession = await db.query.feeConcessions.findFirst({
          where: eq(schema.feeConcessions.id, id),
          with: { student: { with: { user: { columns: { tenantId: true } } } } },
        });
        if (!concession || concession.student.user.tenantId !== tenantId) {
          set.status = 403;
          return { error: 'Concession not found or access denied' };
        }

        if (concession) {
          await removeConcessionFromPendingFees(db as unknown as DbTransaction, concession.studentId, concession.feeCategoryId);
        }

        const [result] = await db.delete(schema.feeConcessions).where(eq(schema.feeConcessions.id, id)).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
  )

  // ── Fee Receipts ─────────────────────────────────────────────────────────
  .group('/fee-receipts', (app) =>
    app
      .use(requirePermission('fees'))
      .get('/', async ({ query, tenantId }) => {
        const cacheKey = `fee-receipts:${tenantId}:${JSON.stringify(query)}`;
        const cached = await dataCache.get(cacheKey);
        if (cached) return cached;

        const { studentId, fromDate, toDate, search, mode, classId } = query as any;
        const page = parseInt((query as any).page || '1');
        const limit = parseInt((query as any).limit || '20');
        const skip = (page - 1) * limit;

        // ── Stats mode ────────────────────────────────────────────────────
        if (mode === 'stats') {
          const statsResult = await db.select({
            method: schema.feeReceipts.paymentMethod,
            amount: sum(schema.feeReceipts.paidAmount),
            count: count(),
          })
          .from(schema.feeReceipts)
          .where(and(
            eq(schema.feeReceipts.tenantId, tenantId!),
            fromDate ? gte(schema.feeReceipts.paidDate, fromDate) : undefined,
            toDate ? lte(schema.feeReceipts.paidDate, toDate) : undefined,
          ))
          .groupBy(schema.feeReceipts.paymentMethod);

          let totalAmount = 0;
          let totalCount = 0;
          const methods: FeeReceiptStats['methods'] = {
            cash: { amount: 0, count: 0 },
            online: { amount: 0, count: 0 },
            cheque: { amount: 0, count: 0 },
          };

          statsResult.forEach(r => {
            const m = (r.method || '').toLowerCase();
            const amt = Number(r.amount) || 0;
            const cnt = Number(r.count) || 0;
            totalAmount += amt;
            totalCount += cnt;
            methods[m] = { amount: amt, count: cnt };
          });

          const result: FeeReceiptStats = { totalAmount, totalCount, methods };
          await dataCache.set(cacheKey, result, 60000);
          return result;
        }

        // ── Min mode ──────────────────────────────────────────────────────
        if (mode === 'min') {
          const [receiptsList, totalResult] = await Promise.all([
            db.select({
              id: schema.feeReceipts.id,
              paidAmount: schema.feeReceipts.paidAmount,
              paymentMethod: schema.feeReceipts.paymentMethod,
            })
            .from(schema.feeReceipts)
            .where(and(
              eq(schema.feeReceipts.tenantId, tenantId!),
              fromDate ? gte(schema.feeReceipts.paidDate, fromDate) : undefined,
              toDate ? lte(schema.feeReceipts.paidDate, toDate) : undefined,
            ))
            .orderBy(desc(schema.feeReceipts.createdAt), desc(schema.feeReceipts.id))
            .limit(limit)
            .offset(skip),

            db.select({ count: count() })
              .from(schema.feeReceipts)
              .where(and(
                eq(schema.feeReceipts.tenantId, tenantId!),
                fromDate ? gte(schema.feeReceipts.paidDate, fromDate) : undefined,
                toDate ? lte(schema.feeReceipts.paidDate, toDate) : undefined,
              )),
          ]);

          const total = totalResult[0]?.count || 0;
          const result = { items: receiptsList, total, totalPages: Math.ceil(Number(total) / limit) };
          await dataCache.set(cacheKey, result, 60000);
          return result;
        }

        // ── Full mode — fix N+1: fire receipts, count, and fees in parallel ──
        const receiptWhereConditions = (feeReceipts: typeof schema.feeReceipts, { and, eq, or, ilike, gte, lte }: any) => {
          const conditions = [eq(feeReceipts.tenantId, tenantId!)];
          if (studentId && studentId !== 'all') conditions.push(eq(feeReceipts.studentId, studentId));
          if (classId && classId !== 'all') {
            conditions.push(sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              WHERE s.id = ${feeReceipts.studentId} AND s."classId" = ${classId}
            )`);
          }
          if (search) {
            conditions.push(or(
              ilike(feeReceipts.receiptNumber, `%${search}%`)!,
              sql`EXISTS (
                SELECT 1 FROM ${schema.students} s
                JOIN ${schema.users} u ON s."userId" = u.id
                WHERE s.id = ${feeReceipts.studentId} AND u.name ILIKE ${'%' + search + '%'}
              )`!
            )!);
          }
          if (fromDate) conditions.push(gte(feeReceipts.paidDate, fromDate));
          if (toDate) conditions.push(lte(feeReceipts.paidDate, toDate));
          return and(...conditions);
        };

        const [receiptsList, totalResult] = await Promise.all([
          db.query.feeReceipts.findMany({
            where: (feeReceipts, helpers) => receiptWhereConditions(feeReceipts as any, helpers),
            with: {
              student: {
                with: {
                  user: { columns: { name: true } },
                  class: { columns: { name: true } },
                  parent: {
                    with: {
                      user: { columns: { name: true } },
                    },
                  },
                },
              },
            },
            orderBy: [desc(schema.feeReceipts.createdAt), desc(schema.feeReceipts.id)],
            limit,
            offset: skip,
          }),

          db.select({ count: count() })
            .from(schema.feeReceipts)
            .where(receiptWhereConditions(schema.feeReceipts, { and, eq, or, ilike, gte, lte })),
        ]);

        const total = totalResult[0]?.count || 0;

        // Collect all fee IDs from receipts and fetch them in a single query
        // (Runs in parallel to avoid a sequential second round-trip)
        const feeIdsNested = receiptsList.flatMap((r: any) => r.feeIds.split(',').filter(Boolean));
        const fees = feeIdsNested.length > 0
          ? await db.query.fees.findMany({
              where: inArray(schema.fees.id, feeIdsNested),
              with: { category: true },
            })
          : [];

        const feeMap = new Map(fees.map((f) => [f.id, f]));

        const items = receiptsList.map((r: any) => ({
          ...r,
          studentName: r.student.user.name,
          studentId: r.student.userId || r.studentId,
          className: r.student.class?.name || 'N/A',
          parentName: r.student.parent?.user?.name || 'Guardian',
          feeItems: r.feeIds.split(',').filter(Boolean).map((fid: string) => {
            const f = feeMap.get(fid);
            return f ? {
              feeCategoryName: (f as any).category?.name || f.type,
              amount: f.amount,
              concession: f.concession,
              paidAmount: f.paidAmount,
            } : null;
          }).filter(Boolean),
        }));

        const result = { items, total, totalPages: Math.ceil(Number(total) / limit) };
        await dataCache.set(cacheKey, result, 60000);
        return result;
      })
      .post('/', async ({ body, user, tenantId, set }) => {
        try {
          if (!tenantId) {
            set.status = 403;
            return { error: 'Tenant context required' };
          }
          if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
            set.status = 403;
            return { error: 'Access denied: staff or administrator privileges required' };
          }
          const parsed = CreateReceiptSchema.safeParse(body);
          if (!parsed.success) {
            set.status = 400;
            return { error: formatZodError(parsed.error) };
          }
          const { studentId, feeIds, paidAmount, paymentMethod, feeAmounts } = parsed.data;
          const { totalAmount, concessionTotal } = body as any;

          // 🛡️ SECURITY: Verify student belongs to tenant
          const student = await db.query.students.findFirst({
            where: eq(schema.students.id, studentId),
            with: { user: { columns: { tenantId: true } } },
          });
          if (!student || student.user.tenantId !== tenantId) {
            set.status = 403;
            return { error: 'Access denied: student does not belong to your school' };
          }

          // 🛡️ SECURITY: Verify all fee IDs belong to both this student and this tenant
          if (feeIds.length > 0) {
            const validFees = await db.select({ count: count() })
              .from(schema.fees)
              .where(and(
                inArray(schema.fees.id, feeIds),
                eq(schema.fees.studentId, studentId),
                eq(schema.fees.tenantId, tenantId!),
              ));
            if ((validFees[0]?.count || 0) !== feeIds.length) {
              set.status = 403;
              return { error: 'Access denied: one or more fees do not belong to this student or school' };
            }
          }

          const result = await db.transaction(async (tx) => {
            return await FeeReceiptService.processPayment(tx, {
              tenantId: user.tenantId!,
              studentId,
              feeIds,
              paidAmount: Number(paidAmount) || 0,
              paymentMethod,
              userId: user.id,
            });
          });

          await invalidateFeeCaches(tenantId!);

          if (!result) throw new Error('Transaction failed');

          posthog.capture({
            distinctId: tenantId || 'system',
            event: 'fee_paid',
            properties: {
              tenantId,
              studentId,
              paidAmount,
              totalAmount,
              paymentMethod,
              receiptNumber: result.receiptNumber,
            },
          });

          return result;
        } catch (e: any) {
          if (e.message === 'DUPLICATE_PAYMENT') {
            set.status = 409;
            return { error: 'A duplicate payment has already been recorded recently. Please refresh and check transaction history.' };
          }
          if (e.message === 'FEES_ALREADY_PAID') {
            set.status = 400;
            return { error: 'The selected fees have already been fully paid.' };
          }
          captureError(e, { method: 'POST', path: '/fee-receipts', tenantId });
          set.status = 500;
          return { error: 'Failed to record payment' };
        }
      })
  )

  // ── Fee Assignments ──────────────────────────────────────────────────────
  .group('/fee-assign', (app) =>
    app
      .use(requirePermission('fees'))
      .get('/', async ({ query, tenantId, set }) => {
        const { classId, feeCategoryId, academicYear } = query as { classId?: string; feeCategoryId?: string; academicYear?: string };
        if (!classId || !feeCategoryId || !academicYear) {
          set.status = 400;
          return { error: 'classId, feeCategoryId and academicYear are required' };
        }
        const cls = await db.query.classes.findFirst({ where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId!)) });
        if (!cls) { set.status = 403; return { error: 'Forbidden' }; }

        const [students, transportAssignments] = await Promise.all([
          db.query.students.findMany({
            where: and(eq(schema.students.classId, classId), eq(schema.students.status, 'active')),
            with: {
              user: { columns: { name: true } },
              fees: {
                where: (fees, { and, eq }) => and(
                  eq(fees.feeCategoryId, feeCategoryId),
                  // dueDate is written as `${academicYear}-04-01`, so the year is
                  // always a prefix — a leading-wildcard ILIKE could never use an
                  // index and matched exactly the same rows.
                  like(fees.dueDate, `${academicYear}%`),
                ),
              },
            },
          }),
          db.select({ studentId: schema.transportAssignments.studentId })
            .from(schema.transportAssignments)
            .innerJoin(schema.students, eq(schema.transportAssignments.studentId, schema.students.id))
            .where(eq(schema.students.classId, classId)),
        ]);

        const transportStudentIds = new Set(transportAssignments.map(ta => ta.studentId));

        return {
          totalStudents: students.length,
          students: students.map((s) => ({
            id: s.id,
            name: s.user.name,
            rollNumber: s.rollNumber,
            isAssigned: s.fees.length > 0,
            isPaid: s.fees.some((f) => f.status === 'paid'),
            hasTransport: transportStudentIds.has(s.id),
          })),
        };
      })
      .post('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const parsed = FeeAssignSchema.safeParse(body);
        if (!parsed.success) {
          set.status = 400;
          return { error: formatZodError(parsed.error) };
        }
        const { studentIds: requestedIds, feeCategoryId, academicYear, action } = parsed.data;
        // Duplicate ids would otherwise each match one row in the ownership check
        // below and produce duplicate fee rows.
        const studentIds = [...new Set(requestedIds)];

        // 🛡️ SECURITY: Verify category belongs to tenant
        const category = await db.query.feeCategories.findFirst({
          where: and(eq(schema.feeCategories.id, feeCategoryId), eq(schema.feeCategories.tenantId, tenantId!)),
        });
        if (!category) {
          set.status = 403;
          return { error: 'Access denied: fee category not found' };
        }
        if (category.code === 'TRANSPORT') {
          set.status = 400;
          return { error: 'TRANSPORT category fees are managed through Transport Assignments' };
        }
        if (category.status === 'inactive') {
          set.status = 400;
          return { error: 'Cannot assign fees for an inactive category' };
        }

        // 🛡️ SECURITY: Verify studentIds belong to tenant
        if (studentIds.length > 0) {
          const chunkCounts = await Promise.all(
            chunked(studentIds, FEE_ID_QUERY_CHUNK).map(async (group) => {
              const rows = await db.select({ count: count() })
                .from(schema.students)
                .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
                .where(and(
                  inArray(schema.students.id, group),
                  eq(schema.users.tenantId, tenantId!),
                ));
              return rows[0]?.count || 0;
            })
          );
          const validCount = chunkCounts.reduce((total, n) => total + n, 0);
          if (validCount !== studentIds.length) {
            set.status = 403;
            return { error: 'Access denied: one or more students do not belong to your school' };
          }
        }

        if (action === 'assign') {
          const [structure, existingFeeChunks] = await Promise.all([
            db.query.feeStructures.findFirst({
              where: and(eq(schema.feeStructures.feeCategoryId, feeCategoryId), eq(schema.feeStructures.academicYear, academicYear)),
            }),
            Promise.all(
              chunked(studentIds, FEE_ID_QUERY_CHUNK).map((group) =>
                db.query.fees.findMany({
                  where: (fees, { and, eq, inArray }) => and(
                    inArray(fees.studentId, group),
                    eq(fees.feeCategoryId, feeCategoryId),
                    like(fees.dueDate, `${academicYear}%`),
                  ),
                  columns: { studentId: true },
                })
              )
            ),
          ]);

          const existingStudentIds = new Set(existingFeeChunks.flat().map(f => f.studentId));
          const studentsToAssign = studentIds.filter((sid: string) => !existingStudentIds.has(sid));

          let created = 0;
          const skipped = studentIds.length - studentsToAssign.length;

          if (studentsToAssign.length > 0) {
            const feesToInsert = studentsToAssign.map((sid: string) => ({
              tenantId: tenantId!,
              studentId: sid,
              feeCategoryId,
              amount: Number(structure?.amount) || 0,
              type: category?.name || 'School Fee',
              dueDate: `${academicYear}-04-01`,
              status: 'pending' as const,
            }));

            // Chunked inserts: a school-wide assignment is one row per student,
            // and a single 50k-row VALUES list blows past Postgres' 65535-parameter
            // ceiling (~8k rows at 8 columns). `created` counts rows, so no
            // .returning() is needed — the fields the notifications use are ours.
            for (const group of chunked(feesToInsert, FEE_INSERT_CHUNK)) {
              const inserted = await db.insert(schema.fees).values(group).returning({ id: schema.fees.id });
              created += inserted.length;
            }

            // One notification job per batch, not per student: each job does a
            // single inArray lookup instead of a DB round-trip per recipient.
            const stamp = Date.now();
            const batches = chunked(feesToInsert, FEE_NOTIFY_BATCH);
            const jobs = batches.map((batch, batchIndex) => ({
              name: 'fee-due-batch',
              data: {
                tenantId: tenantId!,
                fees: batch.map((fee) => ({
                  studentId: fee.studentId,
                  feeType: fee.type,
                  amount: fee.amount,
                  dueDate: fee.dueDate,
                })),
              },
              opts: { jobId: `fee-due-batch-${feeCategoryId}-${academicYear}-${stamp}-${batchIndex}` },
            }));
            for (const group of chunked(jobs, QUEUE_ADD_BULK_CHUNK)) {
              await notificationQueue.addBulk(group).catch(e => console.error('[QUEUE_ERROR] Failed to queue bulk fee due alerts:', e));
            }
          }

          await invalidateFeeAndStudentCaches(tenantId!);
          return { created, skipped };
        } else if (action === 'remove') {
          // Year-scoped like `assign`: without the dueDate prefix filter this
          // deleted the category's pending fees across EVERY academic year.
          const paidChunks = await Promise.all(
            chunked(studentIds, FEE_ID_QUERY_CHUNK).map((group) =>
              db.query.fees.findMany({
                where: (fees, { and, eq, inArray }) => and(
                  inArray(fees.studentId, group),
                  eq(fees.feeCategoryId, feeCategoryId),
                  eq(fees.status, 'paid'),
                  like(fees.dueDate, `${academicYear}%`),
                ),
                columns: { studentId: true },
              })
            )
          );

          const paidStudentIds = new Set(paidChunks.flat().map(f => f.studentId));
          const studentsToRemove = studentIds.filter((sid: string) => !paidStudentIds.has(sid));

          let removed = 0;
          const skipped = studentIds.length - studentsToRemove.length;

          if (studentsToRemove.length > 0) {
            for (const group of chunked(studentsToRemove, FEE_INSERT_CHUNK)) {
              const result = await db.delete(schema.fees).where(and(
                inArray(schema.fees.studentId, group),
                eq(schema.fees.feeCategoryId, feeCategoryId),
                eq(schema.fees.status, 'pending'),
                like(schema.fees.dueDate, `${academicYear}%`),
              )).returning({ id: schema.fees.id });
              removed += result.length;
            }
          }

          await invalidateFeeAndStudentCaches(tenantId!);
          return { removed, skipped };
        }
      })
  )

  .group('/academic-years', (app) =>
    app
      .use(requireAuth)
      .get('/', async ({ tenantId, set }) => {
        try {
          const years = await db.select()
            .from(schema.academicYears)
            .where(eq(schema.academicYears.tenantId, tenantId!))
            .orderBy(desc(schema.academicYears.name));
          return years;
        } catch (error) {
          set.status = 500;
          return { error: 'Failed to fetch academic years' };
        }
      })
  );
