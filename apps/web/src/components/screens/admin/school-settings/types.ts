import { toast } from "sonner";

export const ALL_DAYS = [
  { key: "monday", label: "Monday", short: "Mon", icon: "📅" },
  { key: "tuesday", label: "Tuesday", short: "Tue", icon: "📝" },
  { key: "wednesday", label: "Wednesday", short: "Wed", icon: "📚" },
  { key: "thursday", label: "Thursday", short: "Thu", icon: "✏️" },
  { key: "friday", label: "Friday", short: "Fri", icon: "🎉" },
  { key: "saturday", label: "Saturday", short: "Sat", icon: "📖" },
  { key: "sunday", label: "Sunday", short: "Sun", icon: "🏫" },
] as const;

export type DayKey = (typeof ALL_DAYS)[number]["key"];

const DEFAULT_WORKING_DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export interface TenantSettings {
  workingDays: string[];
  defaultMarksheetTemplateId?: string;
  enableModalTabulationPreview?: boolean;
  enableModalMarksheetPreview?: boolean;
  enableModalAdmitCardPreview?: boolean;
  enableGradeSelection?: boolean;
  [key: string]: unknown;
}

export interface SettingsState {
  loading: boolean;
  saving: boolean;
  workingDays: Set<DayKey>;
  defaultMarksheetTemplateId: string;
  enableModalTabulationPreview: boolean;
  enableModalMarksheetPreview: boolean;
  enableModalAdmitCardPreview: boolean;
  enableGradeSelection: boolean;
  hasChanges: boolean;
  initialSettings: TenantSettings | null;
}

export type SettingsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: TenantSettings }
  | { type: "FETCH_ERROR" }
  | { type: "TOGGLE_DAY"; dayKey: DayKey }
  | { type: "QUICK_SELECT_DAYS"; days: DayKey[] }
  | { type: "SET_MARKSHEET_TEMPLATE"; templateId: string }
  | { type: "TOGGLE_TABULATION_PREVIEW"; checked: boolean }
  | { type: "TOGGLE_MARKSHEET_PREVIEW"; checked: boolean }
  | { type: "TOGGLE_ADMIT_CARD_PREVIEW"; checked: boolean }
  | { type: "TOGGLE_GRADE_SELECTION"; checked: boolean }
  | { type: "SAVE_START" }
  | {
      type: "SAVE_SUCCESS";
      payload: {
        workingDays: DayKey[];
        defaultMarksheetTemplateId: string;
        enableModalTabulationPreview: boolean;
        enableModalMarksheetPreview: boolean;
        enableModalAdmitCardPreview: boolean;
        enableGradeSelection: boolean;
      };
    }
  | { type: "SAVE_ERROR" };

export const initialState: SettingsState = {
  loading: true,
  saving: false,
  workingDays: new Set(DEFAULT_WORKING_DAYS),
  defaultMarksheetTemplateId: "classic",
  enableModalTabulationPreview: false,
  enableModalMarksheetPreview: false,
  enableModalAdmitCardPreview: false,
  enableGradeSelection: false,
  hasChanges: false,
  initialSettings: null,
};

export function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        loading: true,
      };
    case "FETCH_SUCCESS": {
      const data = action.payload;
      let nextWorkingDays = state.workingDays;
      let nextTemplateId = state.defaultMarksheetTemplateId;
      let nextTabPreview = state.enableModalTabulationPreview;
      let nextMarksheetPreview = state.enableModalMarksheetPreview;
      let nextAdmitCardPreview = state.enableModalAdmitCardPreview;
      let nextGradeSelection = state.enableGradeSelection;

      if (data.workingDays && Array.isArray(data.workingDays)) {
        const validDays = data.workingDays.filter((d: string) =>
          ALL_DAYS.some((day) => day.key === d)
        ) as DayKey[];
        if (validDays.length > 0) {
          nextWorkingDays = new Set(validDays);
        }
      }
      if (data.defaultMarksheetTemplateId && typeof data.defaultMarksheetTemplateId === "string") {
        nextTemplateId = data.defaultMarksheetTemplateId;
      }
      if (typeof data.enableModalTabulationPreview === "boolean") {
        nextTabPreview = data.enableModalTabulationPreview;
      }
      if (typeof data.enableModalMarksheetPreview === "boolean") {
        nextMarksheetPreview = data.enableModalMarksheetPreview;
      }
      if (typeof data.enableModalAdmitCardPreview === "boolean") {
        nextAdmitCardPreview = data.enableModalAdmitCardPreview;
      }
      if (typeof data.enableGradeSelection === "boolean") {
        nextGradeSelection = data.enableGradeSelection;
      }

      return {
        ...state,
        loading: false,
        initialSettings: data,
        workingDays: nextWorkingDays,
        defaultMarksheetTemplateId: nextTemplateId,
        enableModalTabulationPreview: nextTabPreview,
        enableModalMarksheetPreview: nextMarksheetPreview,
        enableModalAdmitCardPreview: nextAdmitCardPreview,
        enableGradeSelection: nextGradeSelection,
        hasChanges: false,
      };
    }
    case "FETCH_ERROR":
      return {
        ...state,
        loading: false,
      };
    case "TOGGLE_DAY": {
      const next = new Set(state.workingDays);
      if (next.has(action.dayKey)) {
        next.delete(action.dayKey);
      } else {
        next.add(action.dayKey);
      }
      return {
        ...state,
        workingDays: next,
        hasChanges: true,
      };
    }
    case "QUICK_SELECT_DAYS":
      return {
        ...state,
        workingDays: new Set(action.days),
        hasChanges: true,
      };
    case "SET_MARKSHEET_TEMPLATE":
      return {
        ...state,
        defaultMarksheetTemplateId: action.templateId,
        hasChanges: true,
      };
    case "TOGGLE_TABULATION_PREVIEW":
      return {
        ...state,
        enableModalTabulationPreview: action.checked,
        hasChanges: true,
      };
    case "TOGGLE_MARKSHEET_PREVIEW":
      return {
        ...state,
        enableModalMarksheetPreview: action.checked,
        hasChanges: true,
      };
    case "TOGGLE_ADMIT_CARD_PREVIEW":
      return {
        ...state,
        enableModalAdmitCardPreview: action.checked,
        hasChanges: true,
      };
    case "TOGGLE_GRADE_SELECTION":
      return {
        ...state,
        enableGradeSelection: action.checked,
        hasChanges: true,
      };
    case "SAVE_START":
      return {
        ...state,
        saving: true,
      };
    case "SAVE_SUCCESS": {
      const { workingDays, defaultMarksheetTemplateId, enableModalTabulationPreview, enableModalMarksheetPreview, enableModalAdmitCardPreview, enableGradeSelection } = action.payload;
      return {
        ...state,
        saving: false,
        hasChanges: false,
        initialSettings: state.initialSettings
          ? {
              ...state.initialSettings,
               workingDays,
               defaultMarksheetTemplateId,
               enableModalTabulationPreview,
               enableModalMarksheetPreview,
               enableModalAdmitCardPreview,
               enableGradeSelection,
            }
          : null,
      };
    }
    case "SAVE_ERROR":
      return {
        ...state,
        saving: false,
      };
    default:
      return state;
  }
}
