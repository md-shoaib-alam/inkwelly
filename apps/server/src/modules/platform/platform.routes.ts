import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, or, inArray, sql, count, sum, not, isNotNull, asc } from 'drizzle-orm';
import { requireSuperAdmin } from '../../lib/auth';
import {
  platformMay,
  requirePlatformPermission,
  requireRootPlatformAdmin,
  invalidatePlatformRolePermissions,
  invalidateUserPermissions,
} from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { addJob } from '../../lib/queue';
import { posthog, captureError } from '../../lib/monitoring/posthog';

/** A debug probe that can enqueue an arbitrary job, so it stays with the owner. */
const platformDebugRoutes = new Elysia()
  .use(requireRootPlatformAdmin())
  .post('/test-queue', async ({ body }) => {
    const job = await addJob('GENERAL', 'test-job', { 
      message: 'Hello from BullMQ!',
      timestamp: new Date().toISOString(),
      ...(body as any)
    });
    return { success: true, jobId: job.id };
  });

/**
 * The platform landing dashboard. Every platform admin reaches it — the web
 * sidebar shows it regardless of grants — so the aggregates ask only for
 * membership. The audit trail embedded in it is not an aggregate, so it is
 * withheld unless the caller also holds `audit-logs` view.
 */
const platformLandingRoutes = new Elysia()
  .use(requireSuperAdmin)
  // GET /platform — Platform-wide statistics
  .get('/', async ({ set, user }) => {
    try {
      const cacheKey = 'platform:global_stats';
      const canViewAudit = await platformMay(user, 'audit-logs', 'view');
      if (canViewAudit) {
        const cached = await dataCache.get(cacheKey);
        if (cached) return cached;
      }

      // Step 1: Execute all platform statistics in parallel waves
      const [
        tenantStatGrouping,
        userStatGrouping,
        totalClassesResult,
        subStats,
        revenueStatsResult,
        recentLogs,
        planDistGrouping,
        activeRevenueResult,
        tenantsRaw
      ] = await Promise.all([
        db.select({ status: schema.tenants.status, count: count() }).from(schema.tenants).groupBy(schema.tenants.status),
        db.select({ role: schema.users.role, count: count() }).from(schema.users).groupBy(schema.users.role),
        db.select({ count: count() }).from(schema.classes),
        db.select({ status: schema.subscriptions.status, count: count() }).from(schema.subscriptions).groupBy(schema.subscriptions.status),
        db.select({ total: sum(schema.subscriptions.amount) }).from(schema.subscriptions),
        canViewAudit
          ? db.query.auditLogs.findMany({
              limit: 10,
              orderBy: [desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id)],
              with: { tenant: { columns: { id: true, name: true, slug: true } } },
            })
          : Promise.resolve([] as (typeof schema.auditLogs.$inferSelect)[]),
        db.select({ plan: schema.tenants.plan, count: count() }).from(schema.tenants).groupBy(schema.tenants.plan),
        db.select({ total: sum(schema.subscriptions.amount) }).from(schema.subscriptions).where(eq(schema.subscriptions.status, 'active')),
        db.query.tenants.findMany({
          orderBy: [desc(schema.tenants.createdAt), desc(schema.tenants.id)],
          limit: 5,
        })
      ]);

      // Step 2: Map counts
      const totalTenants = tenantStatGrouping.reduce((acc: number, curr: any) => acc + Number(curr.count || 0), 0);
      const activeTenants = Number(tenantStatGrouping.find((g: any) => g.status === 'active')?.count || 0);
      const trialTenants = Number(tenantStatGrouping.find((g: any) => g.status === 'trial')?.count || 0);
      const suspendedTenants = Number(tenantStatGrouping.find((g: any) => g.status === 'suspended')?.count || 0);

      const totalUsers = userStatGrouping.reduce((acc: number, curr: any) => acc + Number(curr.count || 0), 0);
      const totalStudents = Number(userStatGrouping.find((g: any) => g.role === 'student')?.count || 0);
      const totalTeachers = Number(userStatGrouping.find((g: any) => g.role === 'teacher')?.count || 0);
      const totalParents = Number(userStatGrouping.find((g: any) => g.role === 'parent')?.count || 0);
      const totalAdmins = Number(userStatGrouping.find((g: any) => g.role === 'admin')?.count || 0);

      const totalSubscriptions = subStats.reduce((acc: number, curr: any) => acc + Number(curr.count || 0), 0);
      const activeSubscriptions = Number(subStats.find((g: any) => g.status === 'active')?.count || 0);

      // Step 3: Efficient Top Tenant Revenue (N + 1 fix)
      const topTenantIds = tenantsRaw.map((t: any) => t.id);
      let topTenants = [];
      if (topTenantIds.length > 0) {
        const [topTenantRevStats, topUserCounts, topClassCounts] = await Promise.all([
          db.select({
            tenantId: schema.subscriptions.tenantId,
            total: sum(schema.subscriptions.amount)
          })
          .from(schema.subscriptions)
          .where(and(inArray(schema.subscriptions.tenantId, topTenantIds), eq(schema.subscriptions.status, 'active')))
          .groupBy(schema.subscriptions.tenantId),
          db.select({ tenantId: schema.users.tenantId, count: count() })
            .from(schema.users).where(inArray(schema.users.tenantId, topTenantIds)).groupBy(schema.users.tenantId),
          db.select({ tenantId: schema.classes.tenantId, count: count() })
            .from(schema.classes).where(inArray(schema.classes.tenantId, topTenantIds)).groupBy(schema.classes.tenantId),
        ]);

        const revMap = new Map(topTenantRevStats.map((r: any) => [r.tenantId, Number(r.total || 0)]));
        const userMap = new Map(topUserCounts.map((r: any) => [r.tenantId, Number(r.count)]));
        const classMap = new Map(topClassCounts.map((r: any) => [r.tenantId, Number(r.count)]));
        topTenants = tenantsRaw.map((t: any) => ({
          ...t,
          totalRevenue: revMap.get(t.id) || 0,
          studentCount: userMap.get(t.id) || 0,
          _count: { users: userMap.get(t.id) || 0, classes: classMap.get(t.id) || 0 }
        })).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
      }

      // Step 4: Monthly Data (Simulation)
      const monthlyData = [5, 4, 3, 2, 1, 0].map(i => {
        const date = new Date(); date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          newTenants: Math.floor(Math.random() * 5) + 1,
          newUsers: Math.floor(Math.random() * 50) + 20,
          revenue: Math.floor(Math.random() * 50000) + 20000,
        };
      });

      const result = {
        tenants: { total: totalTenants, active: activeTenants, trial: trialTenants, suspended: suspendedTenants },
        users: { total: totalUsers, students: totalStudents, teachers: totalTeachers, parents: totalParents, admins: totalAdmins },
        classes: Number(totalClassesResult[0]?.count || 0),
        subscriptions: { total: totalSubscriptions, active: activeSubscriptions },
        revenue: { active: Number(activeRevenueResult[0]?.total || 0), total: Number(revenueStatsResult[0]?.total || 0) },
        planDistribution: planDistGrouping.map((p: any) => ({ plan: p.plan, count: Number(p.count || 0) })),
        recentLogs, monthlyData, topTenants,
      };

      // Only the audit-inclusive shape may be cached, or it would be served back
      // to an admin who is not entitled to it.
      if (canViewAudit) await dataCache.set(cacheKey, result, 300000); // 5 minutes
      return result;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/platform' });
      console.error('Platform Stats Error:', error);
      set.status = 500;
      return { error: 'Failed to fetch platform stats' };
    }
  });

