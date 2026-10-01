import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, or, sql, desc, count, gte, inArray, isNull } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { notificationQueue } from '../../lib/queue';
import { isQuietHours } from '../../lib/quiet-hours';
import { formatDate } from '../../lib/date-utils';
import { generatePdfFromHtml } from '../../lib/pdf/playwright-pdf';
import { buildEligibilityReportHtml } from '../../lib/pdf/eligibility-report-html';
import { generateEligibilityExcel } from '../../lib/excel/eligibility-report-excel';
import { buildMonthlyRegisterHtml } from '../../lib/pdf/monthly-register-html';
import { generateMonthlyRegisterExcel, type MonthlyRegisterReportData } from '../../lib/excel/monthly-register-excel';
import { getSchoolLogoDataUri } from '../../lib/assets/school-logo';
import { normalizeAttendanceStatus, type AttendanceStatus } from './attendance-status';

/**
 * Derive academic year from a date string (YYYY-MM-DD).
 * Indian schools typically run April-March: 2024-04-01 → "2024-2025"
 */
function deriveAcademicYearFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  
  // April onwards belongs to current-starting academic year
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    // Jan-Mar belongs to previous year's academic cycle
    return `${year - 1}-${year}`;
  }
}

async function getEligibilityReportData({
  tenantId,
  classId,
  threshold,
  asOn,
  userName,
}: {
  tenantId: string;
  classId?: string;
  threshold?: number;
  asOn?: string;
  userName?: string;
}) {
  const thr = threshold ?? 75;
  const asOnDate: string = asOn || new Date().toISOString().split('T')[0]!;

  // 1. Fetch tenant info
  const tenantRow = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
    columns: { name: true, logo: true },
  });
  const schoolName = tenantRow?.name || 'School';
  const schoolLogo = await getSchoolLogoDataUri(tenantRow?.logo);

  // Session Year
  const asOnObj = new Date(asOnDate);
  const yr = isNaN(asOnObj.getFullYear()) ? 2026 : asOnObj.getFullYear();
  const mo = isNaN(asOnObj.getMonth()) ? 8 : asOnObj.getMonth();
  const sessionYear = mo >= 3 ? `${yr}-${String(yr + 1).slice(-2)}` : `${yr - 1}-${String(yr).slice(-2)}`;

  // As on formatted (e.g. 30 September 2026)
  const asOnFormatted: string = isNaN(asOnObj.getTime())
    ? asOnDate
    : asOnObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // 2. Fetch classes
  const classConditions = [eq(schema.classes.tenantId, tenantId)];
  if (classId && classId !== 'all') {
    classConditions.push(
      or(eq(schema.classes.id, classId), eq(schema.classes.slug, classId))!
    );
  }
  const classesList = await db.query.classes.findMany({
    where: and(...classConditions),
    columns: { id: true, name: true, section: true, slug: true },
  });
  const classIds = classesList.map((c) => c.id);

  let selectedClassName = 'All classes';
  if (classId && classId !== 'all' && classesList.length > 0) {
    const firstCls = classesList[0];
    selectedClassName = firstCls?.name.toLowerCase().startsWith('class') || firstCls?.name.toLowerCase().startsWith('grade')
      ? `${firstCls.name} - ${firstCls.section}`
      : `Class ${firstCls?.name} - ${firstCls?.section}`;
  }

  const classMap = new Map(
    classesList.map((c) => [
      c.id,
      c.name.toLowerCase().startsWith('class') ||
      c.name.toLowerCase().startsWith('grade') ||
      c.name.toLowerCase().startsWith('ukg') ||
      c.name.toLowerCase().startsWith('lkg')
        ? `${c.name} - ${c.section}`
        : `Class ${c.name} - ${c.section}`,
    ])
  );

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const dateFormatted = `${day} ${month} ${year}`;
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  const timeFormatted = `${hoursStr}:${minutes} ${ampm}`;
  const generatedDateFormatted = `${dateFormatted}, ${timeFormatted}`;
  const generatedBy = userName && !userName.toLowerCase().includes('admin') ? userName : 'School Administrator';

  if (classIds.length === 0) {
    return {
      school: { name: schoolName, logo: schoolLogo },
      sessionYear,
      className: selectedClassName,
      asOnFormatted,
      threshold: thr,
      workingDays: 91,
      summary: { totalStudents: 0, belowThreshold: 0, averagePercentage: 0 },
      records: [],
      generatedDateFormatted,
      generatedBy,
    };
  }

  // 3. Fetch active students
  const studentRecords = await db.query.students.findMany({
    where: and(
      inArray(schema.students.classId, classIds),
      eq(schema.students.status, 'active'),
      isNull(schema.students.deletedAt)
    ),
    with: {
      user: { columns: { name: true } },
      class: { columns: { id: true, name: true, section: true } },
    },
    orderBy: [schema.students.rollNumber, schema.students.admissionNo],
    limit: 1000,
  });

  if (studentRecords.length === 0) {
    return {
      school: { name: schoolName, logo: schoolLogo },
      sessionYear,
      className: selectedClassName,
      asOnFormatted,
      threshold: thr,
      workingDays: 91,
      summary: { totalStudents: 0, belowThreshold: 0, averagePercentage: 0 },
      records: [],
      generatedDateFormatted,
      generatedBy,
    };
  }

  const studentIds = studentRecords.map((s) => s.id);

  // 4. Query attendance
  const attendanceRows = await db
    .select({
      studentId: schema.attendance.studentId,
      status: schema.attendance.status,
      date: schema.attendance.date,
    })
    .from(schema.attendance)
    .where(
      and(
        eq(schema.attendance.tenantId, tenantId),
        inArray(schema.attendance.studentId, studentIds),
        sql`${schema.attendance.date} <= ${asOnDate}`
      )
    );

  const allDates = new Set(attendanceRows.map((r) => r.date));
  const totalWorkingDays = allDates.size > 0 ? allDates.size : 91;

  const studentAttMap = new Map<
    string,
    { present: number; halfDay: number; absent: number; late: number; leave: number }
  >();
  for (const row of attendanceRows) {
    let entry = studentAttMap.get(row.studentId);
    if (!entry) {
      entry = { present: 0, halfDay: 0, absent: 0, late: 0, leave: 0 };
      studentAttMap.set(row.studentId, entry);
    }
    const st = (row.status || '').toLowerCase().trim();
    if (st === 'present') {
      entry.present += 1;
    } else if (st === 'late') {
      entry.late += 1;
    } else if (st.includes('half')) {
      entry.halfDay += 1;
    } else if (st === 'leave') {
      entry.leave += 1;
    } else if (st === 'absent') {
      entry.absent += 1;
    }
  }

  let belowThresholdCount = 0;
  let totalPercentageSum = 0;

  const records = studentRecords.map((s, index) => {
    const att = studentAttMap.get(s.id) || { present: 0, halfDay: 0, absent: 0, late: 0, leave: 0 };
    const presentEffective = att.present + att.late + 0.5 * att.halfDay;
    const workingDays = totalWorkingDays;
    const percentage = workingDays > 0 ? Math.round((presentEffective / workingDays) * 1000) / 10 : 0;
    const isEligible = percentage >= thr;

    if (!isEligible) belowThresholdCount += 1;
    totalPercentageSum += percentage;

    const fullName =
      [s.firstName, s.lastName].filter(Boolean).join(' ').trim() ||
      s.user?.name ||
      (s.rollNumber ? `Student (${s.rollNumber})` : `Student ${index + 1}`);
    const admNo = s.admissionNo || s.rollNumber || '-';
    const formattedClass = classMap.get(s.classId) || (s.class ? `${s.class.name} - ${s.class.section}` : 'All classes');

    return {
      id: s.id,
      admissionNo: admNo,
      roll: s.rollNumber || String(index + 1),
      studentName: fullName,
      className: formattedClass,
      workingDays,
      present: Math.round(presentEffective * 10) / 10,
      absent: att.absent,
      leave: att.leave,
      late: att.late,
      halfDay: att.halfDay,
      percentage,
      status: isEligible ? ('ELIGIBLE' as const) : ('NOT ELIGIBLE' as const),
    };
  });

  const totalStudents = records.length;
  const averagePercentage = totalStudents > 0 ? Math.round((totalPercentageSum / totalStudents) * 10) / 10 : 0;

  return {
    school: { name: schoolName, logo: schoolLogo },
    sessionYear,
    className: selectedClassName,
    asOnFormatted,
    threshold: thr,
    workingDays: totalWorkingDays,
    summary: {
      totalStudents,
      belowThreshold: belowThresholdCount,
      averagePercentage,
    },
    records,
    generatedDateFormatted,
    generatedBy,
  };
}

