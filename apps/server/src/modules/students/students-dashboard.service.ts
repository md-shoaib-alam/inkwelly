import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { and, count, eq, inArray, isNull, notInArray } from 'drizzle-orm';
import { formatDate } from '../../lib/date-utils';
import {
  pickCurrentSession,
  sessionProgress,
  type SessionRow,
} from '../../lib/academic-session';

/**
 * The Students command center.
 *
 * Every number here counts rows that exist. Where the shipped reference shows
 * something this schema cannot answer — a religion, a reservation category, a document,
 * an Aadhaar number — the tile comes back in `untracked` with the reason and the card
 * says "Not collected in this build". A zero would be worse: it reads as a school that
 * failed to do something, not a product that never shipped it.
 *
 * The cohort is scoped by tenant through `Class`, not by `Student.academicYear`. Two
 * reasons: that is how the roster lists students, so the two screens cannot disagree
 * about the total; and `academicYear` is free text that schools — and our own seed —
 * leave out of step with the `AcademicYear` rows, so filtering on it empties the screen.
 * The session is still resolved and reported, and it frames the admission window, the
 * age floor and the enrolment curve.
 *
 * One SELECT of the cohort's own columns, then the derivations in JS. Splitting it into
 * group-bys would have been eight round trips to arrive at the same rows, because the
 * age pyramid, the birthday list and the completeness figure all need a per-student
 * date of birth, and that is stored as text too loose to cast safely in SQL.
 */

/** Class-stage bands from NEP 2020 — the same bands the Academics screen plots. */
export const NEP_STAGES = [
  { key: 'foundational', label: 'Foundational', min: 1, max: 3 },
  { key: 'preparatory', label: 'Preparatory', min: 4, max: 5 },
  { key: 'middle', label: 'Middle', min: 6, max: 8 },
  { key: 'secondary', label: 'Secondary', min: 9, max: 12 },
];
const NEP_GRADE_MIN = 1;
const NEP_GRADE_MAX = 12;

/** The reference's five plotted bands. Outside them is still real data, so it stays visible. */
export const AGE_BANDS = ['3-5', '6-8', '9-11', '12-14', '15-17'];

/**
 * The tiles the shipped design shows and this build cannot answer, each with what is
 * missing. Rendered as disabled cards so the screen keeps its shape and the reason is
 * on the screen rather than in a ticket nobody reads.
 */
export const UNTRACKED_TILES = [
  {
    key: 'category',
    label: 'Category',
    reason: 'No reservation category is stored on a student record.',
  },
  {
    key: 'documents',
    label: 'Document completeness',
    reason: 'No document table exists, so nothing records what has been uploaded.',
  },
  {
    key: 'compliance',
    label: 'Compliance',
    reason: 'Aadhaar, APAAR, RTE and CWSN are not fields on a student record.',
  },
  {
    key: 'duplicates',
    label: 'Duplicate identifiers',
    reason: 'No identifier column exists, so there is nothing to match duplicates on.',
  },
  {
    key: 'religion',
    label: 'Religion',
    reason: 'No religion field exists on a student record.',
  },
  {
    key: 'motherTongue',
    label: 'Mother tongue',
    reason: 'No mother tongue field exists on a student record.',
  },
  {
    key: 'transfers',
    label: 'Transferred in',
    reason: 'A class move is written to the audit trail as a student update, the same row a profile edit leaves, so the two cannot be counted apart.',
  },
];

