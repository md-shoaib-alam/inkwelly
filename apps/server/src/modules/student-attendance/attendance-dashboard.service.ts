import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { and, count, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import { formatDate } from '../../lib/date-utils';
import { pickCurrentSession, sessionProgress, type SessionRow } from '../../lib/academic-session';

/**
 * The Students Attendance command center.
 *
 * Every number counts `Attendance` rows. Where the shipped reference shows a status this
 * build cannot produce — late, half-day, leave — the tile comes back in `statusBreakdown`
 * and `untracked` with `tracked: false` and the reason, and the card says "not tracked
 * yet". A zero would read as a school that never marks late arrivals, not a product that
 * never shipped the status.
 *
 * The cohort is scoped by tenant through `Class`, exactly as the Students command center
 * scopes it, so the two screens cannot disagree about how many students are on roll.
 *
 * Attendance is aggregated in SQL rather than loaded per row: a school with 300 students
 * and 12 classes writes 3,600 rows a day, and the screen only ever shows counts. The one
 * grouped SELECT over the widest window the screen reads (session start to today) feeds
 * the calendar, the week, the previous month and the session figure, so the whole screen
 * costs one round trip over ~500 grouped rows.
 */

/** The five statuses the reference lists, in the order it lists them. */
export const STATUS_KEYS = ['present', 'late', 'halfDay', 'leave', 'absent'] as const;

/**
 * The statuses a student-side screen can actually write. `attendance.routes.ts` and the
 * marking UI deal in these two and nothing else; `late`, `half_day` and `leave` exist only
 * on `StaffAttendance`, which is a different table about a different population.
 */
export const TRACKED_STATUSES = new Set(['present', 'absent']);

export const DEFAULT_CUTOFF = '09:00';
export const DEFAULT_TARGET = 92;

/** The tiles the reference shows and this build cannot answer, each with what is missing. */
export const UNTRACKED_TILES = [
  {
    key: 'late',
    label: 'Late',
    reason: 'Nothing writes a late status for a student; the register only records present or absent.',
  },
  {
    key: 'halfDay',
    label: 'Half day',
    reason: 'Half day is a staff attendance status; no student-side screen can set one.',
  },
  {
    key: 'leave',
    label: 'On leave',
    reason: 'A sanctioned leave is not joined to the attendance row, so it cannot be counted apart from an absence.',
  },
];

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  // The reference shows one decimal on every rate, so the rounding happens here rather
  // than in each card — otherwise two cards can disagree about the same number.
  return Math.round((part / whole) * 1000) / 10;
}

/** A `YYYY-MM-DD` shifted by whole days, read in UTC so a DST never moves the date. */
export function shiftDay(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

/** The first and last day of the month `iso` sits in, inclusive. */
export function monthBounds(iso: string): { start: string; end: string } {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return { start: iso, end: iso };
  const d = new Date(t);
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
}

/** The `YYYY-MM` key of a day. */
export function monthKeyOf(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 7) : '';
}

/**
 * The month whose grid the calendar draws. The screen's chevrons move this without
 * moving any rate: the session, the week and the comparison month all stay anchored on
 * today, so a school looking back at July sees July's days measured against the target
 * it has now.
 */
export function monthBoundsOfKey(key: string | null | undefined, today: string): { start: string; end: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(key ?? '');
  if (!match) return monthBounds(today);
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) return monthBounds(today);
  return {
    start: `${year}-${String(monthNumber).padStart(2, '0')}-01`,
    end: new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10),
  };
}

/**
 * The month before `iso`'s own, as a bound pair. The session-average delta compares
 * against this, because "the month before the one you are in" is the only comparison a
 * school can check on the same screen.
 */
export function previousMonthBounds(iso: string): { start: string; end: string } {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return monthBounds(iso);
  const d = new Date(t);
  const anchor = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0));
  return monthBounds(anchor.toISOString().slice(0, 10));
}

