export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  type: string;
  targetRole: string;
  color: string;
  allDay: boolean;
  location?: string;
  createdAt: string;
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  endDate: string;
  type: string;
  targetRole: string;
  color: string;
  allDay: boolean;
  location: string;
}

export const EMPTY_FORM: EventFormData = {
  title: "",
  description: "",
  date: "",
  endDate: "",
  type: "event",
  targetRole: "all",
  color: "#3b82f6",
  allDay: true,
  location: "",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  exam: "#ef4444",
  holiday: "#10b981",
  event: "#3b82f6",
  meeting: "#f97316",
  sports: "#8b5cf6",
  cultural: "#ec4899",
  deadline: "#f59e0b",
  other: "#6b7280",
  general: "#10b981",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  exam: "Exam",
  holiday: "Holiday",
  event: "Event",
  meeting: "Meeting",
  sports: "Sports",
  cultural: "Cultural",
  deadline: "Deadline",
  other: "Other",
  general: "General",
};

export const TARGET_ROLE_LABELS: Record<string, string> = {
  all: "Everyone",
  admin: "Admins",
  teacher: "Teachers",
  student: "Students",
  parent: "Parents",
};

export const ALL_EVENT_TYPES = [
  "exam",
  "holiday",
  "event",
  "meeting",
  "sports",
  "cultural",
  "deadline",
  "other",
  "general",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
