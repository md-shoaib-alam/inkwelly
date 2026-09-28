import { db } from '../../lib/db'
import * as schema from '../../db/schema'
import { eq, and, desc, inArray, count, sum } from 'drizzle-orm'
import { platformResolvers as platformQueries } from '../../modules/platform/platform.resolvers'
import { dashboardResolvers as dashboardQueries } from '../../modules/dashboard/dashboard.resolvers'
import { academicQueries, academicMutations } from '../../modules/academics/academic.resolvers'
import { financeQueries, financeMutations } from '../../modules/finance/finance.resolvers'
import { commonQueries, commonMutations } from '../../modules/support/common.resolvers'
import { authResolvers as authMutations } from '../../modules/auth/auth.resolvers'
import { notificationResolvers } from '../../modules/communication/notification.resolvers'

export const resolvers = {
  JSON: {
    __serialize: (value: unknown) => value,
    __parseValue: (value: unknown) => value,
    __parseLiteral: (ast: any) => {
      try { return JSON.parse(ast.value) } catch { return ast.value }
    },
  },

  Query: {
    ...platformQueries,
    ...dashboardQueries,
    ...academicQueries,
    ...financeQueries,
    ...commonQueries,
    ...notificationResolvers.Query,
  },

  Mutation: {
    ...commonMutations,
    ...academicMutations,
    ...financeMutations,
    ...authMutations,
    ...notificationResolvers.Mutation,
  },

  Tenant: {
    createdAt: (p: any) => p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: (p: any) => p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  },
  User: { createdAt: (p: any) => p.createdAt ? new Date(p.createdAt).toISOString() : null },
  Subscription: { createdAt: (p: any) => p.createdAt ? new Date(p.createdAt).toISOString() : null },
  AuditLog: { createdAt: (p: any) => p.createdAt ? new Date(p.createdAt).toISOString() : null },
  NoticeInfo: { createdAt: (p: any) => p.createdAt ? new Date(p.createdAt).toISOString() : null },
  PlatformNotice: { createdAt: (p: any) => p.createdAt ? new Date(p.createdAt).toISOString() : null },

  ParentChild: {
    grades: async (parent: any, _: any, { loaders }: any) => {
      return loaders.childGrades.load(parent.id);
    },
    attendance: async (parent: any, _: any, { loaders }: any) => {
      return loaders.childAttendance.load(parent.id);
    }
  },

  TenantStudent: {
    class: async (student: any, _: any, { loaders }: any) => {
      if (!student.classId) return null;
      return loaders.classes.load(student.classId);
    },
    parent: async (student: any, _: any, { loaders }: any) => {
      if (!student.parentId) return null;
      return loaders.parents.load(student.parentId);
    },
    className: async (student: any, _: any, { loaders }: any) => {
      if (student.className) return student.className;
      if (!student.classId) return 'Unassigned';
      const c = await loaders.classes.load(student.classId);
      return c ? `${c.name}-${c.section}` : 'Unassigned';
    },
    parentName: async (student: any, _: any, { loaders }: any) => {
      if (student.parentName) return student.parentName;
      if (!student.parentId) return 'Not Linked';
      const p = await loaders.parents.load(student.parentId);
      return p?.user?.name || 'Not Linked';
    },
    name: async (student: any, _: any, { loaders }: any) => {
      if (student.name) return student.name;
      const u = await loaders.users.load(student.userId);
      return u?.name || 'Unknown';
    },
    email: async (student: any, _: any, { loaders }: any) => {
      if (student.email) return student.email;
      const u = await loaders.users.load(student.userId);
      return u?.email || '';
    }
  },

  TenantTeacher: {
    name: async (teacher: any, _: any, { loaders }: any) => {
      if (teacher.name) return teacher.name;
      const u = await loaders.users.load(teacher.userId);
      return u?.name || 'Unknown';
    },
    email: async (teacher: any, _: any, { loaders }: any) => {
      if (teacher.email) return teacher.email;
      const u = await loaders.users.load(teacher.userId);
      return u?.email || '';
    }
  },

  TenantParent: {
    name: async (parent: any, _: any, { loaders }: any) => {
      if (parent.name) return parent.name;
      const u = await loaders.users.load(parent.userId);
      return u?.name || 'Unknown';
    }
  },

  TenantDetail: {
    tenant: async (parent: { tenantId: string }) => {
      const tenantRes = await db.query.tenants.findFirst({ 
        where: eq(schema.tenants.id, parent.tenantId)
      });
      if (!tenantRes) return null;
      
      const [roleCounts, activeSubsRes, classesRes, notices] = await Promise.all([
        db.select({ role: schema.users.role, count: count() })
          .from(schema.users)
          .where(eq(schema.users.tenantId, parent.tenantId))
          .groupBy(schema.users.role),
        db.select({ count: count(), revenue: sum(schema.subscriptions.amount) })
          .from(schema.subscriptions)
          .where(and(eq(schema.subscriptions.tenantId, parent.tenantId), eq(schema.subscriptions.status, 'active'))),
        db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, parent.tenantId)),
        db.select({ id: schema.notices.id }).from(schema.notices).where(eq(schema.notices.tenantId, parent.tenantId))
      ]);
      
      const rCount = (role: string) => roleCounts.find((r: any) => r.role === role)?.count || 0;
      const totalUsers = Number(rCount('student')) + Number(rCount('teacher')) + Number(rCount('parent')) + Number(rCount('admin'));
      
      return {
        ...tenantRes,
        studentCount: Number(rCount('student')),
        teacherCount: Number(rCount('teacher')),
        parentCount: Number(rCount('parent')),
        adminCount: Number(rCount('admin')),
        activeSubscriptions: Number(activeSubsRes[0]?.count || 0),
        totalRevenue: Number(activeSubsRes[0]?.revenue || 0),
        _count: {
          users: totalUsers,
          classes: classesRes.length,
          subscriptions: Number(activeSubsRes[0]?.count || 0),
          notices: notices.length,
          events: 0
        }
      };
    },
    students: async (parent: { tenantId: string }) => {
      const students = await db.query.students.findMany({ 
        where: inArray(
          schema.students.userId,
          db.select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.tenantId, parent.tenantId))
        ), 
        with: { user: { columns: { name: true, email: true, phone: true } }, class: { columns: { name: true, section: true } } }
      });
      return students.map((s: any) => ({ ...s, name: s.user?.name || 'Unknown', email: s.user?.email || '', phone: s.user?.phone, className: s.class ? `${s.class.name}-${s.class.section}` : 'N/A' }));
    },
    teachers: async (parent: { tenantId: string }) => {
      const teachers = await db.query.teachers.findMany({ 
        where: inArray(
          schema.teachers.userId,
          db.select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.tenantId, parent.tenantId))
        ), 
        with: { user: { columns: { name: true, email: true, phone: true, isActive: true } } }
      });
      return teachers.map((t: any) => ({ ...t, name: t.user?.name || 'Unknown', email: t.user?.email || '', phone: t.user?.phone, status: t.user?.isActive ? 'active' : 'inactive' }));
    },
    parents: async (parent: { tenantId: string }) => {
      const parents = await db.query.parents.findMany({ 
        where: inArray(
          schema.parents.userId,
          db.select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.tenantId, parent.tenantId))
        ), 
        with: { user: { columns: { name: true, email: true, phone: true, isActive: true } } }
      });
      return parents.map((p: any) => ({ ...p, name: p.user?.name || 'Unknown', email: p.user?.email || '', phone: p.user?.phone, status: p.user?.isActive ? 'active' : 'inactive' }));
    },
    classes: async (parent: { tenantId: string }) => {
      const classesRes = await db.query.classes.findMany({ 
        where: eq(schema.classes.tenantId, parent.tenantId), 
        with: { students: { columns: { id: true } } }
      });
      return classesRes.map((c: any) => ({ ...c, studentCount: c.students?.length || 0 })).sort((a: any, b: any) => {
        const nameCompare = (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
        if (nameCompare !== 0) return nameCompare;
        return (a.section || '').localeCompare(b.section || '', undefined, { sensitivity: 'base' });
      });
    },
    notices: async (parent: { tenantId: string }) => {
      const notices = await db.query.notices.findMany({ 
        where: eq(schema.notices.tenantId, parent.tenantId), 
        with: { author: { columns: { name: true } } },
        orderBy: [desc(schema.notices.createdAt)], 
        limit: 10 
      });
      return notices.map((n: any) => ({ ...n, authorName: n.author?.name || 'System' }));
    },
    fees: async (parent: { tenantId: string }) => {
      const fees = await db.query.fees.findMany({ 
        where: inArray(
          schema.fees.studentId,
          db.select({ id: schema.students.id })
            .from(schema.students)
            .where(inArray(
              schema.students.userId,
              db.select({ id: schema.users.id })
                .from(schema.users)
                .where(eq(schema.users.tenantId, parent.tenantId))
            ))
        ), 
        with: { student: { with: { user: { columns: { name: true } } } } },
        orderBy: [desc(schema.fees.dueDate)], 
        limit: 20 
      });
      return fees.map((f: any) => ({ ...f, studentName: f.student?.user?.name || 'Unknown' }));
    },
    attendance: async (parent: { tenantId: string }) => {
      const attendance = await db.query.attendance.findMany({ 
        where: inArray(
          schema.attendance.classId,
          db.select({ id: schema.classes.id })
            .from(schema.classes)
            .where(eq(schema.classes.tenantId, parent.tenantId))
        ), 
        with: { student: { with: { user: { columns: { name: true } } } }, class: { columns: { name: true, section: true } } },
        orderBy: [desc(schema.attendance.date)], 
        limit: 50 
      });
      return attendance.map((a: any) => ({ ...a, studentName: a.student?.user?.name || 'Unknown', className: a.class ? `${a.class.name}-${a.class.section}` : 'N/A' }));
    }
  }
}

