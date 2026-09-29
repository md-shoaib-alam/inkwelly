/**
 * Fee domain types.
 * Centralises all TypeScript interfaces for the fees module so routes no longer
 * need `as any` casts for their return values.
 */

// ─── String unions ────────────────────────────────────────────────────────────

export type FeeStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';
export type PaymentMethod = 'cash' | 'online' | 'cheque';
export type ConcessionType = 'full_waiver' | 'percentage' | 'fixed';

// ─── Row shapes returned by GET /fees ─────────────────────────────────────────

export interface FeeItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  /** Display name — feeCategoryName if available, else raw type string */
  type: string;
  status: FeeStatus;
  dueDate: string;
  paidAmount: number;
  paidDate: string | null;
  remark: string | null;
  concession: number;
  feeCategoryName: string | null;
}

export interface FeeStats {
  total: number;
  pending: number;
  rate: number;
}

export interface ClassSummary {
  id: string;
  name: string;
}

export interface FeeListResult {
  items: FeeItem[];
  total: number;
  totalPages: number;
  /** Only present when mode=unified */
  stats?: FeeStats;
  /** Only present when mode=unified */
  classes?: ClassSummary[];
  /** Only present when mode=unified */
  students?: unknown[];
}

// ─── Row shapes returned by GET /fee-receipts ─────────────────────────────────

export interface FeeItemSummary {
  feeCategoryName: string;
  amount: number;
  concession: number;
  paidAmount: number;
}

export interface FeeReceiptRow {
  id: string;
  receiptNumber: string;
  tenantId: string;
  studentId: string;
  /** CSV of fee IDs — preserved for backward compat */
  feeIds: string;
  totalAmount: number;
  paidAmount: number;
  concessionTotal: number;
  paymentMethod: string;
  paidDate: string;
  collectedBy: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  studentName: string;
  className: string;
  parentName: string;
  feeItems: FeeItemSummary[];
}

export interface ReceiptStatsMethod {
  amount: number;
  count: number;
}

export interface FeeReceiptStats {
  totalAmount: number;
  totalCount: number;
  methods: Record<string, ReceiptStatsMethod>;
}

// ─── Row shapes returned by GET /fee-concessions ──────────────────────────────

export interface ConcessionRow {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  feeCategoryId: string | null;
  feeCategoryName: string;
  concessionType: ConcessionType;
  amount: number;
  reason: string | null;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Row shapes returned by GET /fee-structures ───────────────────────────────

export interface StructureRow {
  id: string;
  feeCategoryId: string;
  feeCategoryName: string;
  feeCategoryCode: string;
  feeCategoryStatus: string;
  classId: string;
  className: string;
  classGrade: string | null;
  amount: number;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}
