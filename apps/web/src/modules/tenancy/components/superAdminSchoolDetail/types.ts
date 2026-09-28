import React from "react";
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  School, 
  IndianRupee,
  ClipboardCheck, 
  Bell,
  CheckCircle2,
  Activity,
  Ban,
  XCircle
} from "lucide-react";

export type TabType = "students" | "teachers" | "parents" | "classes" | "fees" | "attendance" | "notices";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  maxStudents: number;
  maxTeachers: number;
  maxParents: number;
  maxClasses: number;
  createdAt: string;
  studentCount: number;
  teacherCount: number;
  parentCount: number;
  adminCount: number;
  activeSubscriptions: number;
  totalRevenue: number;
  _count: {
    users: number;
    classes: number;
    subscriptions: number;
    notices: number;
    events: number;
  };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  className: string;
  gender: string;
  dateOfBirth: string;
  status: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: string;
  status: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  occupation: string;
  status: string;
}

export interface Class {
  id: string;
  name: string;
  section: string;
  grade: string;
  capacity: number;
  studentCount: number;
}

export interface Fee {
  id: string;
  studentName: string;
  type: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAmount: number;
}

export interface Attendance {
  id: string;
  studentName: string;
  date: string;
  status: string;
  className: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorName: string;
  priority: string;
  createdAt: string;
  targetRole: string;
}

export const planColors: Record<string, { bg: string; text: string; border: string }> = {
  basic: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
  standard: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-700" },
  premium: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-700" },
  enterprise: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-700" },
};

export const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  active: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: React.createElement(CheckCircle2, { className: "size-3" }) },
  trial: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: React.createElement(Activity, { className: "size-3" }) },
  suspended: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: React.createElement(Ban, { className: "size-3" }) },
  inactive: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", icon: React.createElement(XCircle, { className: "size-3" }) },
};

export const TAB_CONFIG: { value: TabType; label: string; icon: React.ReactNode }[] = [
  { value: "students", label: "Students", icon: React.createElement(GraduationCap, { className: "size-4" }) },
  { value: "teachers", label: "Teachers", icon: React.createElement(Users, { className: "size-4" }) },
  { value: "parents", label: "Parents", icon: React.createElement(UserCheck, { className: "size-4" }) },
  { value: "classes", label: "Classes", icon: React.createElement(School, { className: "size-4" }) },
  { value: "fees", label: "Fees", icon: React.createElement(IndianRupee, { className: "size-4" }) },
  { value: "attendance", label: "Attendance", icon: React.createElement(ClipboardCheck, { className: "size-4" }) },
  { value: "notices", label: "Notices", icon: React.createElement(Bell, { className: "size-4" }) },
];
