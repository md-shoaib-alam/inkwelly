import { z } from 'zod';

// ─── Reusable primitives ──────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const positiveAmount = z.number({ required_error: 'Amount is required' }).positive('Amount must be a positive number');
const nonNegativeAmount = z.number().min(0, 'Amount cannot be negative');
const dateString = z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format');
const paymentMethod = z.enum(['cash', 'online', 'cheque'], {
  errorMap: () => ({ message: 'Payment method must be cash, online, or cheque' })
});
const concessionType = z.enum(['full_waiver', 'percentage', 'fixed'], {
  errorMap: () => ({ message: 'Concession type must be full_waiver, percentage, or fixed' })
});

// ─── Fee creation (POST /fees) ────────────────────────────────────────────────

export const CreateFeeSchema = z.object({
  studentId:     z.string().min(1, 'studentId is required'),
  feeCategoryId: z.string().min(1).nullable().optional(),
  amount:        z.number({ required_error: 'amount is required', invalid_type_error: 'amount must be a number' }).positive('Amount must be positive'),
  type:          z.string().min(1, 'type is required'),
  dueDate:       dateString.optional(),
  remarks:       z.string().optional(),
});
export type CreateFeeInput = z.infer<typeof CreateFeeSchema>;

// ─── Fee receipt creation (POST /fee-receipts) ────────────────────────────────

export const CreateReceiptSchema = z.object({
  studentId:       z.string().min(1, 'studentId is required'),
  feeIds:          z.array(z.string().min(1)).min(1, 'At least one fee ID is required'),
  totalAmount:     nonNegativeAmount.optional(),
  paidAmount:      nonNegativeAmount,
  concessionTotal: nonNegativeAmount.optional(),
  paymentMethod,
  feeAmounts:      z.record(z.number()).optional(),
});
export type CreateReceiptInput = z.infer<typeof CreateReceiptSchema>;

// ─── Fee concession creation (POST /fee-concessions) ─────────────────────────

export const CreateConcessionSchema = z.object({
  studentId:      z.string().min(1, 'studentId is required'),
  feeCategoryId:  z.string().min(1).nullable().optional(),
  concessionType,
  amount:         nonNegativeAmount,
  reason:         z.string().optional(),
  status:         z.enum(['active', 'inactive']).default('active'),
  validFrom:      dateString.nullable().optional(),
  validUntil:     dateString.nullable().optional(),
  approvedBy:     z.string().nullable().optional(),
  tenantId:       z.string().optional(), // filled by server
});
export type CreateConcessionInput = z.infer<typeof CreateConcessionSchema>;

// ─── Fee structure (POST /fee-structures) ─────────────────────────────────────

export const CreateFeeStructureSchema = z.object({
  feeCategoryId: z.string().min(1, 'feeCategoryId is required'),
  classId:       z.string().min(1, 'classId is required'),
  amount:        positiveAmount,
  academicYear:  z.string().min(1, 'academicYear is required'),
});
export type CreateFeeStructureInput = z.infer<typeof CreateFeeStructureSchema>;

// ─── Transport assignment (POST /transport-assignments) ───────────────────────

export const CreateTransportAssignmentSchema = z.object({
  studentId:         z.string().min(1, 'studentId is required'),
  routeId:           z.string().min(1, 'routeId is required'),
  startDate:         dateString,
  pickupPoint:       z.string().optional(),
  newPickupPointFee: z.number().optional(),
});
export type CreateTransportAssignmentInput = z.infer<typeof CreateTransportAssignmentSchema>;

// ─── Fee assignment (POST /fee-assign) ───────────────────────────────────────

export const FeeAssignSchema = z.object({
  studentIds:    z.array(z.string().min(1)).min(1, 'At least one student is required'),
  feeCategoryId: z.string().min(1, 'feeCategoryId is required'),
  academicYear:  z.string().min(1, 'academicYear is required'),
  action:        z.enum(['assign', 'remove']),
});
export type FeeAssignInput = z.infer<typeof FeeAssignSchema>;

// ─── Utility: format Zod errors into a single string ─────────────────────────

export function formatZodError(error: z.ZodError): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
}