function pct(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

function dayEpoch(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

function gradeNum(grade: string | number | null | undefined): number | null {
  const g = typeof grade === 'number' ? grade : Number.parseInt(String(grade ?? ''), 10);
  return Number.isFinite(g) ? g : null;
}

export function nepStageKey(grade: string | number | null | undefined): string {
  const g = gradeNum(grade);
  if (g === null || g < NEP_GRADE_MIN || g > NEP_GRADE_MAX) return 'unclassified';
  return NEP_STAGES.find((s) => g >= s.min && g <= s.max)?.key ?? 'unclassified';
}

/** Whole years completed on `on`, so a nine-year-old is not counted as ten. */
export function ageYearsOn(dob: string | null | undefined, on: string): number | null {
  const birth = dayEpoch(dob);
  const then = dayEpoch(on);
  if (birth === null || then === null || then < birth) return null;
  const b = new Date(birth);
  const t = new Date(then);
  let years = t.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    t.getUTCMonth() < b.getUTCMonth() ||
    (t.getUTCMonth() === b.getUTCMonth() && t.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) years--;
  return years >= 0 ? years : null;
}

export function ageBandOf(age: number): string {
  if (age < 3) return 'under-3';
  if (age > 17) return 'over-17';
  return (
    AGE_BANDS.find((band) => {
      const [lo, hi] = band.split('-').map(Number);
      return lo !== undefined && hi !== undefined && age >= lo && age <= hi;
    }) ?? 'other'
  );
}

/**
 * The age a child has usually reached by the time they sit in that grade. Grade 1 at six
 * is the NEP floor and each grade adds a year; a grade we cannot read has no floor, so
 * it can never be wrongly blamed for it.
 */
export function expectedMinAgeForGrade(grade: string | number | null | undefined): number | null {
  const g = gradeNum(grade);
  if (g === null || g < NEP_GRADE_MIN || g > NEP_GRADE_MAX) return null;
  return g + 5;
}

export function youngerThanExpected(input: {
  grade: string | number | null;
  dob: string | null;
  on: string;
}): boolean {
  const floor = expectedMinAgeForGrade(input.grade);
  if (floor === null) return false;
  const age = ageYearsOn(input.dob, input.on);
  return age !== null && age < floor;
}

/** The four fields a `Student` row actually carries. */
export function profileFieldCount(row: {
  dateOfBirth: string | null;
  bloodGroup: string | null;
  parentId: string | null;
  rollNumber: string | null;
}): number {
  return [row.dateOfBirth, row.bloodGroup, row.parentId, row.rollNumber].filter((v) =>
    typeof v === 'string' ? v.trim().length > 0 : v != null,
  ).length;
}

/** The share of students complete on *every* field, which is what "complete" means. */
export function profileCompletenessPct(
  rows: {
    dateOfBirth: string | null;
    bloodGroup: string | null;
    parentId: string | null;
    rollNumber: string | null;
  }[],
): number {
  if (rows.length === 0) return 0;
  return pct(rows.filter((r) => profileFieldCount(r) === 4).length, rows.length);
}

/** The middle of the sorted list; the lower of the two middles when the count is even. */
export function medianAge(ages: number[]): number | null {
  if (ages.length === 0) return null;
  const sorted = [...ages].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? null;
}

export function monthKey(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  return iso.slice(0, 7);
}

/** Inclusive at both ends, so a session's first and last day both count. */
export function inWindow(iso: string | null | undefined, from: string, to: string): boolean {
  const day = dayEpoch(iso);
  const start = dayEpoch(from);
  const end = dayEpoch(to);
  return day !== null && start !== null && end !== null && day >= start && day <= end;
}

/**
 * The `YYYY-MM` keys ending with the month `today` sits in, `span` of them.
 *
 * The trend cards are framed on the session the school is running, because that is what
 * they claim on their face — "across the session", "this session". With no session row
 * there is nothing to frame on, so the caller asks for a trailing year instead, which is
 * the shortest span that still reads as a trend.
 */
export function trendMonths(today: string, span = 12): string[] {
  const key = monthKey(today);
  if (!key || span < 1) return [];
  const parts = key.split('-').map(Number);
  let y = parts[0];
  let m = parts[1];
  if (!y || !m) return [];
  const out: string[] = [];
  for (let i = 0; i < span; i++) {
    out.unshift(`${y}-${String(m).padStart(2, '0')}`);
    if (--m < 1) {
      m = 12;
      y--;
    }
  }
  return out;
}

/**
 * How many months of axis a window needs, inclusive at both ends. Without a session start
 * there is no window to measure, and the caller keeps the trailing year it defaults to.
 */
export function monthSpan(from: string | null | undefined, to: string): number {
  const a = monthKey(from);
  const b = monthKey(to);
  if (!a || !b) return 12;
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  if (!ay || !am || !by || !bm) return 12;
  return Math.max(1, (by - ay) * 12 + (bm - am) + 1);
}

function monthLabel(key: string): string {
  const parts = key.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  if (!y || !m) return key;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'short',
    timeZone: 'UTC',
  });
}

/** A 2024 leap year stands in for "this day of the year", so 29 February still counts. */
function dayOfYear(isoMonthDay: string): number {
  const parts = isoMonthDay.split('-').map(Number);
  const m = parts[0];
  const d = parts[1];
  if (!m || !d) return -1;
  return Math.floor(Date.UTC(2024, m - 1, d) / 86400000);
}

