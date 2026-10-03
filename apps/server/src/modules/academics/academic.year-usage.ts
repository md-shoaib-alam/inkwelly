import { and, count, eq, like, or } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';

/**
 * Renaming a year orphans every row that stores its name. The set of such
 * tables grew the day writes started stamping `academicYear` on transactions
 * (fees, assignments, submissions, grades, attendance) and the day classes
 * became per-session rows — so the guard counts all of them, not just the
 * original four. `fees` is double-counted on purpose: the screens still match
 * rows by the `${year}-04-01` dueDate encoding, and a rename guard may
 * over-block but must never under-block.
 */
export const YEAR_COLUMN_TABLES = {
  students: schema.students,
  feeStructures: schema.feeStructures,
  promotions: schema.promotions,
  exams: schema.exams,
  fees: schema.fees,
  assignments: schema.assignments,
  submissions: schema.submissions,
  grades: schema.grades,
  attendance: schema.attendance,
  classes: schema.classes,
};

export type UsageTable = keyof typeof YEAR_COLUMN_TABLES;

/** `fees.dueDate` is `${academicYear}-04-01` (see the fee screens' payload builders). */
export const feeDueDatePattern = (name: string) => `${name}-%`;

const firstCount = (rows: { n: number }[]): number => Number(rows[0]?.n ?? 0);

/**
 * Students reach their school through User, feeStructures through
 * FeeCategory — those two arms are joined. Every other table carries tenantId
 * natively and shares the `tenantId + academicYear` shape, so one loop covers
 * the rest instead of eight hand-written arms drifting apart.
 */
export async function yearUsageCounts(tenantId: string, name: string): Promise<Record<UsageTable, number>> {
  const joinArms = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.users.id, schema.students.userId))
      .where(and(eq(schema.users.tenantId, tenantId), eq(schema.students.academicYear, name))),
    db
      .select({ n: count() })
      .from(schema.feeStructures)
      .innerJoin(schema.feeCategories, eq(schema.feeCategories.id, schema.feeStructures.feeCategoryId))
      .where(and(eq(schema.feeCategories.tenantId, tenantId), eq(schema.feeStructures.academicYear, name))),
  ]);

  const tenantScoped = (Object.keys(YEAR_COLUMN_TABLES) as UsageTable[]).filter(
    (key) => key !== 'students' && key !== 'feeStructures',
  );

  const loopCounts = await Promise.all(
    tenantScoped.map((key) => {
      if (key === 'fees') {
        return db
          .select({ n: count() })
          .from(schema.fees)
          .where(and(
            eq(schema.fees.tenantId, tenantId),
            or(eq(schema.fees.academicYear, name), like(schema.fees.dueDate, feeDueDatePattern(name))),
          ));
      }
      const table = YEAR_COLUMN_TABLES[key];
      return db
        .select({ n: count() })
        .from(table)
        .where(and(eq((table as { tenantId: any }).tenantId, tenantId), eq((table as { academicYear: any }).academicYear, name)));
    }),
  );

  const counts: Record<UsageTable, number> = {
    students: firstCount(joinArms[0]!),
    feeStructures: firstCount(joinArms[1]!),
    promotions: 0,
    exams: 0,
    fees: 0,
    assignments: 0,
    submissions: 0,
    grades: 0,
    attendance: 0,
    classes: 0,
  };
  tenantScoped.forEach((key, i) => {
    counts[key] = firstCount(loopCounts[i]!);
  });
  return counts;
}