/** Platform-wide reads, each narrowed by the module the web sidebar gates it under. */
const platformAuditRoutes = new Elysia()
  .use(requirePlatformPermission('audit-logs'))
  // GET /platform/audit-logs
  .get('/audit-logs', async ({ query, set }) => {
    try {
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '50');
      const conditions = [];
      if (query.action) conditions.push(eq(schema.auditLogs.action, query.action as string));

      const [logs, totalResult] = await Promise.all([
        db.query.auditLogs.findMany({ 
          where: and(...conditions), 
          with: { tenant: { columns: { id: true, name: true } } }, 
          orderBy: [desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id)], 
          offset: (page - 1) * limit, 
          limit 
        }),
        db.select({ count: count() }).from(schema.auditLogs).where(and(...conditions)),
      ]);
      const actionTypes = await db.select({ action: schema.auditLogs.action, count: count() }).from(schema.auditLogs).groupBy(schema.auditLogs.action);

      return { logs, total: Number(totalResult[0]?.count || 0), page, totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit), actionTypes: actionTypes.map((a: any) => ({ action: a.action, count: Number(a.count || 0) })) };
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to fetch audit logs' };
    }
  });

const platformBillingRoutes = new Elysia()
  .use(requirePlatformPermission('billing'))
  // GET /platform/billing
  .get('/billing', async ({ query, set }) => {
    try {
      const subPage = parseInt(query.subPage || '1');
      const tenantPage = parseInt(query.tenantPage || '1');
      const limit = parseInt(query.limit || '50');

      const [
        recentSubscriptions,
        totalSubsResult,
        tenantRevenue,
        activeSubCounts,
        tenantList,
        userCountsByTenant,
        classCountsByTenant,
        totalTenantsResult,
        planGrouping,
        methodGrouping,
        statusGrouping
      ] = await Promise.all([
        db.query.subscriptions.findMany({
          with: {
            parent: { with: { user: { columns: { name: true, email: true } } } },
            tenant: { columns: { name: true, slug: true } },
          },
          offset: (subPage - 1) * limit,
          limit,
          orderBy: [desc(schema.subscriptions.createdAt), desc(schema.subscriptions.id)],
        }),
        db.select({ count: count() }).from(schema.subscriptions),
        db.select({
          tenantId: schema.subscriptions.tenantId,
          total: sum(schema.subscriptions.amount),
          count: count(schema.subscriptions.id)
        })
        .from(schema.subscriptions)
        .groupBy(schema.subscriptions.tenantId),
        db.select({
          tenantId: schema.subscriptions.tenantId,
          total: sum(schema.subscriptions.amount),
          count: count(schema.subscriptions.id)
        })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.status, 'active'))
        .groupBy(schema.subscriptions.tenantId),
        db.query.tenants.findMany({
          offset: (tenantPage - 1) * limit,
          limit,
        }),
        db.select({ tenantId: schema.users.tenantId, count: count() })
          .from(schema.users).groupBy(schema.users.tenantId),
        db.select({ tenantId: schema.classes.tenantId, count: count() })
          .from(schema.classes).groupBy(schema.classes.tenantId),
        db.select({ count: count() }).from(schema.tenants),
        db.select({
          planName: schema.subscriptions.planName,
          count: count(schema.subscriptions.id),
          total: sum(schema.subscriptions.amount)
        })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.status, 'active'))
        .groupBy(schema.subscriptions.planName),
        db.select({
          paymentMethod: schema.subscriptions.paymentMethod,
          count: count(schema.subscriptions.id),
          total: sum(schema.subscriptions.amount)
        })
        .from(schema.subscriptions)
        .groupBy(schema.subscriptions.paymentMethod),
        db.select({ status: schema.subscriptions.status, count: count() }).from(schema.subscriptions).groupBy(schema.subscriptions.status)
      ]);

      const revMap = new Map<string, any>(tenantRevenue.map((r: any) => [r.tenantId, { total: Number(r.total || 0), count: Number(r.count || 0) }]));
      const activeMap = new Map<string, any>(activeSubCounts.map((r: any) => [r.tenantId, { revenue: Number(r.total || 0), count: Number(r.count || 0) }]));
      const userCountMap = new Map<string, number>(userCountsByTenant.map((r: any) => [r.tenantId, Number(r.count)]));
      const classCountMap = new Map<string, number>(classCountsByTenant.map((r: any) => [r.tenantId, Number(r.count)]));

      const tenantBilling = tenantList.map((t: any) => {
        const rev = revMap.get(t.id) || { total: 0, count: 0 };
        const active = activeMap.get(t.id) || { revenue: 0, count: 0 };
        return {
          ...t,
          _count: { users: userCountMap.get(t.id) || 0, classes: classCountMap.get(t.id) || 0 },
          totalRevenue: rev.total,
          activeRevenue: active.revenue,
          activeSubscriptions: active.count,
          totalSubscriptions: rev.count,
        };
      });

      const planRevenue: Record<string, { count: number; revenue: number }> = {};
      planGrouping.forEach((g: any) => {
        planRevenue[g.planName] = { count: Number(g.count || 0), revenue: Number(g.total || 0) };
      });

      const methodRevenue: Record<string, { count: number; revenue: number }> = {};
      methodGrouping.forEach((g: any) => {
        methodRevenue[g.paymentMethod] = { count: Number(g.count || 0), revenue: Number(g.total || 0) };
      });

      const statusDistribution: Record<string, number> = {};
      statusGrouping.forEach((g: any) => {
        statusDistribution[g.status] = Number(g.count || 0);
      });

      const monthlyTrend = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(i => {
        const date = new Date(); date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          revenue: Math.floor(Math.random() * 50000) + 20000,
          newSubscriptions: Math.floor(Math.random() * 10),
          churned: Math.floor(Math.random() * 2),
        };
      });

      const totalSubs = Number(totalSubsResult[0]?.count || 0);
      const totalTenants = Number(totalTenantsResult[0]?.count || 0);

      return {
        subscriptions: {
          data: recentSubscriptions,
          total: totalSubs,
          page: subPage,
          totalPages: Math.ceil(totalSubs / limit)
        },
        tenantBilling: {
          data: tenantBilling,
          total: totalTenants,
          page: tenantPage,
          totalPages: Math.ceil(totalTenants / limit)
        },
        planRevenue,
        methodRevenue,
        monthlyTrend,
        statusDistribution,
        totalActiveRevenue: planGrouping.reduce((sum: any, g: any) => sum + Number(g.total || 0), 0)
      };
    } catch (error) {
      console.error('Billing Data Error:', error);
      set.status = 500;
      return { error: 'Failed to fetch billing data' };
    }
  });

