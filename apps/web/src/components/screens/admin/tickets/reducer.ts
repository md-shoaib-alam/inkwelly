import { TicketItem, TicketDetail, StaffMember, CreateFormData } from "./types";

export interface TicketsState {
  tickets: TicketItem[];
  staffList: StaffMember[];
  loading: boolean;
  statusFilter: string;
  searchQuery: string;
  priorityFilter: string;
  categoryFilter: string;
  createOpen: boolean;
  createForm: CreateFormData;
  creating: boolean;
  detailOpen: boolean;
  selectedTicket: TicketDetail | null;
  detailLoading: boolean;
  replyMessage: string;
  sendingReply: boolean;
  editStatus: string;
  editPriority: string;
  editAssignee: string;
  updatingTicket: boolean;
}

export type TicketsAction =
  | { type: "SET_TICKETS"; tickets: TicketItem[] }
  | { type: "SET_STAFF_LIST"; staff: StaffMember[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_STATUS_FILTER"; status: string }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_PRIORITY_FILTER"; priority: string }
  | { type: "SET_CATEGORY_FILTER"; category: string }
  | { type: "SET_CREATE_OPEN"; open: boolean }
  | { type: "SET_CREATE_FORM"; form: CreateFormData }
  | { type: "SET_CREATING"; creating: boolean }
  | { type: "SET_DETAIL_OPEN"; open: boolean }
  | { type: "SET_SELECTED_TICKET"; ticket: TicketDetail | null }
  | { type: "SET_DETAIL_LOADING"; loading: boolean }
  | { type: "SET_REPLY_MESSAGE"; message: string }
  | { type: "SET_SENDING_REPLY"; sending: boolean }
  | { type: "SET_EDIT_TICKET_FIELDS"; status: string; priority: string; assignee: string }
  | { type: "SET_EDIT_STATUS"; status: string }
  | { type: "SET_EDIT_PRIORITY"; priority: string }
  | { type: "SET_EDIT_ASSIGNEE"; assignee: string }
  | { type: "SET_UPDATING_TICKET"; updating: boolean };

export const emptyCreateForm: CreateFormData = {
  title: "",
  description: "",
  priority: "medium",
  category: "general",
};

export const initialState: TicketsState = {
  tickets: [],
  staffList: [],
  loading: true,
  statusFilter: "all",
  searchQuery: "",
  priorityFilter: "all",
  categoryFilter: "all",
  createOpen: false,
  createForm: { ...emptyCreateForm },
  creating: false,
  detailOpen: false,
  selectedTicket: null,
  detailLoading: false,
  replyMessage: "",
  sendingReply: false,
  editStatus: "",
  editPriority: "",
  editAssignee: "unassigned",
  updatingTicket: false,
};

export function ticketsReducer(state: TicketsState, action: TicketsAction): TicketsState {
  switch (action.type) {
    case "SET_TICKETS":
      return { ...state, tickets: action.tickets, loading: false };
    case "SET_STAFF_LIST":
      return { ...state, staffList: action.staff };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.status };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };
    case "SET_PRIORITY_FILTER":
      return { ...state, priorityFilter: action.priority };
    case "SET_CATEGORY_FILTER":
      return { ...state, categoryFilter: action.category };
    case "SET_CREATE_OPEN":
      return { ...state, createOpen: action.open };
    case "SET_CREATE_FORM":
      return { ...state, createForm: action.form };
    case "SET_CREATING":
      return { ...state, creating: action.creating };
    case "SET_DETAIL_OPEN":
      return { ...state, detailOpen: action.open };
    case "SET_SELECTED_TICKET":
      return { ...state, selectedTicket: action.ticket };
    case "SET_DETAIL_LOADING":
      return { ...state, detailLoading: action.loading };
    case "SET_REPLY_MESSAGE":
      return { ...state, replyMessage: action.message };
    case "SET_SENDING_REPLY":
      return { ...state, sendingReply: action.sending };
    case "SET_EDIT_TICKET_FIELDS":
      return { ...state, editStatus: action.status, editPriority: action.priority, editAssignee: action.assignee };
    case "SET_EDIT_STATUS":
      return { ...state, editStatus: action.status };
    case "SET_EDIT_PRIORITY":
      return { ...state, editPriority: action.priority };
    case "SET_EDIT_ASSIGNEE":
      return { ...state, editAssignee: action.assignee };
    case "SET_UPDATING_TICKET":
      return { ...state, updatingTicket: action.updating };
    default:
      return state;
  }
}
