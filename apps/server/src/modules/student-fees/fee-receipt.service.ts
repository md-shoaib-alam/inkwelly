/**
 * FeeReceiptService — Shared Service Layer for Fee Receipt & Payment Processing
 * Handles atomic fee row locking, payment balance allocations, and receipt creation.
 */
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, gte, inArray, like, desc } from 'drizzle-orm';
import { formatDate } from '../../lib/date-utils';

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ProcessPaymentInput {
  tenantId: string;
  studentId: string;
  feeIds: string[];
  paidAmount: number;
  paymentMethod: string;
  userId: string;
}

export const FeeReceiptService = {
  /**
   * Processes a payment transaction atomically:
   * 1. Locks selected fee rows with .for('update')
   * 2. Rejects if fees are already fully paid or if a duplicate payment was made within 15s
   * 3. Calculates original total and concession apportioning
   * 4. Creates the receipt and updates fee statuses/balances
   * 5. Handles surplus/advance payments
   */
  async processPayment(tx: DbTransaction, input: ProcessPaymentInput) {
    const { tenantId, studentId, feeIds, paidAmount, paymentMethod, userId } = input;

    //  Serialise receipt-number allocation per school. Every payment takes
    // this lock before the fee rows, so concurrent payments cannot agree on the
    // same sequence number (the whole transaction would roll back on 23505).
    await tx.select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .for('update');

    //  CONCURRENCY LOCK: Lock the selected fee rows to serialize concurrent requests
    const selectedFees = await tx.select()
      .from(schema.fees)
      .where(and(inArray(schema.fees.id, feeIds), eq(schema.fees.studentId, studentId)))
      .for('update');

    if (selectedFees.length === 0) {
      throw new Error('No valid fees found for payment');
    }

    // Calculate remaining payable balance on these locked fees
    let totalPayableRemaining = 0;
    for (const fee of selectedFees) {
      const netAmount = fee.amount - fee.concession;
      const alreadyPaid = fee.paidAmount || 0;
      totalPayableRemaining += Math.max(0, netAmount - alreadyPaid);
    }

    // If selected fees are already fully paid, reject the duplicate payment
    if (totalPayableRemaining <= 0) {
      throw new Error('FEES_ALREADY_PAID');
    }

    // Also check for duplicate receipt in the last 15 seconds to be extra safe
    const duplicateCheckTime = new Date(Date.now() - 15000);
    const existingReceipt = await tx.query.feeReceipts.findFirst({
      where: and(
        eq(schema.feeReceipts.tenantId, tenantId),
        eq(schema.feeReceipts.studentId, studentId),
        eq(schema.feeReceipts.feeIds, feeIds.join(',')),
        eq(schema.feeReceipts.paidAmount, Number(paidAmount) || 0),
        gte(schema.feeReceipts.createdAt, duplicateCheckTime),
      ),
    });

    if (existingReceipt) {
      throw new Error('DUPLICATE_PAYMENT');
    }

    // --- CALCULATE CORRECT ORIGINAL AND CONCESSION TOTALS FOR THIS RECEIPT ---
    let remainingPaidAmount = Number(paidAmount) || 0;
    let calculatedTotalAmount = 0;
    let calculatedConcessionTotal = 0;

    for (const fee of selectedFees) {
      const netAmount = fee.amount - fee.concession;
      const alreadyPaid = fee.paidAmount || 0;
      const balanceToPay = Math.max(0, netAmount - alreadyPaid);

      if (balanceToPay > 0 && remainingPaidAmount > 0) {
        const payNow = Math.min(balanceToPay, remainingPaidAmount);
        const fraction = netAmount > 0 ? (payNow / netAmount) : 0;

        calculatedTotalAmount += fraction * fee.amount;
        calculatedConcessionTotal += fraction * fee.concession;
        remainingPaidAmount -= payNow;
      }
    }

    // Any remaining paid amount is advance payment (new money paid without concessions)
    if (remainingPaidAmount > 0) {
      calculatedTotalAmount += remainingPaidAmount;
    }

    // Receipt numbers run in a school's own register: RCPT-<year>-<seq>, e.g.
    // RCPT-2026-0001. They were RCPT-<epoch-ms>-<12 hex>, which was unreadable
    // on a printed receipt and only unique because of that.
    const year = new Date().getFullYear();
    const prefix = `RCPT-${year}-`;
    const [highest] = await tx.query.feeReceipts.findMany({
      columns: { receiptNumber: true },
      where: and(
        eq(schema.feeReceipts.tenantId, tenantId),
        like(schema.feeReceipts.receiptNumber, `${prefix}%`),
      ),
      orderBy: [desc(schema.feeReceipts.receiptNumber)],
      limit: 1,
    });
    let seq = parseInt((highest?.receiptNumber || `${prefix}0`).slice(prefix.length), 10);
    if (!Number.isFinite(seq)) seq = 0;
    const receiptNumber = `${prefix}${(seq + 1).toString().padStart(4, '0')}`;

    const [rcpt] = await tx.insert(schema.feeReceipts).values({
      tenantId,
      receiptNumber,
      studentId,
      feeIds: feeIds.join(','),
      totalAmount: Number(calculatedTotalAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      concessionTotal: Number(calculatedConcessionTotal) || 0,
      paymentMethod,
      paidDate: formatDate(),
      collectedBy: userId,
      status: 'completed',
    }).returning();

    if (!rcpt) throw new Error('Failed to create receipt');

    let remainingPaid = Number(paidAmount) || 0;
    const updatePromises = [];

    for (const fee of selectedFees) {
      const netAmount = fee.amount - fee.concession;
      const alreadyPaid = fee.paidAmount || 0;
      const balanceToPay = Math.max(0, netAmount - alreadyPaid);

      if (balanceToPay > 0 && remainingPaid > 0) {
        const payNow = Math.min(balanceToPay, remainingPaid);
        const totalNewPaid = alreadyPaid + payNow;
        const newStatus = totalNewPaid >= netAmount ? 'paid' : 'partially_paid';

        updatePromises.push(
          tx.update(schema.fees).set({
            status: newStatus,
            paidAmount: totalNewPaid,
            paidDate: formatDate(),
            receiptId: rcpt.id,
            receiptNumber: rcpt.receiptNumber,
            paymentMethod,
          }).where(eq(schema.fees.id, fee.id)),
        );

        remainingPaid -= payNow;
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    // Handle Surplus (Advance Payment)
    if (remainingPaid > 0) {
      await tx.insert(schema.fees).values({
        tenantId,
        studentId,
        academicYear: selectedFees[0]!.academicYear,
        amount: 0,
        type: 'Advance Payment',
        status: 'paid',
        dueDate: formatDate(),
        paidDate: formatDate(),
        paidAmount: remainingPaid,
        receiptId: rcpt.id,
        receiptNumber: rcpt.receiptNumber,
        paymentMethod,
        remarks: 'Advance/Over-payment',
      });
    }

    return rcpt;
  }
};
