/**
 * FeeService — Shared Service Layer for Fee Business Logic
 * Single source of truth for fee concessions and calculations.
 */
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { formatDate } from '../lib/date-utils';

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const FeeService = {
  /**
   * Applies a concession to all PENDING fees (due today or later) for a student.
   * Uses a single batch UPDATE per concession type — no N+1.
   */
  async applyConcessionToPendingFees(
    tx: DbTransaction,
    studentId: string,
    feeCategoryId: string | null,
    concessionType: string,
    amount: number
  ): Promise<void> {
    const today = formatDate(); // YYYY-MM-DD
    const conditions = [
      eq(schema.fees.studentId, studentId),
      eq(schema.fees.status, 'pending'),
      gte(schema.fees.dueDate, today),
    ];
    if (feeCategoryId) {
      conditions.push(eq(schema.fees.feeCategoryId, feeCategoryId));
    }

    if (concessionType === 'full_waiver') {
      await tx.update(schema.fees)
        .set({ concession: schema.fees.amount })
        .where(and(...conditions));
    } else if (concessionType === 'percentage') {
      await tx.update(schema.fees)
        .set({ concession: sql`${schema.fees.amount} * (${amount}::double precision / 100)` })
        .where(and(...conditions));
    } else if (concessionType === 'fixed') {
      await tx.update(schema.fees)
        .set({ concession: sql`LEAST(${amount}::double precision, ${schema.fees.amount})` })
        .where(and(...conditions));
    }
  },

  /**
   * Removes any concession (sets concession=0) from PENDING future fees.
   */
  async removeConcessionFromPendingFees(
    tx: DbTransaction,
    studentId: string,
    feeCategoryId: string | null
  ): Promise<void> {
    const today = formatDate();
    const conditions = [
      eq(schema.fees.studentId, studentId),
      eq(schema.fees.status, 'pending'),
      gte(schema.fees.dueDate, today),
    ];
    if (feeCategoryId) {
      conditions.push(eq(schema.fees.feeCategoryId, feeCategoryId));
    }
    await tx.update(schema.fees).set({ concession: 0 }).where(and(...conditions));
  }
};