/** 0 = Sunday, as JS reports it. */
export function weekdayOf(iso: string): number {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? 0 : new Date(t).getUTCDay();
}

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Whether the school keeps this day. The names come from the tenant's own `workingDays`,
 * which defaults to Monday–Saturday; a holiday outranks it, because a school that keeps
 * Saturday still shuts for a holiday on one.
 */
export function isSchoolDay(
  iso: string,
  workingDays: string[],
  holidayDates: Set<string>,
): boolean {
  if (holidayDates.has(iso)) return false;
  const name = WEEKDAY_NAMES[weekdayOf(iso)];
  if (!name) return false;
  // An absent or empty setting is not "no working days", it is the default the API itself
  // returns, so the calendar keeps Monday–Saturday rather than going blank.
  const days = workingDays.length ? workingDays : WEEKDAY_NAMES.slice(1, 7);
  return days.includes(name);
}

export type DayCounts = { present: number; absent: number };

/** present / (present + absent) over a set of days, as a whole percentage. */
export function rateOver(days: DayCounts[]): number {
  let present = 0;
  let marked = 0;
  for (const d of days) {
    present += d.present;
    marked += d.present + d.absent;
  }
  return pct(present, marked);
}

/** The share of the roll that walked in today — what the reference's "% in school" means. */
export function inSchoolRate(present: number, rollStrength: number): number {
  return pct(present, rollStrength);
}

/**
 * The calendar band a day falls in, measured against the school's own target rather than
 * a constant: Good at or above it, Watch within ten points under it, Critical below that.
 */
export function bandOf(rate: number, target: number): 'good' | 'watch' | 'critical' {
  if (rate >= target) return 'good';
  if (rate >= target - 10) return 'watch';
  return 'critical';
}

/** Percentage points between two rates, or null when one of them has nothing to compare. */
export function deltaPoints(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  return Math.round((current - previous) * 10) / 10;
}

/**
 * The cutoff as minutes past midnight, or null when a school has stored something that is
 * not a clock time. The screen shows the text; only the "N left" count needs the number.
 */
