import { PlatformRoleRecord, AssignedUser, AvailableUser } from "./types";

export interface RolesState {
  roles: PlatformRoleRecord[];
  loading: boolean;
  dialogOpen: boolean;
  editingRole: PlatformRoleRecord | null;
  saving: boolean;
  name: string;
  description: string;
  color: string;
  permissions: Record<string, string[]>;
  assignDialogOpen: boolean;
  assigningRole: PlatformRoleRecord | null;
  assignedUsers: AssignedUser[];
  availableUsers: AvailableUser[];
  assignLoading: boolean;
  assignSaving: boolean;
  userSearch: string;
}

export type RolesAction =
  | { type: "SET_ROLES"; roles: PlatformRoleRecord[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_DIALOG_OPEN"; open: boolean }
  | { type: "SET_EDITING_ROLE"; role: PlatformRoleRecord | null }
  | { type: "SET_SAVING"; saving: boolean }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_DESCRIPTION"; description: string }
  | { type: "SET_COLOR"; color: string }
  | { type: "SET_PERMISSIONS"; permissions: Record<string, string[]> }
  | { type: "TOGGLE_PERMISSION"; module: string; action: string }
  | { type: "SET_ASSIGN_DIALOG_OPEN"; open: boolean }
  | { type: "SET_ASSIGNING_ROLE"; role: PlatformRoleRecord | null }
  | { type: "SET_ASSIGNED_USERS"; users: AssignedUser[] }
  | { type: "SET_AVAILABLE_USERS"; users: AvailableUser[] }
  | { type: "SET_ASSIGN_LOADING"; loading: boolean }
  | { type: "SET_ASSIGN_SAVING"; saving: boolean }
  | { type: "SET_USER_SEARCH"; search: string }
  | { type: "UPDATE_USER_LISTS"; action: "assign" | "unassign"; userId: string };

export const initialState: RolesState = {
  roles: [],
  loading: true,
  dialogOpen: false,
  editingRole: null,
  saving: false,
  name: "",
  description: "",
  color: "#059669",
  permissions: {},
  assignDialogOpen: false,
  assigningRole: null,
  assignedUsers: [],
  availableUsers: [],
  assignLoading: false,
  assignSaving: false,
  userSearch: "",
};

export function rolesReducer(state: RolesState, action: RolesAction): RolesState {
  switch (action.type) {
    case "SET_ROLES":
      return { ...state, roles: action.roles, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_DIALOG_OPEN":
      return { ...state, dialogOpen: action.open };
    case "SET_EDITING_ROLE":
      return { ...state, editingRole: action.role };
    case "SET_SAVING":
      return { ...state, saving: action.saving };
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_DESCRIPTION":
      return { ...state, description: action.description };
    case "SET_COLOR":
      return { ...state, color: action.color };
    case "SET_PERMISSIONS":
      return { ...state, permissions: action.permissions };
    case "TOGGLE_PERMISSION": {
      const current = state.permissions[action.module] || [];
      const updated = current.includes(action.action)
        ? current.filter((a) => a !== action.action)
        : [...current, action.action];
      return { ...state, permissions: { ...state.permissions, [action.module]: updated } };
    }
    case "SET_ASSIGN_DIALOG_OPEN":
      return { ...state, assignDialogOpen: action.open };
    case "SET_ASSIGNING_ROLE":
      return { ...state, assigningRole: action.role };
    case "SET_ASSIGNED_USERS":
      return { ...state, assignedUsers: action.users };
    case "SET_AVAILABLE_USERS":
      return { ...state, availableUsers: action.users };
    case "SET_ASSIGN_LOADING":
      return { ...state, assignLoading: action.loading };
    case "SET_ASSIGN_SAVING":
      return { ...state, assignSaving: action.saving };
    case "SET_USER_SEARCH":
      return { ...state, userSearch: action.search };
    case "UPDATE_USER_LISTS": {
      if (action.action === "assign") {
        const user = state.availableUsers.find(u => u.id === action.userId);
        if (user) {
          return {
            ...state,
            availableUsers: state.availableUsers.filter(u => u.id !== action.userId),
            assignedUsers: [...state.assignedUsers, user],
          };
        }
      } else {
        const user = state.assignedUsers.find(u => u.id === action.userId);
        if (user) {
          return {
            ...state,
            assignedUsers: state.assignedUsers.filter(u => u.id !== action.userId),
            availableUsers: [...state.availableUsers, { ...user, platformRoleId: null }],
          };
        }
      }
      return state;
    }
    default:
      return state;
  }
}