/**
 * The newest of a set of ISO stamps, or null when none of them is set. Fixed-width UTC,
 * so the greatest string is the greatest instant and there is no parsing to get wrong.
 */
export function latestStamp(stamps: (string | null)[]): string | null {
  let newest: string | null = null;
  for (const s of stamps) if (s && (!newest || s > newest)) newest = s;
  return newest;
}

/** Whole days between two `YYYY-MM-DD` dates, clamped at zero for a clock skew. */
export function daysSince(iso: string, today: string): number {
  const at = Date.parse(`${iso}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(at) || Number.isNaN(now)) return 0;
  return Math.max(0, Math.round((now - at) / 86400000));
}

type Student = {
  id: string;
  name: string;
  classId: string;
  gender: string;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  parentId: string | null;
  rollNumber: string;
  status: string;
  admissionDate: string;
  updatedAt: string | null;
};

type ClassRow = {
  id: string;
  name: string;
  section: string;
  grade: string;
  capacity: number;
};

/** A count of rows a school can go and fix, with the screen that lists them. */
type StudentAlert = {
  code: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  title: string;
  detail: string;
  screen: string;
};

export const StudentsDashboardService = {
  async commandCenter(tenantId: string, requestedYear?: string | null) {
    const today = formatDate();

    const [classRows, yearRows] = await Promise.all([
      db
        .select({
          id: schema.classes.id,
          name: schema.classes.name,
          section: schema.classes.section,
          grade: schema.classes.classLevel,
          capacity: schema.classes.capacity,
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
    ]);

    const classes = classRows as ClassRow[];
    const classIds = classes.map((c) => c.id);
    const classById = new Map(classes.map((c) => [c.id, c]));

    const session = pickCurrentSession(yearRows as SessionRow[], requestedYear, today);
    const progress = session ? sessionProgress(session.startDate, session.endDate, today) : null;
    // With no session row there is nothing to frame a year against, and inventing one
    // would put a date on the screen that no school ever set.
    const windowStart = session?.startDate ?? null;
    const windowEnd = session?.endDate ?? today;

    // These two counts share no input with the cohort fetch or each other, so all
    // three run at once; each is awaited where its number is actually needed.
    // `classId` is NOT NULL, so an orphan points at a class that has since been deleted.
    // The join below cannot see those rows, which is why this needs its own count.
    const orphanedQ = classIds.length
      ? db
          .select({ n: count() })
          .from(schema.students)
          .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
          .where(
            and(
              eq(schema.users.tenantId, tenantId),
              notInArray(schema.students.classId, classIds),
              isNull(schema.students.deletedAt),
            ),
          )
          .then((r) => Number(r[0]?.n ?? 0))
      : Promise.resolve(0);
    // A promotion is a fact only once it has run; a pending row is still a plan. With no
    // session row there is no "this session" to count inside, so the tile says none.
    const promotedQ = session
      ? db
          .select({ n: count() })
          .from(schema.promotions)
          .where(
            and(
              eq(schema.promotions.tenantId, tenantId),
              eq(schema.promotions.academicYear, session.name),
              eq(schema.promotions.status, 'completed'),
            ),
          )
          .then((r) => Number(r[0]?.n ?? 0))
      : Promise.resolve(0);

    const cohort = classIds.length
      ? ((
          await db
            .select({
              id: schema.students.id,
              name: schema.users.name,
              classId: schema.students.classId,
              gender: schema.students.gender,
              dateOfBirth: schema.students.dateOfBirth,
              bloodGroup: schema.students.bloodGroup,
              parentId: schema.students.parentId,
              rollNumber: schema.students.rollNumber,
              status: schema.students.status,
              admissionDate: schema.students.admissionDate,
              updatedAt: schema.students.updatedAt,
            })
            .from(schema.students)
            .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
            .where(and(inArray(schema.students.classId, classIds), isNull(schema.students.deletedAt)))
        ).map((r) => ({
          ...r,
          // `updatedAt` is what every tile reads, and it is a date; the footer needs the
          // clock too, so the instant is kept beside it rather than reconstructed.
          stampedAt: r.updatedAt ? (r.updatedAt as Date).toISOString() : null,
          updatedAt: r.updatedAt ? formatDate(r.updatedAt as Date) : null,
        })))
      : [];

    const active = cohort.filter((r) => r.status === 'active');
    const withdrawn = cohort.filter((r) => r.status === 'withdrawn');
    const graduated = cohort.filter((r) => r.status === 'graduated');

    const boys = active.filter((r) => r.gender === 'male').length;
    const girls = active.filter((r) => r.gender === 'female').length;

    const ages = active
      .map((r) => ageYearsOn(r.dateOfBirth, today))
      .filter((a): a is number => a !== null);
    const median = medianAge(ages);

    const admittedThisSession =
      windowStart === null
        ? 0
        : active.filter((r) => inWindow(r.admissionDate, windowStart, windowEnd)).length;

    // --- Classes, and the capacity a school set for each one. ---
    const classStrength = classes
      .map((c) => {
        const inClass = active.filter((r) => r.classId === c.id);
        return {
          classId: c.id,
          label: `${c.name} - ${c.section}`,
          students: inClass.length,
          boys: inClass.filter((r) => r.gender === 'male').length,
          girls: inClass.filter((r) => r.gender === 'female').length,
          capacity: c.capacity,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    // Sorted by overflow so the first entry is the class a school most needs to see.
    const overCapacity = classStrength
      .filter((c) => c.students > c.capacity)
      .sort((a, b) => b.students - b.capacity - (a.students - a.capacity));
    const worstOver = overCapacity[0] ?? null;
    const largest = classStrength.length
      ? classStrength.reduce((best, c) => (c.students > best.students ? c : best))
      : null;

    // --- Alerts: each one counts rows a school can go and fix. ---
    const noGuardian = active.filter((r) => !r.parentId).length;
    const noDob = active.filter((r) => !r.dateOfBirth).length;
    const tooYoung =
      windowStart === null
        ? 0
        : active.filter((r) =>
            youngerThanExpected({ grade: classById.get(r.classId)?.grade ?? null, dob: r.dateOfBirth, on: windowStart }),
          ).length;
    const orphaned = await orphanedQ;

    const candidates: (StudentAlert | false)[] = [
      orphaned > 0 && {
        code: 'STUDENTS_WITHOUT_CLASS',
        severity: 'high',
        count: orphaned,
        title: `${plural(orphaned, 'student is', 'students are')} not assigned to any class`,
        detail: 'Their class record was deleted, so they sit in no register and no report.',
        screen: 'list',
      },
      noGuardian > 0 && {
        code: 'STUDENTS_WITHOUT_GUARDIAN',
        severity: 'high',
        count: noGuardian,
        title: `${plural(noGuardian, 'student has', 'students have')} no parent or guardian on record`,
        detail: 'Fee reminders, notices and attendance messages have nobody to reach.',
        screen: 'list',
      },
      tooYoung > 0 && {
        code: 'STUDENTS_YOUNGER_THAN_GRADE',
        severity: 'medium',
        count: tooYoung,
        title: `${plural(tooYoung, 'student is', 'students are')} younger than their class usually expects`,
        detail: 'Below the NEP age floor of one year per class level, measured at the start of the session.',
        screen: 'list',
      },
      noDob > 0 && {
        code: 'STUDENTS_WITHOUT_DOB',
        severity: 'medium',
        count: noDob,
        title: `${plural(noDob, 'student has', 'students have')} no date of birth recorded`,
        detail: 'The age pyramid, birthday wishes and every age-based report skip these students.',
        screen: 'list',
      },
      worstOver !== null && {
        code: 'CLASSES_OVER_CAPACITY',
        severity: 'medium',
        count: overCapacity.length,
        title: `${plural(overCapacity.length, 'class is', 'classes are')} over their seated capacity`,
        detail: `Worst is ${worstOver.students} in ${worstOver.label} against ${worstOver.capacity} seats.`,
        screen: 'classes',
      },
    ];
    const alerts = candidates.filter((a): a is StudentAlert => a !== false);

    // --- Birthdays in the next ten days, wrapping the year boundary. ---
    const todayDoy = dayOfYear(today.slice(5));
    const birthdays = active
      .flatMap((r) => {
        const date = r.dateOfBirth;
        if (!date) return [];
        const doy = dayOfYear(date.slice(5));
        if (doy < 0) return [];
        const away = (((doy - todayDoy) % 366) + 366) % 366;
        return away > 0 && away <= 10 ? [{ student: r, date, away }] : [];
      })
      .sort((a, b) => a.away - b.away || a.student.name.localeCompare(b.student.name))
      .slice(0, 10)
      .map((b) => ({
        id: b.student.id,
        name: b.student.name,
        className: `${classById.get(b.student.classId)?.name ?? 'Unassigned'} - ${classById.get(b.student.classId)?.section ?? '—'}`,
        date: b.date,
        daysAway: b.away,
      }));

    // --- Recent profile changes. `updatedAt` is the only stamp a student row keeps, so
    // this is "last touched" and not an audit trail — it cannot say who or what changed.
    const recentActivity = active
      .filter((r) => r.updatedAt)
      .sort((a, b) => (a.updatedAt! < b.updatedAt! ? 1 : -1))
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        name: r.name,
        className: `${classById.get(r.classId)?.name ?? 'Unassigned'} - ${classById.get(r.classId)?.section ?? '—'}`,
        at: r.updatedAt!,
        daysAgo: daysSince(r.updatedAt!, today),
      }));

    // The footer's "Updated …" is when a record last changed, not when this query ran.
    const lastUpdated = latestStamp(active.map((r) => r.stampedAt));

    // --- Composition ---
    const stageOf = (r: Student) => nepStageKey(classById.get(r.classId)?.grade);
    const stages = NEP_STAGES.map((stage) => ({
      key: stage.key,
      label: stage.label,
      students: active.filter((r) => stageOf(r) === stage.key).length,
    }));
    const unclassified = active.filter((r) => stageOf(r) === 'unclassified').length;
    if (unclassified > 0) {
      stages.push({ key: 'unclassified', label: 'Unclassified', students: unclassified });
    }

    // The five reference bands always appear. The two edge bands appear only when a child
    // really sits outside them — an 18-year-old in Grade 12 would otherwise count toward
    // `total` while vanishing from the chart.
    const agePyramid = [...AGE_BANDS, 'under-3', 'over-17']
      .map((band) => {
        const inBand = active.filter((r) => {
          const a = ageYearsOn(r.dateOfBirth, today);
          return a !== null && ageBandOf(a) === band;
        });
        return {
          band,
          boys: inBand.filter((r) => r.gender === 'male').length,
          girls: inBand.filter((r) => r.gender === 'female').length,
        };
      })
      .filter((row, i) => i < AGE_BANDS.length || row.boys + row.girls > 0);

    const promoted = await promotedQ;

    // --- Trends: the session the school is running, or a trailing year with no session. ---
    const months = trendMonths(today, monthSpan(windowStart, today));
    const movement = months.map((m) => ({
      month: m,
      label: monthLabel(m),
      admissions: active.filter((r) => monthKey(r.admissionDate) === m).length,
      withdrawals: withdrawn.filter((r) => monthKey(r.updatedAt) === m).length,
    }));
    const enrolment = months.map((m) => ({
      period: m,
      label: monthLabel(m),
      students: active.filter((r) => {
        const k = monthKey(r.admissionDate);
        return k !== null && k <= m;
      }).length,
    }));

    return {
      session: session
        ? {
            name: session.name,
            isCurrent: session.isCurrent,
            startDate: session.startDate,
            endDate: session.endDate,
            totalDays: progress?.totalDays ?? 0,
            dayNumber: progress?.dayNumber ?? 0,
            percentComplete: progress?.percentComplete ?? 0,
          }
        : null,
      stats: {
        total: active.length,
        admissions: admittedThisSession,
        withdrawals: withdrawn.length,
        graduated: graduated.length,
        promoted,
        profileCompletePercent: profileCompletenessPct(active),
        boys,
        girls,
        otherGenders: active.length - boys - girls,
        medianAge: median ?? 0,
        youngestAge: ages.length ? Math.min(...ages) : 0,
        oldestAge: ages.length ? Math.max(...ages) : 0,
        ageUnknown: active.length - ages.length,
        classes: classes.length,
        averageClassSize: classes.length ? Math.round(active.length / classes.length) : 0,
        largestClassName: largest?.label ?? '—',
        largestClassSize: largest?.students ?? 0,
        upcomingBirthdays: birthdays.length,
        openAlerts: alerts.reduce((sum, a) => sum + a.count, 0),
      },
      stages,
      agePyramid,
      classStrength,
      movement,
      enrolment,
      birthdays,
      alerts,
      recentActivity,
      lastUpdated,
      untracked: UNTRACKED_TILES,
    };
  },
};
