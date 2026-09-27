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
  status: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassOption {
  id: string;
  name: string;
  section: string;
  grade: string;
  capacity: number;
  studentCount: number;
  classTeacher: string;
}

export interface StudentOption {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  classId: string;
}

export interface PromotionFormData {
  studentId: string;
  fromClassId: string;
  toClassId: string;
  academicYear: string;
  remarks: string;
}

export const emptyForm: PromotionFormData = {
  studentId: "",
  fromClassId: "",
  toClassId: "",
  academicYear: "",
  remarks: "",
};

export interface PromotionsState {
  activeTab: "individual" | "bulk" | "graduated";
  
  // Data
  promotions: PromotionRecord[];
  graduations: PromotionRecord[];
  classes: ClassOption[];
  students: StudentOption[];
  loading: boolean;

  // Filters
  academicYearFilter: string;
  classFilter: string;
  statusFilter: string;

  // Individual promotion dialog
  dialogOpen: boolean;
  form: PromotionFormData;
  submitting: boolean;

  // Bulk promote dialog
  bulkDialogOpen: boolean;
  bulkFromClass: string;
  bulkToClass: string;
  bulkAcademicYear: string;
  bulkRemarks: string;
  bulkSubmitting: boolean;

  // Graduation dialog
  gradClassId: string;
  gradAcademicYear: string;
  gradRemarks: string;
  gradSelectedIds: Set<string>;
  gradSubmitting: boolean;

  // Reject confirmation dialog
  rejectDialogOpen: boolean;
  rejectingPromotion: PromotionRecord | null;
  rejectRemarks: string;
  rejecting: boolean;

  // Approving state
  approvingId: string | null;
}

export type PromotionsAction =
  | { type: "SET_ACTIVE_TAB"; tab: "individual" | "bulk" | "graduated" }
  | { type: "FETCH_START" }
  | { type: "FETCH_PROMOTIONS_SUCCESS"; payload: PromotionRecord[] }
  | { type: "FETCH_GRADUATIONS_SUCCESS"; payload: PromotionRecord[] }
  | { type: "FETCH_CLASSES_STUDENTS_SUCCESS"; classes: ClassOption[]; students: StudentOption[] }
  | { type: "FETCH_END" }
  | { type: "SET_ACADEMIC_YEAR_FILTER"; value: string }
  | { type: "SET_CLASS_FILTER"; value: string }
  | { type: "SET_STATUS_FILTER"; value: string }
  | { type: "OPEN_NEW_PROMOTION_DIALOG"; academicYear: string }
  | { type: "CLOSE_NEW_PROMOTION_DIALOG" }
  | { type: "SET_FORM"; form: PromotionFormData }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "OPEN_BULK_DIALOG"; academicYear: string }
  | { type: "CLOSE_BULK_DIALOG" }
  | { type: "SET_BULK_FROM_CLASS"; classId: string; toClassId: string }
  | { type: "SET_BULK_TO_CLASS"; classId: string }
  | { type: "SET_BULK_ACADEMIC_YEAR"; value: string }
  | { type: "SET_BULK_REMARKS"; value: string }
  | { type: "SET_BULK_SUBMITTING"; value: boolean }
  | { type: "OPEN_GRAD_DIALOG"; academicYear: string }
  | { type: "SET_GRAD_CLASS_ID"; classId: string; selectedIds: Set<string> }
  | { type: "SET_GRAD_SELECTED_IDS"; ids: Set<string> }
  | { type: "SET_GRAD_ACADEMIC_YEAR"; value: string }
  | { type: "SET_GRAD_REMARKS"; value: string }
  | { type: "TOGGLE_GRAD_STUDENT"; id: string }
  | { type: "SET_GRAD_SUBMITTING"; value: boolean }
  | { type: "OPEN_REJECT_DIALOG"; promotion: PromotionRecord }
  | { type: "CLOSE_REJECT_DIALOG" }
  | { type: "SET_REJECT_REMARKS"; value: string }
  | { type: "SET_REJECTING"; value: boolean }
  | { type: "SET_APPROVING_ID"; id: string | null };

