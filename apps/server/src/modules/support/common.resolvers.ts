import { db } from '../../lib/db'
import * as schema from '../../db/schema'
import { eq, and, desc, inArray, count, sql, sum, ilike, gte, lte, or, isNull, isNotNull } from 'drizzle-orm'
import { paginate, checkAuth, requireModule, requireSchoolAdmin, requirePlatformModule, scopedTenantId, tenantFromArg } from '../../graphql/resolvers/helpers'
import { dataCache } from '../../lib/cache'
import { createAuditLog } from '../../lib/audit-helper'
import { defaultYearNames } from '../../db/backfill_academic_years'

export const commonQueries = {
  users: async (_: unknown, args: { role?: string; tenantId?: string; search?: string; page?: number; limit?: number }, context: any) => {
    // Outside the try: its catch would flatten a denial into "Failed to fetch users".
    const auth = await requirePlatformModule(context, 'users', 'view')
    try {
      const { role, tenantId, search, page = 1, limit = 20 } = args
      // Undefined here means super_admin with no tenant selected: whole-platform view.
      const tenantFilter = scopedTenantId(auth, tenantId)
      const conditions = []
      if (tenantFilter) conditions.push(eq(schema.users.tenantId, tenantFilter))
      if (role && role !== 'all') conditions.push(eq(schema.users.role, role as any))
      if (search) conditions.push(ilike(schema.users.name, `%${search}%`))

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const [users, totalRes, roleCountsRes] = await Promise.all([
        db.query.users.findMany({
          where,
          columns: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
          with: { tenant: { columns: { id: true, name: true, slug: true } } },
          orderBy: [desc(schema.users.createdAt)],
          offset: (page - 1) * limit,
          limit
        }),
        db.select({ count: count() }).from(schema.users).where(where),
        db.select({ role: schema.users.role, count: count() }).from(schema.users).where(where).groupBy(schema.users.role),
      ])

      const total = Number(totalRes[0]?.count || 0)
      return { 
        users, 
        total, 
        page, 
        totalPages: Math.ceil(total / limit), 
        roleCounts: roleCountsRes.map((r: any) => ({ role: r.role, count: r.count })) 
      }
    } catch (e) { console.error(e); throw new Error('Failed to fetch users') }
  },

  tenants: async (_: unknown, args: { status?: string; plan?: string; search?: string; page?: number; limit?: number }, context: any) => {
    await requirePlatformModule(context, 'tenants', 'view')
    try {
      const { status, plan, search, page = 1, limit = 50 } = args
      const conditions = []
      if (status === 'deleted') {
        conditions.push(isNotNull(schema.tenants.deletedAt))
      } else {
        conditions.push(isNull(schema.tenants.deletedAt))
        if (status && status !== 'all') conditions.push(eq(schema.tenants.status, status))
      }
      if (plan && plan !== 'all') conditions.push(eq(schema.tenants.plan, plan))
      if (search) conditions.push(ilike(schema.tenants.name, `%${search}%`))

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const baseConditions = [];
      if (status === 'deleted') {
        baseConditions.push(isNotNull(schema.tenants.deletedAt));
      } else {
        baseConditions.push(isNull(schema.tenants.deletedAt));
      }

      const [res, statsResult, expiringRes] = await Promise.all([
        paginate(schema.tenants, db.query.tenants, { 
          where, 
          page, 
          limit,
          orderBy: [desc(schema.tenants.createdAt)]
        }),
        db.select({
          status: schema.tenants.status,
          count: count()
        })
        .from(schema.tenants)
        .where(and(...baseConditions))
        .groupBy(schema.tenants.status),
        db.select({
          count: count()
        })
        .from(schema.tenants)
        .where(and(
          ...baseConditions,
          inArray(schema.tenants.status, ['active', 'trial']),
          gte(schema.tenants.endDate, new Date().toISOString().substring(0, 10)),
          lte(schema.tenants.endDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10))
        ))
      ]);

      const stats = {
        total: 0,
        active: 0,
        trial: 0,
        suspended: 0,
        expiring: Number(expiringRes[0]?.count || 0)
      };

      statsResult.forEach(r => {
        const c = Number(r.count);
        stats.total += c;
        if (r.status === 'active') stats.active = c;
        else if (r.status === 'trial') stats.trial = c;
        else if (r.status === 'suspended') stats.suspended = c;
      });

      const ids = res.items.map((t: any) => t.id)
      if (ids.length === 0) return { tenants: [], total: 0, page, totalPages: 0 }

      const [roleCounts, activeSubs, classCounts, noticeCounts, eventCounts, subCounts] = await Promise.all([
        db.select({ tenantId: schema.users.tenantId, role: schema.users.role, count: count() })
          .from(schema.users)
          .where(inArray(schema.users.tenantId, ids))
          .groupBy(schema.users.tenantId, schema.users.role),
        db.select({ 
          tenantId: schema.subscriptions.tenantId, 
          count: count(), 
          revenue: sum(schema.subscriptions.amount) 
        })
          .from(schema.subscriptions)
          .where(and(inArray(schema.subscriptions.tenantId, ids), eq(schema.subscriptions.status, 'active')))
          .groupBy(schema.subscriptions.tenantId),
        db.select({ tenantId: schema.classes.tenantId, count: count() })
          .from(schema.classes)
          .where(inArray(schema.classes.tenantId, ids))
          .groupBy(schema.classes.tenantId),
        db.select({ tenantId: schema.notices.tenantId, count: count() })
          .from(schema.notices)
          .where(inArray(schema.notices.tenantId, ids))
          .groupBy(schema.notices.tenantId),
        db.select({ tenantId: schema.events.tenantId, count: count() })
          .from(schema.events)
          .where(inArray(schema.events.tenantId, ids))
          .groupBy(schema.events.tenantId),
        db.select({ tenantId: schema.subscriptions.tenantId, count: count() })
          .from(schema.subscriptions)
          .where(inArray(schema.subscriptions.tenantId, ids))
          .groupBy(schema.subscriptions.tenantId),
      ])

      const roleMapObj: any = {};
      roleCounts.forEach((c: any) => {
        if (!c.tenantId) return;
        if (!roleMapObj[c.tenantId]) roleMapObj[c.tenantId] = {};
        roleMapObj[c.tenantId][c.role] = c.count;
      });

      const activeMap = new Map(activeSubs.map((s: any) => [s.tenantId, s]));
      const classMap = new Map(classCounts.map((c: any) => [c.tenantId, c.count]));
      const noticeMap = new Map(noticeCounts.map((c: any) => [c.tenantId, c.count]));
      const eventMap = new Map(eventCounts.map((c: any) => [c.tenantId, c.count]));
      const subMap = new Map(subCounts.map((c: any) => [c.tenantId, c.count]));

      return {
        tenants: res.items.map((t: any) => {
          const tRoles = roleMapObj[t.id] || {};
          const tAct = activeMap.get(t.id);
          const totalUsers = (tRoles['student'] || 0) + (tRoles['teacher'] || 0) + (tRoles['parent'] || 0) + (tRoles['admin'] || 0);
          return { 
            ...t, 
            studentCount: tRoles['student'] || 0, 
            teacherCount: tRoles['teacher'] || 0, 
            parentCount: tRoles['parent'] || 0, 
            adminCount: tRoles['admin'] || 0, 
            activeSubscriptions: Number(tAct?.count || 0), 
            totalRevenue: Number(tAct?.revenue || 0),
            _count: {
              users: totalUsers,
              classes: Number(classMap.get(t.id) || 0),
              subscriptions: Number(subMap.get(t.id) || 0),
              notices: Number(noticeMap.get(t.id) || 0),
              events: Number(eventMap.get(t.id) || 0)
            }
          }
        }),
        total: res.total, page: res.page, totalPages: res.totalPages, stats
      }
    } catch (e) { console.error(e); throw new Error('Failed to fetch tenants') }
  },

  auditLogs: async (_: unknown, args: { action?: string; role?: string; tenantId?: string; page?: number; limit?: number }, context: any) => {
    const auth = await requirePlatformModule(context, 'audit-logs', 'view')
    try {
      const { action, role, tenantId, page = 1, limit = 50 } = args
      const tenantFilter = scopedTenantId(auth, tenantId && tenantId !== 'all' ? tenantId : null)

      const conditions = [];
      if (action && action !== 'all') conditions.push(eq(schema.auditLogs.action, action));
      if (tenantFilter) conditions.push(eq(schema.auditLogs.tenantId, tenantFilter));
      if (role && role !== 'all') {
        conditions.push(
          inArray(
            schema.auditLogs.userId,
            db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, role as any))
          )
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      const [logs, totalRes, types] = await Promise.all([
        db.query.auditLogs.findMany({
          where,
          with: { 
            tenant: { columns: { id: true, name: true, slug: true, email: true } },
            user: { columns: { id: true, name: true, email: true } }
          },
          orderBy: [desc(schema.auditLogs.createdAt)],
          offset: (page - 1) * limit,
          limit
        }),
        db.select({ count: count() }).from(schema.auditLogs).where(where),
        db.select({ action: schema.auditLogs.action, count: count() }).from(schema.auditLogs).groupBy(schema.auditLogs.action),
      ])
      
      const total = Number(totalRes[0]?.count || 0)
      return { 
        logs, 
        total, 
        page, 
        totalPages: Math.ceil(total / limit), 
        actionTypes: types.map((a: any) => ({ action: a.action, count: a.count })) 
      }
    } catch (e) { console.error(e); throw new Error('Failed to fetch audit logs') }
  },

  notices: async (_: unknown, args: { tenantId?: string; page?: number; limit?: number }, context: any) => {
    const { user } = checkAuth(context);
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const result = await paginate(schema.notices, db.query.notices, { 
      where: eq(schema.notices.tenantId, tenantId), 
      page: args.page, 
      limit: args.limit, 
      with: { author: { columns: { name: true } } },
      orderBy: [desc(schema.notices.createdAt)]
    });
    
    return { 
      notices: result.items.map((n: any) => ({ ...n, authorName: n.author?.name || 'System' })), 
      total: result.total, 
      page: result.page, 
      totalPages: result.totalPages 
    };
  },

  attendance: async (_: unknown, args: { tenantId?: string; classId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'attendance', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const conditions = [
      inArray(
        schema.attendance.classId,
        db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
      )
    ];
    if (args.classId) conditions.push(eq(schema.attendance.classId, args.classId));
    if (args.startDate) conditions.push(sql`${schema.attendance.date} >= ${args.startDate}`);
    if (args.endDate) conditions.push(sql`${schema.attendance.date} <= ${args.endDate}`);

    const result = await paginate(schema.attendance, db.query.attendance, { 
      where: and(...conditions), 
      page: args.page, 
      limit: args.limit, 
      with: { student: { with: { user: true } }, class: true },
      orderBy: [desc(schema.attendance.date)]
    });

    return { 
      records: result.items.map((a: any) => ({ ...a, studentName: a.student.user.name, className: `${a.class.name}-${a.class.section}` })), 
      total: result.total, 
      page: result.page, 
      totalPages: result.totalPages 
    };
  },

  subscriptions: async (_: unknown, args: { tenantId?: string; status?: string; search?: string; startDate?: string; endDate?: string; page?: number; limit?: number }, context: any) => {
    const { user } = checkAuth(context);
    const tenantId = await tenantFromArg(user, args.tenantId);
    // No school selected means every school, which is the billing grant's data.
    if (user.role === 'super_admin' && !tenantId) await requirePlatformModule(context, 'billing', 'view');
    
    const cacheKey = `graphql:subs:${tenantId || 'all'}:${args.status || 'all'}:${args.search || ''}:${args.startDate || ''}:${args.endDate || ''}:${args.page || 1}:${args.limit || 50}`;
    const cached = await dataCache.get(cacheKey);
    if (cached) return cached;

    const conditions = [];
    if (tenantId) conditions.push(eq(schema.subscriptions.tenantId, tenantId));
    if (args.status && args.status !== 'all') {
      if (args.status === 'none') {
        conditions.push(or(
          eq(schema.subscriptions.status, 'cancelled'),
          eq(schema.subscriptions.status, 'expired')
        )!);
      } else {
        conditions.push(eq(schema.subscriptions.status, args.status));
      }
    }
    if (args.startDate) conditions.push(gte(schema.subscriptions.createdAt, new Date(args.startDate)));
    if (args.endDate) conditions.push(lte(schema.subscriptions.createdAt, new Date(args.endDate)));

    // Only return the latest subscription per parent to avoid duplicate rows for the same parent in super admin
    conditions.push(sql`${schema.subscriptions.id} = (
      SELECT s2.id FROM "Subscription" s2 
      WHERE s2."parentId" = ${schema.subscriptions.parentId} 
      ORDER BY s2."createdAt" DESC 
      LIMIT 1
    )`);

    if (args.search) {
      conditions.push(or(
        ilike(schema.subscriptions.planName, `%${args.search}%`),
        ilike(schema.subscriptions.transactionId, `%${args.search}%`),
        inArray(
          schema.subscriptions.tenantId,
          db.select({ id: schema.tenants.id }).from(schema.tenants).where(ilike(schema.tenants.name, `%${args.search}%`))
        ),
        inArray(
          schema.subscriptions.parentId,
          db.select({ id: schema.parents.id })
            .from(schema.parents)
            .innerJoin(schema.users, eq(schema.parents.userId, schema.users.id))
            .where(or(
              ilike(schema.users.name, `%${args.search}%`),
              ilike(schema.users.email, `%${args.search}%`)
            ))
        )
      )!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [result, statsRes, activeCountRes] = await Promise.all([
      paginate(schema.subscriptions, db.query.subscriptions, {
        where,
        page: args.page,
        limit: args.limit,
        with: {
          tenant: { columns: { id: true, name: true, slug: true } },
          parent: { with: { user: { columns: { name: true, email: true } } } }
        },
        orderBy: [desc(schema.subscriptions.createdAt)]
      }),
      db.select({
        totalRevenue: sum(schema.subscriptions.amount),
        totalCount: count()
      })
      .from(schema.subscriptions)
      .where(tenantId ? eq(schema.subscriptions.tenantId, tenantId) : undefined),
      db.select({ count: count() })
        .from(schema.subscriptions)
        .where(and(
          tenantId ? eq(schema.subscriptions.tenantId, tenantId) : undefined,
          eq(schema.subscriptions.status, 'active')
        )),
    ]);

    const response = {
      subscriptions: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      stats: {
        activeSubscriptions: Number(activeCountRes[0]?.count || 0),
        totalSubscriptions: Number(statsRes[0]?.totalCount || 0),
        totalRevenue: Number(statsRes[0]?.totalRevenue || 0)
      }
    };

    await dataCache.set(cacheKey, response, 300000); // 5 minutes cache
    return response;
  },
}

export const commonMutations = {
  createTenant: async (_: unknown, { data }: { data: any }, context: any) => {
    await requirePlatformModule(context, 'tenants', 'create')
    try {
      const { name, slug } = data;
      if (!name?.trim() || !slug?.trim()) throw new Error('Name and slug required');
      
      const existing = await db.query.tenants.findFirst({ where: eq(schema.tenants.slug, slug.trim()) })
      if (existing) throw new Error('Slug already exists')

      const tenant = await db.transaction(async (tx) => {
        const [row] = await tx.insert(schema.tenants).values({
          ...data,
          name: name.trim(),
          slug: slug.trim(),
          startDate: new Date().toISOString().substring(0, 10),
          updatedAt: new Date()
        }).returning();
        if (!row) throw new Error('Failed to create tenant');
        // A school with no academic year cannot open any screen: the URL
        // requires the session segment, so the year is created with the tenant.
        const year = defaultYearNames();
        await tx.insert(schema.academicYears).values({
          tenantId: row.id,
          name: year.name,
          startDate: year.startDate,
          endDate: year.endDate,
          status: 'active',
          isCurrent: true,
        });
        return row;
      });

      await createAuditLog({ 
        action: 'CREATE_TENANT', 
        resource: 'tenant', 
        userId: context.user?.id || null,
        details: { tenantId: tenant!.id, name: name.trim() },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      })
      return tenant
    } catch (e: any) { throw new Error(e.message || 'Failed to create tenant') }
  },

  updateTenant: async (_: unknown, { id, data }: { id: string, data: any }, context: any) => {
    await requirePlatformModule(context, 'tenants', 'edit')
    try {
      const [tenant] = await db.update(schema.tenants).set(data).where(eq(schema.tenants.id, id)).returning();
      await createAuditLog({ 
        action: 'UPDATE_TENANT', 
        resource: 'tenant', 
        userId: context.user?.id || null,
        details: { tenantId: id, changes: Object.keys(data) },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      })
      return tenant
    } catch (e) { console.error(e); throw new Error('Failed to update tenant') }
  },

  deleteTenant: async (_: unknown, { id }: { id: string }, context: any) => {
    await requirePlatformModule(context, 'tenants', 'delete')
    try {
      await createAuditLog({ 
        action: 'SOFT_DELETE_TENANT', 
        resource: 'tenant', 
        userId: context.user?.id || null,
        details: { tenantId: id, source: 'graphql' },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      })
      
      await db.update(schema.tenants).set({
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(schema.tenants.id, id))

      return true
    } catch (e) { console.error(e); throw new Error('Failed to delete tenant') }
  },

  restoreTenant: async (_: unknown, { id }: { id: string }, context: any) => {
    await requirePlatformModule(context, 'tenants', 'edit')
    try {
      const [tenant] = await db.update(schema.tenants).set({
        status: 'active',
        deletedAt: null,
        updatedAt: new Date()
      }).where(eq(schema.tenants.id, id)).returning()

      if (!tenant) throw new Error('Tenant not found');

      await createAuditLog({ 
        action: 'RESTORE_TENANT', 
        resource: 'tenant', 
        userId: context.user?.id || null,
        details: { tenantId: id },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      })
      return tenant
    } catch (e) { console.error(e); throw new Error('Failed to restore tenant') }
  },

  toggleTenantStatus: async (_: unknown, { id, status }: { id: string; status: string }, context: any) => {
    await requirePlatformModule(context, 'tenants', 'edit')
    try {
      const [tenant] = await db.update(schema.tenants).set({ status }).where(eq(schema.tenants.id, id)).returning();
      await createAuditLog({ 
        action: 'TOGGLE_TENANT_STATUS', 
        resource: 'tenant', 
        userId: context.user?.id || null,
        details: { tenantId: id, newStatus: status },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      })
      return tenant
    } catch (e) { console.error(e); throw new Error('Failed to toggle tenant status') }
  }
}

