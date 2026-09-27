export interface FeeItem {
  name: string;
  amount: number;
  deadline: string;
  collected: number;
}

export interface StudentOption {
  id: string;
  name: string;
  classId?: string;
  className?: string;
  rollNumber?: string;
  phone?: string;
}

export interface ClassOption {
  id: string;
  name: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  studentName: string;
  paidAmount: number;
  paidDate: string;
  paymentMethod: string;
  feeItems: ({ feeCategoryName: string; amount: number; concession: number; paidAmount: number } | null)[];
}

export interface Concession {
  id: string;
  studentName: string;
  studentClass: string;
  feeCategoryName: string;
  concessionType: string;
  amount: number;
  reason: string;
  status: string;
}

export interface FeeStructure {
  id: string;
  feeCategoryId: string;
  feeCategoryName: string;
  feeCategoryCode?: string;
  feeCategoryStatus?: string;
  classId: string;
  className: string;
  amount: number;
  academicYear: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  frequency: string;
}
