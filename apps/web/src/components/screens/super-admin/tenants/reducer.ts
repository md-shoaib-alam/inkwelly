import { Tenant, TenantFormData, ViewMode, emptyFormData } from "./types";

export interface TenantsState {
  search: string;
  planFilter: string;
  statusFilter: string;
  viewMode: ViewMode;
  currentPage: number;
  formDialogOpen: boolean;
  detailDialogOpen: boolean;
  deleteDialogOpen: boolean;
  adminModalOpen: boolean;
  selectedTenant: Tenant | null;
  editingTenant: Tenant | null;
  viewingTenant: Tenant | null;
  deletingTenant: Tenant | null;
  targetTenantForAdmin: Tenant | null;
  formData: TenantFormData;
  submitting: boolean;
  autoSlug: boolean;
  adminFormData: { name: string; email: string; phone: string; password: "" };
  showAdminPassword: boolean;
}

export type TenantsAction =
  | { type: "SET_SEARCH"; search: string }
  | { type: "SET_PLAN_FILTER"; filter: string }
  | { type: "SET_STATUS_FILTER"; filter: string }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "SET_CURRENT_PAGE"; page: number }
  | { type: "SET_FORM_DIALOG_OPEN"; open: boolean }
  | { type: "SET_DETAIL_DIALOG_OPEN"; open: boolean }
  | { type: "SET_DELETE_DIALOG_OPEN"; open: boolean }
  | { type: "SET_ADMIN_MODAL_OPEN"; open: boolean }
  | { type: "SET_SELECTED_TENANT"; tenant: Tenant | null }
  | { type: "SET_EDITING_TENANT"; tenant: Tenant | null; formData?: TenantFormData }
  | { type: "SET_VIEWING_TENANT"; tenant: Tenant | null }
  | { type: "SET_DELETING_TENANT"; tenant: Tenant | null }
  | { type: "SET_TARGET_TENANT_FOR_ADMIN"; tenant: Tenant | null }
  | { type: "SET_FORM_DATA"; data: Partial<TenantFormData> }
  | { type: "RESET_FORM_DATA"; data?: TenantFormData }
  | { type: "SET_SUBMITTING"; submitting: boolean }
  | { type: "SET_AUTO_SLUG"; autoSlug: boolean }
  | { type: "SET_ADMIN_FORM_DATA"; data: Partial<TenantsState["adminFormData"]> }
  | { type: "SET_SHOW_ADMIN_PASSWORD"; show: boolean };

export const initialState: TenantsState = {
  search: "",
  planFilter: "all",
  statusFilter: "all",
  viewMode: "grid",
  currentPage: 1,
  formDialogOpen: false,
  detailDialogOpen: false,
  deleteDialogOpen: false,
  adminModalOpen: false,
  selectedTenant: null,
  editingTenant: null,
  viewingTenant: null,
  deletingTenant: null,
  targetTenantForAdmin: null,
  formData: emptyFormData,
  submitting: false,
  autoSlug: true,
  adminFormData: { name: "", email: "", phone: "", password: "" },
  showAdminPassword: false,
};

export function tenantsReducer(state: TenantsState, action: TenantsAction): TenantsState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.search, currentPage: 1 };
    case "SET_PLAN_FILTER":
      return { ...state, planFilter: action.filter, currentPage: 1 };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.filter, currentPage: 1 };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.page };
    case "SET_FORM_DIALOG_OPEN":
      return { ...state, formDialogOpen: action.open };
    case "SET_DETAIL_DIALOG_OPEN":
      return { ...state, detailDialogOpen: action.open };
    case "SET_DELETE_DIALOG_OPEN":
      return { ...state, deleteDialogOpen: action.open };
    case "SET_ADMIN_MODAL_OPEN":
      return { ...state, adminModalOpen: action.open };
    case "SET_SELECTED_TENANT":
      return { ...state, selectedTenant: action.tenant };
    case "SET_EDITING_TENANT":
      return { 
        ...state, 
        editingTenant: action.tenant, 
        formData: action.formData || state.formData 
      };
    case "SET_VIEWING_TENANT":
      return { ...state, viewingTenant: action.tenant };
    case "SET_DELETING_TENANT":
      return { ...state, deletingTenant: action.tenant };
    case "SET_TARGET_TENANT_FOR_ADMIN":
      return { ...state, targetTenantForAdmin: action.tenant };
    case "SET_FORM_DATA":
      return { ...state, formData: { ...state.formData, ...action.data } };
    case "RESET_FORM_DATA":
      return { ...state, formData: action.data || emptyFormData };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.submitting };
    case "SET_AUTO_SLUG":
      return { ...state, autoSlug: action.autoSlug };
    case "SET_ADMIN_FORM_DATA":
      return { ...state, adminFormData: { ...state.adminFormData, ...action.data } };
    case "SET_SHOW_ADMIN_PASSWORD":
      return { ...state, showAdminPassword: action.show };
    default:
      return state;
  }
}