const platformUserRoutes = new Elysia()
  .use(requirePlatformPermission('users'))
  // GET /platform/users
  .get('/users', async ({ query, set }) => {
    try {
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '50');
      const conditions = [];
      if (query.role && query.role !== 'all') conditions.push(eq(schema.users.role, query.role as string));
      if (query.tenantId) conditions.push(eq(schema.users.tenantId, query.tenantId as string));
      if (query.search) conditions.push(sql`${schema.users.name} ILIKE ${`%${query.search}%`}`);

      const [users, totalResult] = await Promise.all([
        db.query.users.findMany({ 
          where: and(...conditions), 
          with: { tenant: { columns: { id: true, name: true, slug: true } } }, 
          orderBy: [desc(schema.users.createdAt), desc(schema.users.id)], 
          offset: (page - 1) * limit, 
          limit 
        }),
        db.select({ count: count() }).from(schema.users).where(and(...conditions)),
      ]);
      const roleCounts = await db.select({ role: schema.users.role, count: count() }).from(schema.users).groupBy(schema.users.role);

      return { users, total: Number(totalResult[0]?.count || 0), page, totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit), roleCounts: roleCounts.map((r: any) => ({ role: r.role, count: Number(r.count || 0) })) };
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to fetch users' };
    }
  });

