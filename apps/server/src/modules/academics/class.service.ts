/**
 * ClassService — Shared Service Layer
 * Used by: REST /routes/classes.ts  AND  GraphQL academic.resolvers.ts
 */
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, count, inArray, exists } from 'drizzle-orm';
import { dataCache } from '../../lib/cache';

export interface ClassListParams {
  tenantId: string;
  page?: number;
  limit?: number;
  /** If provided, only return classes this teacher teaches */
  teacherUserId?: string;
  /** If true, include all classes regardless of teacherUserId */
  all?: boolean;
}

const sortByName = (a: any, b: any) => {
  const n = (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
  if (n !== 0) return n;
  return (a.section || '').localeCompare(b.section || '', undefined, { sensitivity: 'base' });
};

export const ClassService = {
  async list(params: ClassListParams) {
    const { tenantId } = params;
    const page = Math.max(1, Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) : 1);
    const limit = Math.min(100, Math.max(1, Number.isFinite(Number(params.limit)) ? Math.floor(Number(params.limit)) : 50));

    // ← fixed: include params.all so a teacher scoped request and an
    //   all=true request on the same teacherUserId get distinct cache entries.
    const cacheKey = `classes:v1:${tenantId}:${params.teacherUserId || 'all'}:${params.all ? '1' : '0'}:${page}:${limit}`;

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        // Resolve teacherId if needed
        let teacherId: string | null = null;
        if (params.teacherUserId && !params.all) {
          const teacher = await db.query.teachers.findFirst({
            where: eq(schema.teachers.userId, params.teacherUserId),
            columns: { id: true },
          });
          if (!teacher) return { items: [], total: 0, page, totalPages: 0 };
          teacherId = teacher.id;
        }

        const where = (cls: any, { eq: eqFn, and: andFn }: any) => {
          const base = eqFn(cls.tenantId, tenantId!);
          if (!teacherId) return base;
          return andFn(
            base,
            exists(
              db.select().from(schema.subjects).where(
                and(eq(schema.subjects.classId, cls.id), eq(schema.subjects.teacherId, teacherId!))
              )
            )
          );
        };

        const classesList = await db.query.classes.findMany({
          where,
          with: {
            students: { columns: { id: true } },
            teachers: {
              where: eq(schema.classTeachers.isClassTeacher, true),
              limit: 1,
              with: { teacher: { with: { user: { columns: { name: true } } } } },
            },
          },
        });

        const allItems = classesList.map((c: any) => {
          const classTeacher = c.teachers?.[0];
          return {
            id: c.id,
            name: c.name,
            section: c.section,
            grade: c.grade,
            capacity: c.capacity,
            studentCount: c.students.length,
            classTeacher: classTeacher?.teacher?.user?.name || 'Unassigned',
            classTeacherId: classTeacher?.teacher?.id || null,
          };
        }).sort(sortByName);

        // ← fixed: actually paginate the sorted results
        const total = allItems.length;
        const skip = (page - 1) * limit;
        const items = allItems.slice(skip, skip + limit);

        return { items, total, page, totalPages: Math.ceil(total / limit) };
      },
      300_000, // 5 min
    );
  },

  /** GQL paginated list with teacher assignment details */
  async listPaginated(params: ClassListParams) {
    const { tenantId } = params;
    const normalizedPage = Math.max(1, Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) : 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number.isFinite(Number(params.limit)) ? Math.floor(Number(params.limit)) : 50));

    // Resolve teacherId if needed
    let teacherId: string | null = null;
    if (params.teacherUserId && !params.all) {
      const teacher = await db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, params.teacherUserId),
        columns: { id: true },
      });
      if (!teacher) return { items: [], total: 0, page: normalizedPage, totalPages: 0 };
      teacherId = teacher.id;
    }

    const cacheKey = `classes:paginated:v1:${tenantId}:${teacherId || 'all'}:${normalizedPage}:${normalizedLimit}`;

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        const where = teacherId
          ? and(
              eq(schema.classes.tenantId, tenantId),
              exists(
                db.select().from(schema.subjects).where(
                  and(eq(schema.subjects.classId, schema.classes.id), eq(schema.subjects.teacherId, teacherId!))
                )
              )
            )
          : eq(schema.classes.tenantId, tenantId);

        // Fetch all matching classes to sort them globally in memory
        const classesList = await db.query.classes.findMany({
          where,
          with: {
            teachers: { with: { teacher: { with: { user: { columns: { name: true } } } } } },
          },
        });

        const classIds = classesList.map((c: any) => c.id);
        const studentCounts = classIds.length > 0
          ? await db.select({ classId: schema.students.classId, count: count() })
              .from(schema.students)
              .where(inArray(schema.students.classId, classIds))
              .groupBy(schema.students.classId)
          : [];

        const countMap = new Map(studentCounts.map(s => [s.classId, s.count]));

        const allItems = classesList.map((c: any) => ({
          ...c,
          studentCount: countMap.get(c.id) || 0,
          teachers: c.teachers.map((t: any) => ({ id: t.teacher.id, name: t.teacher.user.name })),
        })).sort(sortByName);

        const total = allItems.length;
        const skip = (normalizedPage - 1) * normalizedLimit;
        const items = allItems.slice(skip, skip + normalizedLimit);

        return {
          items,
          total,
          page: normalizedPage,
          totalPages: Math.ceil(total / normalizedLimit),
        };
      },
      300_000,
    );
  },

  /** Lightweight list for dropdowns (mode=min) */
  async listMin(tenantId: string, teacherUserId?: string) {
    const cacheKey = `classes:min:v1:${tenantId}:${teacherUserId || 'all'}`;
    return dataCache.getOrSet(
      cacheKey,
      async () => {
        let teacherId: string | null = null;
        if (teacherUserId) {
          const teacher = await db.query.teachers.findFirst({
            where: eq(schema.teachers.userId, teacherUserId),
            columns: { id: true },
          });
          if (!teacher) return [];
          teacherId = teacher.id;
        }

        const where = (cls: any, { eq: eqFn, and: andFn }: any) => {
          const base = eqFn(cls.tenantId, tenantId!);
          if (!teacherId) return base;
          return andFn(base, exists(
            db.select().from(schema.subjects).where(
              and(eq(schema.subjects.classId, cls.id), eq(schema.subjects.teacherId, teacherId!))
            )
          ));
        };

        const classes = await db.query.classes.findMany({
          where,
          columns: { id: true, name: true, section: true, grade: true },
        });
        return [...classes].sort(sortByName);
      },
      300_000,
    );
  },
};
