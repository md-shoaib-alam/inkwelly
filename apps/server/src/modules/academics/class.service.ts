/**
 * ClassService — Shared Service Layer
 * Used by: REST /classes  AND  GraphQL academic.resolvers.ts
 */
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { and, asc, desc, eq, count, inArray, exists, ilike, or, sql, type SQL } from 'drizzle-orm';
import { dataCache } from '../../lib/cache';
import type { ClassListQuery } from '../../lib/validation/class';

export interface ClassListParams extends Partial<ClassListQuery> {
  tenantId: string;
  /** If provided, only return classes this teacher teaches */
  teacherUserId?: string;
  /** If true, include all classes regardless of teacherUserId */
  all?: boolean;
}

export interface ClassRow {
  id: string;
  name: string;
  slug: string | null;
  section: string;
  classLevel: string;
  medium: string;
  isVocational: boolean;
  isActive: boolean;
  capacity: number;
  studentCount: number;
  /** Share of this class's students complete on every profile field the dashboard counts. */
  profileCompletePercent: number;
  classTeacher: string | null;
  classTeacherId: string | null;
  teachers: { id: string; name: string; avatar?: string | null; isPrimary: boolean }[];
}

/**
 * Whitelisted so `sortBy` can never reach ORDER BY as raw input.
 */
export const CLASS_SORT_EXPRESSIONS: Record<string, SQL> = {
  name: sql`${schema.classes.name}`,
  classLevel: sql`${schema.classes.classLevel}`,
  section: sql`${schema.classes.section}`,
  capacity: sql`${schema.classes.capacity}`,
};

const ENROLLED_SUBQUERY = sql`(
  select count(*) from "Student" s where s."classId" = "Class"."id"
)`;

/**
 * The fields a profile must carry to count as complete — the same set the Students
 * dashboard scores in `profileFieldCount`, so a class bar and the dashboard total
 * can never disagree. `class.service.test.ts` proves that function counts exactly
 * these and nothing else.
 */
export const PROFILE_COMPLETE_FIELDS = ['dateOfBirth', 'bloodGroup', 'parentId', 'rollNumber'] as const;

/**
 * `btrim` rather than a bare `is not null`: `rollNumber` is NOT NULL but arrives
 * blank from the import path, and the dashboard's `trim().length > 0` does not
 * accept whitespace as a filled-in field.
 */
export function completeProfileCondition(columns: readonly string[]): string {
  return columns.map((column) => `coalesce(btrim(s."${column}"), '') <> ''`).join(' and ');
}

const COMPLETE_PROFILE_CONDITION = sql.raw(completeProfileCondition(PROFILE_COMPLETE_FIELDS));

/**
 * One pass over the class's students for both numbers, so the denominator is the
 * same population `studentCount` reports — a row that says 24 enrolled and a bar
 * computed over 22 active students would read as a bug even when it is not.
 */
const COMPLETION_SUBQUERY = sql`(
  select coalesce(
    round(100.0 * count(*) filter (where ${COMPLETE_PROFILE_CONDITION}) / nullif(count(*), 0)),
    0
  )::int
  from "Student" s where s."classId" = "Class"."id"
)`;

/** `enrolled` is the one sortable value that isn't a column, so it sorts on the count. */
export const CLASS_SORT_KEYS = [...Object.keys(CLASS_SORT_EXPRESSIONS), 'enrolled'];

/**
 * Every filter is applied in SQL, so the sort and the LIMIT decide how much work
 * a request does. Previously the whole tenant was read, joined and sorted in
 * JavaScript before being sliced, which made the page cost proportional to the
 * school's total class count instead of the ~20 rows it displays.
 */
export function buildClassFilters(
  tenantId: string,
  filters: Partial<ClassListParams>,
  teacherId: string | null,
): SQL[] {
  const clauses: SQL[] = [eq(schema.classes.tenantId, tenantId)];

  if (filters.classLevel) clauses.push(eq(schema.classes.classLevel, filters.classLevel));
  if (filters.section) clauses.push(eq(schema.classes.section, filters.section));
  if (filters.medium) clauses.push(eq(schema.classes.medium, filters.medium));
  if (typeof filters.vocational === 'boolean') clauses.push(eq(schema.classes.isVocational, filters.vocational));
  if (filters.status) clauses.push(eq(schema.classes.isActive, filters.status === 'active'));

  if (filters.search) {
    const needle = `%${filters.search}%`;
    clauses.push(or(
      ilike(schema.classes.name, needle),
      ilike(schema.classes.classLevel, needle),
      ilike(schema.classes.section, needle),
    )!);
  }

  if (teacherId) {
    clauses.push(exists(
      sql`select 1 from "Subject" sub where sub."classId" = "Class"."id" and sub."teacherId" = ${teacherId}`,
    ));
  }

  return clauses;
}