/**
 * Platform-role administration is root-only: a scoped platform admin who could
 * edit grants or hand out roles could widen themselves from below.
 */
const platformRoleRoutes = new Elysia()
  .use(requireRootPlatformAdmin())
  // Platform roles CRUD
  .get('/roles', async ({ set }) => {
    try {
      const [roles, roleUserCounts] = await Promise.all([
        db.query.platformRoles.findMany({
          orderBy: [desc(schema.platformRoles.createdAt)],
        }),
        db.select({ roleId: schema.users.platformRoleId, count: count() })
          .from(schema.users)
          .where(isNotNull(schema.users.platformRoleId))
          .groupBy(schema.users.platformRoleId),
      ]);
      const roleCountMap = new Map(roleUserCounts.map((r: any) => [r.roleId, Number(r.count)]));
      return roles.map(r => ({ ...r, _count: { users: roleCountMap.get(r.id) || 0 } }));
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to fetch platform roles' };
    }
  })
  .post('/roles', async ({ body, set }) => {
    try {
      const b = body as any;
      if (!b.name || typeof b.name !== 'string' || b.name.trim().length === 0) { set.status = 400; return { error: 'Role name is required' }; }
      const existing = await db.query.platformRoles.findFirst({ where: eq(schema.platformRoles.name, b.name.trim()) });
      if (existing) { set.status = 409; return { error: 'A role with this name already exists' }; }

      const [role] = await db.insert(schema.platformRoles).values({ 
        name: b.name.trim(), 
        description: b.description?.trim() || null, 
        color: b.color || '#e11d48', 
        permissions: JSON.stringify(b.permissions || {}) 
      }).returning();
      set.status = 201;
      return role;
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to create platform role' };
    }
  })
  .put('/roles/:id', async ({ params, body, set }) => {
    try {
      const id = params.id;
      const b = body as any;
      const existing = await db.query.platformRoles.findFirst({ where: eq(schema.platformRoles.id, id) });
      if (!existing) { set.status = 404; return { error: 'Role not found' }; }

      if (b.name && b.name.trim() !== existing.name) {
        const dup = await db.query.platformRoles.findFirst({ where: and(eq(schema.platformRoles.name, b.name.trim()), not(eq(schema.platformRoles.id, id))) });
        if (dup) { set.status = 409; return { error: 'A role with this name already exists' }; }
      }

      const updateData: any = {};
      if (b.name) updateData.name = b.name.trim();
      if (b.description !== undefined) updateData.description = b.description?.trim() || null;
      if (b.color) updateData.color = b.color;
      if (b.permissions) updateData.permissions = JSON.stringify(b.permissions);

      const [role] = await db.update(schema.platformRoles).set(updateData).where(eq(schema.platformRoles.id, id)).returning();
      if (updateData.permissions) await invalidatePlatformRolePermissions(id);
      return role;
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to update platform role' };
    }
  })
  .delete('/roles/:id', async ({ params, set }) => {
    try {
      const id = params.id;
      if (!id) { set.status = 400; return { error: 'Role ID is required' }; }
      const existing = await db.query.platformRoles.findFirst({ where: eq(schema.platformRoles.id, id) });
      if (!existing) { set.status = 404; return { error: 'Role not found' }; }
      
      const userCountResult = await db.select({ count: count() }).from(schema.users).where(eq(schema.users.platformRoleId, id));
      const userCount = Number(userCountResult[0]?.count || 0);
      if (userCount > 0) { set.status = 400; return { error: `Cannot delete role: ${userCount} user(s) are assigned.` }; }

      await db.delete(schema.platformRoles).where(eq(schema.platformRoles.id, id));
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to delete platform role' };
    }
  })
  // Platform role users (Nested Sub-Resource)
  .get('/roles/:id/users', async ({ params, set }) => {
    try {
      const roleId = params.id;
      const users = await db.query.users.findMany({ 
        where: and(eq(schema.users.role, 'super_admin'), eq(schema.users.platformRoleId, roleId)), 
        columns: { id: true, name: true, email: true, avatar: true, isActive: true, createdAt: true }, 
        orderBy: [asc(schema.users.name)] 
      });
      return users;
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to fetch users' };
    }
  })
  .patch('/roles/:id/users', async ({ params, body, set }) => {
    try {
      const roleId = params.id;
      const b = body as any;
      if (!b.userId || !b.action) { set.status = 400; return { error: 'userId and action are required' }; }
      if (b.action !== 'assign' && b.action !== 'unassign') { set.status = 400; return { error: 'action must be "assign" or "unassign"' }; }

      const user = await db.query.users.findFirst({ where: eq(schema.users.id, b.userId) });
      if (!user || user.role !== 'super_admin') { set.status = 404; return { error: 'Super admin user not found' }; }

      if (b.action === 'assign') {
        const role = await db.query.platformRoles.findFirst({ where: eq(schema.platformRoles.id, roleId) });
        if (!role) { set.status = 404; return { error: 'Platform role not found' }; }
        await db.update(schema.users).set({ platformRoleId: roleId }).where(eq(schema.users.id, b.userId));
        await invalidateUserPermissions([b.userId]);

        posthog.capture({
          distinctId: 'super_admin',
          event: 'platform_role_updated',
          properties: { userId: b.userId, roleId, action: 'assign' }
        });

        return { success: true, message: `Role "${role.name}" assigned to ${user.name}` };
      } else {
        await db.update(schema.users).set({ platformRoleId: null }).where(eq(schema.users.id, b.userId));
        await invalidateUserPermissions([b.userId]);

        posthog.capture({
          distinctId: 'super_admin',
          event: 'platform_role_updated',
          properties: { userId: b.userId, action: 'unassign' }
        });

        return { success: true, message: `Role unassigned from ${user.name}` };
      }
    } catch (error) {
      captureError(error, { method: 'PATCH', path: '/platform/roles/:id/users' });
      set.status = 500;
      return { error: 'Failed to update role assignment' };
    }
  })
  .get('/roles/:id/available-users', async ({ params, set }) => {
    try {
      const roleId = params.id;
      const conditions = [eq(schema.users.role, 'super_admin'), not(eq(schema.users.platformRoleId, roleId))];

      const users = await db.query.users.findMany({
        where: and(...conditions),
        columns: { id: true, name: true, email: true, avatar: true, isActive: true, platformRoleId: true },
        orderBy: [asc(schema.users.name)],
      });
      return users;
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to fetch available users' };
    }
  });

export const platformRoutes = new Elysia({ prefix: '/platform' })
  .use(requireSuperAdmin)
  .use(platformDebugRoutes)
  .use(platformLandingRoutes)
  .use(platformAuditRoutes)
  .use(platformBillingRoutes)
  .use(platformUserRoutes)
  .use(platformRoleRoutes);

