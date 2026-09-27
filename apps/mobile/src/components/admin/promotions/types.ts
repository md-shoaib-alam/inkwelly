export interface PromotionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  fromClassId: string;
  fromClassName: string;
  fromClassGrade: string;
  toClassId: string;
  toClassName: string;
  toClassGrade: string;
  academicYear: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassOption {
  id: string;
  name: string;
  section: string;
  grade: string;
  capacity?: number;
  studentCount?: number;
  classTeacher?: string;
}

export interface StudentOption {
  id: string;
  name: string;
  rollNumber?: string;
  className?: string;
  classId?: string;
}

export interface PromotionFormData {
  studentId: string;
  fromClassId: string;
  toClassId: string;
  academicYear: string;
  remarks: string;
}

export const emptyForm: PromotionFormData = {
  studentId: '',
  fromClassId: '',
  toClassId: '',
  academicYear: '',
  remarks: '',
};

export type ActiveTab = 'bulk' | 'individual' | 'graduated';

export interface PromotionsState {
  activeTab: ActiveTab;
  promotions: PromotionRecord[];
  graduations: PromotionRecord[];
  classes: ClassOption[];
  students: StudentOption[]; // legacy alias if needed
  formStudents: StudentOption[];
  bulkStudents: StudentOption[];
  gradStudents: StudentOption[];
  loading: boolean;
  academicYearFilter: string;
  classFilter: string;
  statusFilter: string;
  dialogOpen: boolean;
  form: PromotionFormData;
  submitting: boolean;
  bulkDialogOpen: boolean;
  bulkFromClass: string;
  bulkToClass: string;
  bulkAcademicYear: string;
  bulkRemarks: string;
  bulkSelectedIds: string[];
  bulkSubmitting: boolean;
  gradClassId: string;
  gradAcademicYear: string;
  gradRemarks: string;
  gradSelectedIds: string[];
  gradSubmitting: boolean;
  rejectDialogOpen: boolean;
  rejectingPromotion: PromotionRecord | null;
  rejectRemarks: string;
  rejecting: boolean;
  approvingId: string | null;
}
