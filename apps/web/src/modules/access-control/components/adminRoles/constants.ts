import React from "react";
import {
  GraduationCap,
  UserCheck,
  Users,
  Briefcase,
  School,
  BookOpen,
  CalendarCheck,
  Receipt,
  CreditCard,
  Award,
  FileSpreadsheet,
  TrendingUp,
  FileCheck,
  Bell,
  Clock,
  Calendar,
  BarChart3,
  Palmtree,
  LifeBuoy,
  CalendarRange,
} from "lucide-react";
import type { PermissionModule, RoleTemplate } from "./types";

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "students",
    label: "Students",
    desc: "Manage student enrollments, profiles & details",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
    icon: React.createElement(GraduationCap, { className: "size-4" }),
  },
  {
    key: "teachers",
    label: "Teachers",
    desc: "Teacher records, assignments & teaching schedule",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
    icon: React.createElement(UserCheck, { className: "size-4" }),
  },
  {
    key: "parents",
    label: "Parents",
    desc: "Parent directory, guardian details & communications",
    iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40",
    icon: React.createElement(Users, { className: "size-4" }),
  },
  {
    key: "staff",
    label: "Staff",
    desc: "Non-teaching staff & administrative workforce",
    iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40",
    icon: React.createElement(Briefcase, { className: "size-4" }),
  },
  {
    key: "classes",
    label: "Classes",
    desc: "Class sections, divisions & classroom allocations",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40",
    icon: React.createElement(School, { className: "size-4" }),
  },
  {
    key: "subjects",
    label: "Subjects",
    desc: "Course curricula, syllabus & subject mapping",
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40",
    icon: React.createElement(BookOpen, { className: "size-4" }),
  },
  {
    key: "attendance",
    label: "Attendance",
    desc: "Daily student & staff attendance records",
    iconBg: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/40",
    icon: React.createElement(CalendarCheck, { className: "size-4" }),
  },
  {
    key: "fees",
    label: "Fees",
    desc: "Fee structures, fee collections & student receipts",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
    icon: React.createElement(Receipt, { className: "size-4" }),
  },
  {
    key: "expenses",
    label: "Expenses",
    desc: "School operational expenses, vouchers & invoices",
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40",
    icon: React.createElement(CreditCard, { className: "size-4" }),
  },
  {
    key: "grades",
    label: "Grades",
    desc: "Grade cards, grading scales & student evaluation",
    iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40",
    icon: React.createElement(Award, { className: "size-4" }),
  },
  {
    key: "exams",
    label: "Exams",
    desc: "Examinations, schedules, admit cards & marksheets",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40",
    icon: React.createElement(FileSpreadsheet, { className: "size-4" }),
  },
  {
    key: "promotions",
    label: "Promotions",
    desc: "Student batch promotions & academic year progression",
    iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40",
    icon: React.createElement(TrendingUp, { className: "size-4" }),
  },
  {
    key: "certificates",
    label: "Certificates",
    desc: "Transfer certificates, bonafide & merit documents",
    iconBg: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/40",
    icon: React.createElement(FileCheck, { className: "size-4" }),
  },
  {
    key: "notices",
    label: "Notices",
    desc: "School announcements, circulars & notifications",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
    icon: React.createElement(Bell, { className: "size-4" }),
  },
  {
    key: "timetable",
    label: "Timetable",
    desc: "Class period schedules, timing & room allocations",
    iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40",
    icon: React.createElement(Clock, { className: "size-4" }),
  },
  {
    key: "calendar",
    label: "Calendar",
    desc: "School academic calendar, events & holidays",
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40",
    icon: React.createElement(Calendar, { className: "size-4" }),
  },
  {
    key: "reports",
    label: "Reports",
    desc: "Analytical reports, statistics & CSV/PDF exports",
    iconBg: "bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-100 dark:border-pink-900/40",
    icon: React.createElement(BarChart3, { className: "size-4" }),
  },
  {
    key: "leaves",
    label: "Leaves",
    desc: "Staff & student leave applications and approvals",
    iconBg: "bg-lime-50 text-lime-600 dark:bg-lime-950/50 dark:text-lime-400 border border-lime-100 dark:border-lime-900/40",
    icon: React.createElement(Palmtree, { className: "size-4" }),
  },
  {
    key: "tickets",
    label: "Support",
    desc: "Parent & staff help desk inquiries & tickets",
    iconBg: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-900/40",
    icon: React.createElement(LifeBuoy, { className: "size-4" }),
  },
  {
    key: "academic-years",
    label: "Academic Years",
    desc: "Configure academic sessions, terms & year statuses",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
    icon: React.createElement(CalendarRange, { className: "size-4" }),
  },
];

export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"] as const;

export const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

export const COLOR_PRESETS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: "Finance Manager",
    description: "Full control over fees, collections, student payments, and expenses.",
    color: "#10b981",
    permissions: {
      fees: ["view", "create", "edit", "delete"],
      expenses: ["view", "create", "edit", "delete"],
      students: ["view"],
      parents: ["view"],
      classes: ["view"],
      reports: ["view", "create"],
    },
  },
  {
    name: "Academic Coordinator",
    description: "Academic lead managing classes, subjects, exams, grades, and timetables.",
    color: "#8b5cf6",
    permissions: {
      classes: ["view", "create", "edit", "delete"],
      subjects: ["view", "create", "edit", "delete"],
      exams: ["view", "create", "edit", "delete"],
      grades: ["view", "create", "edit", "delete"],
      certificates: ["view", "create", "edit", "delete"],
      timetable: ["view", "create", "edit", "delete"],
      promotions: ["view", "create", "edit", "delete"],
      notices: ["view", "create", "edit", "delete"],
    },
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
      classes: ["view"],
    },
  },
  {
    name: "Receptionist / Clerk",
    description: "Handles parent inquiries, notices, calendar events, and support tickets.",
    color: "#06b6d4",
    permissions: {
      notices: ["view", "create", "edit", "delete"],
      calendar: ["view", "create", "edit", "delete"],
      tickets: ["view", "create", "edit", "delete"],
      parents: ["view"],
      students: ["view"],
    },
  },
  {
    name: "Exam Controller",
    description: "Oversees exam sessions, grade approvals, and student report cards.",
    color: "#f43f5e",
    permissions: {
      exams: ["view", "create", "edit", "delete"],
      grades: ["view", "create", "edit", "delete"],
      certificates: ["view", "create", "edit", "delete"],
      "academic-years": ["view"],
      reports: ["view", "create"],
      students: ["view"],
      classes: ["view"],
    },
  },
  {
    name: "Read-Only Staff",
    description: "View-only observer access across all academic and administrative modules.",
    color: "#f59e0b",
    permissions: Object.fromEntries(
      PERMISSION_MODULES.map((m) => [m.key, ["view"]])
    ),
  },
];