export const getInitialState = (
  propTab: "individual" | "bulk" | "graduated" | undefined,
  currentAcademicYear: string
): PromotionsState => ({
  activeTab: propTab || "individual",
  promotions: [],
  graduations: [],
  classes: [],
  students: [],
  loading: true,
  academicYearFilter: "all",
  classFilter: "all",
  statusFilter: "all",
  dialogOpen: false,
  form: { ...emptyForm, academicYear: currentAcademicYear },
  submitting: false,
  bulkDialogOpen: false,
  bulkFromClass: "",
  bulkToClass: "",
  bulkAcademicYear: currentAcademicYear,
  bulkRemarks: "",
  bulkSubmitting: false,
  gradClassId: "",
  gradAcademicYear: currentAcademicYear,
  gradRemarks: "",
  gradSelectedIds: new Set(),
  gradSubmitting: false,
  rejectDialogOpen: false,
  rejectingPromotion: null,
  rejectRemarks: "",
  rejecting: false,
  approvingId: null,
});

export function promotionsReducer(state: PromotionsState, action: PromotionsAction): PromotionsState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_PROMOTIONS_SUCCESS":
      return { ...state, promotions: action.payload };
    case "FETCH_GRADUATIONS_SUCCESS":
      return { ...state, graduations: action.payload };
    case "FETCH_CLASSES_STUDENTS_SUCCESS":
      return { ...state, classes: action.classes, students: action.students };
    case "FETCH_END":
      return { ...state, loading: false };
    case "SET_ACADEMIC_YEAR_FILTER":
      return { ...state, academicYearFilter: action.value };
    case "SET_CLASS_FILTER":
      return { ...state, classFilter: action.value };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.value };
    case "OPEN_NEW_PROMOTION_DIALOG":
      return { ...state, dialogOpen: true, form: { ...emptyForm, academicYear: action.academicYear } };
    case "CLOSE_NEW_PROMOTION_DIALOG":
      return { ...state, dialogOpen: false };
    case "SET_FORM":
      return { ...state, form: action.form };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.value };
    case "OPEN_BULK_DIALOG":
      return { ...state, bulkDialogOpen: true, bulkFromClass: "", bulkToClass: "", bulkAcademicYear: action.academicYear, bulkRemarks: "" };
    case "CLOSE_BULK_DIALOG":
      return { ...state, bulkDialogOpen: false };
    case "SET_BULK_FROM_CLASS":
      return { ...state, bulkFromClass: action.classId, bulkToClass: action.toClassId };
    case "SET_BULK_TO_CLASS":
      return { ...state, bulkToClass: action.classId };
    case "SET_BULK_ACADEMIC_YEAR":
      return { ...state, bulkAcademicYear: action.value };
    case "SET_BULK_REMARKS":
      return { ...state, bulkRemarks: action.value };
    case "SET_BULK_SUBMITTING":
      return { ...state, bulkSubmitting: action.value };
    case "OPEN_GRAD_DIALOG":
      return {
        ...state,
        activeTab: "graduated",
        gradClassId: "",
        gradAcademicYear: action.academicYear,
        gradRemarks: "",
        gradSelectedIds: new Set(),
      };
    case "SET_GRAD_CLASS_ID":
      return { ...state, gradClassId: action.classId, gradSelectedIds: action.selectedIds };
    case "SET_GRAD_SELECTED_IDS":
      return { ...state, gradSelectedIds: action.ids };
    case "SET_GRAD_ACADEMIC_YEAR":
      return { ...state, gradAcademicYear: action.value };
    case "SET_GRAD_REMARKS":
      return { ...state, gradRemarks: action.value };
    case "TOGGLE_GRAD_STUDENT": {
      const next = new Set(state.gradSelectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, gradSelectedIds: next };
    }
    case "SET_GRAD_SUBMITTING":
      return { ...state, gradSubmitting: action.value };
    case "OPEN_REJECT_DIALOG":
      return { ...state, rejectDialogOpen: true, rejectingPromotion: action.promotion, rejectRemarks: "" };
    case "CLOSE_REJECT_DIALOG":
      return { ...state, rejectDialogOpen: false };
    case "SET_REJECT_REMARKS":
      return { ...state, rejectRemarks: action.value };
    case "SET_REJECTING":
      return { ...state, rejecting: action.value };
    case "SET_APPROVING_ID":
      return { ...state, approvingId: action.id };
    default:
      return state;
  }
}
