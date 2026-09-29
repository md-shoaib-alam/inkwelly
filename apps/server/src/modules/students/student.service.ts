/**
 * StudentService — Shared Service Layer
 *
 * Single source of truth for all student database queries.
 * Used by BOTH:
 *   - REST route:      /routes/students.ts
 *   - GraphQL resolver: /graphql/resolvers/academic.resolvers.ts
 *
 * This eliminates duplicated DB logic and means any bug fix or new filter
 * needs to be made in ONE place only.
 */

import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, ne, or, desc, inArray, count, ilike, isNull, sql, exists } from 'drizzle-orm';
import { dataCache } from '../../lib/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentListParams {
  tenantId: string;
  classId?: string;
  search?: string;
  status?: string;     // 'active' | 'inactive' | 'all'
  gender?: string;     // 'male' | 'female' | 'all'
  page?: number;
  limit?: number;
  /** Only include students with no parent linked */
  unlinkedOnly?: boolean;
  /** Caller user — used for parent-role scoping */
  callerUserId?: string;
  callerRole?: string;
}

export interface StudentListItem {
  id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  rollNumber: string;
  className: string;
  classId: string | null;
  parentId: string | null;
  parentName: string | null;
  parentEmail: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  admissionDate: string | null;
  transport?: any | null;
  status: string;
}

