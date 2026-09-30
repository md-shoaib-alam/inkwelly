import { db } from '../../lib/db'
import { GraphQLError } from 'graphql'
import * as schema from '../../db/schema'
import { eq, and, ne, desc, inArray, count, sql, sum, ilike, or, lt, gt } from 'drizzle-orm'
import { checkAuth, paginate, requireModule, requireSchoolAdmin, assertTenantOwnership, tenantFromArg } from '../../graphql/resolvers/helpers'
import { invalidateUserPermissions, invalidateRolePermissions } from '../../lib/permissions'
import { dataCache } from '../../lib/cache'
import { formatDate } from '../../lib/date-utils'
import { StudentService } from '../students'
import { TeacherService } from '../employees'
import { ClassService } from './class.service'
import { SubjectService } from './subject.service'
import { ClassListQuerySchema, blankToUndefined, formatZodError } from '../../lib/validation/class'
import { yearUsageCounts } from './academic.year-usage'
import { AcademicsDashboardService } from './academics-dashboard.service'

export const academicQueries = {
  subjects: async (_: unknown, args: { tenantId?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'subjects', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const result = await SubjectService.listPaginated({
      tenantId,
      page: args.page,
      limit: args.limit,
      mineOnly: user.role === 'teacher',
      callerUserId: user.id,
    });
    return { subjects: result.items, total: result.total, page: result.page, totalPages: result.totalPages };
  },

  classes: async (_: unknown, args: Record<string, unknown>, context: any) => {
    const { user } = await requireModule(context, 'classes', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId as string | undefined);
    if (!tenantId) throw new Error('Tenant context required');

    const parsed = ClassListQuerySchema.safeParse(blankToUndefined(args));
    if (!parsed.success) {
      throw new GraphQLError(formatZodError(parsed.error), { extensions: { code: 'BAD_USER_INPUT' } });
    }

    const result = await ClassService.listPaginated({
      tenantId,
      ...parsed.data,
      teacherUserId: user.role === 'teacher' ? user.id : undefined,
    });
    return { classes: result.items, total: result.total, page: result.page, totalPages: result.totalPages };
  },

  classStats: async (_: unknown, args: { tenantId?: string }, context: any) => {
    const { user } = await requireModule(context, 'classes', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');
    return ClassService.stats(tenantId);
  },

  classFilterOptions: async (_: unknown, args: { tenantId?: string }, context: any) => {
    const { user } = await requireModule(context, 'classes', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');
    return ClassService.filterOptions(tenantId);
  },

  teachers: async (_: unknown, args: { tenantId?: string; search?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'teachers', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const result = await TeacherService.list({
      tenantId,
      search: args.search,
      page: args.page,
      limit: args.limit,
      callerUserId: user.id,
      callerRole: user.role,
    });
    return { teachers: result.items, total: result.total, page: result.page, totalPages: result.totalPages };
  },

  students: async (_: unknown, args: { tenantId?: string; classId?: string; search?: string; status?: string; gender?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'students', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    // Delegate to the shared service — same logic as REST GET /students
    const result = await StudentService.list({
      tenantId,
      classId: args.classId,
      search: args.search,
      status: args.status,
      gender: args.gender,
      page: args.page,
      limit: args.limit,
      callerUserId: user.id,
      callerRole: user.role,
    });

    // GraphQL response shape: { students, total, page, totalPages }
    return {
      students: result.items.map((s: any) => ({
        ...s,
        username: s.username,
        className: s.className,
        parentName: s.parentName || 'Not Linked',
        parentEmail: s.parentEmail || '',
        parent: s.parentId ? {
          id: s.parentId,
          name: s.parentName || 'Unknown',
          email: s.parentEmail || '',
        } : null,
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  },

  staff: async (_: unknown, args: { tenantId?: string; role?: string; search?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'staff', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const page = args.page || 1;
    const limit = args.limit || 20;

    if (args.role === 'teacher') {
      const where = inArray(
        schema.teachers.userId,
        db.select({ id: schema.users.id })
          .from(schema.users)
          .where(
            and(
              eq(schema.users.tenantId, tenantId),
              args.search ? or(
                ilike(schema.users.name, `%${args.search}%`),
                ilike(schema.users.email, `%${args.search}%`)
              ) : undefined
            )
          )
      );
      const teachers = await db.query.teachers.findMany({
        where,
        with: { user: { with: { customRole: true } } },
        orderBy: [desc(schema.teachers.createdAt), desc(schema.teachers.id)],
        offset: (page - 1) * limit,
        limit,
      });
      const totalRes = await db.select({ count: count() }).from(schema.teachers).where(where);
      const total = Number(totalRes[0]?.count || 0);
      
      return {
        staff: teachers.map((t: any) => ({ ...t.user, id: t.userId })),
        total, page, totalPages: Math.ceil(total / limit)
      };
    }

    const conditions = [eq(schema.users.tenantId, tenantId)];
    if (args.role) {
      conditions.push(eq(schema.users.role, args.role as any));
    } else {
      conditions.push(inArray(schema.users.role, ['admin', 'staff', 'teacher']));
    }
    if (args.search) {
      conditions.push(
        or(
          ilike(schema.users.name, `%${args.search}%`),
          ilike(schema.users.email, `%${args.search}%`)
        )!
      );
    }

    const result = await paginate(schema.users, db.query.users, {
      where: and(...conditions),
      page: args.page,
      limit: args.limit,
      with: { customRole: true },
      orderBy: [desc(schema.users.createdAt), desc(schema.users.id)]
    });

    return {
      staff: result.items,
      total: result.total, page: result.page, totalPages: result.totalPages
    };
  },

  fees: async (_: unknown, args: { tenantId?: string; studentId?: string; status?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'fees', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const conditions = [
      inArray(
        schema.fees.studentId,
        db.select({ id: schema.students.id })
          .from(schema.students)
          .innerJoin(schema.users, eq(schema.users.id, schema.students.userId))
          .where(eq(schema.users.tenantId, tenantId))
      )
    ];
    if (args.studentId) conditions.push(eq(schema.fees.studentId, args.studentId));
    if (args.status && args.status !== 'all') conditions.push(eq(schema.fees.status, args.status as any));

    const result = await paginate(schema.fees, db.query.fees, {
      where: and(...conditions),
      page: args.page,
      limit: args.limit,
      with: { student: { with: { user: true } } },
      orderBy: [desc(schema.fees.dueDate), desc(schema.fees.id)]
    });

    return {
      fees: result.items.map((f: any) => ({
        ...f,
        studentName: f.student.user.name
      })),
      total: result.total, page: result.page, totalPages: result.totalPages
    };
  },

  parents: async (_: unknown, args: { tenantId?: string; search?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'parents', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);

    if (!tenantId) throw new Error('Tenant context required');

    const conditions = [];
    if (tenantId) {
      conditions.push(
        inArray(
          schema.parents.userId,
          db.select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.tenantId, tenantId))
        )
      );
    }
    if (args.search) {
      conditions.push(
        inArray(
          schema.parents.userId,
          db.select({ id: schema.users.id })
            .from(schema.users)
            .where(and(
              eq(schema.users.tenantId, tenantId!),
              or(
                ilike(schema.users.name, `%${args.search}%`),
                ilike(schema.users.email, `%${args.search}%`)
              )
            ))
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const cacheKey = `gql:parents:${tenantId || 'all'}:${args.page || 1}:${args.limit || 50}:${args.search || ''}`;
    const cached = await dataCache.get(cacheKey);
    if (cached) return cached;

    const result = await paginate(schema.parents, db.query.parents, {
      where,
      page: args.page,
      limit: args.limit,
      with: { 
        user: true, 
        students: { with: { user: true, class: true } },
        subscriptions: { orderBy: [desc(schema.subscriptions.createdAt)], limit: 1 }
      },
      orderBy: [desc(schema.parents.createdAt), desc(schema.parents.id)]
    });

    const parentsResponse = {
      parents: result.items.map((p: any) => {
        const sub = p.subscriptions?.[0] || null;
        return {
          id: p.id,
          userId: p.userId,
          name: p.user?.name || 'Unknown',
          email: p.user?.email || '',
          username: p.user?.username || '',
          phone: p.user?.phone,
          address: p.user?.address,
          role: p.user?.role,
          isActive: p.user?.isActive,
          occupation: p.occupation || '',
          status: p.user?.isActive ? 'Active' : 'Inactive',
          children: (p.students || []).map((s: any) => ({
            id: s.id,
            name: s.user?.name || 'Unknown',
            email: s.user?.email || '',
            username: s.user?.username || '',
            rollNumber: s.rollNumber,
            className: s.class ? `${s.class.name}-${s.class.section}` : 'Unassigned',
            classId: s.classId,
            gender: s.gender,
            dateOfBirth: s.dateOfBirth,
            class: s.class
          })),
          subscription: sub ? {
            id: sub.id,
            planName: sub.planName,
            planId: sub.planId,
            amount: sub.amount,
            period: sub.period,
            status: sub.status,
            transactionId: sub.transactionId,
            startDate: sub.startDate,
            endDate: sub.endDate,
            autoRenew: sub.autoRenew
          } : null
        };
      }),
      total: result.total, page: result.page, totalPages: result.totalPages
    };

    await dataCache.set(cacheKey, parentsResponse, 300000);
    return parentsResponse;
  },

  customRoles: async (_: unknown, { tenantId: rawId }: { tenantId?: string }, context: any) => {
    const { user } = requireSchoolAdmin(context);
    const tenantId = await tenantFromArg(user, rawId);
    if (!tenantId) throw new Error('Tenant context required');

    const roles = await db.query.customRoles.findMany({ 
      where: eq(schema.customRoles.tenantId, tenantId),
      with: { users: { columns: { id: true } } },
      orderBy: [desc(schema.customRoles.createdAt)] 
    });

    return roles.map((r: any) => ({ 
      ...r, 
      permissions: JSON.parse(r.permissions || '{}'), 
      userCount: r.users?.length || 0, 
      createdAt: r.createdAt.toISOString() 
    }));
  },

  tenantDetail: async (_: unknown, { tenantId: rawId }: { tenantId: string }, context: any) => {
    const { user } = checkAuth(context);
    const tenantId = await tenantFromArg(user, rawId);
    if (!tenantId) throw new Error('Tenant not found');
    return { tenantId };
  },

  staffAttendance: async (_: unknown, args: { tenantId?: string; role?: string; date?: string; page?: number; limit?: number }, context: any) => {
    const { user } = await requireModule(context, 'attendance', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const date = args.date || formatDate();
    const page = args.page || 1;
    const limit = args.limit || 20;

    if (args.role === 'teacher') {
      const teacherWhere = inArray(
        schema.teachers.userId,
        db.select({ id: schema.users.id })
          .from(schema.users)
          .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.isActive, true)))
      );
      const teachers = await db.query.teachers.findMany({
        where: teacherWhere,
        with: { user: { with: { staffAttendance: { where: eq(schema.staffAttendance.date, date) } } } },
        orderBy: [desc(schema.teachers.createdAt), desc(schema.teachers.id)],
        offset: (page - 1) * limit,
        limit,
      });
      const totalRes = await db.select({ count: count() }).from(schema.teachers).where(teacherWhere);
      const total = Number(totalRes[0]?.count || 0);
      
      return {
        records: teachers.map((t: any) => {
          const u = t.user;
          const att = u.staffAttendance?.[0];
          return {
            id: t.userId,
            userId: t.userId,
            staffName: u.name,
            role: u.role,
            date,
            status: att?.status || 'absent',
            checkIn: att?.checkIn,
            checkOut: att?.checkOut,
            remarks: att?.remarks,
            recordId: att?.id
          };
        }),
        total, page, totalPages: Math.ceil(total / limit)
      };
    }

    const conditions = [
      eq(schema.users.tenantId, tenantId),
      eq(schema.users.isActive, true)
    ];
    if (args.role && args.role !== 'all') {
      conditions.push(eq(schema.users.role, args.role as any));
    } else {
      conditions.push(inArray(schema.users.role, ['staff', 'teacher']));
    }

    const result = await paginate(schema.users, db.query.users, {
      where: and(...conditions),
      page: args.page,
      limit: args.limit,
      with: { 
        staffAttendance: {
          where: eq(schema.staffAttendance.date, date)
        }
      },
      orderBy: [desc(schema.users.createdAt), desc(schema.users.id)]
    });

    return {
      records: result.items.map((u: any) => {
        const att = u.staffAttendance?.[0];
        return {
          id: u.id,
          userId: u.id,
          staffName: u.name,
          role: u.role,
          date,
          status: att?.status || 'absent',
          checkIn: att?.checkIn,
          checkOut: att?.checkOut,
          remarks: att?.remarks,
          recordId: att?.id
        };
      }),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  },

  calendarEvents: async (_: unknown, args: { tenantId?: string; month?: string }, context: any) => {
    const { user } = checkAuth(context);
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const conditions = [eq(schema.events.tenantId, tenantId)];
    if (args.month) {
      const [yearStr, monthStr] = args.month.split('-');
      const year = parseInt(yearStr || '0', 10);
      const monthNum = parseInt(monthStr || '0', 10);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const monthStart = `${args.month}-01`;
      const monthEnd = `${args.month}-${String(daysInMonth).padStart(2, '0')}`;
      
      conditions.push(or(
        and(sql`${schema.events.date} >= ${monthStart}`, sql`${schema.events.date} <= ${monthEnd}`)!,
        and(sql`${schema.events.endDate} >= ${monthStart}`, sql`${schema.events.endDate} <= ${monthEnd}`)!,
        and(lt(schema.events.date, monthStart), gt(schema.events.endDate, monthEnd))!
      )!);
    }

    return db.query.events.findMany({ 
      where: and(...conditions), 
      orderBy: [desc(schema.events.date)] 
    });
  },

  academicYears: async (_: unknown, args: { tenantId?: string }, context: any) => {
    const { user } = checkAuth(context);
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    return db.query.academicYears.findMany({
      where: eq(schema.academicYears.tenantId, tenantId),
      orderBy: [desc(schema.academicYears.startDate)]
    });
  },

  currentAcademicYear: async (_: unknown, args: { tenantId?: string }, context: any) => {
    const { user } = checkAuth(context);
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    return db.query.academicYears.findFirst({
      where: and(eq(schema.academicYears.tenantId, tenantId), eq(schema.academicYears.isCurrent, true))
    });
  },

  academicsCommandCenter: async (
    _: unknown,
    args: { tenantId?: string; academicYear?: string },
    context: any,
  ) => {
    const { user } = await requireModule(context, 'classes', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    return AcademicsDashboardService.commandCenter(tenantId, args.academicYear);
  },
}

export const academicMutations = {
  createSubject: async (_: unknown, { data }: { data: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'subjects', 'create');
    if (!tenantId) throw new Error('Tenant required');

    const targetClass = await db.query.classes.findFirst({ where: and(eq(schema.classes.id, data.classId), eq(schema.classes.tenantId, tenantId)) });
    if (!targetClass) throw new Error('Class not found');

    const [subject] = await db.insert(schema.subjects).values({ 
      ...data, 
      classId: data.classId, 
      teacherId: data.teacherId 
    }).returning();

    const fullSubject = await db.query.subjects.findFirst({
      where: eq(schema.subjects.id, subject!.id),
      with: { class: true, teacher: { with: { user: true } } }
    });

    if (!fullSubject) throw new Error('Failed to create subject');
    return { ...fullSubject, className: `${fullSubject.class.name}-${fullSubject.class.section}`, teacherName: fullSubject.teacher?.user.name || 'Not Assigned' };
  },

  updateSubject: async (_: unknown, { id, data }: { id: string, data: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'subjects', 'edit');
    const existing = await db.query.subjects.findFirst({ 
      where: and(
        eq(schema.subjects.id, id),
        inArray(
          schema.subjects.classId,
          db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
        )
      )
    });
    if (!existing) throw new Error('Subject not found');

    await db.update(schema.subjects).set(data).where(eq(schema.subjects.id, id));
    
    const subject = await db.query.subjects.findFirst({
      where: eq(schema.subjects.id, id),
      with: { class: true, teacher: { with: { user: true } } }
    });

    if (!subject) throw new Error('Failed to update subject');
    return { ...subject, className: `${subject.class.name}-${subject.class.section}`, teacherName: subject.teacher?.user.name || 'Not Assigned' };
  },

  deleteSubject: async (_: unknown, { id }: { id: string }, context: any) => {
    const { tenantId } = await requireModule(context, 'subjects', 'delete');
    const existing = await db.query.subjects.findFirst({ 
      where: and(
        eq(schema.subjects.id, id),
        inArray(
          schema.subjects.classId,
          db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, tenantId))
        )
      )
    });
    if (!existing) throw new Error('Subject not found');
    await db.delete(schema.subjects).where(eq(schema.subjects.id, id));
    
    // Invalidate caches
    await dataCache.deleteMatch(`gql:subjects:${tenantId}:*`);
    await dataCache.deleteMatch(`*subjects*${tenantId}*`);
    
    return true;
  },

  createCustomRole: async (_: unknown, args: any, context: any) => {
    const { user } = requireSchoolAdmin(context);
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant required');

    const [role] = await db.insert(schema.customRoles).values({ 
      tenantId, 
      name: args.name.trim(), 
      description: args.description, 
      color: args.color, 
      permissions: JSON.stringify(args.permissions || {}) 
    }).returning();

    if (!role) throw new Error('Failed to create custom role');
    return { ...role, permissions: JSON.parse(role.permissions || '{}'), userCount: 0, createdAt: role.createdAt.toISOString() };
  },

  updateCustomRole: async (_: unknown, { id, ...data }: any, context: any) => {
    const auth = requireSchoolAdmin(context);
    await assertTenantOwnership(schema.customRoles, id, auth, 'role');
    if (data.permissions) data.permissions = JSON.stringify(data.permissions);
    const [role] = await db.update(schema.customRoles).set(data).where(eq(schema.customRoles.id, id)).returning();
    if (!role) throw new Error('Failed to update custom role');
    await invalidateRolePermissions(id);
    return { ...role, permissions: JSON.parse(role.permissions || '{}'), userCount: 0, createdAt: role.createdAt.toISOString() };
  },

  deleteCustomRole: async (_: unknown, { id }: { id: string }, context: any) => {
    const auth = requireSchoolAdmin(context);
    const [role] = await db.select({ tenantId: schema.customRoles.tenantId })
      .from(schema.customRoles).where(eq(schema.customRoles.id, id)).limit(1);
    if (!role) throw new Error('Role not found');
    if (auth.user.role !== 'super_admin' && role.tenantId !== auth.tenantId) {
      throw new Error('Forbidden: record belongs to another school');
    }
    // Unassign users from this role — scoped to the role's school, not platform-wide
    const members = await db.select({ id: schema.users.id })
      .from(schema.users).where(eq(schema.users.customRoleId, id));
    await db.update(schema.users)
      .set({ customRoleId: null })
      .where(and(eq(schema.users.customRoleId, id), eq(schema.users.tenantId, role.tenantId)));

    // Delete the role
    await db.delete(schema.customRoles).where(eq(schema.customRoles.id, id));
    await invalidateUserPermissions(members.map((m) => m.id));
    return true;
  },

  assignRoleToUser: async (_: unknown, { userId, roleId, tenantId: rawId }: any, context: any) => {
    const { user } = requireSchoolAdmin(context);
    const tenantId = await tenantFromArg(user, rawId);

    if (roleId) {
      const [role] = await db.select({ id: schema.customRoles.id }).from(schema.customRoles)
        .where(and(eq(schema.customRoles.id, roleId), tenantId ? eq(schema.customRoles.tenantId, tenantId) : undefined))
        .limit(1);
      if (!role) throw new Error('Role not found in this school');
    }

    await db.update(schema.users)
      .set({ customRoleId: roleId || null })
      .where(and(eq(schema.users.id, userId), tenantId ? eq(schema.users.tenantId, tenantId) : undefined));
    await invalidateUserPermissions([userId]);
    return true;
  },

  markStaffAttendance: async (_: unknown, { data }: { data: any }, context: any) => {
    const { tenantId } = requireSchoolAdmin(context);
    if (!tenantId) throw new Error('Tenant required');

    const { userId, date, status, checkIn, checkOut, remarks } = data;

    await db.insert(schema.staffAttendance).values({
      userId, tenantId, date, status, checkIn, checkOut, remarks
    })
    .onConflictDoUpdate({
      target: [schema.staffAttendance.userId, schema.staffAttendance.date],
      set: { status, checkIn, checkOut, remarks }
    });

    return true;
  },

  markBulkStaffAttendance: async (_: unknown, { data }: { data: any[] }, context: any) => {
    const { tenantId } = requireSchoolAdmin(context);
    if (!tenantId) throw new Error('Tenant required');

    try {
      await db.transaction(async (tx) => {
        for (const item of data) {
          if (!item.userId || !item.date) continue;
          await tx.insert(schema.staffAttendance).values({
            userId: item.userId,
            tenantId,
            date: item.date,
            status: item.status || 'present',
            checkIn: item.checkIn || null,
            checkOut: item.checkOut || null,
            remarks: item.remarks || null
          })
          .onConflictDoUpdate({
            target: [schema.staffAttendance.userId, schema.staffAttendance.date],
            set: { 
              status: item.status || 'present',
              checkIn: item.checkIn || null,
              checkOut: item.checkOut || null,
              remarks: item.remarks || null
            }
          });
        }
      });
      return true;
    } catch (err: any) {
      console.error('Staff Attendance Bulk Error:', err);
      throw new Error(`Attendance Save Failed: ${err.message || 'Check server logs'}`);
    }
  },

  createEvent: async (_: unknown, { data }: { data: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'calendar', 'create');
    if (!tenantId) throw new Error('Tenant required');
    const [event] = await db.insert(schema.events).values({
      ...data,
      tenantId,
      type: data.type || 'general',
      targetRole: data.targetRole || 'all',
      color: data.color || '#10b981',
      allDay: Boolean(data.allDay)
    }).returning();
    return event;
  },

  updateEvent: async (_: unknown, { id, data }: { id: string; data: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'calendar', 'edit');
    const [event] = await db.update(schema.events).set(data).where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenantId))).returning();
    if (!event) throw new Error('Event not found');
    return event;
  },

  deleteEvent: async (_: unknown, { id }: { id: string }, context: any) => {
    const { tenantId } = await requireModule(context, 'calendar', 'delete');
    const res = await db.delete(schema.events).where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenantId))).returning();
    if (res.length === 0) throw new Error('Event not found');
    return true;
  },

  createAcademicYear: async (_: unknown, { input }: { input: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'academic-years', 'create');
    if (!tenantId) throw new Error('Tenant required');

    await db.transaction(async (tx) => {
      if (input.isCurrent) {
        await tx.update(schema.academicYears)
          .set({ isCurrent: false })
          .where(and(eq(schema.academicYears.tenantId, tenantId), eq(schema.academicYears.isCurrent, true)));
      }
      await tx.insert(schema.academicYears).values({
        ...input,
        tenantId,
        status: input.status || 'active'
      });
    });

    return db.query.academicYears.findFirst({
      where: and(eq(schema.academicYears.tenantId, tenantId), eq(schema.academicYears.name, input.name))
    });
  },

  updateAcademicYear: async (_: unknown, { id, input }: { id: string, input: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'academic-years', 'edit');

    const existing = await db.query.academicYears.findFirst({
      where: and(eq(schema.academicYears.id, id), eq(schema.academicYears.tenantId, tenantId)),
    });
    if (!existing) throw new Error('Academic year not found');

    if (existing.isCurrent && input.isCurrent === false) {
      const otherCurrent = await db.query.academicYears.findFirst({
        where: and(
          eq(schema.academicYears.tenantId, tenantId),
          eq(schema.academicYears.isCurrent, true),
          ne(schema.academicYears.id, id),
        ),
      });
      if (!otherCurrent) {
        throw new GraphQLError(
          `MUST_KEEP_CURRENT: One session must remain current. Use "Set current" on another session to move it.`,
          { extensions: { code: 'MUST_KEEP_CURRENT' } },
        );
      }
    }

    if (input.name && input.name !== existing.name) {
      const counts = await yearUsageCounts(tenantId, existing.name);
      const inUse = Object.entries(counts).filter(([, n]) => n > 0);
      if (inUse.length) {
        throw new GraphQLError(
          `YEAR_IN_USE: "${existing.name}" is in use (${inUse.map(([t, n]) => `${t}: ${n}`).join(', ')}). ` +
          `Create "${input.name}" as a new session instead of renaming.`,
          { extensions: { code: 'YEAR_IN_USE' } },
        );
      }
    }

    const [year] = await db.transaction(async (tx) => {
      if (input.isCurrent) {
        await tx.update(schema.academicYears)
          .set({ isCurrent: false })
          .where(and(eq(schema.academicYears.tenantId, tenantId), eq(schema.academicYears.isCurrent, true)));
      }
      return tx.update(schema.academicYears).set(input).where(and(eq(schema.academicYears.id, id), eq(schema.academicYears.tenantId, tenantId))).returning();
    });

    if (!year) throw new Error('Academic year not found');
    return year;
  },

  deleteAcademicYear: async (_: unknown, { id }: { id: string }, context: any) => {
    const { tenantId } = await requireModule(context, 'academic-years', 'delete');
    const res = await db.delete(schema.academicYears).where(and(eq(schema.academicYears.id, id), eq(schema.academicYears.tenantId, tenantId))).returning();
    if (res.length === 0) throw new Error('Academic year not found');
    return true;
  },

  setCurrentAcademicYear: async (_: unknown, { id }: { id: string }, context: any) => {
    const { tenantId } = await requireModule(context, 'academic-years', 'edit');
    
    const [year] = await db.transaction(async (tx) => {
      await tx.update(schema.academicYears)
        .set({ isCurrent: false })
        .where(and(eq(schema.academicYears.tenantId, tenantId), eq(schema.academicYears.isCurrent, true)));

      return tx.update(schema.academicYears)
        .set({ isCurrent: true, status: 'active' })
        .where(and(eq(schema.academicYears.id, id), eq(schema.academicYears.tenantId, tenantId)))
        .returning();
    });

    if (!year) throw new Error('Academic year not found');
    return year;
  }
}

