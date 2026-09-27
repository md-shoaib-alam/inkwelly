import { db } from '../../lib/db'
import * as schema from '../../db/schema'
import { eq, and, desc, count, sql, sum, inArray, or, gte, lte, avg, ilike, isNull } from 'drizzle-orm'
import { paginate, requirePlatformModule, requirePlatformUser } from './helpers'
import { platformMay } from '../../lib/permissions'

export const platformResolvers = {
  platformStats: async (_: any, __: any, context: any) => {
    // The platform landing dashboard is shown to every platform admin, scoped or
    // not, so it asks only for membership. Everything narrower uses a module.
    const { user } = requirePlatformUser(context);
    // The recent-activity strip is audit data, and `audit-logs` is its own grant;
    // the landing page stays open, this slice of it does not.
    const canViewAudit = await platformMay(user, 'audit-logs', 'view');
    try {
      const [
        tenantStatGrouping,
        userStatGrouping,
        classCountRes,
        subStats,
        revenueStatsRes,
        activityLogs,
        planDist,
        activeRevenueResultRes,
        tenants,
        expiringSoonRes
      ] = await Promise.all([
        db.select({ status: schema.tenants.status, count: count() }).from(schema.tenants).groupBy(schema.tenants.status),
        db.select({ role: schema.users.role, count: count() }).from(schema.users).groupBy(schema.users.role),
        db.select({ count: count() }).from(schema.classes),
        db.select({ status: schema.subscriptions.status, count: count() }).from(schema.subscriptions).groupBy(schema.subscriptions.status),
        db.select({ total: sum(schema.subscriptions.amount) }).from(schema.subscriptions),
        canViewAudit ? db.query.auditLogs.findMany({
          limit: 10,
          orderBy: [desc(schema.auditLogs.createdAt)],
          with: { 
            tenant: { columns: { id: true, name: true, slug: true } },
            user: { columns: { name: true, email: true } }
          },
        }) : Promise.resolve([] as (typeof schema.auditLogs.$inferSelect)[]),
        db.select({ plan: schema.tenants.plan, count: count() }).from(schema.tenants).groupBy(schema.tenants.plan),
        db.select({ total: sum(schema.subscriptions.amount) }).from(schema.subscriptions).where(eq(schema.subscriptions.status, 'active')),
        db.query.tenants.findMany({
          orderBy: [desc(schema.tenants.createdAt)],
          limit: 5,
          columns: { id: true, name: true, slug: true, plan: true, status: true },
          with: {
            users: { columns: { id: true } },
            classes: { columns: { id: true } }
          }
        }),
        db.select({ count: count() })
          .from(schema.tenants)
          .where(and(
            isNull(schema.tenants.deletedAt),
            inArray(schema.tenants.status, ['active', 'trial']),
            gte(schema.tenants.endDate, new Date().toISOString().substring(0, 10)),
            lte(schema.tenants.endDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10))
          ))
      ]);

      const tGroup = (status: string) => tenantStatGrouping.find((g: any) => g.status === status)?.count || 0;
      const uGroup = (role: string) => userStatGrouping.find((g: any) => g.role === role)?.count || 0;

      return {
        tenants: {
          total: tenantStatGrouping.reduce((acc: any, curr: any) => acc + (curr.count || 0), 0),
          active: tGroup('active'),
          trial: tGroup('trial'),
          suspended: tGroup('suspended'),
          expiring: Number(expiringSoonRes[0]?.count || 0),
        },
        users: {
          total: userStatGrouping.reduce((acc: any, curr: any) => acc + (curr.count || 0), 0),
          students: uGroup('student'),
          teachers: uGroup('teacher'),
          parents: uGroup('parent'),
          admins: uGroup('admin'),
        },
        classes: Number(classCountRes[0]?.count || 0),
        subscriptions: {
          total: subStats.reduce((acc: any, curr: any) => acc + (curr.count || 0), 0),
          active: subStats.find((g: any) => g.status === 'active')?.count || 0,
        },
        revenue: {
          active: Number(activeRevenueResultRes[0]?.total || 0),
          total: Number(revenueStatsRes[0]?.total || 0),
        },
        planDistribution: planDist.map((p: any) => ({ plan: p.plan, count: p.count })),
        activityLogs,
        monthlyData: [], // Placeholder
        topTenants: await Promise.all(tenants.map(async (t: any) => {
          const revRes = await db.select({ total: sum(schema.subscriptions.amount) })
            .from(schema.subscriptions)
            .where(eq(schema.subscriptions.tenantId, t.id));
          return { 
            ...t, 
            totalRevenue: Number(revRes[0]?.total || 0), 
            studentCount: t.users.length, 
            teacherCount: 0 
          };
        })),
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to fetch platform stats')
    }
  },

  billingData: async (_: any, { type }: { type?: string }, context: any) => {
    await requirePlatformModule(context, 'billing', 'view')
    try {
      const isSchool = type === 'school';
      const isParent = type === 'parent';

      // Core minimal data needed for school list always
      const [tenantList, userGroups] = await Promise.all([
        db.query.tenants.findMany({ 
          columns: { id: true, name: true, slug: true, plan: true, status: true }, 
          limit: 1000 
        }),
        db.select({ tenantId: schema.users.tenantId, count: count() })
          .from(schema.users)
          .groupBy(schema.users.tenantId)
      ]);

      const userCountMap = new Map(userGroups.map((r: any) => [r.tenantId, r.count]));

      // Perform heavy sub queries only if general or specified as parent
      let recentSubscriptions: any[] = [];
      let tenantRevenue: any[] = [];
      let activeSubCounts: any[] = [];
      let planGrouping: any[] = [];
      let methodGrouping: any[] = [];
      let statusGroups: any[] = [];

      if (!isSchool) {
        [
          recentSubscriptions,
          tenantRevenue,
          activeSubCounts,
          planGrouping,
          methodGrouping,
          statusGroups
        ] = await Promise.all([
          db.query.subscriptions.findMany({
            with: {
              parent: { with: { user: { columns: { id: true, name: true, email: true } } } },
              tenant: { columns: { id: true, name: true, slug: true } },
            },
            limit: 20,
            orderBy: [desc(schema.subscriptions.createdAt)],
          }),
          db.select({ tenantId: schema.subscriptions.tenantId, total: sum(schema.subscriptions.amount), count: count() })
            .from(schema.subscriptions)
            .groupBy(schema.subscriptions.tenantId),
          db.select({ tenantId: schema.subscriptions.tenantId, revenue: sum(schema.subscriptions.amount), count: count() })
            .from(schema.subscriptions)
            .where(eq(schema.subscriptions.status, 'active'))
            .groupBy(schema.subscriptions.tenantId),
          db.select({ planName: schema.subscriptions.planName, count: count(), revenue: sum(schema.subscriptions.amount) })
            .from(schema.subscriptions)
            .where(eq(schema.subscriptions.status, 'active'))
            .groupBy(schema.subscriptions.planName),
          db.select({ paymentMethod: schema.subscriptions.paymentMethod, count: count(), revenue: sum(schema.subscriptions.amount) })
            .from(schema.subscriptions)
            .groupBy(schema.subscriptions.paymentMethod),
          db.select({ status: schema.subscriptions.status, count: count() })
            .from(schema.subscriptions)
            .groupBy(schema.subscriptions.status),
        ]);
      }

      const revenueMap = new Map(tenantRevenue.map((r: any) => [r.tenantId, { total: Number(r.total || 0), count: r.count }]));
      const activeMap = new Map(activeSubCounts.map((r: any) => [r.tenantId, { revenue: Number(r.revenue || 0), count: r.count }]));

      const planRevenue: any = {}; planGrouping.forEach((g: any) => planRevenue[g.planName] = { count: g.count, revenue: Number(g.revenue || 0) });
      const methodRevenue: any = {}; methodGrouping.forEach((g: any) => methodRevenue[g.paymentMethod || 'other'] = { count: g.count, revenue: Number(g.revenue || 0) });
      const statusDistribution: any = {}; statusGroups.forEach((g: any) => statusDistribution[g.status] = g.count);

      return {
        subscriptions: recentSubscriptions,
        tenantBilling: tenantList.map((t: any) => {
          const rev = revenueMap.get(t.id) || { total: 0, count: 0 };
          const act = activeMap.get(t.id) || { revenue: 0, count: 0 };
          return { 
            ...t, 
            totalRevenue: rev.total, 
            activeRevenue: act.revenue, 
            activeSubscriptions: act.count, 
            totalSubscriptions: rev.count, 
            _count: { 
              users: Number(userCountMap.get(t.id) || 0), 
              subscriptions: rev.count 
            } 
          };
        }),
        planRevenue,
        methodRevenue,
        monthlyTrend: [], // Placeholder
        statusDistribution,
        totalActiveRevenue: planGrouping.reduce((sum: number, g: any) => sum + Number(g.revenue || 0), 0),
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to fetch billing data')
    }
  }
}

