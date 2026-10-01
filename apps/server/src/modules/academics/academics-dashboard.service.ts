import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { and, count, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { formatDate } from '../../lib/date-utils';
import { pickCurrentSession, sessionProgress } from '../../lib/academic-session';

/**
 * The Academics command center. Every number is a SELECT over rows that already
 * exist — nothing is estimated, and an axis with no table behind it is reported as
 * untracked rather than as 0%, which would blame the school for our missing feature.
 */

/** Class-stage bands from NEP 2020. `Class.classLevel` is free text, so a grade that
 *  doesn't parse lands in "Unclassified" rather than being guessed at. */
const NEP_STAGES = [
  { key: 'foundational', label: 'Foundational', min: 1, max: 3 },
  { key: 'preparatory', label: 'Preparatory', min: 4, max: 5 },
  { key: 'middle', label: 'Middle', min: 6, max: 8 },
  { key: 'secondary', label: 'Secondary', min: 9, max: 12 },
];
const NEP_GRADE_MIN = 1;
const NEP_GRADE_MAX = 12;

/** Students per teacher. A policy choice, not a measurement. */
function ratioBand(ratio: number): 'Healthy' | 'Watch' | 'Strained' {
  if (ratio <= 20) return 'Healthy';
  if (ratio <= 30) return 'Watch';
  return 'Strained';
}

function pct(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export const AcademicsDashboardService = {
  async commandCenter(tenantId: string, requestedYear?: string | null) {
    const today = formatDate();

    const classRows = await db
      .select({ id: schema.classes.id, classLevel: schema.classes.classLevel })
      .from(schema.classes)
      .where(eq(schema.classes.tenantId, tenantId));
    const classIds = classRows.map((c) => c.id);
    const hasClasses = classIds.length > 0;

    const [
      yearRows,
      [teacherCount],
      [studentCount],
      [subjectCount],
      [offeringCount],
      [taughtCount],
      offeringClassRows,
      timetableClasses,
      examClasses,
      classStudentRows,
      studentYears,
      examYears,
    ] = await Promise.all([
      db
        .select()
        .from(schema.academicYears)
        .where(eq(schema.academicYears.tenantId, tenantId)),
      db
        .select({ count: count() })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.tenantId, tenantId),
            eq(schema.users.role, 'teacher'),
            eq(schema.users.isActive, true),
          ),
        ),
      hasClasses
        ? db
            .select({ count: count() })
            .from(schema.students)
            .where(
              and(
                inArray(schema.students.classId, classIds),
                eq(schema.students.status, 'active'),
              ),
            )
        : Promise.resolve([{ count: 0 }]),
      db
        .select({
          count: count(),
          distinct: sql<number>`count(distinct (${schema.subjects.name}, ${schema.subjects.code}))`,
        })
        .from(schema.subjects)
        .where(eq(schema.subjects.tenantId, tenantId)),
      hasClasses
        ? db
            .select({ count: count() })
            .from(schema.subjects)
            .where(inArray(schema.subjects.classId, classIds))
        : Promise.resolve([{ count: 0 }]),
      hasClasses
        ? db
            .select({ count: count() })
            .from(schema.subjects)
            .where(
              and(
                inArray(schema.subjects.classId, classIds),
                isNotNull(schema.subjects.teacherId),
              ),
            )
        : Promise.resolve([{ count: 0 }]),
      hasClasses
        ? db
            .selectDistinct({ classId: schema.subjects.classId })
            .from(schema.subjects)
            .where(inArray(schema.subjects.classId, classIds))
        : Promise.resolve([] as { classId: string | null }[]),
      db
        .selectDistinct({ classId: schema.timetables.classId })
        .from(schema.timetables)
        .innerJoin(schema.classes, eq(schema.timetables.classId, schema.classes.id))
        .where(eq(schema.classes.tenantId, tenantId)),
      db
        .selectDistinct({
          classId: schema.exams.classId,
          academicYear: schema.exams.academicYear,
        })
        .from(schema.exams)
        .where(eq(schema.exams.tenantId, tenantId)),
      hasClasses
        ? db
            .select({ classId: schema.students.classId, students: count() })
            .from(schema.students)
            .where(
              and(
                inArray(schema.students.classId, classIds),
                eq(schema.students.status, 'active'),
              ),
            )
            .groupBy(schema.students.classId)
        : Promise.resolve([] as { classId: string; students: number }[]),
      hasClasses
        ? db
            .select({ year: schema.students.academicYear, students: count() })
            .from(schema.students)
            .where(
              and(
                inArray(schema.students.classId, classIds),
                eq(schema.students.status, 'active'),
              ),
            )
            .groupBy(schema.students.academicYear)
        : Promise.resolve([] as { year: string; students: number }[]),
      db
        .select({ year: schema.exams.academicYear, exams: count() })
        .from(schema.exams)
        .where(eq(schema.exams.tenantId, tenantId))
        .groupBy(schema.exams.academicYear),
    ]);

    // `Timetable` has no tenantId, so the tenant is reached through its class.
    const doubleBookedRows = await db.execute(sql`
      select count(distinct t1."teacherId") as n
      from "Timetable" t1
      join "Class" c1 on c1."id" = t1."classId" and c1."tenantId" = ${tenantId}
      join "Timetable" t2
        on t2."teacherId" = t1."teacherId"
       and t2."day" = t1."day"
       and t2."id" <> t1."id"
       and t1."startTime" < t2."endTime"
       and t2."startTime" < t1."endTime"
      where t1."teacherId" is not null
    `);
    const doubleBooked = Number((doubleBookedRows as { n?: number | string }[])[0]?.n ?? 0);

    const classes = classRows.length;
    const teachers = Number(teacherCount?.count ?? 0);
    const students = Number(studentCount?.count ?? 0);
    const subjects = Number(subjectCount?.count ?? 0);
    const offerings = Number(offeringCount?.count ?? 0);
    const taught = Number(taughtCount?.count ?? 0);

    const session = pickCurrentSession(yearRows, requestedYear, today);
    const yearName = session?.name ?? null;
    const progress = session ? sessionProgress(session.startDate, session.endDate, today) : null;

    const studentsByClass = new Map(classStudentRows.map((r) => [r.classId, Number(r.students)]));
    const classesWithStudents = classIds.filter((id) => (studentsByClass.get(id) ?? 0) > 0).length;
    const classesWithTimetable = timetableClasses.length;
    const classesWithOfferings = offeringClassRows.length;
    const classLevels = new Set(
      classRows
        .map((c) => Number.parseInt(c.classLevel, 10))
        .filter((g) => Number.isFinite(g)),
    ).size;
    const classesWithExams = yearName
      ? new Set(examClasses.filter((r) => r.academicYear === yearName).map((r) => r.classId)).size
      : 0;

    const ratio = teachers > 0 ? students / teachers : 0;

    const axes = [
      {
        key: 'structure',
        label: 'Structure',
        tracked: classes > 0,
        percent: pct(classesWithStudents, classes),
        detail: `${classesWithStudents}/${classes} classes have students`,
      },
      {
        key: 'teachers',
        label: 'Teachers',
        tracked: offerings > 0,
        percent: pct(taught, offerings),
        detail: `${taught}/${offerings} offerings have a teacher`,
      },
      {
        key: 'timetable',
        label: 'Timetable',
        tracked: classes > 0,
        percent: pct(classesWithTimetable, classes),
        detail: `${classesWithTimetable}/${classes} classes have periods`,
      },
      {
        key: 'syllabus',
        label: 'Syllabus',
        tracked: false,
        percent: 0,
        detail: 'No syllabus records exist in this build',
      },
      {
        key: 'exams',
        label: 'Exams',
        tracked: classes > 0 && !!yearName,
        percent: pct(classesWithExams, classes),
        detail: `${classesWithExams}/${classes} classes have exams in ${yearName ?? 'any year'}`,
      },
    ];
    const scored = axes.filter((a) => a.tracked);
    const score = scored.length
      ? Math.round(scored.reduce((sum, a) => sum + a.percent, 0) / scored.length)
      : 0;

    const stages = NEP_STAGES.map((stage) => {
      const inStage = classRows.filter((c) => {
        const grade = Number.parseInt(c.classLevel, 10);
        return Number.isFinite(grade) && grade >= stage.min && grade <= stage.max;
      });
      return {
        key: stage.key,
        label: stage.label,
        classes: inStage.length,
        students: inStage.reduce((sum, c) => sum + (studentsByClass.get(c.id) ?? 0), 0),
      };
    });
    const staged = stages.reduce((sum, s) => sum + s.classes, 0);
    if (classes - staged > 0) {
      const ungraded = classRows.filter((c) => {
        const grade = Number.parseInt(c.classLevel, 10);
        return !Number.isFinite(grade) || grade < NEP_GRADE_MIN || grade > NEP_GRADE_MAX;
      });
      stages.push({
        key: 'unclassified',
        label: 'Unclassified',
        classes: ungraded.length,
        students: ungraded.reduce((sum, c) => sum + (studentsByClass.get(c.id) ?? 0), 0),
      });
    }

    const examsByYear = new Map(examYears.map((r) => [r.year, Number(r.exams)]));
    const growthPoints = [...new Set([...studentYears.map((r) => r.year), ...examsByYear.keys()])]
      .sort()
      .map((year) => ({
        year,
        students: Number(studentYears.find((r) => r.year === year)?.students ?? 0),
        exams: examsByYear.get(year) ?? 0,
      }));

    const findings = [
      doubleBooked > 0 && {
        code: 'TIMETABLE_TEACHER_DOUBLE_BOOKED',
        severity: 'high',
        count: doubleBooked,
        title: `${plural(doubleBooked, 'teacher is', 'teachers are')} double-booked in the same period`,
        detail: 'A teacher cannot be in two rooms at once. Resolve conflicts before publishing the timetable.',
        screen: 'timetable',
      },
      offerings - taught > 0 && {
        code: 'OFFERINGS_WITHOUT_TEACHER',
        severity: 'medium',
        count: offerings - taught,
        title: `${plural(offerings - taught, 'offering has', 'offerings have')} no teacher assigned`,
        detail: 'Nobody is linked to these class-subject pairs, so they cannot be timetabled or graded.',
        screen: 'subjects',
      },
      classes - classesWithTimetable > 0 && {
        code: 'CLASSES_WITHOUT_TIMETABLE',
        severity: 'medium',
        count: classes - classesWithTimetable,
        title: `${plural(classes - classesWithTimetable, 'class has', 'classes have')} no timetable`,
        detail: 'No periods are allotted for these classes yet.',
        screen: 'timetable',
      },
      classes - classesWithStudents > 0 && {
        code: 'CLASSES_WITHOUT_STUDENTS',
        severity: 'low',
        count: classes - classesWithStudents,
        title: `${plural(classes - classesWithStudents, 'class has', 'classes have')} no active students`,
        detail: 'Empty sections usually mean an admission or promotion that was never completed.',
        screen: 'classes',
      },
    ].filter((f): f is NonNullable<typeof f> => f !== false);

    return {
      session:
        session && progress
          ? {
              name: session.name,
              isCurrent: session.isCurrent,
              startDate: session.startDate,
              endDate: session.endDate,
              ...progress,
            }
          : session
            ? {
                name: session.name,
                isCurrent: session.isCurrent,
                startDate: session.startDate,
                endDate: session.endDate,
                totalDays: 0,
                dayNumber: 0,
                percentComplete: 0,
              }
            : null,
      stats: {
        classes,
        students,
        teachers,
        subjects,
        offerings,
        taught,
        classLevels,
        classesWithOfferings,
        ratio: Math.round(ratio * 10) / 10,
        ratioLabel: teachers > 0 ? `1:${Math.round(ratio)}` : '—',
        ratioBand: teachers > 0 ? ratioBand(ratio) : 'Unknown',
      },
      readiness: { score, axes },
      stages,
      growth: { sessions: growthPoints.length, points: growthPoints },
      findings,
    };
  },
};
