export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  } | null;
}

export interface TicketItem {
  id: string;
  tenantId: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  } | null;
  assignee: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  } | null;
  _count: {
    messages: number;
  };
}

export interface TicketDetail extends Omit<TicketItem, "_count"> {
  messages: TicketMessage[];
}

export interface CreateFormData {
  title: string;
  description: string;
  priority: string;
  category: string;
}

export const emptyCreateForm: CreateFormData = {
  title: "",
  description: "",
  priority: "medium",
  category: "general",
};

export const TICKET_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "academics", label: "Academics" },
  { value: "feature_request", label: "Feature Request" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
];

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  on_hold: "On Hold",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  in_progress:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  on_hold:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  resolved:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  closed:
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  medium:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  high: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  urgent:
    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  teacher: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  student: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  parent: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  staff: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  super_admin: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function getCategoryLabel(value: string): string {
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label || value;
}
