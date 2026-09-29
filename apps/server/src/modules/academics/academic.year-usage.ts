import { and, count, eq, like } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';

/**
 * Renaming a year orphans every row that stores its name. `fees` is the sharp
 * edge: it has no academicYear column, the year is encoded inside each row's
 * dueDate, so a rename silently changes what an existing receipt means.
 * The guard is server-side because the edit dialog is not the only writer.
 */
export const YEAR_COLUMN_TABLES = {
  students: schema.students,
  feeStructures: schema.feeStructures,
  promotions: schema.promotions,
  exams: schema.exams,
};

export type UsageTable = keyof typeof YEAR_COLUMN_TABLES | 'fees';

/** `fees.dueDate` is `${academicYear}-04-01` (see the fee screens' payload builders). */
export const feeDueDatePattern = (name: string) => `${name}-%`;

const firstCount = (rows: { n: number }[]): number => Number(rows[0]?.n ?? 0);

/**
 * Only `promotions` and `exams` carry a tenantId. The other three reach their
 * school through a parent row, so each arm is written out instead of looped.
 */
export async function yearUsageCounts(tenantId: string, name: string): Promise<Record<UsageTable, number>> {
  const [students, feeStructures, promotions, exams, fees] = await Promise.all([
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
    db
      .select({ n: count() })
      .from(schema.promotions)
      .where(and(eq(schema.promotions.tenantId, tenantId), eq(schema.promotions.academicYear, name))),
    db
      .select({ n: count() })
      .from(schema.exams)
      .where(and(eq(schema.exams.tenantId, tenantId), eq(schema.exams.academicYear, name))),
    db
      .select({ n: count() })
      .from(schema.fees)
      .where(and(eq(schema.fees.tenantId, tenantId), like(schema.fees.dueDate, feeDueDatePattern(name)))),
  ]);

  return {
    students: firstCount(students),
    feeStructures: firstCount(feeStructures),
    promotions: firstCount(promotions),
    exams: firstCount(exams),
    fees: firstCount(fees),
  };
}
