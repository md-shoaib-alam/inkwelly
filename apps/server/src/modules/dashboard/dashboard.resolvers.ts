import { db } from '../../lib/db'
import * as schema from '../../db/schema'
import { eq, and, desc, count, sql, sum, inArray, or, gte, lte, avg, ilike } from 'drizzle-orm'
import { checkAuth, resolveScopedTenantId, tenantFromArg } from '../../graphql/resolvers/helpers'
import { formatDate } from '../../lib/date-utils'

export const dashboardResolvers = {
  adminDashboard: async (_: unknown, args: { tenantId?: string }, context: any) => {
    // Outside the try: its catch returns null, which would report a refusal as
    // an empty dashboard.
    const { user, tenantId: authTid } = checkAuth(context);
    const tenantId = await tenantFromArg(user, args.tenantId) ?? authTid;
    try {
      if (!tenantId) return null;
      
      const [userStats, classCountRes] = await Promise.all([
        db.select({ role: schema.users.role, count: count() })
          .from(schema.users)
          .where(and(eq(schema.users.tenantId, tenantId), inArray(schema.users.role, ['student', 'teacher', 'parent']), eq(schema.users.isActive, true)))
          .groupBy(schema.users.role),
        db.select({ count: count() }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
      ]);

      const counts = userStats.reduce((acc: any, curr: any) => {
        acc[curr.role] = curr.count;
        return acc;
      }, { student: 0, teacher: 0, parent: 0 });

      return { 
        totalStudents: counts.student, 
        totalTeachers: counts.teacher, 
        totalClasses: Number(classCountRes[0]?.count || 0), 
        totalParents: counts.parent, 
        totalRevenue: 0, 
        pendingFees: 0, 
        attendanceRate: 0, 
        upcomingEvents: 0, 
        monthlyAttendance: [], 
        classDistribution: [], 
        gradeDistribution: [], 
        recentNotices: [], 
        feeByType: [] 
      };
    } catch (e) { console.error(e); return null; }
  },

  dashboardSummary: async (_: unknown, { tenantId: rawId }: { tenantId: string }, context: any) => {
    // Outside the try: its catch would report a refusal as an empty school.
    const tenantId = await resolveScopedTenantId(context, rawId);
    try {
      
      const thirtyDaysAgo = new Date(); 
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDate = formatDate(thirtyDaysAgo);

      const [userStats, eventsRes, attendanceStatsRes, classCountRes] = await Promise.all([
        db.select({ role: schema.users.role, count: count() })
          .from(schema.users)
          .where(and(eq(schema.users.tenantId, tenantId), inArray(schema.users.role, ['student', 'teacher', 'parent']), eq(schema.users.isActive, true)))
          .groupBy(schema.users.role),
        db.select({ count: count() })
          .from(schema.events)
          .where(and(eq(schema.events.tenantId, tenantId), gte(schema.events.date, formatDate()))),
        db.select({ 
          total: count(),
          present: sql<number>`coalesce(sum(case when ${schema.attendance.status} = 'present' then 1 else 0 end), 0)`
        })
          .from(schema.attendance)
          .where(and(
            inArray(
              schema.attendance.classId,
              db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
            ),
            gte(schema.attendance.date, recentDate)
          )),
        db.select({ count: count() }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
      ]);

      const counts = userStats.reduce((acc: any, curr: any) => {
        acc[curr.role] = curr.count;
        return acc;
      }, { student: 0, teacher: 0, parent: 0 });

      const totalAttendance = Number(attendanceStatsRes[0]?.total || 0);
      const presentCount = Number(attendanceStatsRes[0]?.present || 0);

      return {
        totalStudents: counts.student,
        totalTeachers: counts.teacher,
        totalClasses: Number(classCountRes[0]?.count || 0),
        totalParents: counts.parent,
        upcomingEvents: Number(eventsRes[0]?.count || 0),
        attendanceRate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0
      }
    } catch (e) { console.error(e); return { totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalParents: 0, upcomingEvents: 0, attendanceRate: 0 } }
  },

  dashboardAttendance: async (_: unknown, { tenantId: rawId }: { tenantId: string }, context: any) => {
    // Outside the try: its catch would report a refusal as an empty school.
    const tenantId = await resolveScopedTenantId(context, rawId);
    try {
      const ranges = Array.from({ length: 6 }, (_, idx) => {
        const i = 5 - idx; const s = new Date(); s.setMonth(s.getMonth() - i - 1); s.setDate(1); const e = new Date(); e.setMonth(e.getMonth() - i); e.setDate(0);
        return { label: s.toLocaleString('default', { month: 'short' }), start: formatDate(s), end: formatDate(e) }
      })
      
      const stats = await db.select({ date: schema.attendance.date, status: schema.attendance.status, count: count() })
        .from(schema.attendance)
        .where(and(
          inArray(
            schema.attendance.classId,
            db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
          ),
          gte(schema.attendance.date, ranges[0]!.start)
        ))
        .groupBy(schema.attendance.date, schema.attendance.status);

      return ranges.map(r => {
        let present = 0;
        let absent = 0;
        for (const s of stats) {
          if (s.date >= r.start && s.date <= r.end) {
            if (s.status === 'present') present += Number(s.count);
            if (s.status === 'absent') absent += Number(s.count);
          }
        }
        const total = present + absent;
        return { 
          month: r.label, 
          present, 
          absent,
          rate: total > 0 ? Math.round((present / total) * 10000) / 100 : 0 
        };
      })
    } catch (e) { console.error(e); return [] }
  },

  dashboardAcademic: async (_: unknown, { tenantId: rawId }: { tenantId: string }, context: any) => {
    // Outside the try: its catch would report a refusal as an empty school.
    const tenantId = await resolveScopedTenantId(context, rawId);
    try {
      const [classes, studentCounts, grades] = await Promise.all([
        db.select({ id: schema.classes.id, name: schema.classes.name, section: schema.classes.section })
          .from(schema.classes)
          .where(eq(schema.classes.tenantId, tenantId)),
        db.select({ classId: schema.students.classId, count: count() })
          .from(schema.students)
          .innerJoin(schema.classes, eq(schema.classes.id, schema.students.classId))
          .where(eq(schema.classes.tenantId, tenantId))
          .groupBy(schema.students.classId),
        db.select({ grade: schema.grades.grade, count: count() })
          .from(schema.grades)
          .where(and(
            inArray(
              schema.grades.studentId,
              db.select({ id: schema.students.id })
                .from(schema.students)
                .innerJoin(schema.users, eq(schema.users.id, schema.students.userId))
                .where(eq(schema.users.tenantId, tenantId))
            ),
            sql`${schema.grades.grade} is not null`
          ))
          .groupBy(schema.grades.grade)
      ]);
      const sortedClasses = [...classes].sort((a: any, b: any) => {
        const nameCompare = (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
        if (nameCompare !== 0) return nameCompare;
        return (a.section || '').localeCompare(b.section || '', undefined, { sensitivity: 'base' });
      });
      const studentCountByClass = new Map(studentCounts.map((s: any) => [s.classId, Number(s.count)]));
      return { 
        classDistribution: sortedClasses.map(c => ({ name: `${c.name}-${c.section}`, students: studentCountByClass.get(c.id) || 0 })), 
        gradeDistribution: grades.map(g => ({ grade: g.grade!, count: g.count })) 
      }
    } catch (e) { console.error(e); return { classDistribution: [], gradeDistribution: [] } }
  },

  dashboardFinancial: async (_: unknown, { tenantId: rawId }: { tenantId: string }, context: any) => {
    // Outside the try: its catch would report a refusal as an empty school.
    const tenantId = await resolveScopedTenantId(context, rawId);
    try {
      
      const feeWhere = inArray(
        schema.fees.studentId,
        db.select({ id: schema.students.id })
          .from(schema.students)
          .innerJoin(schema.users, eq(schema.users.id, schema.students.userId))
          .where(eq(schema.users.tenantId, tenantId))
      );

      const [aggRes, byType] = await Promise.all([
        db.select({ amount: sum(schema.fees.amount), paidAmount: sum(schema.fees.paidAmount) })
          .from(schema.fees)
          .where(feeWhere),
        db.select({ type: schema.fees.type, amount: sum(schema.fees.amount), paidAmount: sum(schema.fees.paidAmount) })
          .from(schema.fees)
          .where(feeWhere)
          .groupBy(schema.fees.type)
      ])

      const agg = aggRes[0];
      return { 
        totalRevenue: Number(agg?.paidAmount || 0), 
        pendingFees: Math.max(0, Number(agg?.amount || 0) - Number(agg?.paidAmount || 0)), 
        feeByType: byType.map(f => ({ 
          type: f.type, 
          collected: Number(f.paidAmount || 0), 
          pending: Math.max(0, Number(f.amount || 0) - Number(f.paidAmount || 0)) 
        })) 
      }
    } catch (e) { console.error(e); return { totalRevenue: 0, pendingFees: 0, feeByType: [] } }
  },

  dashboardNotices: async (_: unknown, { tenantId: rawId }: { tenantId: string }, context: any) => {
    // Outside the try: its catch would report a refusal as an empty school.
    const tenantId = await resolveScopedTenantId(context, rawId);
    try {
      const data = await db.query.notices.findMany({ 
        where: eq(schema.notices.tenantId, tenantId), 
        orderBy: [desc(schema.notices.createdAt)], 
        limit: 5, 
        with: { author: { columns: { name: true } } } 
      })
      return data.map(n => ({ 
        id: n.id, 
        title: n.title, 
        content: n.content, 
        authorName: n.author?.name || 'System', 
        priority: n.priority, 
        createdAt: n.createdAt.toISOString(), 
        targetRole: n.targetRole 
      }))
    } catch (e) { console.error(e); return [] }
  },

  teacherDashboard: async (_: unknown, { teacherName }: { teacherName?: string }, context: any) => {
    try {
      let name = teacherName || context?.session?.user?.name;
      if (!name) throw new Error('Name required');
      
      const user = await db.query.users.findFirst({ 
        where: and(eq(schema.users.name, name), eq(schema.users.role, 'teacher')), 
        with: { teacher: true } 
      });
      if (!user?.teacher) throw new Error('Teacher not found');
      const tId = user.teacher.id;
      const today = new Date().toLocaleString('default', { weekday: 'long' }).toLowerCase();
      const todayDate = formatDate();

      const [cts, subs, asgs, sched, pendRes, selfAtt] = await Promise.all([
        db.query.classTeachers.findMany({ 
          where: eq(schema.classTeachers.teacherId, tId), 
          with: { class: true } 
        }),
        db.query.subjects.findMany({ 
          where: eq(schema.subjects.teacherId, tId), 
          with: { class: true } 
        }),
        db.query.assignments.findMany({ 
          where: and(eq(schema.assignments.teacherId, tId), eq(schema.assignments.status, 'active')), 
          with: { subject: true, class: true }, 
          orderBy: [desc(schema.assignments.createdAt)], 
          limit: 5 
        }),
        db.query.timetables.findMany({ 
          where: and(eq(schema.timetables.teacherId, tId), eq(schema.timetables.day, today)), 
          with: { subject: true, class: true }, 
          orderBy: [schema.timetables.startTime] 
        }),
        db.select({ count: count() }).from(schema.assignments).where(and(eq(schema.assignments.teacherId, tId), eq(schema.assignments.status, 'active'))),
        // The teacher's own staff-attendance row, so the dashboard can say
        // "Present"/"Not marked" instead of a student attendance percentage.
        db.query.staffAttendance.findFirst({
          where: and(
            eq(schema.staffAttendance.userId, user.id),
            eq(schema.staffAttendance.date, todayDate)
          ),
          columns: { status: true, checkIn: true, checkOut: true }
        }),
      ]);

      // Counts come from GROUP BY aggregates; pulling every student row just to read
      // .length scales with enrolment and buys nothing.
      const countedClassIds = [...new Set([
        ...cts.map((ct: any) => ct.class.id),
        ...asgs.map((a: any) => a.class.id),
      ])];
      const [studentCounts, submissionCounts] = await Promise.all([
        countedClassIds.length > 0
          ? db.select({ classId: schema.students.classId, n: count() }).from(schema.students)
              .where(inArray(schema.students.classId, countedClassIds))
              .groupBy(schema.students.classId)
          : Promise.resolve([] as { classId: string; n: number }[]),
        asgs.length > 0
          ? db.select({ assignmentId: schema.submissions.assignmentId, n: count() }).from(schema.submissions)
              .where(inArray(schema.submissions.assignmentId, asgs.map((a: any) => a.id)))
              .groupBy(schema.submissions.assignmentId)
          : Promise.resolve([] as { assignmentId: string; n: number }[]),
      ]);
      const studentsByClass = new Map(studentCounts.map((r: any) => [r.classId, Number(r.n)]));
      const submissionsByAssignment = new Map(submissionCounts.map((r: any) => [r.assignmentId, Number(r.n)]));

      const classIds = cts.map((ct: any) => ct.class.id);
      const attendanceStats = classIds.length > 0 ? await db.select({
        total: count(),
        present: sql<number>`coalesce(sum(case when ${schema.attendance.status} = 'present' then 1 else 0 end), 0)`
      })
        .from(schema.attendance)
        .where(and(
          inArray(schema.attendance.classId, classIds),
          eq(schema.attendance.date, todayDate)
        )) : [{ total: 0, present: 0 }];

      return {
        teacherId: tId,
        classes: cts.map((ct: any) => ({ id: ct.class.id, name: ct.class.name, section: ct.class.section, studentCount: studentsByClass.get(ct.class.id) ?? 0 })),
        subjects: subs.map((s: any) => ({ id: s.id, name: s.name, code: s.code, className: `${s.class.name}-${s.class.section}` })),
        totalStudents: cts.reduce((sum: number, c: any) => sum + (studentsByClass.get(c.class.id) ?? 0), 0),
        pendingAssignments: Number(pendRes[0]?.count || 0),
        todaySchedule: sched.map((t: any) => ({ id: t.id, day: t.day, startTime: t.startTime, endTime: t.endTime, subjectName: t.subject.name, className: `${t.class.name}-${t.class.section}` })),
        todayAttendance: { present: Number(attendanceStats[0]?.present || 0), total: Number(attendanceStats[0]?.total || 0) },
        todaySelfAttendance: {
          status: selfAtt?.status ?? 'not_marked',
          checkIn: selfAtt?.checkIn ?? null,
          checkOut: selfAtt?.checkOut ?? null,
        },
        recentAssignments: asgs.map((a: any) => ({ 
          id: a.id, 
          title: a.title, 
          subjectName: a.subject.name, 
          className: `${a.class.name}-${a.class.section}`, 
          dueDate: a.dueDate, 
          submissions: submissionsByAssignment.get(a.id) ?? 0, 
          totalStudents: studentsByClass.get(a.class.id) ?? 0,
          mode: a.mode
        })),
      }
    } catch (e) { console.error(e); throw new Error('Failed to fetch teacher dashboard') }
  },

  studentDashboard: async (_: unknown, { studentEmail }: { studentEmail?: string }, context: any) => {
    try {
      const email = studentEmail || context?.session?.user?.email;
      const user = await db.query.users.findFirst({ 
        where: and(eq(schema.users.email, email), eq(schema.users.role, 'student')), 
        with: { student: { with: { class: true } } } 
      });
      if (!user?.student) throw new Error('Student not found');
      const s = user.student;
      const today = formatDate();
      const day = new Date().toLocaleString('default', { weekday: 'long' }).toLowerCase();

      const [attStats, gAggRes, tt, pendRes, recG, notices] = await Promise.all([
        db.select({ status: schema.attendance.status, count: count() })
          .from(schema.attendance)
          .where(and(eq(schema.attendance.studentId, s.id), eq(schema.attendance.classId, s.classId)))
          .groupBy(schema.attendance.status),
        db.select({ avg: avg(schema.grades.marks) })
          .from(schema.grades)
          .innerJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
          .where(and(eq(schema.grades.studentId, s.id), eq(schema.subjects.classId, s.classId))),
        db.query.timetables.findMany({ where: and(eq(schema.timetables.classId, s.classId), eq(schema.timetables.day, day)), with: { subject: true, class: true }, orderBy: [schema.timetables.startTime] }),
        db.select({ count: count() }).from(schema.assignments).where(and(eq(schema.assignments.classId, s.classId), eq(schema.assignments.status, 'active'), gte(schema.assignments.dueDate, today))),
        db.query.grades.findMany({
          where: (grades, { and, eq, inArray }) => and(
            eq(grades.studentId, s.id),
            inArray(
              grades.subjectId,
              db.select({ id: schema.subjects.id })
                .from(schema.subjects)
                .where(eq(schema.subjects.classId, s.classId))
            )
          ),
          with: { subject: true },
          orderBy: [desc(schema.grades.createdAt)],
          limit: 5
        }),
        db.query.notices.findMany({ where: and(eq(schema.notices.tenantId, user.tenantId!), inArray(schema.notices.targetRole, ['all', 'student'])), orderBy: [desc(schema.notices.createdAt)], limit: 5 }),
      ]);

      const totAtt = attStats.reduce((sum: number, a: any) => sum + Number(a.count), 0);
      const presAtt = Number(attStats.find((a: any) => a.status === 'present')?.count || 0);

      return {
        studentId: s.id,
        classId: s.classId,
        attendanceRate: totAtt > 0 ? Math.round((presAtt / totAtt) * 10000) / 100 : 0,
        avgGrade: gAggRes[0]?.avg ? Math.round(Number(gAggRes[0].avg) * 100) / 100 : 0,
        pendingAssignments: Number(pendRes[0]?.count || 0),
        todaySchedule: tt.map((t: any) => ({ id: t.id, day: t.day, startTime: t.startTime, endTime: t.endTime, subjectName: t.subject.name, className: `${t.class.name}-${t.class.section}` })),
        recentGrades: recG.map((g: any) => ({ id: g.id, subjectName: g.subject.name, examType: g.examType, marks: g.marks || 0, maxMarks: g.maxMarks || 100, grade: g.grade })),
        notices: notices.map((n: any) => ({ id: n.id, title: n.title, content: n.content, authorName: 'System', priority: n.priority, createdAt: n.createdAt.toISOString(), targetRole: n.targetRole })),
      }
    } catch (e) { console.error(e); throw new Error('Failed to fetch student dashboard') }
  },

  parentDashboard: async (_: unknown, { parentName }: { parentName?: string }, context: any) => {
    try {
      const userId = context.user?.id;
      const name = parentName || context?.session?.user?.name;
      
      const user = await db.query.users.findFirst({ 
        where: or(eq(schema.users.id, userId || 'none'), and(eq(schema.users.name, name), eq(schema.users.role, 'parent'))), 
        with: { parent: true } 
      });

      if (!user?.parent) throw new Error('Parent not found');
      const pId = user.parent.id;

      // Lazy cleanup of expired subscriptions
      const today = new Date().toISOString().substring(0, 10);
      await db.update(schema.subscriptions)
        .set({ status: 'expired' })
        .where(
          and(
            eq(schema.subscriptions.parentId, pId),
            eq(schema.subscriptions.status, 'active'),
            sql`${schema.subscriptions.endDate} < ${today}`
          )
        );

      const parentWithSub = await db.query.parents.findFirst({
        where: eq(schema.parents.id, pId),
        with: { subscriptions: { where: eq(schema.subscriptions.status, 'active'), orderBy: [desc(schema.subscriptions.createdAt)], limit: 1 } }
      });
      
      const plan = parentWithSub?.subscriptions[0]?.planName?.toLowerCase() || 'basic';

      const [children, notices] = await Promise.all([
        db.query.students.findMany({ 
          where: eq(schema.students.parentId, pId), 
          with: { 
            user: { columns: { name: true, email: true, tenantId: true, avatar: true } }, 
            class: true, 
            fees: { orderBy: [desc(schema.fees.dueDate)], limit: 10 },
            attendance: { orderBy: [desc(schema.attendance.date)], limit: 60 } // Fetch last 60 days of attendance
          } 
        }),
        db.query.notices.findMany({ 
          where: and(eq(schema.notices.tenantId, user.tenantId!), inArray(schema.notices.targetRole, ['all', 'parent'])), 
          orderBy: [desc(schema.notices.createdAt)], 
          limit: 5 
        })
      ]);

      if (children.length === 0) return { children: [], notices: [], fees: [], performanceSummary: [], subscriptionPlan: plan };

      const performanceSummary = await Promise.all(children.map(async (c) => {
        const stats = await context.loaders.studentPerformance.load(c.id);
        return { 
          name: c.user.name, 
          ...stats
        };
      }));

      return {
        children: children.map(c => ({ 
          id: c.id, 
          userId: c.userId,
          name: c.user.name, 
          email: c.user.email,
          avatar: c.user.avatar,
          className: c.class ? `${c.class.name}-${c.class.section}` : 'Unassigned',
          classId: c.classId,
          rollNumber: c.rollNumber,
          gender: c.gender,
          dateOfBirth: c.dateOfBirth,
          admissionDate: c.admissionDate,
          attendance: c.attendance || [], // Return attendance records
        })),
        notices: notices.map((n: any) => ({ id: n.id, title: n.title, content: n.content, authorName: 'System', priority: n.priority, createdAt: n.createdAt.toISOString(), targetRole: n.targetRole })),
        fees: children.flatMap((c: any) => c.fees.map((f: any) => ({ id: f.id, studentName: c.user.name, type: f.type, amount: f.amount || 0, status: f.status, dueDate: f.dueDate, paidDate: f.paidDate, paidAmount: f.paidAmount || 0 }))),
        performanceSummary,
        subscriptionPlan: plan
      }
    } catch (error) { 
      console.error("[PARENT_DASHBOARD_ERROR]", error);
      throw new Error('Failed to fetch parent dashboard');
    }
  },

  staffDashboard: async (_: unknown, args: { tenantId?: string }, context: any) => {
    return dashboardResolvers.adminDashboard(_, args, context);
  }
}

