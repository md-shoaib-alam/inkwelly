/**
 * ParentService — Shared Service Layer
 * Used by: REST /routes/parents.ts  AND  GraphQL academic.resolvers.ts
 */
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, count, ilike } from 'drizzle-orm';
import { dataCache } from '../lib/cache';

export interface ParentListParams {
  tenantId: string;
  search?: string;
  page?: number;
  limit?: number;
  /** Scope to only this user's own record (parent role) */
  callerUserId?: string;
  callerRole?: string;
}

export const ParentService = {
  async list(params: ParentListParams) {
    const { tenantId, search } = params;
    const page = Math.max(1, Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) : 1);
    const limit = Math.min(100, Math.max(1, Number.isFinite(Number(params.limit)) ? Math.floor(Number(params.limit)) : 50));
    const skip = (page - 1) * limit;

    if (params.callerRole === 'parent' && !params.callerUserId) {
      return { items: [], total: 0, page, totalPages: 0 };
    }

    const cacheKey = `parents:v1:${tenantId}:${params.callerRole || ''}:${params.callerUserId || ''}:${page}:${limit}:${search || ''}`;

    return dataCache.getOrSet(
      cacheKey,
      async () => {
        const whereClause = and(
          eq(schema.users.tenantId, tenantId),
          eq(schema.users.role, 'parent'),
          params.callerRole === 'parent' && params.callerUserId
            ? eq(schema.users.id, params.callerUserId)
            : undefined,
          search
            ? and(...(search as string).trim().split(/\s+/).map(term => ilike(schema.users.name, `%${term}%`)))
            : undefined
        );
        const [usersList, totalResult] = await Promise.all([
          db.query.users.findMany({
            where: whereClause,
            with: {
              parent: {
                with: {
                  students: {
                    with: {
                      user: { columns: { name: true, email: true } },
                      class: { columns: { name: true, section: true } },
                    },
                  },
                },
              },
            },
            orderBy: [schema.users.name],
            limit,
            offset: skip,
          }),
          db.select({ count: count() }).from(schema.users).where(whereClause),
        ]);

        const total = Number(totalResult[0]?.count || 0);

        return {
          items: usersList.map((u: any) => {
            const parent = u.parent;
            return {
              id: parent?.id || 'unlinked-' + u.id,
              userId: u.id,
              name: u.name || 'Unknown',
              email: u.email || '',
              phone: u.phone || '',
              username: u.username || '',
              occupation: parent?.occupation || '',
              children: (parent?.students || []).map((s: any) => ({
                id: s.id,
                name: s.user?.name || 'Unknown',
                email: s.user?.email || '',
                rollNumber: s.rollNumber,
                className: s.class ? `${s.class.name}-${s.class.section}` : '',
                classId: s.classId,
                gender: s.gender,
                dateOfBirth: s.dateOfBirth,
              })),
            };
          }),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      },
      1_800_000, // 30 min
    );
  },

  async getById(parentId: string, tenantId: string) {
    const parent = await db.query.parents.findFirst({
      where: eq(schema.parents.id, parentId),
      with: {
        user: true,
        students: {
          with: {
            user: { columns: { name: true, email: true } },
            class: { columns: { name: true, section: true } },
          },
        },
      },
    });

    if (parent && parent.user && parent.user.tenantId === tenantId) {
      const u = parent.user;
      return {
        id: parent.id,
        userId: u.id,
        name: u.name || 'Unknown',
        email: u.email || '',
        phone: u.phone || '',
        username: u.username || '',
        occupation: parent.occupation || '',
        children: (parent.students || []).map((s: any) => ({
          id: s.id,
          name: s.user?.name || 'Unknown',
          email: s.user?.email || '',
          rollNumber: s.rollNumber,
          className: s.class ? `${s.class.name}-${s.class.section}` : '',
          classId: s.classId,
          gender: s.gender,
          dateOfBirth: s.dateOfBirth,
        })),
      };
    }

    // Fallback: check if parentId is unlinked-userId or directly matches users.id
    const targetUserId = parentId.startsWith('unlinked-') ? parentId.replace('unlinked-', '') : parentId;
    const user = await db.query.users.findFirst({
      where: and(eq(schema.users.id, targetUserId), eq(schema.users.tenantId, tenantId), eq(schema.users.role, 'parent')),
      with: {
        parent: {
          with: {
            students: {
              with: {
                user: { columns: { name: true, email: true } },
                class: { columns: { name: true, section: true } },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const p = user.parent;
    return {
      id: p?.id || 'unlinked-' + user.id,
      userId: user.id,
      name: user.name || 'Unknown',
      email: user.email || '',
      phone: user.phone || '',
      username: user.username || '',
      occupation: p?.occupation || '',
      children: (p?.students || []).map((s: any) => ({
        id: s.id,
        name: s.user?.name || 'Unknown',
        email: s.user?.email || '',
        rollNumber: s.rollNumber,
        className: s.class ? `${s.class.name}-${s.class.section}` : '',
        classId: s.classId,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
      })),
    };
  },
};
