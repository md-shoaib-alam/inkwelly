export interface ClassInfo {
  id: string;
  name: string;
  section: string;
  studentCount: number;
  classTeacher?: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  rollNumber: string;
}

export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  className: string;
  classId: string;
  teacherName?: string;
}

export interface Assessment {
  id: string;
  classId: string;
  subjectId: string;
  title: string;
  type: string;
  totalMarks: number;
  passingMarks: number;
  grades?: { id: string; studentId: string; marksObtained: number }[];
  class?: { students: { id: string }[] };
  status?: string;
}

export interface GradeManagementState {
  classes: ClassInfo[];
  subjects: SubjectInfo[];
  students: StudentInfo[];
  assessments: Assessment[];
  selectedAssessmentId: string;
  confirmCompleteId: string | null;
  completingId: string | null;
  marks: Record<string, string>;
  loading: boolean;
  saving: boolean;
  gradesLoading: boolean;
  isDirty: boolean;
  activeTab: "active" | "completed";
  listLoading: boolean;
  isDialogOpen: boolean;
  newTitle: string;
  newType: string;
  newMode: string;
  newTotalMarks: string;
  newPassingMarks: string;
  isCreating: boolean;
  dialogClassId: string;
  dialogSubjectId: string;
}

export type GradeManagementAction =
  | { type: "SET_BOOTSTRAP_DATA"; classes: ClassInfo[]; subjects: SubjectInfo[] }
  | { type: "SET_ASSESSMENTS"; assessments: Assessment[] }
  | { type: "SET_STUDENTS"; students: StudentInfo[] }
  | { type: "SET_SELECTED_ASSESSMENT_ID"; id: string }
  | { type: "SET_CONFIRM_COMPLETE_ID"; id: string | null }
  | { type: "SET_COMPLETING_ID"; id: string | null }
  | { type: "SET_MARKS"; marks: Record<string, string> }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_SAVING"; value: boolean }
  | { type: "SET_GRADES_LOADING"; value: boolean }
  | { type: "SET_IS_DIRTY"; value: boolean }
  | { type: "SET_ACTIVE_TAB"; tab: "active" | "completed" }
  | { type: "SET_LIST_LOADING"; value: boolean }
  | { type: "SET_IS_DIALOG_OPEN"; value: boolean }
  | { type: "SET_NEW_TITLE"; value: string }
  | { type: "SET_NEW_TYPE"; value: string }
  | { type: "SET_NEW_MODE"; value: string }
  | { type: "SET_NEW_TOTAL_MARKS"; value: string }
  | { type: "SET_NEW_PASSING_MARKS"; value: string }
  | { type: "SET_IS_CREATING"; value: boolean }
  | { type: "SET_DIALOG_CLASS_ID"; value: string }
  | { type: "SET_DIALOG_SUBJECT_ID"; value: string }
  | { type: "ADD_ASSESSMENT"; assessment: Assessment };

export const initialState: GradeManagementState = {
  classes: [],
  subjects: [],
  students: [],
  assessments: [],
  selectedAssessmentId: "",
  confirmCompleteId: null,
  completingId: null,
  marks: {},
  loading: true,
  saving: false,
  gradesLoading: false,
  isDirty: false,
  activeTab: "active",
  listLoading: true,
  isDialogOpen: false,
  newTitle: "",
  newType: "unit_test",
  newMode: "offline",
  newTotalMarks: "25",
  newPassingMarks: "10",
  isCreating: false,
  dialogClassId: "",
  dialogSubjectId: "",
};

export function gradeManagementReducer(state: GradeManagementState, action: GradeManagementAction): GradeManagementState {
  switch (action.type) {
    case "SET_BOOTSTRAP_DATA":
      return { ...state, classes: action.classes, subjects: action.subjects, loading: false };
    case "SET_ASSESSMENTS":
      return { ...state, assessments: action.assessments, listLoading: false };
    case "SET_STUDENTS":
      return { ...state, students: action.students };
    case "SET_SELECTED_ASSESSMENT_ID":
      return { ...state, selectedAssessmentId: action.id };
    case "SET_CONFIRM_COMPLETE_ID":
      return { ...state, confirmCompleteId: action.id };
    case "SET_COMPLETING_ID":
      return { ...state, completingId: action.id };
    case "SET_MARKS":
      return { ...state, marks: action.marks };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_SAVING":
      return { ...state, saving: action.value };
    case "SET_GRADES_LOADING":
      return { ...state, gradesLoading: action.value };
    case "SET_IS_DIRTY":
      return { ...state, isDirty: action.value };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_LIST_LOADING":
      return { ...state, listLoading: action.value };
    case "SET_IS_DIALOG_OPEN":
      return { ...state, isDialogOpen: action.value };
    case "SET_NEW_TITLE":
      return { ...state, newTitle: action.value };
    case "SET_NEW_TYPE":
      return { ...state, newType: action.value };
    case "SET_NEW_MODE":
      return { ...state, newMode: action.value };
    case "SET_NEW_TOTAL_MARKS":
      return { ...state, newTotalMarks: action.value };
    case "SET_NEW_PASSING_MARKS":
      return { ...state, newPassingMarks: action.value };
    case "SET_IS_CREATING":
      return { ...state, isCreating: action.value };
    case "SET_DIALOG_CLASS_ID":
      return { ...state, dialogClassId: action.value, dialogSubjectId: "" };
    case "SET_DIALOG_SUBJECT_ID":
      return { ...state, dialogSubjectId: action.value };
    case "ADD_ASSESSMENT":
      return {
        ...state,
        assessments: [action.assessment, ...state.assessments],
        selectedAssessmentId: action.assessment.id,
      };
    default:
      return state;
  }
}
