import { format } from "date-fns";

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  subjectName: string;
  className: string;
  teacherName: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  ungradedSubmissions: number;
  mode: "online" | "offline";
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNumber?: string;
  studentClass: string;
  content: string | null;
  status: string;
  submittedAt: string;
  grade: string | null;
  feedback: string | null;
}

export interface State {
  assignments: Assignment[];
  subjects: { id: string; name: string; className: string; classId: string; teacherId: string }[];
  loading: boolean;
  dialogOpen: boolean;
  form: {
    title: string;
    description: string;
    classId: string;
    subjectId: string;
    dueDate: Date | undefined;
    mode: "online" | "offline";
  };
  subDialogOpen: boolean;
  selectedAssignment: Assignment | null;
  submissions: Submission[];
  subLoading: boolean;
  gradingId: string | null;
  editedGrades: Record<string, { grade: string; feedback: string }>;
  bulkSaving: boolean;
  completingId: string | null;
  confirmCompleteId: string | null;
}

export type Action =
  | { type: 'SET_ASSIGNMENTS'; payload: Assignment[] }
  | { type: 'SET_SUBJECTS'; payload: State['subjects'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_FORM'; payload: Partial<State['form']> }
  | { type: 'RESET_FORM' }
  | { type: 'SET_SUB_DIALOG_OPEN'; payload: boolean }
  | { type: 'OPEN_SUBMISSIONS'; payload: Assignment }
  | { type: 'SET_SUBMISSIONS'; payload: Submission[] }
  | { type: 'SET_SUB_LOADING'; payload: boolean }
  | { type: 'SET_GRADING_ID'; payload: string | null }
  | { type: 'SET_EDITED_GRADE'; payload: { id: string; grade?: string; feedback?: string } }
  | { type: 'UPDATE_SUBMISSION_GRADE'; payload: { id: string; grade: string; feedback: string | null } }
  | { type: 'BULK_UPDATE_GRADES'; payload: { id: string; grade: string; feedback: string | null }[] }
  | { type: 'SET_BULK_SAVING'; payload: boolean }
  | { type: 'SET_COMPLETING_ID'; payload: string | null }
  | { type: 'SET_CONFIRM_COMPLETE_ID'; payload: string | null }
  | { type: 'CLEAR_EDITED_GRADES' };

export const initialState: State = {
  assignments: [],
  subjects: [],
  loading: true,
  dialogOpen: false,
  form: {
    title: "",
    description: "",
    classId: "",
    subjectId: "",
    dueDate: undefined,
    mode: "offline",
  },
  subDialogOpen: false,
  selectedAssignment: null,
  submissions: [],
  subLoading: false,
  gradingId: null,
  editedGrades: {},
  bulkSaving: false,
  completingId: null,
  confirmCompleteId: null,
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ASSIGNMENTS': {
      const arr = Array.isArray(action.payload) ? action.payload : ((action.payload as any)?.data || (action.payload as any)?.items || []);
      return { ...state, assignments: arr };
    }
    case 'SET_SUBJECTS': return { ...state, subjects: action.payload };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_DIALOG_OPEN': return { ...state, dialogOpen: action.payload };
    case 'SET_FORM': return { ...state, form: { ...state.form, ...action.payload } };
    case 'RESET_FORM': return { ...state, form: initialState.form, dialogOpen: false };
    case 'SET_SUB_DIALOG_OPEN': 
      if (!action.payload) {
        return { ...state, subDialogOpen: false, selectedAssignment: null, submissions: [], editedGrades: {} };
      }
      return { ...state, subDialogOpen: true };
    case 'OPEN_SUBMISSIONS': 
      return { ...state, selectedAssignment: action.payload, subDialogOpen: true, subLoading: true, editedGrades: {} };
    case 'SET_SUBMISSIONS': return { ...state, submissions: action.payload };
    case 'SET_SUB_LOADING': return { ...state, subLoading: action.payload };
    case 'SET_GRADING_ID': return { ...state, gradingId: action.payload };
    case 'SET_EDITED_GRADE':
      return {
        ...state,
        editedGrades: {
          ...state.editedGrades,
          [action.payload.id]: {
            grade: action.payload.grade ?? (state.editedGrades[action.payload.id]?.grade || ""),
            feedback: action.payload.feedback ?? (state.editedGrades[action.payload.id]?.feedback || ""),
          }
        }
      };
    case 'UPDATE_SUBMISSION_GRADE':
      return {
        ...state,
        submissions: state.submissions.map(s => 
          s.id === action.payload.id 
            ? { ...s, grade: action.payload.grade, feedback: action.payload.feedback, status: 'graded' } 
            : s
        ),
        editedGrades: (() => {
          const next = { ...state.editedGrades };
          delete next[action.payload.id];
          return next;
        })()
      };
    case 'BULK_UPDATE_GRADES':
      return {
        ...state,
        submissions: state.submissions.map(s => {
          const update = action.payload.find(u => u.id === s.id);
          return update ? { ...s, grade: update.grade, feedback: update.feedback, status: 'graded' } : s;
        }),
        editedGrades: {}
      };
    case 'SET_BULK_SAVING': return { ...state, bulkSaving: action.payload };
    case 'SET_COMPLETING_ID': return { ...state, completingId: action.payload };
    case 'SET_CONFIRM_COMPLETE_ID': return { ...state, confirmCompleteId: action.payload };
    case 'CLEAR_EDITED_GRADES': return { ...state, editedGrades: {} };
    default: return state;
  }
}
