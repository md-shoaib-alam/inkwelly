/**
 * SubjectService — Shared Service Layer
 * Used by: REST /routes/subjects.ts  AND  GraphQL academic.resolvers.ts
 */
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, count, ilike, inArray, asc } from 'drizzle-orm';
import { dataCache } from '../../lib/cache';

export interface SubjectListParams {
  tenantId: string;
  classId?: string;
  search?: string;
  page?: number;
  limit?: number;
  /** Only return subjects assigned to the calling teacher */
  mineOnly?: boolean;
  callerUserId?: string;
}

export const SubjectService = {
  async list(params: SubjectListParams) {
    const { tenantId, classId, search } = params;
    const page = Math.max(1, Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) : 1);
    const limit = Math.min(100, Math.max(1, Number.isFinite(Number(params.limit)) ? Math.floor(Number(params.limit)) : 50));

    // Resolve teacher ID first if mineOnly is requested
    let teacherId: string | null = null;
    if (params.mineOnly && params.callerUserId) {
      const teacher = await db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, params.callerUserId),
        columns: { id: true },
      });
      if (!teacher) {
        return { items: [], total: 0, page, totalPages: 0 };
      }
      teacherId = teacher.id;
    }

    const cacheKey = `subjects:v1:${tenantId}:${classId || 'all'}:${search || ''}:${teacherId || 'all'}:${page}:${limit}`;

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        const buildWhere = (subjects: any, { eq: eqFn, and: andFn, ilike: ilikeFn }: any) => {
          const conditions = [eqFn(subjects.tenantId, tenantId!)];
          if (classId && classId !== 'all') conditions.push(eqFn(subjects.classId, classId));
          if (search) conditions.push(ilikeFn(subjects.name, `%${search}%`));
          if (teacherId) conditions.push(eqFn(subjects.teacherId, teacherId));
          return andFn(...conditions);
        };

        const skip = (page - 1) * limit;

        const [subjectsList, totalResult] = await Promise.all([
          db.query.subjects.findMany({
            where: buildWhere,
            with: {
              class: { columns: { name: true, section: true } },
              teacher: { with: { user: { columns: { name: true } } } },
            },
            orderBy: [asc(schema.subjects.name)],
            offset: skip,
            limit,
          }),
          db.select({ count: count() })
            .from(schema.subjects)
            .where(buildWhere(schema.subjects, { eq, and, ilike })),
        ]);

        const total = Number(totalResult[0]?.count || 0);

        const items = subjectsList.map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          className: `${s.class.name}-${s.class.section}`,
          classId: s.classId,
          teacherName: s.teacher?.user?.name || 'Not Assigned',
          teacherId: s.teacherId || '',
        }));

        return { items, total, page, totalPages: Math.ceil(total / limit) };
      },
      300_000, // 5 min
    );
  },

  /** GQL paginated list */
  async listPaginated(params: SubjectListParams) {
    const { tenantId } = params;
    const page = Math.max(1, Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) : 1);
    const limit = Math.min(100, Math.max(1, Number.isFinite(Number(params.limit)) ? Math.floor(Number(params.limit)) : 50));
    const skip = (page - 1) * limit;

    // Resolve teacher ID first if mineOnly is requested
    let teacherId: string | null = null;
    if (params.mineOnly && params.callerUserId) {
      const teacher = await db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, params.callerUserId),
        columns: { id: true },
      });
      if (!teacher) {
        return { items: [], total: 0, page, totalPages: 0 };
      }
      teacherId = teacher.id;
    }

    const cacheKey = `subjects:paginated:v1:${tenantId}:${teacherId || 'all'}:${page}:${limit}`;

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        const conditions = [
          inArray(
            schema.subjects.classId,
            db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
          ),
        ];
        if (teacherId) {
          conditions.push(eq(schema.subjects.teacherId, teacherId));
        }
        const where = and(...conditions);

        const [subjectsList, totalResult] = await Promise.all([
          db.query.subjects.findMany({
            where,
            with: {
              class: { columns: { name: true, section: true } }, // Fixed: restrict selection
              teacher: { with: { user: { columns: { name: true } } } }, // Fixed: restrict selection
            },
            orderBy: [desc(schema.subjects.createdAt), desc(schema.subjects.id)],
            offset: skip,
            limit,
          }),
          db.select({ count: count() })
            .from(schema.subjects)
            .where(where),
        ]);

        const total = Number(totalResult[0]?.count || 0);

        return {
          items: subjectsList.map((s: any) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            classId: s.classId,
            className: `${s.class.name}-${s.class.section}`,
            teacherName: s.teacher?.user?.name || 'Not Assigned',
            teacherId: s.teacherId || '',
          })),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      },
      300_000,
    );
  },

  /** Lightweight min list for dropdowns */
  async listMin(tenantId: string) {
    const cacheKey = `subjects:min:v1:${tenantId}`;
    return dataCache.getOrSet(
      cacheKey,
      async () => {
        return db.query.subjects.findMany({
          where: (subjects, { eq: eqFn }) => eqFn(subjects.tenantId, tenantId),
          columns: { id: true, name: true, classId: true, teacherId: true },
          orderBy: [asc(schema.subjects.name)],
        });
      },
      300_000,
    );
  },
};
