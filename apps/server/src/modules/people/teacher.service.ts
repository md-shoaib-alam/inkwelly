/**
 * TeacherService — Shared Service Layer
 * Used by: REST /routes/teachers.ts  AND  GraphQL academic.resolvers.ts
 */
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, or, desc, count, ilike, inArray, sql } from 'drizzle-orm';
import { dataCache } from '../../lib/cache';

export interface TeacherListParams {
  tenantId: string;
  search?: string;
  page?: number;
  limit?: number;
  callerUserId?: string;
  callerRole?: string;
}

export const TeacherService = {
  async list(params: TeacherListParams) {
    const { tenantId, search } = params;
    const page = Math.max(1, Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) : 1);
    const limit = Math.min(100, Math.max(1, Number.isFinite(Number(params.limit)) ? Math.floor(Number(params.limit)) : 50));
    const skip = (page - 1) * limit;

    if (
      (params.callerRole === 'parent' || params.callerRole === 'student') &&
      !params.callerUserId
    ) {
      return { items: [], total: 0, page, totalPages: 0 };
    }

    const cacheKey = `teachers:v1:${tenantId}:${params.callerRole || 'all'}:${params.callerUserId || 'all'}:${page}:${limit}:${search || ''}`;

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        // Define shared query predicate for tenant and search terms
        const buildPredicate = (userSchema: typeof schema.users) => {
          if (search) {
            return and(
              eq(userSchema.tenantId, tenantId),
              or(
                ilike(userSchema.name, `%${search}%`),
                ilike(userSchema.email, `%${search}%`)
              )
            );
          }
          return eq(userSchema.tenantId, tenantId);
        };

        const tenantUserIds = db.select({ id: schema.users.id })
          .from(schema.users)
          .where(buildPredicate(schema.users));

        // Caller scoping: parent/student can only see teachers assigned to their classes/subjects
        let allowedTeacherIdsCond: any = undefined;
        if (params.callerRole === 'parent' && params.callerUserId) {
          const parentSubquery = db.select({ id: schema.parents.id })
            .from(schema.parents)
            .where(eq(schema.parents.userId, params.callerUserId));
          const childrenClassIds = db.select({ classId: schema.students.classId })
            .from(schema.students)
            .where(eq(schema.students.parentId, parentSubquery));

          const teacherIdsFromClasses = db.select({ teacherId: schema.classTeachers.teacherId })
            .from(schema.classTeachers)
            .where(inArray(schema.classTeachers.classId, childrenClassIds));
          const teacherIdsFromSubjects = db.select({ teacherId: schema.subjects.teacherId })
            .from(schema.subjects)
            .where(and(
              inArray(schema.subjects.classId, childrenClassIds),
              sql`${schema.subjects.teacherId} IS NOT NULL`
            ));

          allowedTeacherIdsCond = or(
            inArray(schema.teachers.id, teacherIdsFromClasses),
            inArray(schema.teachers.id, teacherIdsFromSubjects)
          );
        } else if (params.callerRole === 'student' && params.callerUserId) {
          const studentClassIdSubquery = db.select({ classId: schema.students.classId })
            .from(schema.students)
            .where(eq(schema.students.userId, params.callerUserId));

          const teacherIdsFromClasses = db.select({ teacherId: schema.classTeachers.teacherId })
            .from(schema.classTeachers)
            .where(inArray(schema.classTeachers.classId, studentClassIdSubquery));
          const teacherIdsFromSubjects = db.select({ teacherId: schema.subjects.teacherId })
            .from(schema.subjects)
            .where(and(
              inArray(schema.subjects.classId, studentClassIdSubquery),
              sql`${schema.subjects.teacherId} IS NOT NULL`
            ));

          allowedTeacherIdsCond = or(
            inArray(schema.teachers.id, teacherIdsFromClasses),
            inArray(schema.teachers.id, teacherIdsFromSubjects)
          );
        }

        const where = allowedTeacherIdsCond
          ? and(inArray(schema.teachers.userId, tenantUserIds), allowedTeacherIdsCond)
          : inArray(schema.teachers.userId, tenantUserIds);

        const countWhere = allowedTeacherIdsCond
          ? and(buildPredicate(schema.users), allowedTeacherIdsCond)
          : buildPredicate(schema.users);

        const [teachers, totalResult] = await Promise.all([
          db.query.teachers.findMany({
            where,
            with: {
              user: { columns: { name: true, email: true, phone: true, isActive: true } },
              subjects: { columns: { name: true } },
              classes: { with: { class: { columns: { name: true, section: true } } } },
            },
            orderBy: [desc(schema.teachers.id)],
            offset: skip,
            limit,
          }),
          db.select({ count: count() })
            .from(schema.teachers)
            .innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
            .where(countWhere),
        ]);

        const total = Number(totalResult[0]?.count || 0);

        return {
          items: teachers.map((t: any) => ({
            id: t.id,
            userId: t.userId,
            name: t.user?.name || 'Unknown',
            email: t.user?.email || '',
            phone: t.user?.phone || '',
            status: t.user?.isActive ? 'active' : 'inactive',
            qualification: t.qualification,
            experience: t.experience,
            joiningDate: t.joiningDate,
            subjects: t.subjects.map((s: any) => s.name),
            classes: t.classes.map((c: any) => `${c.class.name}-${c.class.section}`),
          })),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      },
      1_800_000, // 30 min
    );
  },

  /** Lightweight list for dropdowns */
  async listMin(tenantId: string, search?: string) {
    const cacheKey = `teachers:min:v2:${tenantId}:${search || ''}`;
    return dataCache.getOrSet(
      cacheKey,
      async () => {
        const tenantUserIds = db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(
            search
              ? and(eq(schema.users.tenantId, tenantId), ilike(schema.users.name, `%${search}%`))
              : eq(schema.users.tenantId, tenantId)
          );

        const teachers = await db.query.teachers.findMany({
          where: inArray(schema.teachers.userId, tenantUserIds),
          with: { user: { columns: { name: true } } },
          orderBy: [desc(schema.teachers.id)],
          limit: 200,
        });
        return teachers.map((t: any) => ({ id: t.id, userId: t.userId, name: t.user.name }));
      },
      300_000,
    );
  },
};