/**
 * The cache key has to carry every filter, or two different views of the same
 * tenant collide on one entry and the second caller gets the first one's rows.
 * The `v3` is the payload's version: adding a field to the row shape has to bump
 * it, or the cached entries written before the change keep serving rows without it.
 */
export function classCacheKey(params: ClassListParams, teacherScope: string): string {
  const f = params;
  const parts = [
    f.classLevel ?? '', f.section ?? '', f.medium ?? '',
    f.vocational === undefined ? '' : String(f.vocational),
    f.status ?? '', f.search ?? '',
    f.sortBy ?? 'name', f.sortDir ?? 'asc',
    teacherScope, String(f.page ?? 1), String(f.limit ?? 50),
  ].map(encodeURIComponent).join('|');
  return `classes:paginated:v4:${params.tenantId}:${parts}`;
}

const normalizePaging = (params: ClassListParams) => {
  const page = Math.max(1, Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) : 1);
  const limit = Math.min(100, Math.max(1, Number.isFinite(Number(params.limit)) ? Math.floor(Number(params.limit)) : 50));
  return { page, limit };
};

async function resolveTeacherId(teacherUserId?: string, all?: boolean): Promise<string | null | 'none'> {
  if (!teacherUserId || all) return null;
  const teacher = await db.query.teachers.findFirst({
    where: eq(schema.teachers.userId, teacherUserId),
    columns: { id: true },
  });
  return teacher ? teacher.id : 'none';
}

/** One round trip for the page's teachers, instead of joining every class. */
async function teachersForClasses(classIds: string[]) {
  if (classIds.length === 0) return new Map<string, { id: string; name: string; isPrimary: boolean }[]>();

  const rows = await db
    .select({
      classId: schema.classTeachers.classId,
      teacherId: schema.classTeachers.teacherId,
      name: schema.users.name,
      avatar: schema.users.avatar,
      isPrimary: schema.classTeachers.isClassTeacher,
    })
    .from(schema.classTeachers)
    .innerJoin(schema.teachers, eq(schema.classTeachers.teacherId, schema.teachers.id))
    .innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
    .where(inArray(schema.classTeachers.classId, classIds));

  const byClass = new Map<string, { id: string; name: string; avatar?: string | null; isPrimary: boolean }[]>();
  for (const row of rows) {
    const list = byClass.get(row.classId) ?? [];
    list.push({ id: row.teacherId, name: row.name, avatar: row.avatar, isPrimary: row.isPrimary });
    byClass.set(row.classId, list);
  }
  for (const list of byClass.values()) {
    list.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));
  }
  return byClass;
}

