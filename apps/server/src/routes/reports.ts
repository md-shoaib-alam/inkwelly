import { Elysia } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, sql, count, lt, ne, asc } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { requirePermission } from '../lib/permissions';
import { dataCache } from '../lib/cache';
import { redis } from '../lib/redis';
import { notificationQueue } from '../lib/queue';
import { chunked } from '../lib/batch';
import { captureError } from '../lib/monitoring/posthog';

const GRADE_RANK: Record<string, number> = { 'A+': 6, A: 5, 'B+': 4, B: 3, C: 2, D: 1 };
const GRADE_ORDER = ['A+', 'A', 'B+', 'B', 'C', 'D'];

// The aggregate SQL finishes in ~1.3ms; building the drizzle query and mapping
// its rows costs ~10ms of single-threaded JS, which is what caps these endpoints
// near 100 req/s. Caching moves that cost off the hot path.
const REPORT_TTL_MS = 60_000;

// Matches the batching fee-assign uses for the same `fee-due-batch` job name.
const FEE_REMINDER_BATCH = 200;
const QUEUE_ADD_BULK_CHUNK = 500;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const reportsRoutes = new Elysia({ prefix: '/reports' })
  .use(requireAuth)
  .use(requirePermission('reports'))

  .get('/academics', async ({ query, tenantId }) => {
    // Results vary only by tenant and these two filters, so one key serves every
    // viewer in the tenant.
    const cacheKey = `reports:${tenantId}:academics:${query.classId || 'all'}:${query.examType || 'all'}`;

    return dataCache.getOrSet(cacheKey, async () => {
    const where = and(
      eq(schema.grades.tenantId, tenantId!),
      query.classId && query.classId !== 'all'
        ? sql`EXISTS (SELECT 1 FROM ${schema.subjects} sub WHERE sub.id = ${schema.grades.subjectId} AND sub."classId" = ${query.classId})`
        : undefined,
      query.examType ? eq(schema.grades.examType, query.examType) : undefined,
    );

    const rows = await db
      .select({
        subjectName: schema.subjects.name,
        grade: schema.grades.grade,
        entries: count(),
        totalMarks: sql<string>`coalesce(sum(${schema.grades.marks}), 0)`,
        maxMarks: sql<string>`max(${schema.grades.maxMarks})`,
      })
      .from(schema.grades)
      .leftJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
      .where(where)
      .groupBy(schema.subjects.name, schema.grades.grade);

    const distribution = new Map<string, number>();
    const subjects = new Map<string, { entries: number; totalMarks: number; maxMarks: number; bestRank: number }>();

    for (const r of rows) {
      const grade = r.grade ?? 'N/A';
      distribution.set(grade, (distribution.get(grade) ?? 0) + Number(r.entries));

      const name = r.subjectName ?? 'Unassigned';
      const entries = Number(r.entries);
      const prev = subjects.get(name) ?? { entries: 0, totalMarks: 0, maxMarks: 0, bestRank: 0 };
      const rank = GRADE_RANK[grade] ?? 0;
      subjects.set(name, {
        entries: prev.entries + entries,
        totalMarks: prev.totalMarks + Number(r.totalMarks),
        maxMarks: Math.max(prev.maxMarks, Number(r.maxMarks)),
        bestRank: Math.max(prev.bestRank, rank),
      });
    }

    return {
      totalRecords: rows.reduce((t, r) => t + Number(r.entries), 0),
      gradeDistribution: [
        ...GRADE_ORDER.map((g) => ({ grade: g, count: distribution.get(g) ?? 0 })),
        ...Array.from(distribution.entries())
          .filter(([g]) => !GRADE_ORDER.includes(g))
          .map(([grade, c]) => ({ grade, count: c })),
      ],
      subjectAverages: Array.from(subjects.entries())
        .map(([subject, d]) => ({
          subject,
          studentCount: d.entries,
          averageMarks: d.entries ? Math.round(d.totalMarks / d.entries) : 0,
          maxMarks: d.maxMarks,
          highestGrade: Object.keys(GRADE_RANK).find((g) => GRADE_RANK[g] === d.bestRank) ?? 'N/A',
        }))
        .sort((a, b) => b.averageMarks - a.averageMarks),
    };
    }, REPORT_TTL_MS);
  })

  .get('/fees', async ({ query, tenantId }) => {
    const page = Math.max(1, parseInt(query.page || '1') || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '10') || 10));
    const cacheKey = `reports:${tenantId}:fees:${query.classId || 'all'}:${page}:${limit}`;

    return dataCache.getOrSet(cacheKey, async () => {
    const where = and(
      eq(schema.fees.tenantId, tenantId!),
      query.classId && query.classId !== 'all'
        ? sql`EXISTS (SELECT 1 FROM ${schema.students} s WHERE s.id = ${schema.fees.studentId} AND s."classId" = ${query.classId})`
        : undefined,
    );

    const [totals, byType, overdueCount, overdueRows] = await Promise.all([
      db.select({
        recordCount: count(),
        totalFees: sql<string>`coalesce(sum(${schema.fees.amount}), 0)`,
        collected: sql<string>`coalesce(sum(${schema.fees.paidAmount}), 0)`,
      }).from(schema.fees).where(where),

      db.select({
        type: sql<string>`coalesce(${schema.feeCategories.name}, ${schema.fees.type})`,
        collected: sql<string>`coalesce(sum(${schema.fees.paidAmount}), 0)`,
        pending: sql<string>`coalesce(sum(${schema.fees.amount} - ${schema.fees.paidAmount}), 0)`,
      }).from(schema.fees)
        .leftJoin(schema.feeCategories, eq(schema.fees.feeCategoryId, schema.feeCategories.id))
        .where(where)
        .groupBy(sql`coalesce(${schema.feeCategories.name}, ${schema.fees.type})`),

      db.select({ count: count() }).from(schema.fees)
        .where(and(where, ne(schema.fees.status, 'paid'), lt(schema.fees.dueDate, today()))),

      db.select({
        id: schema.fees.id,
        studentId: schema.fees.studentId,
        studentName: schema.users.name,
        className: sql<string>`concat(${schema.classes.name}, '-', ${schema.classes.section})`,
        amount: schema.fees.amount,
        paidAmount: schema.fees.paidAmount,
        dueDate: schema.fees.dueDate,
        status: schema.fees.status,
        type: sql<string>`coalesce(${schema.feeCategories.name}, ${schema.fees.type})`,
      }).from(schema.fees)
        .leftJoin(schema.students, eq(schema.fees.studentId, schema.students.id))
        .leftJoin(schema.users, eq(schema.students.userId, schema.users.id))
        .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
        .leftJoin(schema.feeCategories, eq(schema.fees.feeCategoryId, schema.feeCategories.id))
        .where(and(where, ne(schema.fees.status, 'paid'), lt(schema.fees.dueDate, today())))
        .orderBy(asc(schema.fees.dueDate), asc(schema.fees.id))
        .limit(limit)
        .offset((page - 1) * limit),
    ]);

    const t = totals[0] ?? { recordCount: 0, totalFees: '0', collected: '0' };

    return {
      summary: {
        recordCount: Number(t.recordCount),
        totalFees: Number(t.totalFees),
        collected: Number(t.collected),
        pending: Number(t.totalFees) - Number(t.collected),
      },
      typeBreakdown: byType.map((r) => ({
        type: r.type,
        collected: Number(r.collected),
        pending: Number(r.pending),
      })),
      overdue: {
        total: Number(overdueCount[0]?.count ?? 0),
        page,
        limit,
        items: overdueRows.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          studentName: r.studentName ?? 'Unknown Student',
          className: r.className ?? '-',
          amount: r.amount,
          paidAmount: r.paidAmount,
          dueDate: r.dueDate,
          status: r.status,
          type: r.type,
        })),
      },
    };
    }, REPORT_TTL_MS);
  })

  .post('/fees/reminders', async ({ tenantId, set }) => {
    // "Send reminders" on Reports > Finances. Delivery reuses the automatic fee
    // path: a `fee-due-batch` job whose worker resolves each student's parent,
    // writes the transient notification the bell reads, and queues the FCM push
    // (with quiet-hours deferral). Nothing here inserts a Notification row, so
    // there is only ever one implementation of "notify about a fee".
    const cooldownKey = `fee-reminders:${tenantId}`;
    const COOLDOWN_SECONDS = 3600;

    let acquired = true;
    try {
      acquired = (await redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS, 'NX')) === 'OK';
    } catch {
      // Redis being unreachable should delay the guard, not block a reminder.
      acquired = true;
    }
    if (!acquired) {
      set.status = 429;
      const ttl = await redis.ttl(cooldownKey).catch(() => -1);
      const mins = ttl > 0 ? Math.ceil(ttl / 60) : null;
      return {
        error: mins
          ? `Reminders were already sent. You can send again in ${mins} minute${mins === 1 ? '' : 's'}.`
          : 'Reminders were already sent recently.',
      };
    }

    try {
      // One aggregate row per student, because one reminder per student is what
      // a parent should receive. The innerJoin on Parent is also the recipient
      // filter: a student with no linked parent has nobody to notify, and the
      // worker would silently skip it, so counting it as "sent" would lie.
      const overdue = await db.select({
        studentId: schema.fees.studentId,
        pending: sql<string>`coalesce(sum(${schema.fees.amount} - ${schema.fees.paidAmount}), 0)`,
        earliestDue: sql<string>`min(${schema.fees.dueDate})`,
      })
        .from(schema.fees)
        .innerJoin(schema.students, eq(schema.fees.studentId, schema.students.id))
        .innerJoin(schema.parents, eq(schema.students.parentId, schema.parents.id))
        .where(and(
          eq(schema.fees.tenantId, tenantId!),
          ne(schema.fees.status, 'paid'),
          lt(schema.fees.dueDate, today()),
        ))
        .groupBy(schema.fees.studentId);

      if (overdue.length === 0) {
        await redis.del(cooldownKey).catch(() => {});
        return { sent: 0 };
      }

      const fees = overdue.map((r) => ({
        studentId: r.studentId,
        feeType: 'overdue balance',
        amount: Number(r.pending),
        dueDate: r.earliestDue,
      }));

      // Batched like fee-assign: one job per slice so a single worker job never
      // holds a 50k-element IN list, and one Redis pipeline per recipient group.
      const stamp = Date.now();
      const jobs = chunked(fees, FEE_REMINDER_BATCH).map((batch, i) => ({
        name: 'fee-due-batch',
        data: { tenantId: tenantId!, fees: batch },
        opts: { jobId: `manual-fee-reminders-${tenantId}-${stamp}-${i}`, removeOnComplete: true },
      }));
      for (const group of chunked(jobs, QUEUE_ADD_BULK_CHUNK)) {
        await notificationQueue.addBulk(group);
      }

      return { sent: fees.length };
    } catch (error) {
      // A failed send must not burn the cooldown — the admin would be locked out
      // for an hour with nothing delivered.
      await redis.del(cooldownKey).catch(() => {});
      captureError(error, { method: 'POST', path: '/reports/fees/reminders', tenantId });
      set.status = 500;
      return { error: 'Failed to schedule fee reminders' };
    }
  });
