import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, count, sql, desc, gte, lte, and, inArray, isNotNull } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { dataCache } from '../../lib/cache';
import { captureError } from '../../lib/monitoring/posthog';
import Elysia from 'elysia';
import { formatDate } from '../../lib/date-utils';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .use(requireAuth)
  .get('/', async ({ user, tenantId, set }) => {
    // Safety net: requireAuth should block this, but guard here in case of
    // Elysia plugin deduplication edge cases when mounted under a parent router.
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    try {
      const cacheKey = `dashboard:${tenantId || 'global'}:${user.role}`;
      const cachedData = await dataCache.get(cacheKey);
      if (cachedData) return cachedData;


      // Handle Super Admin (Platform-wide stats)
      if (user.role === 'super_admin') {
        const [
          totalTenantsRes,
          totalUsersRes,
          globalStudentsRes,
          globalTeachersRes
        ] = await Promise.all([
          db.select({ count: count() }).from(schema.tenants),
          db.select({ count: count() }).from(schema.users),
          db.select({ count: count() }).from(schema.students),
          db.select({ count: count() }).from(schema.teachers),
        ]);

        const totalTenants = totalTenantsRes[0]?.count ?? 0;
        const totalUsers = totalUsersRes[0]?.count ?? 0;
        const globalStudents = globalStudentsRes[0]?.count ?? 0;
        const globalTeachers = globalTeachersRes[0]?.count ?? 0;

        const recentNotices = await db.query.notices.findMany({
          limit: 5,
          orderBy: [desc(schema.notices.createdAt)],
          with: {
            author: { columns: { name: true } },
            tenant: { columns: { name: true } }
          }
        });

        const result = {
          isSuperAdmin: true,
          totalTenants,
          totalUsers,
          totalStudents: globalStudents,
          totalTeachers: globalTeachers,
          totalStaff: 0,
          recentNotices: recentNotices.map((n: any) => ({
            id: n.id, title: n.title,
            authorName: n.author.name,
            tenantName: n.tenant?.name || 'Platform',
            priority: n.priority,
            createdAt: n.createdAt.toISOString()
          })),
          totalRevenue: 0,
        };

        await dataCache.set(cacheKey, result, 3600000);
        return result;
      }

      // Handle Tenant Users
      const activeTenantId = tenantId!;

      // Optimized: Parallelize ALL independent queries to minimize latency
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const startDate = formatDate(sixMonthsAgo);
      
      const today = new Date();
      const todayStr = formatDate(today);
      const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfMonthStr = formatDate(startOfMonthDate);
      const endOfMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const endOfMonthStr = formatDate(endOfMonthDate);

      const [
        totalStudentsRes,
        totalTeachersRes,
        totalClassesRes,
        totalParentsRes,
        paidFeesAmountRes,
        totalAttendanceRes,
        presentAttendanceRes,
        upcomingEventsRes,
        attendanceStats,
        classDistribution,
        recentNoticesRaw,
        feeCollections,
        feeDues,
        revenueStats,
        studentGenderStats,
        totalStaffRes
      ] = await Promise.all([
        db.select({ count: count() }).from(schema.students).innerJoin(schema.users, eq(schema.students.userId, schema.users.id)).where(eq(schema.users.tenantId, activeTenantId)),
        db.select({ count: count() }).from(schema.teachers).innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id)).where(eq(schema.users.tenantId, activeTenantId)),
        db.select({ count: count() }).from(schema.classes).where(eq(schema.classes.tenantId, activeTenantId)),
        db.select({ count: count() }).from(schema.parents).innerJoin(schema.users, eq(schema.parents.userId, schema.users.id)).where(eq(schema.users.tenantId, activeTenantId)),
        db.select({ paidAmount: sql<string | null>`sum(${schema.fees.paidAmount})` }).from(schema.fees).where(and(eq(schema.fees.tenantId, activeTenantId), gte(schema.fees.paidDate, startOfMonthStr), lte(schema.fees.paidDate, endOfMonthStr))),
        db.select({ count: count() }).from(schema.attendance).where(eq(schema.attendance.tenantId, activeTenantId)),
        db.select({ count: count() }).from(schema.attendance).where(and(eq(schema.attendance.tenantId, activeTenantId), eq(schema.attendance.status, 'present'))),
        db.select({ count: count() }).from(schema.events).where(and(eq(schema.events.tenantId, activeTenantId), gte(schema.events.date, todayStr), lte(schema.events.date, endOfMonthStr))),
        db.select({ date: schema.attendance.date, status: schema.attendance.status, count: count() }).from(schema.attendance).where(and(eq(schema.attendance.tenantId, activeTenantId), gte(schema.attendance.date, startDate))).groupBy(schema.attendance.date, schema.attendance.status),
        db.select({ name: schema.classes.name, section: schema.classes.section, studentsCount: count(schema.students.id) }).from(schema.classes).leftJoin(schema.students, eq(schema.classes.id, schema.students.classId)).where(eq(schema.classes.tenantId, activeTenantId)).groupBy(schema.classes.id, schema.classes.name, schema.classes.section),
        db.query.notices.findMany({
          where: eq(schema.notices.tenantId, activeTenantId),
          limit: 5,
          orderBy: [desc(schema.notices.createdAt)],
          with: { author: { columns: { name: true } } }
        }),
        db.select({ type: schema.fees.type, paidAmount: sql<string | null>`sum(${schema.fees.paidAmount})` }).from(schema.fees).where(and(eq(schema.fees.tenantId, activeTenantId), gte(schema.fees.paidDate, startOfMonthStr), lte(schema.fees.paidDate, endOfMonthStr))).groupBy(schema.fees.type),
        db.select({ type: schema.fees.type, amount: sql<string | null>`sum(${schema.fees.amount})`, paidAmount: sql<string | null>`sum(${schema.fees.paidAmount})` }).from(schema.fees).where(and(eq(schema.fees.tenantId, activeTenantId), gte(schema.fees.dueDate, startOfMonthStr), lte(schema.fees.dueDate, endOfMonthStr))).groupBy(schema.fees.type),
        db.select({ paidDate: schema.fees.paidDate, paidAmount: sql<string | null>`sum(${schema.fees.paidAmount})` }).from(schema.fees).where(and(eq(schema.fees.tenantId, activeTenantId), isNotNull(schema.fees.paidDate), gte(schema.fees.paidDate, startDate), lte(schema.fees.paidDate, endOfMonthStr))).groupBy(schema.fees.paidDate),
        db.select({ gender: schema.students.gender, count: count() }).from(schema.students).innerJoin(schema.users, eq(schema.students.userId, schema.users.id)).where(eq(schema.users.tenantId, activeTenantId)).groupBy(schema.students.gender),
        db.select({ count: count() }).from(schema.users).where(and(eq(schema.users.tenantId, activeTenantId), eq(schema.users.role, 'staff')))
      ]);

      const totalStudents = totalStudentsRes[0]?.count ?? 0;
      const totalTeachers = totalTeachersRes[0]?.count ?? 0;
      const totalClasses = totalClassesRes[0]?.count ?? 0;
      const totalParents = totalParentsRes[0]?.count ?? 0;
      const paidFeesAmount = Number(paidFeesAmountRes[0]?.paidAmount ?? 0);
      const totalAttendance = totalAttendanceRes[0]?.count ?? 0;
      const presentAttendance = presentAttendanceRes[0]?.count ?? 0;
      const upcomingEvents = upcomingEventsRes[0]?.count ?? 0;
      const totalStaff = totalStaffRes[0]?.count ?? 0;
      
      const maleStudents = (studentGenderStats as any[]).find((g: any) => g.gender?.toLowerCase() === 'male')?.count ?? 0;
      const femaleStudents = (studentGenderStats as any[]).find((g: any) => g.gender?.toLowerCase() === 'female')?.count ?? 0;

      // ─── Post-processing (In-memory) ───────────────────────
      
      const totalRevenue = paidFeesAmount || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

      const monthlyData: { month: string; rate: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStart = formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
        const mEnd = formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        
        const monthStats = attendanceStats.filter((s: any) => s.date >= mStart && s.date <= mEnd);
        const monthTotal = monthStats.reduce((sum: any, s: any) => sum + s.count, 0);
        const monthPresent = monthStats
          .filter((s: any) => s.status === 'present')
          .reduce((sum: any, s: any) => sum + s.count, 0);
        
        monthlyData.push({
          month: d.toLocaleString('default', { month: 'short' }),
          rate: monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0
        });
      }

      const classData = classDistribution.map((c: any) => ({ name: `${c.name}-${c.section}`, students: c.studentsCount }));

      const defaultTypes = ['tuition', 'exam', 'library', 'transport'];
      const allTypes = Array.from(new Set([
        ...defaultTypes,
        ...feeCollections.map((g: any) => g.type).filter(Boolean),
        ...feeDues.map((g: any) => g.type).filter(Boolean)
      ]));
      const feeByType = allTypes.map(type => {
        const collectedRes = feeCollections.find((g: any) => g.type === type);
        const collected = Number(collectedRes?.paidAmount ?? 0);
        
        const dueRes = feeDues.find((g: any) => g.type === type);
        const totalAmount = Number(dueRes?.amount ?? 0);
        const totalPaid = Number(dueRes?.paidAmount ?? 0);
        const pending = Math.max(0, totalAmount - totalPaid);

        return { type, collected, pending };
      });

      const monthlyRevenue: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStart = formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
        const mEnd = formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        
        const monthStats = revenueStats.filter((s: any) => s.paidDate && s.paidDate >= mStart && s.paidDate <= mEnd);
        const monthTotal = monthStats.reduce((sum: any, s: any) => sum + Number(s.paidAmount || 0), 0);
        
        monthlyRevenue.push({
          month: d.toLocaleString('default', { month: 'short' }),
          amount: monthTotal
        });
      }

      const result = {
        totalStudents, totalTeachers, totalClasses, totalParents,
        totalStaff,
        totalRevenue, attendanceRate,
        upcomingEvents,
        monthlyAttendance: monthlyData,
        monthlyRevenue,
        classDistribution: classData,
        recentNotices: recentNoticesRaw.map((n: any) => ({
          id: n.id, title: n.title, content: n.content,
          authorName: n.author?.name || 'Admin', priority: n.priority,
          createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(), targetRole: n.targetRole
        })),
        feeByType,
        maleStudents,
        femaleStudents,
      };

      // Cache for 1 hour (3,600,000ms)
      await dataCache.set(cacheKey, result, 3600000);

      return result;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/dashboard', tenantId });

      set.status = 500;
      return { error: 'Failed to load dashboard' };
    }
  });