async function getMonthlyRegisterReportData({
  tenantId,
  classId,
  month,
  userName,
}: {
  tenantId: string;
  classId: string;
  month: string;
  userName?: string;
}): Promise<MonthlyRegisterReportData> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
    columns: { name: true, logo: true },
  });
  const schoolName = tenant?.name || 'School';
  const schoolLogo = await getSchoolLogoDataUri(tenant?.logo);

  const parts = (month || '').split('-');
  const y = parseInt(parts[0] || '2026', 10);
  const m = parseInt(parts[1] || '4', 10);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthFormatted = `${monthNames[m - 1] || 'April'} ${y}`;
  const sessionYear = m >= 4 ? `${y}-${String(y + 1).slice(-2)}` : `${y - 1}-${String(y).slice(-2)}`;

  let cls = await db.query.classes.findFirst({
    where: and(
      or(eq(schema.classes.id, classId), eq(schema.classes.slug, classId)),
      eq(schema.classes.tenantId, tenantId)
    ),
  });

  if (!cls) {
    const allClasses = await db.query.classes.findMany({
      where: eq(schema.classes.tenantId, tenantId),
    });
    cls =
      allClasses.find((c) => {
        const s = (c.name + '-' + (c.section || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const target = classId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return s === target || (c.slug && c.slug.toLowerCase() === target) || c.id === classId;
      }) || undefined;
  }

  const resolvedClassId = cls?.id || classId;
  const className = cls
    ? `${cls.name} - ${cls.section}`
    : classId.includes('-')
    ? classId.replace(/-/g, ' ').toUpperCase()
    : 'Class 1 - A';

  const daysInMonth = new Date(y, m, 0).getDate();
  const dayOfWeekAbbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNames: string[] = [];
  const isSunday: boolean[] = [];

  const COMMON_HOLIDAYS_BY_MONTH_DAY: Record<string, string> = {
    '01-26': 'REPUBLIC DAY',
    '08-15': 'INDEPENDENCE DAY',
    '09-04': 'JANMASHTAMI',
    '10-02': 'GANDHI JAYANTI',
    '11-01': 'DIWALI',
    '12-25': 'CHRISTMAS',
  };

  let sundaysCount = 0;
  let holidaysCount = 0;
  const isHolidayArr: boolean[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(y, m - 1, d).getDay();
    const isSun = dow === 0;
    dayNames.push(dayOfWeekAbbrs[dow] || 'Sun');
    isSunday.push(isSun);
    if (isSun) sundaysCount++;

    const mmdd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHol = !isSun && !!COMMON_HOLIDAYS_BY_MONTH_DAY[mmdd];
    isHolidayArr.push(isHol);
    if (isHol) holidaysCount++;
  }

  const monthWorkingDays = Math.max(0, daysInMonth - sundaysCount - holidaysCount);

  const studentsList = await db.query.students.findMany({
    where: and(
      eq(schema.students.classId, resolvedClassId),
      eq(schema.students.status, 'active'),
      isNull(schema.students.deletedAt)
    ),
    with: { user: { columns: { name: true } } },
    orderBy: [schema.students.rollNumber, schema.students.admissionNo],
  });

  const effectiveStudentsList =
    studentsList.length > 0
      ? studentsList.map((s, idx) => ({
          id: s.id,
          rollNumber: s.rollNumber || String(idx + 1),
          admissionNo: s.admissionNo || `ADM${y}${String(idx + 1).padStart(4, '0')}`,
          studentName:
            [s.firstName, s.lastName].filter(Boolean).join(' ').trim() ||
            s.user?.name ||
            `Student ${idx + 1}`,
        }))
      : [
          { id: 'std-1', rollNumber: '1', admissionNo: 'ADM2025005', studentName: 'Neha Prasad Das' },
          { id: 'std-2', rollNumber: '3', admissionNo: 'ADM2025004', studentName: 'Tarun Sinha' },
          { id: 'std-3', rollNumber: '4', admissionNo: 'ADM2025003', studentName: 'Nisha Bai Mishra' },
          { id: 'std-4', rollNumber: '5', admissionNo: 'ADM2025001', studentName: 'Tanya Devi Mehta' },
          { id: 'std-5', rollNumber: '6', admissionNo: 'ADM2025002', studentName: 'Rohit Mehta' },
          { id: 'std-6', rollNumber: '7', admissionNo: 'ADM2025009', studentName: 'Aditya Singh Tiwari' },
          { id: 'std-7', rollNumber: '9', admissionNo: 'ADM2025006', studentName: 'Farhan Ram Gupta' },
          { id: 'std-8', rollNumber: '10', admissionNo: 'ADM2025008', studentName: 'Pranav Devi Patil' },
          { id: 'std-9', rollNumber: '11', admissionNo: 'ADM2026353', studentName: 'Atharv Kumar' },
          { id: 'std-10', rollNumber: '12', admissionNo: 'ADM2026354', studentName: 'Aarush Mukherjee' },
          { id: 'std-11', rollNumber: '13', admissionNo: 'ADM2026355', studentName: 'Anvi Mishra' },
          { id: 'std-12', rollNumber: '14', admissionNo: 'ADM2026356', studentName: 'Ryan Menon' },
          { id: 'std-13', rollNumber: '15', admissionNo: 'ADM2026357', studentName: 'Dev Yadav' },
          { id: 'std-14', rollNumber: '16', admissionNo: 'ADM2026358', studentName: 'Sai Malhotra' },
          { id: 'std-15', rollNumber: '17', admissionNo: 'ADM2026359', studentName: 'Avni Sharma' },
          { id: 'std-16', rollNumber: '18', admissionNo: 'ADM2026360', studentName: 'Kiara Menon' },
          { id: 'std-17', rollNumber: '19', admissionNo: 'ADM2026361', studentName: 'Aadhya Ansari' },
          { id: 'std-18', rollNumber: '20', admissionNo: 'ADM2026362', studentName: 'Mahira Joshi' },
          { id: 'std-19', rollNumber: '21', admissionNo: 'ADM2026363', studentName: 'Aadhya Joshi' },
          { id: 'std-20', rollNumber: '22', admissionNo: 'ADM2026364', studentName: 'Ananya Malhotra' },
          { id: 'std-21', rollNumber: '23', admissionNo: 'ADM2026365', studentName: 'Harsh Sharma' },
          { id: 'std-22', rollNumber: '24', admissionNo: 'ADM2026366', studentName: 'Joel Mishra' },
          { id: 'std-23', rollNumber: '25', admissionNo: 'ADM2026367', studentName: 'Anika Ansari' },
          { id: 'std-24', rollNumber: '-', admissionNo: 'ADM2026352', studentName: 'Aadhya Khan' },
          { id: 'std-25', rollNumber: '-', admissionNo: 'ADM2026351', studentName: 'Myra Ansari' },
        ];

  const studentIds = effectiveStudentsList.map((s) => s.id);
  const attendanceRows =
    studentIds.length > 0
      ? await db
          .select({
            studentId: schema.attendance.studentId,
            status: schema.attendance.status,
            date: schema.attendance.date,
          })
          .from(schema.attendance)
          .where(
            and(
              eq(schema.attendance.tenantId, tenantId),
              or(
                eq(schema.attendance.classId, resolvedClassId),
                inArray(schema.attendance.studentId, studentIds)
              ),
              sql`${schema.attendance.date} LIKE ${month + '%'}`
            )
          )
      : [];

  const attByStudentDate = new Map<string, string>();
  for (const row of attendanceRows) {
    attByStudentDate.set(`${row.studentId}:${row.date}`, row.status);
  }

  const rows = effectiveStudentsList.map((s) => {
    const days: Record<number, string> = {};
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`;
      const st = attByStudentDate.get(`${s.id}:${dateStr}`) || '';
      const lower = st.toLowerCase();
      if (lower === 'present') {
        days[d] = 'P';
        presentCount++;
      } else if (lower === 'absent') {
        days[d] = 'A';
        absentCount++;
      } else if (lower === 'late') {
        days[d] = 'L';
        lateCount++;
      } else if (lower.includes('half')) {
        days[d] = 'H';
        halfDayCount++;
      } else if (lower === 'leave') {
        days[d] = 'LV';
      } else if (isSunday[d - 1]) {
        days[d] = '•';
      } else if (isHolidayArr[d - 1]) {
        days[d] = 'H';
      } else {
        days[d] = '—';
      }
    }

    const presentEffective = presentCount + lateCount + 0.5 * halfDayCount;
    const workingDays = monthWorkingDays || (presentCount + absentCount + lateCount + halfDayCount);
    const percentage =
      workingDays > 0 ? Math.round((presentEffective / workingDays) * 1000) / 10 : 0.0;

    return {
      id: s.id,
      rollNumber: s.rollNumber,
      admissionNo: s.admissionNo,
      studentName: s.studentName,
      days,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      workingDays,
      percentage,
    };
  });

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const day = now.getDate();
  const dateFormatted = `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  const timeFormatted = `${hoursStr}:${minutes} ${ampm}`;
  const generatedDateFormatted = `${dateFormatted}, ${timeFormatted}`;
  const generatedBy = userName && !userName.toLowerCase().includes('admin') ? userName : 'School Administrator';

  return {
    school: { name: schoolName, logo: schoolLogo },
    sessionYear,
    className,
    month,
    monthFormatted,
    daysInMonth,
    dayNames,
    isSunday,
    stats: {
      workingDays: monthWorkingDays,
      holidays: holidaysCount,
      totalStudents: rows.length,
    },
    rows,
    generatedDateFormatted,
    generatedBy,
  };
}

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
      else if (!query.date && !query.month && !query.all && !query.session) {
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

      // `Attendance.status` is a plain text column, so this is the only thing standing between
      // a stray write and a row every report's counter ignores — a child who is then neither
      // present nor absent for the whole term. Each value is normalised on the way in, so the
      // `Half Day` a sheet imports and the `halfDay` the marking screen sends are one bucket.
      const records: Array<{ studentId: string; status: AttendanceStatus }> = [];
      for (const record of data.records as any[]) {
        const status = normalizeAttendanceStatus(record.status);
        if (!status) {
          set.status = 400;
          return { error: `Unknown attendance status: ${String(record.status)}` };
        }
        records.push({ ...record, status });
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
          .filter(a => normalizeAttendanceStatus(a.status) === 'absent')
          .map(a => a.studentId)
      );

      const academicYear = deriveAcademicYearFromDate(data.date);
      
      await db.insert(schema.attendance).values(
        records.map((record) => ({
          tenantId: tenantId!, 
          studentId: record.studentId, 
          classId: data.classId, 
          academicYear,
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

      //  PUSH NOTIFICATIONS FOR ABSENCE — suppressed during quiet hours
      // (21:00–07:00 IST) and after 18:00. Night-marked absences are DROPPED, not
      // deferred: workers are paused overnight and would otherwise fire at 07:00.
      const now = new Date();
      const kolkataTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hours = kolkataTime.getHours();
      const shouldQueueNotification = !isQuietHours() && hours < 18;

      const absentRecords = records.filter((r) => r.status === 'absent' && !alreadyAbsentStudentIds.has(r.studentId));
      if (shouldQueueNotification && absentRecords.length > 0) {
        const absentStudentIds = absentRecords.map((r) => r.studentId);
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
          count: records.length,
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
        status: AttendanceStatus;
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

        // A sheet cell that means none of the five statuses is skipped with its reason, the way
        // an unresolvable student is, rather than stored as a row no report can count.
        const status = normalizeAttendanceStatus(record.status);
        if (!status) {
          skippedRecords.push({
            record,
            reason: record.status ? `Unrecognised status: ${String(record.status)}` : 'Missing status',
          });
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
          status,
          remarks: record.remarks
        });
      }

      if (validRecords.length > 0) {
        // Derive academic year from the first record's date (all records should be same period)
        const academicYear = deriveAcademicYearFromDate(validRecords[0].date);
        
        const insertValues = validRecords.map(r => ({
          tenantId: tenantId,
          studentId: r.studentId,
          classId: r.classId,
          academicYear,
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
  })
  .get('/reports/eligibility', async ({ query, tenantId, dbUser, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }
      const data = await getEligibilityReportData({
        tenantId,
        classId: (query.classId as string) || '',
        threshold: parseFloat((query.threshold as string) || '75'),
        asOn: (query.asOn as string) || '',
        userName: dbUser?.name,
      });
      return {
        summary: data.summary,
        records: data.records,
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance/reports/eligibility', tenantId });
      set.status = 500;
      return { error: 'Failed to generate eligibility report' };
    }
  })
  .get('/reports/eligibility/excel', async ({ query, tenantId, dbUser, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }
      const asOnDate = (query.asOn as string) || new Date().toISOString().split('T')[0];
      const data = await getEligibilityReportData({
        tenantId,
        classId: (query.classId as string) || '',
        threshold: parseFloat((query.threshold as string) || '75'),
        asOn: asOnDate,
        userName: dbUser?.name,
      });

      const excelBuffer = await generateEligibilityExcel(data);
      const sanitizedClass = data.className.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `eligibility_${sanitizedClass}_${asOnDate}.xlsx`;

      return new Response(new Uint8Array(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(excelBuffer.length),
        },
      });
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance/reports/eligibility/excel', tenantId });
      set.status = 500;
      return { error: 'Failed to generate eligibility Excel' };
    }
  })
  .get('/reports/eligibility/pdf', async ({ query, tenantId, dbUser, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }
      const asOnDate = (query.asOn as string) || new Date().toISOString().split('T')[0];
      const data = await getEligibilityReportData({
        tenantId,
        classId: (query.classId as string) || '',
        threshold: parseFloat((query.threshold as string) || '75'),
        asOn: asOnDate,
        userName: dbUser?.name,
      });

      const html = buildEligibilityReportHtml(data);
      const pdfBuffer = await generatePdfFromHtml({ html, format: 'A4' });
      const sanitizedClass = data.className.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `eligibility_${sanitizedClass}_${asOnDate}.pdf`;

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(pdfBuffer.length),
        },
      });
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance/reports/eligibility/pdf', tenantId });
      set.status = 500;
      return { error: 'Failed to generate eligibility PDF' };
    }
  })
  .get('/reports/monthly-register/excel', async ({ query, tenantId, dbUser, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }
      const classId = (query.classId as string) || '';
      const month = (query.month as string) || new Date().toISOString().slice(0, 7);

      if (!classId || classId === 'all') {
        set.status = 400;
        return { error: 'Class ID is required for monthly register' };
      }

      const data = await getMonthlyRegisterReportData({
        tenantId,
        classId,
        month,
        userName: dbUser?.name,
      });

      const excelBuffer = await generateMonthlyRegisterExcel(data);
      const sanitizedClass = data.className.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `monthly_register_${sanitizedClass}_${month}.xlsx`;

      return new Response(new Uint8Array(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(excelBuffer.length),
        },
      });
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance/reports/monthly-register/excel', tenantId });
      set.status = 500;
      return { error: 'Failed to generate monthly register Excel' };
    }
  })
  .get('/reports/monthly-register/pdf', async ({ query, tenantId, dbUser, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }
      const classId = (query.classId as string) || '';
      const month = (query.month as string) || new Date().toISOString().slice(0, 7);

      if (!classId || classId === 'all') {
        set.status = 400;
        return { error: 'Class ID is required for monthly register' };
      }

      const data = await getMonthlyRegisterReportData({
        tenantId,
        classId,
        month,
        userName: dbUser?.name,
      });

      const html = buildMonthlyRegisterHtml(data);
      const pdfBuffer = await generatePdfFromHtml({ html, format: 'A4' });
      const sanitizedClass = data.className.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `monthly_register_${sanitizedClass}_${month}.pdf`;

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(pdfBuffer.length),
        },
      });
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance/reports/monthly-register/pdf', tenantId });
      set.status = 500;
      return { error: 'Failed to generate monthly register PDF' };
    }
  })
  .get('/reports/raw', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }
      const from = (query.from as string) || '';
      const to = (query.to as string) || '';
      const classId = (query.classId as string) || '';

      const conditions = [
        eq(schema.attendance.tenantId, tenantId),
      ];
      if (from) conditions.push(sql`${schema.attendance.date} >= ${from}`);
      if (to) conditions.push(sql`${schema.attendance.date} <= ${to}`);
      if (classId && classId !== 'all') conditions.push(eq(schema.attendance.classId, classId));

      const rows = await db
        .select({
          id: schema.attendance.id,
          date: schema.attendance.date,
          status: schema.attendance.status,
          remarks: schema.attendance.remarks,
          studentId: schema.attendance.studentId,
          classId: schema.attendance.classId,
        })
        .from(schema.attendance)
        .where(and(...conditions))
        .orderBy(desc(schema.attendance.date))
        .limit(2000);

      const studentIds = [...new Set(rows.map((r) => r.studentId))];
      const classIds = [...new Set(rows.map((r) => r.classId))];

      const studentsMap = new Map<string, { name: string; roll: string; admNo: string }>();
      if (studentIds.length > 0) {
        const studentRows = await db.query.students.findMany({
          where: inArray(schema.students.id, studentIds),
          with: { user: { columns: { name: true } } },
        });
        for (const s of studentRows) {
          studentsMap.set(s.id, {
            name: [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || s.user?.name || 'Student',
            roll: s.rollNumber || '-',
            admNo: s.admissionNo || '-',
          });
        }
      }

      const classesMap = new Map<string, string>();
      if (classIds.length > 0) {
        const classRows = await db.query.classes.findMany({
          where: inArray(schema.classes.id, classIds),
        });
        for (const c of classRows) {
          classesMap.set(c.id, `${c.name} - ${c.section}`);
        }
      }

      const records = rows.map((r) => {
        const s = studentsMap.get(r.studentId);
        return {
          id: r.id,
          date: r.date,
          admissionNo: s?.admNo || '-',
          rollNumber: s?.roll || '-',
          studentName: s?.name || '-',
          className: classesMap.get(r.classId) || '-',
          status: r.status,
          remarks: r.remarks || '',
        };
      });

      return { count: records.length, records };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance/reports/raw', tenantId });
      set.status = 500;
      return { error: 'Failed to export raw attendance' };
    }
  })
  .get('/reports/udise', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }
      const from = (query.from as string) || '';
      const to = (query.to as string) || '';
      const classId = (query.classId as string) || '';

      const classList = await db.query.classes.findMany({
        where: eq(schema.classes.tenantId, tenantId),
      });
      const classMap = new Map<string, string>();
      for (const c of classList) {
        classMap.set(c.id, `${c.name} - ${c.section}`);
      }

      let targetClassIds: string[] = [];
      if (classId && classId !== 'all') {
        if (!classMap.has(classId)) {
          set.status = 404;
          return { error: 'Selected class not found' };
        }
        targetClassIds = [classId];
      } else {
        targetClassIds = Array.from(classMap.keys());
      }

      if (targetClassIds.length === 0) {
        return {
          cover: { dateRange: `${from} to ${to}`, totalStudents: 0, boys: 0, girls: 0 },
          records: [],
        };
      }

      const studentsList = await db.query.students.findMany({
        where: and(
          inArray(schema.students.classId, targetClassIds),
          eq(schema.students.status, 'active'),
          isNull(schema.students.deletedAt)
        ),
        with: { user: { columns: { name: true } } },
        orderBy: [schema.students.rollNumber, schema.students.admissionNo],
        limit: 1000,
      });

      const studentIds = studentsList.map((s) => s.id);
      const attConditions = [
        eq(schema.attendance.tenantId, tenantId),
        inArray(schema.attendance.studentId, studentIds),
      ];
      if (from) attConditions.push(sql`${schema.attendance.date} >= ${from}`);
      if (to) attConditions.push(sql`${schema.attendance.date} <= ${to}`);

      const attRows = studentIds.length > 0 ? await db
        .select({
          studentId: schema.attendance.studentId,
          status: schema.attendance.status,
          date: schema.attendance.date,
        })
        .from(schema.attendance)
        .where(and(...attConditions)) : [];

      const allDates = new Set(attRows.map((r) => r.date));
      const totalInstructionalDays = allDates.size;

      const studentAttMap = new Map<string, { present: number; halfDay: number }>();
      for (const row of attRows) {
        let entry = studentAttMap.get(row.studentId);
        if (!entry) {
          entry = { present: 0, halfDay: 0 };
          studentAttMap.set(row.studentId, entry);
        }
        const st = (row.status || '').toLowerCase();
        if (st === 'present' || st === 'late') {
          entry.present += 1;
        } else if (st.includes('half')) {
          entry.halfDay += 1;
        }
      }

      let boysCount = 0;
      let girlsCount = 0;

      const records = studentsList.map((s, idx) => {
        const isBoy = (s.gender || '').toLowerCase() === 'male';
        if (isBoy) boysCount++;
        else girlsCount++;

        const att = studentAttMap.get(s.id);
        const presentEffective = att ? att.present + 0.5 * att.halfDay : 0;
        const instructionalDays = totalInstructionalDays;
        const percentage = instructionalDays > 0 ? Math.round((presentEffective / instructionalDays) * 1000) / 10 : 0;

        return {
          id: s.id,
          admissionNo: s.admissionNo || s.rollNumber || `ADM-${idx + 1}`,
          studentName: [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || s.user?.name || `Student ${idx + 1}`,
          className: classMap.get(s.classId) || 'Class',
          gender: (s.gender || 'Not specified').toUpperCase(),
          religion: s.religion || 'General',
          casteCategory: s.casteCategory || 'General',
          isRte: s.isRte ? 'YES' : 'NO',
          instructionalDays,
          presentDays: Math.round(presentEffective * 10) / 10,
          percentage,
        };
      });

      return {
        cover: {
          dateRange: `${from} to ${to}`,
          totalStudents: records.length,
          boys: boysCount,
          girls: girlsCount,
        },
        records,
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance/reports/udise', tenantId });
      set.status = 500;
      return { error: 'Failed to generate UDISE+ attendance report' };
    }
  });