export const ClassService = {
  /**
   * The single SQL path behind both reads. `columns:` keeps createdAt/updatedAt
   * out of the payload, and the enrolled count is a correlated subquery so it is
   * computed for the rows actually returned rather than loaded as id arrays.
   */
  async queryClasses(params: ClassListParams) {
    const { page, limit } = normalizePaging(params);

    const teacherScope = await resolveTeacherId(params.teacherUserId, params.all);
    if (teacherScope === 'none') return { items: [] as ClassRow[], total: 0, page, totalPages: 0 };

    const cacheKey = classCacheKey({ ...params, page, limit }, teacherScope ?? 'all');

    return dataCache.getOrSet(cacheKey, async () => {
      const where = and(...buildClassFilters(params.tenantId, params, teacherScope));
      const requestedSort = params.sortBy && CLASS_SORT_KEYS.includes(params.sortBy) ? params.sortBy : 'name';
      const direction = params.sortDir === 'desc' ? desc : asc;
      const orderExpression = requestedSort === 'enrolled'
        ? direction(ENROLLED_SUBQUERY)
        : direction(CLASS_SORT_EXPRESSIONS[requestedSort] ?? CLASS_SORT_EXPRESSIONS.name!);

      const [rows, totalRow] = await Promise.all([
        db
          .select({
            id: schema.classes.id,
            name: schema.classes.name,
            slug: schema.classes.slug,
            section: schema.classes.section,
            classLevel: schema.classes.classLevel,
            medium: schema.classes.medium,
            isVocational: schema.classes.isVocational,
            isActive: schema.classes.isActive,
            capacity: schema.classes.capacity,
            studentCount: ENROLLED_SUBQUERY.as('studentCount'),
            profileCompletePercent: COMPLETION_SUBQUERY.as('profileCompletePercent'),
          })
          .from(schema.classes)
          .where(where)
          .orderBy(orderExpression, asc(schema.classes.name), asc(schema.classes.section))
          .limit(limit)
          .offset((page - 1) * limit),
        db
          .select({ total: count() })
          .from(schema.classes)
          .where(where),
      ]);

      const teacherMap = await teachersForClasses(rows.map((r) => r.id));

      const items: ClassRow[] = rows.map((r) => {
        const teachers = teacherMap.get(r.id) ?? [];
        const primary = teachers.find((t) => t.isPrimary) ?? teachers[0] ?? null;
        return {
          ...r,
          studentCount: Number(r.studentCount ?? 0),
          profileCompletePercent: Number(r.profileCompletePercent ?? 0),
          teachers,
          classTeacher: primary?.name ?? null,
          classTeacherId: primary?.id ?? null,
        };
      });

      const total = Number(totalRow?.[0]?.total ?? 0);
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }, 300_000);
  },

  /** REST GET /classes — unchanged response contract for mobile and the web forms. */
  async list(params: ClassListParams) {
    const result = await this.queryClasses(params);
    return {
      items: result.items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        section: c.section,
        classLevel: c.classLevel,
        medium: c.medium,
        isVocational: c.isVocational,
        isActive: c.isActive,
        capacity: c.capacity,
        studentCount: c.studentCount,
        classTeacher: c.classTeacher || 'Unassigned',
        classTeacherId: c.classTeacherId,
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  },

  /** GraphQL `classes` — the page plus the teachers each row carries for the dialog. */
  async listPaginated(params: ClassListParams) {
    return this.queryClasses(params);
  },

  /**
   * Unfiltered tenant totals for the stat cards. Deliberately not derived from
   * the filtered page: an aggregate over a truncated list prints a wrong number
   * with a straight face.
   */
  async stats(tenantId: string) {
    return dataCache.getOrSet(`classes:stats:v1:${tenantId}`, async () => {
      const [row] = await db
        .select({
          total: count(),
          active: sql<number>`count(*) filter (where ${schema.classes.isActive} = true)`,
          enrolled: sql<number>`coalesce(sum((
            select count(*) from "Student" s where s."classId" = "Class"."id"
          )), 0)`,
        })
        .from(schema.classes)
        .where(eq(schema.classes.tenantId, tenantId));

      return {
        total: Number(row?.total ?? 0),
        active: Number(row?.active ?? 0),
        enrolled: Number(row?.enrolled ?? 0),
      };
    }, 300_000);
  },

  /**
   * Which classLevel/section/medium values this tenant actually has. The filter panel
   * builds its options from this rather than a static list, so a select can never
   * offer a value that returns nothing — and never hides one the school uses.
   */
  async filterOptions(tenantId: string) {
    return dataCache.getOrSet(`classes:options:v2:${tenantId}`, async () => {
      const distinct = async (column: SQL) => {
        const rows = await db
          .select({ value: column })
          .from(schema.classes)
          .where(eq(schema.classes.tenantId, tenantId))
          .groupBy(column)
          .orderBy(asc(column));
        return rows.map((r) => r.value).filter(Boolean) as string[];
      };

      const [classLevels, sections, mediums] = await Promise.all([
        distinct(sql`${schema.classes.classLevel}`),
        distinct(sql`${schema.classes.section}`),
        distinct(sql`${schema.classes.medium}`),
      ]);
      return { classLevels, sections, mediums };
    }, 300_000);
  },

  /** Lightweight list for dropdowns (mode=min) */
  async listMin(tenantId: string, teacherUserId?: string) {
    const cacheKey = `classes:min:v2:${tenantId}:${teacherUserId || 'all'}`;
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

        const classes = await db.query.classes.findMany({
          where: (cls, { eq: eqFn, and: andFn }) => {
            const base = eqFn(cls.tenantId, tenantId!);
            if (!teacherId) return base;
            return andFn(base, exists(
              sql`select 1 from "Subject" sub where sub."classId" = ${cls.id} and sub."teacherId" = ${teacherId}`,
            ));
          },
          columns: { id: true, name: true, section: true, classLevel: true, slug: true },
          orderBy: [asc(schema.classes.name), asc(schema.classes.section)],
        });
        return classes;
      },
      300_000,
    );
  },
};
