export interface RoleRecord {
  id: string;
  name: string;
  description?: string;
  color: string;
  permissions: Record<string, string[]>;
  userCount?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  customRole?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export const PERMISSION_MODULES = [
  { key: "students", label: "Students", icon: "👨‍🎓" },
  { key: "teachers", label: "Teachers", icon: "👨‍🏫" },
  { key: "parents", label: "Parents", icon: "👨‍👦" },
  { key: "staff", label: "Staff", icon: "💼" },
  { key: "classes", label: "Classes", icon: "🏫" },
  { key: "subjects", label: "Subjects", icon: "📚" },
  { key: "attendance", label: "Attendance", icon: "📋" },
  { key: "fees", label: "Fees", icon: "💰" },
  { key: "expenses", label: "Expenses", icon: "💸" },
  { key: "grades", label: "Grades", icon: "📝" },
  { key: "exams", label: "Exams", icon: "✍️" },
  { key: "promotions", label: "Promotions", icon: "🚀" },
  { key: "certificates", label: "Certificates", icon: "📜" },
  { key: "notices", label: "Notices", icon: "📢" },
  { key: "timetable", label: "Timetable", icon: "📅" },
  { key: "calendar", label: "Calendar", icon: "📆" },
  { key: "reports", label: "Reports", icon: "📊" },
  { key: "leaves", label: "Leaves", icon: "🌴" },
  { key: "tickets", label: "Support", icon: "🎫" },
  { key: "academic-years", label: "Academic Years", icon: "🗓️" },
];

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export const COLOR_PRESETS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

export const ROLE_TEMPLATES = [
  {
    name: "Finance Manager",
    description: "Full control over fees, collections, student payments, and expenses.",
    color: "#f59e0b",
    permissions: {
      fees: ["view", "create", "edit", "delete"],
      expenses: ["view", "create", "edit", "delete"],
      students: ["view"],
      parents: ["view"],
      classes: ["view"],
      reports: ["view", "create"]
    }
  },
  {
    name: "Academic Coordinator",
    description: "Academic lead managing classes, subjects, exams, grades, and timetables.",
    color: "#10b981",
    permissions: {
      classes: ["view", "create", "edit", "delete"],
      subjects: ["view", "create", "edit", "delete"],
      exams: ["view", "create", "edit", "delete"],
      grades: ["view", "create", "edit", "delete"],
      certificates: ["view", "create", "edit", "delete"],
      timetable: ["view", "create", "edit", "delete"],
      promotions: ["view", "create", "edit", "delete"],
      notices: ["view", "create", "edit", "delete"]
    }
  },
  {
    name: "Registrar / Admin Staff",
    description: "Manages student and parent admissions, attendance logs, and leaves.",
    color: "#3b82f6",
    permissions: {
      students: ["view", "create", "edit", "delete"],
      parents: ["view", "create", "edit", "delete"],
      attendance: ["view", "create", "edit", "delete"],
      tickets: ["view", "create", "edit", "delete"],
      leaves: ["view", "create", "edit", "delete"],
      classes: ["view"]
    }
  },
  {
    name: "Receptionist / Office Clerk",
    description: "Handles parent inquiries, notices, calendar events, and support tickets.",
    color: "#06b6d4",
    permissions: {
      notices: ["view", "create", "edit", "delete"],
      calendar: ["view", "create", "edit", "delete"],
      tickets: ["view", "create", "edit", "delete"],
      parents: ["view"],
      students: ["view"]
    }
  }
];
