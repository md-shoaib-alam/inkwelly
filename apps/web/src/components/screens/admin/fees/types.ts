import { ReactNode } from "react";

export interface FeeCategory {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  frequency: string;
  status: string;
  feesCount: number;
  structuresCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: string;
  feeCategoryId: string;
  feeCategoryName: string;
  feeCategoryCode: string;
  feeCategoryStatus?: string;
  classId: string;
  className: string;
  classGrade: string;
  amount: number;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeConcession {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  feeCategoryId: string | null;
  concessionType: string;
  amount: number;
  reason: string | null;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeeReceipt {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  feeIds: string;
  feeItems: { id: string; feeCategoryName: string; type: string; amount: number; concession: number; paidAmount: number }[];
  totalAmount: number;
  paidAmount: number;
  concessionTotal: number;
  paymentMethod: string;
  paidDate: string;
  collectedBy: string | null;
  remarks: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  classGrade: string;
  feeCategoryId: string | null;
  feeCategoryName: string | null;
  feeCategoryCode: string | null;
  amount: number;
  concession: number;
  type: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  paidAmount: number;
  receiptId: string | null;
  receiptNumber: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

export interface StudentOption {
  id: string;
  name: string;
  className: string;
  classId: string;
  rollNumber: string;
  phone: string;
}

export interface ClassOption {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface TransportAssignment {
  id: string;
  routeId: string;
  routeName: string;
  routeFee: number;
  vehicleNo: string;
  vehicleType: string;
  routeStops: string[];
  studentId: string;
  studentName: string;
  studentPhone: string;
  classId: string | null;
  className: string | null;
  classGrade: string | null;
  classSection: string | null;
}

export interface FeeFormData {
  studentId: string;
  type: string;
  amount: string;
  dueDate: string;
  status: string;
  paidAmount: string;
  paidDate: string;
  remark: string;
}

export interface FeeRecord extends FeeItem {
  student?: {
    name: string;
    class?: {
      name: string;
      section: string;
    };
  };
}