export interface StudentListResult {
  items: StudentListItem[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_STUDENT_LIMIT = 100;

function normalizePagination(page?: number, limit?: number) {
  const safePageValue = Number(page);
  const safeLimitValue = Number(limit);

  const normalizedPage = Number.isFinite(safePageValue) && safePageValue > 0 ? Math.floor(safePageValue) : 1;
  const normalizedLimit = Math.min(
    MAX_STUDENT_LIMIT,
    Math.max(1, Number.isFinite(safeLimitValue) ? Math.floor(safeLimitValue) : 50)
  );

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
}

export function buildWhereConditions(tenantId: string, params: StudentListParams, tableAlias: string = 'students') {
  const conditions: any[] = [
    sql`${sql.raw(`"${tableAlias}"."deletedAt"`)} IS NULL`,
    sql`EXISTS (
      SELECT 1 FROM ${schema.users} u
      WHERE u.id = ${sql.raw(`"${tableAlias}"."userId"`)} AND u."tenantId" = ${tenantId}
    )`
  ];

  if (params.callerRole === 'parent') {
    if (!params.callerUserId) {
      // Fail closed: matching condition that is always false
      conditions.push(sql`1 = 0`);
    } else {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${schema.parents} p
        WHERE p.id = ${sql.raw(`"${tableAlias}"."parentId"`)} AND p."userId" = ${params.callerUserId}
      )`);
    }
  }

  const statusFilter = params.status || 'active';
  if (statusFilter === 'inactive') {
    // Nothing is stored as 'inactive'; the column records where a student went, so
    // inactive is every status that is not active. Matching the word literally
    // returned an empty list, which reads as an empty school.
    conditions.push(ne(schema.students.status, 'active'));
  } else if (statusFilter !== 'all') {
    conditions.push(eq(schema.students.status, statusFilter));
  }

  if (params.gender && params.gender !== 'all') {
    conditions.push(eq(schema.students.gender, params.gender));
  }

  if (params.classId && params.classId !== 'all') {
    conditions.push(eq(schema.students.classId, params.classId));
  }

  if (params.unlinkedOnly) {
    conditions.push(isNull(schema.students.parentId));
  }

  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(
      or(
        sql`EXISTS (
          SELECT 1 FROM ${schema.users} u
          WHERE u.id = ${sql.raw(`"${tableAlias}"."userId"`)}
            AND u."tenantId" = ${tenantId}
            AND (u.name ILIKE ${pattern} OR u.email ILIKE ${pattern} OR u.username ILIKE ${pattern})
        )`,
        sql`${sql.raw(`"${tableAlias}"."rollNumber"`)} ILIKE ${pattern}`,
        sql`${sql.raw(`"${tableAlias}"."id"`)} = ${params.search}`,
      )!
    );
  }

  return and(...conditions);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const StudentService = {
  async list(params: StudentListParams): Promise<StudentListResult> {
    const { tenantId } = params;
    const { page, limit, skip } = normalizePagination(params.page, params.limit);

    const statusFilter = params.status || 'active';
    const cacheKey = [
      'students:v1',
      tenantId,
      params.classId || 'all',
      params.search || '',
      statusFilter,
      params.gender || 'all',
      params.unlinkedOnly ? '1' : '0',
      params.callerRole || '',
      params.callerUserId || '',
      page,
      limit,
    ].join(':');

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        const [rows, totalRows] = await Promise.all([
          db.query.students.findMany({
            where: buildWhereConditions(tenantId, params, 'students'),
            with: {
              user: { columns: { name: true, username: true, email: true, phone: true } },
              class: { columns: { name: true, section: true } },
              parent: { with: { user: { columns: { name: true, email: true } } } },
              transport: true,
            },
            orderBy: [desc(schema.students.rollNumber), desc(schema.students.id)],
            offset: skip,
            limit,
          }),
          db.select({ count: count() }).from(schema.students).where(
            buildWhereConditions(tenantId, params, 'Student')
          ),
        ]);

        const total = Number(totalRows[0]?.count || 0);

        return {
          items: rows.map((s: any) => ({
            id: s.id,
            userId: s.userId,
            username: s.user?.username || '',
            name: s.user?.name || 'Unknown',
            email: s.user?.email || '',
            phone: s.user?.phone || null,
            rollNumber: s.rollNumber || '',
            className: s.class ? `${s.class.name}-${s.class.section}` : 'Unassigned',
            classId: s.classId,
            parentId: s.parentId,
            parentName: s.parent?.user?.name || null,
            parentEmail: s.parent?.user?.email || null,
            gender: s.gender || null,
            dateOfBirth: s.dateOfBirth || null,
            admissionDate: s.admissionDate || null,
            transport: s.transport || null,
            status: s.status,
          })),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      },
      300_000,
    );
  },

  async listMin(params: StudentListParams): Promise<{ items: any[]; hasMore: boolean; page: number }> {
    const { tenantId } = params;
    const { page, limit, skip } = normalizePagination(params.page, params.limit);

    const cacheKey = [
      'students:min:v2',
      tenantId,
      params.classId || 'all',
      params.search || '',
      params.unlinkedOnly ? '1' : '0',
      params.status || 'active',
      params.gender || 'all',
      params.callerRole || '',
      params.callerUserId || '',
      limit,
      page,
    ].join(':');

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        const normalizedParams = { ...params, page, limit };
        const requestedClassId = normalizedParams.classId && normalizedParams.classId !== 'all'
          ? normalizedParams.classId
          : undefined;
        
        const effectiveParams = { ...normalizedParams, classId: requestedClassId };

        const [rows, totalRows] = await Promise.all([
          db.query.students.findMany({
            where: buildWhereConditions(tenantId, effectiveParams, 'students'),
            with: {
              user: { columns: { name: true } },
              class: { columns: { name: true, section: true } },
              parent: { with: { user: { columns: { name: true } } } },
            },
            orderBy: [desc(schema.students.createdAt), desc(schema.students.id)],
            limit,
            offset: skip,
          }),
          db.select({ count: count() }).from(schema.students).where(
            buildWhereConditions(tenantId, effectiveParams, 'Student')
          ),
        ]);

        const total = Number(totalRows[0]?.count || 0);

        return {
          items: rows.map((s: any) => ({
            id: s.id,
            userId: s.userId,
            name: s.user?.name || 'Unknown',
            rollNumber: s.rollNumber || '',
            className: s.class ? `${s.class.name}-${s.class.section}` : '',
            classId: s.classId,
            parentId: s.parentId,
            parentName: s.parent?.user?.name || null,
            status: s.status,
          })),
          hasMore: skip + rows.length < total,
          page,
        };
      },
      300_000,
    );
  },
};
