import { Elysia } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, or, sql, desc, count, gte, inArray } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { requirePermission } from '../lib/permissions';
import { dataCache } from '../lib/cache';
import { redis } from '../lib/redis';
import { posthog, captureError } from '../lib/monitoring/posthog';
import { pushQueue, notificationQueue } from '../lib/queue';
import { isQuietHours } from '../lib/quiet-hours';
import { formatDate } from '../lib/date-utils';

export const attendanceRoutes = new Elysia({ prefix: '/attendance' })
  .use(requireAuth)
  .use(requirePermission('attendance'))
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      const page = parseInt((query.page as string) || '1');
      const limit = Math.min(parseInt((query.limit as string) || '25'), 1000);
      const offset = (page - 1) * limit;

      let dateCutoff: string | undefined;
      
      // 1. PARENT RESTRICTION
      if (user.role === 'parent') {
        const parent = await db.query.parents.findFirst({ 
          where: eq(schema.parents.userId, user.id),
          with: { 
            subscriptions: { 
              where: eq(schema.subscriptions.status, 'active'), 
              orderBy: [desc(schema.subscriptions.createdAt)], 
              limit: 1 
            } 
          }
        });
        
        const plan = parent?.subscriptions[0]?.planName?.toLowerCase() || 'basic';
        const monthsAllowed = plan === 'premium' ? 6 : 1;
        
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - monthsAllowed);
        dateCutoff = formatDate(cutoff);
      } 
      // 2. STUDENT RESTRICTION
      else if (user.role === 'student') {
        // Grant students a 6 month window to view their own history
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 6);
        dateCutoff = formatDate(cutoff);
      }
      // 3. SCHOOL ADMIN/TEACHER HISTORY RESTRICTION
      else if (!query.date) {
        // Only restrict time frame for FULL HISTORY requests
        const tenant = await db.query.tenants.findFirst({
          where: eq(schema.tenants.id, tenantId!),
          columns: { plan: true }
        });
        const plan = tenant?.plan?.toLowerCase() || 'basic';
        let daysAllowed = 7; // basic/starter defaults to 7 days
        if (plan === 'standard') daysAllowed = 14;
        if (plan === 'premium') daysAllowed = 28;

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysAllowed);
        dateCutoff = formatDate(cutoff);
      }

      const conditions = [eq(schema.attendance.tenantId, tenantId!)];
      if (dateCutoff) conditions.push(gte(schema.attendance.date, dateCutoff));
      if (user.role === 'parent') {
        conditions.push(
          inArray(
            schema.attendance.studentId,
            db.select({ id: schema.students.id })
              .from(schema.students)
              .innerJoin(schema.parents, eq(schema.students.parentId, schema.parents.id))
              .where(eq(schema.parents.userId, user.id))
          )
        );
      } else if (user.role === 'student') {
        const studentRecord = await db.query.students.findFirst({
          where: eq(schema.students.userId, user.id)
        });
        if (studentRecord) {
          conditions.push(eq(schema.attendance.studentId, studentRecord.id));
        } else {
          // If no student record found, return empty early
          return { records: [], total: 0, page: 1, totalPages: 0 };
        }
      }
      if (query.classId) conditions.push(eq(schema.attendance.classId, query.classId as string));
      if (query.date) conditions.push(eq(schema.attendance.date, query.date as string));
      if (query.month) conditions.push(eq(schema.attendance.month, query.month as string));
      
      const whereClause = and(...conditions);

      // Perform aggregate count parallel query to prevent double iteration
      const [attendanceList, countResult] = await Promise.all([
        db.query.attendance.findMany({
          where: whereClause,
          with: { 
            student: { with: { user: { columns: { name: true } } } },
            class: { columns: { name: true, section: true } }
          },
          orderBy: [desc(schema.attendance.date), schema.attendance.studentId],
          limit,
          offset
        }),
        db.select({ count: count() }).from(schema.attendance).where(whereClause)
      ]);

      const total = Number(countResult[0]?.count || 0);

      return {
        records: attendanceList.map(a => ({
          id: a.id, studentId: a.studentId, studentName: a.student.user.name,
          classId: a.classId, className: `${a.class.name}-${a.class.section}`,
          date: a.date, month: a.month, status: a.status,
          createdAt: a.createdAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance', tenantId });
      set.status = 500;
      return { error: 'Failed to load attendance' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      const cls = await db.query.classes.findFirst({ where: eq(schema.classes.id, data.classId) });
      if (!cls || cls.tenantId !== tenantId) {
        set.status = 404;
        return { error: 'Class not found or access denied' };
      }

      // Extract month for fast filtering (YYYY-MM-DD -> YYYY-MM)
      const monthStr = data.date.substring(0, 7);

      // SECURITY: Verify all students in the batch belong to this tenant
      const studentIds = data.records.map((r: any) => r.studentId);
      const countRes = await db.select({ count: count() })
        .from(schema.students)
        .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
        .where(and(inArray(schema.students.id, studentIds), eq(schema.users.tenantId, tenantId!)));
      const studentCount = countRes[0]?.count || 0;
      
      if (Number(studentCount) !== studentIds.length) {
        set.status = 403;
        return { error: 'One or more student IDs are invalid or belong to another tenant' };
      }

      // Query existing attendance for these students on this class/date to prevent duplicate push alerts on update
      const existingAttendance = await db.select({
        studentId: schema.attendance.studentId,
        status: schema.attendance.status
      })
      .from(schema.attendance)
      .where(
        and(
          eq(schema.attendance.classId, data.classId),
          eq(schema.attendance.date, data.date),
          inArray(schema.attendance.studentId, studentIds)
        )
      );

      const alreadyAbsentStudentIds = new Set(
        existingAttendance
          .filter(a => a.status === 'absent')
          .map(a => a.studentId)
      );

      await db.insert(schema.attendance).values(
        data.records.map((record: any) => ({
          tenantId: tenantId!, 
          studentId: record.studentId, 
          classId: data.classId, 
          date: data.date, 
          month: monthStr,
          status: record.status 
        }))
      ).onConflictDoUpdate({
        target: [schema.attendance.studentId, schema.attendance.classId, schema.attendance.date],
        set: { 
          status: sql`excluded.status`, 
          month: monthStr,
          createdAt: new Date()
        }
      });

      // 🔔 PUSH NOTIFICATIONS FOR ABSENCE — suppressed during quiet hours
      // (21:00–07:00 IST) and after 18:00. Night-marked absences are DROPPED, not
      // deferred: workers are paused overnight and would otherwise fire at 07:00.
      const now = new Date();
      const kolkataTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hours = kolkataTime.getHours();
      const shouldQueueNotification = !isQuietHours() && hours < 18;

      const absentRecords = data.records.filter((r: any) => r.status === 'absent' && !alreadyAbsentStudentIds.has(r.studentId));
      if (shouldQueueNotification && absentRecords.length > 0) {
        const absentStudentIds = absentRecords.map((r: any) => r.studentId);
        const jobKey = `absence-alerts-${tenantId}-${data.classId}-${data.date}`;
        await notificationQueue.add(
          'absence-alerts',
          {
            tenantId,
            date: data.date,
            absentStudentIds
          },
          { jobId: jobKey }
        ).catch(e => console.error('[QUEUE_ERROR] Failed to queue absence alerts:', e));
      }

      // Parallelize cache invalidation
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
      
      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'attendance_recorded',
        properties: {
          tenantId,
          classId: data.classId,
          date: data.date,
          count: data.records?.length,
          absentCount: absentRecords.length
        }
      });

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/attendance', tenantId });

      set.status = 500;
      return { error: 'Failed to save attendance' };
    }
  })
  .post('/bulk-import', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Unauthorized: Tenant context is missing' };
      }

      const { records } = body as {
        records?: Array<{
          studentId?: string;
          studentEmail?: string;
          rollNumber?: string;
          classId?: string;
          className?: string;
          date: string;
          status: string;
          remarks?: string;
        }>;
      };

      if (!records || !Array.isArray(records)) {
        set.status = 400;
        return { error: 'Invalid input: records must be an array' };
      }

      // Fetch all students and classes of this tenant to create fast mapping maps
      const allTenantClasses = await db.select()
        .from(schema.classes)
        .where(eq(schema.classes.tenantId, tenantId));

      const allTenantStudents = await db.select({
        student: schema.students,
        user: schema.users
      })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(eq(schema.users.tenantId, tenantId));

      // 1. classMapByName: Map name and name-section to class
      const classMapByName = new Map<string, typeof schema.classes.$inferSelect>();
      for (const cls of allTenantClasses) {
        const fullNameSection = `${cls.name}-${cls.section}`;
        classMapByName.set(fullNameSection, cls);
        classMapByName.set(fullNameSection.toLowerCase(), cls);
        classMapByName.set(cls.name, cls);
        classMapByName.set(cls.name.toLowerCase(), cls);
      }

      // 2. student maps
      const studentMapById = new Map<string, typeof schema.students.$inferSelect & { email: string }>();
      const studentMapByEmail = new Map<string, typeof schema.students.$inferSelect & { email: string }>();
      const studentMapByRollClass = new Map<string, typeof schema.students.$inferSelect & { email: string }>();

      for (const row of allTenantStudents) {
        const studentObj = {
          ...row.student,
          email: row.user.email
        };
        studentMapById.set(row.student.id, studentObj);
        
        if (row.user.email) {
          studentMapByEmail.set(row.user.email, studentObj);
          studentMapByEmail.set(row.user.email.toLowerCase(), studentObj);
        }
        
        if (row.student.rollNumber && row.student.classId) {
          const key = `${row.student.rollNumber}_${row.student.classId}`;
          studentMapByRollClass.set(key, studentObj);
          studentMapByRollClass.set(key.toLowerCase(), studentObj);
        }
      }

      const validRecords: Array<{
        studentId: string;
        classId: string;
        date: string;
        status: string;
        remarks?: string;
      }> = [];
      const skippedRecords: Array<{
        record: any;
        reason: string;
      }> = [];

      for (const record of records) {
        if (!record.date || record.date.length < 7) {
          skippedRecords.push({ record, reason: 'Invalid or missing date format' });
          continue;
        }

        if (!record.status) {
          skippedRecords.push({ record, reason: 'Missing status' });
          continue;
        }

        let classId = record.classId;
        if (!classId && record.className) {
          const resolvedClass = classMapByName.get(record.className) || classMapByName.get(record.className.toLowerCase());
          if (resolvedClass) {
            classId = resolvedClass.id;
          }
        }

        let studentId = record.studentId;
        if (!studentId) {
          if (record.studentEmail) {
            const resolvedStudent = studentMapByEmail.get(record.studentEmail) || studentMapByEmail.get(record.studentEmail.toLowerCase());
            if (resolvedStudent) {
              studentId = resolvedStudent.id;
            }
          }

          if (!studentId && record.rollNumber && classId) {
            const key = `${record.rollNumber}_${classId}`;
            const resolvedStudent = studentMapByRollClass.get(key) || studentMapByRollClass.get(key.toLowerCase());
            if (resolvedStudent) {
              studentId = resolvedStudent.id;
            }
          }
        }

        if (!studentId || !classId) {
          skippedRecords.push({ record, reason: 'Could not resolve student or class reference' });
          continue;
        }

        const isStudentValid = studentMapById.has(studentId);
        const isClassValid = allTenantClasses.some(c => c.id === classId);
        if (!isStudentValid || !isClassValid) {
          skippedRecords.push({ record, reason: 'Invalid student ID or class ID for this tenant' });
          continue;
        }

        validRecords.push({
          studentId,
          classId,
          date: record.date,
          status: record.status,
          remarks: record.remarks
        });
      }

      if (validRecords.length > 0) {
        const insertValues = validRecords.map(r => ({
          tenantId: tenantId,
          studentId: r.studentId,
          classId: r.classId,
          date: r.date,
          month: r.date.substring(0, 7),
          status: r.status,
          remarks: r.remarks || null
        }));

        await db.insert(schema.attendance)
          .values(insertValues)
          .onConflictDoUpdate({
            target: [schema.attendance.studentId, schema.attendance.classId, schema.attendance.date],
            set: {
              status: sql`excluded.status`,
              remarks: sql`excluded.remarks`,
              month: sql`excluded.month`,
              createdAt: new Date()
            }
          });
      }

      // Group absent student IDs by date
      const absentsByDate: Record<string, string[]> = {};
      for (const r of validRecords) {
        if (r.status === 'absent') {
          if (!absentsByDate[r.date]) {
            absentsByDate[r.date] = [];
          }
          absentsByDate[r.date]!.push(r.studentId);
        }
      }

      // Queue absence alerts (suppressed during quiet hours and after 18:00 IST —
      // night-marked absences are dropped, not deferred to the morning)
      const now = new Date();
      const kolkataTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hours = kolkataTime.getHours();
      const shouldQueueNotification = !isQuietHours() && hours < 18;

      if (shouldQueueNotification) {
        for (const [date, absentStudentIds] of Object.entries(absentsByDate)) {
          if (absentStudentIds.length > 0) {
            const jobKey = `absence-alerts-${tenantId}-bulk-${date}`;
            await notificationQueue.add(
              'absence-alerts',
              {
                tenantId,
                date,
                absentStudentIds
              },
              { jobId: jobKey }
            ).catch(e => console.error('[QUEUE_ERROR] Failed to queue absence alerts for date:', date, e));
          }
        }
      }

      // Invalidate dashboard cache
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'attendance_bulk_imported',
        properties: {
          tenantId,
          totalCount: records.length,
          importedCount: validRecords.length,
          skippedCount: skippedRecords.length
        }
      });

      return {
        success: true,
        importedCount: validRecords.length,
        skippedCount: skippedRecords.length,
        skippedRecords
      };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/attendance/bulk-import', tenantId });
      set.status = 500;
      return { error: 'Failed to save attendance import' };
    }
  });