export function minutesOf(cutoffTime: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(cutoffTime);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function pastCutoff(now: Date, cutoffTime: string): boolean {
  const cutoff = minutesOf(cutoffTime);
  if (cutoff === null) return false;
  return now.getHours() * 60 + now.getMinutes() >= cutoff;
}

type ClassRow = { id: string; name: string; section: string; grade: string };

export const AttendanceDashboardService = {
  async commandCenter(tenantId: string, requestedYear?: string | null, requestedMonth?: string | null) {
    const today = formatDate();
    const now = new Date();

    const [classRows, yearRows, settingRow, tenantRow] = await Promise.all([
      db
        .select({
          id: schema.classes.id,
          name: schema.classes.name,
          section: schema.classes.section,
          grade: schema.classes.grade,
        })
        .from(schema.classes)
        .where(eq(schema.classes.tenantId, tenantId)),
      db
        .select({
          name: schema.academicYears.name,
          startDate: schema.academicYears.startDate,
          endDate: schema.academicYears.endDate,
          isCurrent: schema.academicYears.isCurrent,
          status: schema.academicYears.status,
        })
        .from(schema.academicYears)
        .where(eq(schema.academicYears.tenantId, tenantId)),
      db.query.attendanceSettings.findFirst({
        where: eq(schema.attendanceSettings.tenantId, tenantId),
        columns: { cutoffTime: true, targetRate: true },
      }),
      db.select({ settings: schema.tenants.settings }).from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1),
    ]);

    const classes = classRows as ClassRow[];
    const classIds = classes.map((c) => c.id);
    const cutoffTime = settingRow?.cutoffTime ?? DEFAULT_CUTOFF;
    const target = settingRow?.targetRate ?? DEFAULT_TARGET;

    let workingDays: string[] = [];
    const blob = tenantRow[0]?.settings;
    if (blob && blob.trim() && blob !== '{}') {
      try {
        const parsed = JSON.parse(blob) as { workingDays?: unknown };
        if (Array.isArray(parsed.workingDays)) {
          workingDays = parsed.workingDays.filter((d): d is string => typeof d === 'string');
        }
      } catch {
        // A blob that will not parse is the default working week, not an error screen.
      }
    }

    const session = pickCurrentSession(yearRows as SessionRow[], requestedYear, today);
    const progress = session ? sessionProgress(session.startDate, session.endDate, today) : null;

    const month = monthBoundsOfKey(requestedMonth, today);
    const previous = previousMonthBounds(today);
    // One window covers everything the screen adds up: the session so far, the month on
    // the grid, the month before this one, and the trailing week. Widest start wins.
    const windowStart = [session?.startDate ?? today, month.start, previous.start, shiftDay(today, -6)]
      .filter(Boolean)
      .sort()[0] as string;

    const [rollRows, dayRows, todayClassRows, teacherRows, holidayRows] = await Promise.all([
      // The roll this screen counts against: the same cohort the Students command center
      // counts, active only, so "259 of 297" means the same 297 on both screens.
      classIds.length
        ? db
            .select({ classId: schema.students.classId, students: count() })
            .from(schema.students)
            .where(
              and(
                inArray(schema.students.classId, classIds),
                eq(schema.students.status, 'active'),
                isNull(schema.students.deletedAt),
              ),
            )
            .groupBy(schema.students.classId)
        : Promise.resolve([] as { classId: string; students: number }[]),
      db
        .select({
          date: schema.attendance.date,
          status: schema.attendance.status,
          students: count(),
        })
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.tenantId, tenantId),
            gte(schema.attendance.date, windowStart),
            lte(schema.attendance.date, today),
          ),
        )
        .groupBy(schema.attendance.date, schema.attendance.status),
      classIds.length
        ? db
            .select({
              classId: schema.attendance.classId,
              status: schema.attendance.status,
              students: count(),
            })
            .from(schema.attendance)
            .where(
              and(
                eq(schema.attendance.tenantId, tenantId),
                eq(schema.attendance.date, today),
                inArray(schema.attendance.classId, classIds),
              ),
            )
            .groupBy(schema.attendance.classId, schema.attendance.status)
        : Promise.resolve([] as { classId: string; status: string; students: number }[]),
      // The teacher a parent would be told to chase, one per class, name and photo included.
      classIds.length
        ? db
            .select({
              classId: schema.classTeachers.classId,
              name: schema.users.name,
              avatar: schema.users.avatar,
            })
            .from(schema.classTeachers)
            .innerJoin(schema.teachers, eq(schema.classTeachers.teacherId, schema.teachers.id))
            .innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
            .where(and(inArray(schema.classTeachers.classId, classIds), eq(schema.classTeachers.isClassTeacher, true)))
        : Promise.resolve([] as { classId: string; name: string; avatar: string | null }[]),
      db
        .select({
          date: schema.events.date,
          endDate: schema.events.endDate,
          title: schema.events.title,
          type: schema.events.type,
        })
        .from(schema.events)
        .where(
          and(
            eq(schema.events.tenantId, tenantId),
            inArray(schema.events.type, ['holiday', 'event']),
            // Anything starting after the month cannot overlap it. A break that started
            // before the month and still runs into it is caught here and clamped in JS.
            lte(schema.events.date, month.end),
          ),
        ),
    ]);

    const rollByClass = new Map(rollRows.map((r) => [r.classId, r.students]));
    const rollStrength = rollRows.reduce((sum, r) => sum + r.students, 0);

    const countsByDay = new Map<string, DayCounts>();
    for (const row of dayRows) {
      const key = String(row.date).slice(0, 10);
      const cell = countsByDay.get(key) ?? { present: 0, absent: 0 };
      if (row.status === 'present') cell.present += row.students;
      else if (row.status === 'absent') cell.absent += row.students;
      countsByDay.set(key, cell);
    }
    const daysIn = (from: string, to: string): DayCounts[] =>
      [...countsByDay.entries()].filter(([d]) => d >= from && d <= to).map(([, c]) => c);

    const todayByStatus = new Map<string, { present: number; absent: number; marked: number }>();
    for (const row of todayClassRows) {
      const cell = todayByStatus.get(row.classId) ?? { present: 0, absent: 0, marked: 0 };
      if (row.status === 'present') cell.present += row.students;
      else if (row.status === 'absent') cell.absent += row.students;
      // Anything the register wrote counts as marked, so an unexpected status shows up as a
      // marked class with a short present + absent total rather than vanishing.
      cell.marked += row.students;
      todayByStatus.set(row.classId, cell);
    }

    const teacherByClass = new Map<string, { name: string; avatar: string | null }>();
    for (const row of teacherRows) {
      if (!teacherByClass.has(row.classId)) teacherByClass.set(row.classId, { name: row.name, avatar: row.avatar });
    }

    // --- The month's named days: a holiday closes the school, an event only marks the cell. ---
    const holidayDates = new Set<string>();
    const marks = new Map<string, { name: string; kind: 'holiday' | 'event' }>();
    for (const row of holidayRows) {
      const from = String(row.date ?? '').slice(0, 10);
      const rawTo = String(row.endDate ?? '').slice(0, 10);
      const to = rawTo >= from ? rawTo : from;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) continue;
      const kind = row.type === 'holiday' ? ('holiday' as const) : ('event' as const);
      // Clamped to the month at both ends, so an event that runs past it or a mistyped
      // far-future end date can never widen this loop past 31 steps.
      let walk = from < month.start ? month.start : from;
      const last = to > month.end ? month.end : to;
      while (walk <= last) {
        if (kind === 'holiday') holidayDates.add(walk);
        // The first name on a day wins, and a holiday outranks an event sharing it, because
        // the chip has to say why the school is shut if it is shut.
        const existing = marks.get(walk);
        if (!existing || (existing.kind === 'event' && kind === 'holiday')) marks.set(walk, { name: row.title, kind });
        walk = shiftDay(walk, 1);
      }
    }

    // --- Today. ---
    const todayCounts = countsByDay.get(today) ?? { present: 0, absent: 0 };
    const markedToday = [...todayByStatus.values()].reduce((sum, c) => sum + c.marked, 0);
    const presentToday = todayCounts.present;
    const absentToday = todayCounts.absent;
    const unmarkedToday = Math.max(0, rollStrength - markedToday);

    // --- Marking progress. ---
    const markingRows = classes
      .map((c) => {
        const counts = todayByStatus.get(c.id) ?? { present: 0, absent: 0, marked: 0 };
        const students = rollByClass.get(c.id) ?? 0;
        const teacher = teacherByClass.get(c.id);
        return {
          classId: c.id,
          label: `${c.name}${c.section ? ` - ${c.section}` : ''}`,
          marked: counts.marked > 0,
          studentsMarked: counts.marked,
          studentsOnRoll: students,
          present: counts.present,
          absent: counts.absent,
          rate: inSchoolRate(counts.present, students),
          teacherName: teacher?.name ?? '',
          teacherAvatar: teacher?.avatar ?? null,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    const markedClasses = markingRows.filter((r) => r.marked).length;
    const totalClasses = markingRows.length;

    // --- Rates, all from the one grouped window. ---
    const week = daysIn(shiftDay(today, -6), today);
    const weekRate = rateOver(week);
    const sessionDays = session ? daysIn(session.startDate > today ? today : session.startDate, today) : [];
    const sessionRate = session ? rateOver(sessionDays) : 0;
    const previousDays = daysIn(previous.start, previous.end);
    // A month nobody has marked in has no rate to compare against; 0 there would read as a
    // collapse, so the tile gets null and the chip is not drawn.
    const previousMonthRate = previousDays.length ? rateOver(previousDays) : null;

    // --- Calendar: every day of this month, with the rate the register supports. ---
    const calendarDays: Array<{
      date: string;
      dayOfMonth: number;
      rate: number;
      marked: boolean;
      isSchoolDay: boolean;
      isHoliday: boolean;
      markName: string;
      band: string;
    }> = [];
    for (let cursor = month.start; cursor <= month.end; cursor = shiftDay(cursor, 1)) {
      const counts = countsByDay.get(cursor);
      const marked = !!counts && counts.present + counts.absent > 0;
      const rate = counts ? inSchoolRate(counts.present, rollStrength) : 0;
      const off = !isSchoolDay(cursor, workingDays, holidayDates);
      calendarDays.push({
        date: cursor,
        dayOfMonth: Number(cursor.slice(8, 10)),
        rate: marked ? rate : 0,
        marked,
        isSchoolDay: !off,
        isHoliday: holidayDates.has(cursor),
        markName: marks.get(cursor)?.name ?? '',
        band: off ? 'off' : marked ? bandOf(rate, target) : 'unmarked',
      });
    }

    const statusCounts: Record<string, number> = {
      present: presentToday,
      late: 0,
      halfDay: 0,
      leave: 0,
      absent: absentToday,
    };
    const STATUS_LABELS: Record<string, string> = {
      present: 'Present',
      late: 'Late',
      halfDay: 'Half-day',
      leave: 'Leave',
      absent: 'Absent',
    };
    const statusBreakdown = [
      ...STATUS_KEYS.map((key) => ({
        key,
        label: STATUS_LABELS[key] ?? key,
        students: statusCounts[key] ?? 0,
        share: pct(statusCounts[key] ?? 0, rollStrength),
        kind: 'students' as const,
        tracked: key === 'present' || key === 'absent',
        reason: UNTRACKED_TILES.find((t) => t.key === key)?.reason ?? '',
      })),
      {
        // The reference's sixth column counts classes, not children: the registers a
        // teacher still has to open. It is a real number, so it is tracked.
        key: 'unmarkedClasses',
        label: 'Unmarked classes',
        students: totalClasses - markedClasses,
        share: pct(totalClasses - markedClasses, totalClasses),
        kind: 'classes' as const,
        tracked: true,
        reason: '',
      },
    ];

    return {
      session: session
        ? {
            name: session.name,
            isCurrent: !!session.isCurrent,
            startDate: session.startDate,
            endDate: session.endDate,
            totalDays: progress?.totalDays ?? 0,
            dayNumber: progress?.dayNumber ?? 0,
            percentComplete: progress?.percentComplete ?? 0,
          }
        : null,
      settings: {
        cutoffTime,
        targetRate: target,
        // Whether the register is still open on this screen's own clock. A school that has
        // not marked anything by the cutoff is the case the tile is there to catch.
        cutoffPassed: pastCutoff(now, cutoffTime),
        isSchoolDayToday: isSchoolDay(today, workingDays, holidayDates),
        todayHolidayName: holidayDates.has(today) ? marks.get(today)?.name ?? '' : '',
      },
      stats: {
        todayRate: inSchoolRate(presentToday, rollStrength),
        presentToday,
        absentToday,
        unmarkedToday,
        rollStrength,
        markedClasses,
        totalClasses,
        classesLeft: totalClasses - markedClasses,
        weekRate,
        sessionRate,
        previousMonthRate,
        sessionRateDelta: deltaPoints(sessionRate, previousMonthRate),
        todayRateDelta: deltaPoints(inSchoolRate(presentToday, rollStrength), weekRate),
      },
      // The day every number above was measured on, so the header cannot drift from the
      // figures when the school's clock and the browser's disagree.
      today,
      statusBreakdown,
      marking: markingRows,
      calendar: calendarDays,
      monthLabel: new Date(`${month.start}T00:00:00Z`).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      displayedMonth: monthKeyOf(month.start),
      monthMarks: [...marks.entries()]
        .map(([date, mark]) => ({ date, name: mark.name, kind: mark.kind }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)),
      untracked: UNTRACKED_TILES,
    };
  },
};
