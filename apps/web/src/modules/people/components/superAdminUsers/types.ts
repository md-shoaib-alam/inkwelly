import React from "react";
import { 
  Shield, 
  Crown, 
  BookOpen, 
  GraduationCap, 
  Heart, 
  UserCog, 
  Users 
} from "lucide-react";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan?: string;
  status?: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string; // "super_admin" | "admin" | "teacher" | "student" | "parent" | "staff"
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  tenant: TenantInfo | null;
}

export interface RoleCount {
  role: string;
  count: number;
}

export interface UsersResponse {
  users: PlatformUser[];
  total: number;
  page: number;
  totalPages: number;
  roleCounts: RoleCount[];
  tenants: TenantInfo[];
}

export const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
  { value: "staff", label: "Staff" },
  { value: "super_admin", label: "Super Admin" },
] as const;

export const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  super_admin: {
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50",
    icon: React.createElement(Crown, { className: "size-3.5 mr-1" }),
    label: "Admin",
  },
  admin: {
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50",
    icon: React.createElement(Crown, { className: "size-3.5 mr-1" }),
    label: "Admin",
  },
  teacher: {
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50",
    icon: React.createElement(BookOpen, { className: "size-3.5 mr-1" }),
    label: "Teacher",
  },
  student: {
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50",
    icon: React.createElement(GraduationCap, { className: "size-3.5 mr-1" }),
    label: "Student",
  },
  parent: {
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50",
    icon: React.createElement(Heart, { className: "size-3.5 mr-1" }),
    label: "Parent",
  },
  staff: {
    color: "text-fuchsia-700 dark:text-fuchsia-300",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800/50",
    icon: React.createElement(UserCog, { className: "size-3.5 mr-1" }),
    label: "Staff",
  },
};

export const STAT_CARDS = [
  {
    key: "total",
    label: "Total Users",
    icon: Users,
    iconBg: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
    stroke: "#2563EB",
    gradientId: "sparkline-blue",
    trend: "↑ 12%",
    subtext: "+134 this month",
  },
  {
    key: "student",
    label: "Students",
    icon: GraduationCap,
    iconBg: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
    stroke: "#9333EA",
    gradientId: "sparkline-purple",
    trend: "↑ 8%",
    subtext: "+66 this month",
  },
  {
    key: "teacher",
    label: "Teachers",
    icon: BookOpen,
    iconBg: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400",
    stroke: "#0284C7",
    gradientId: "sparkline-sky",
    trend: "↑ 5%",
    subtext: "+8 this month",
  },
  {
    key: "parent",
    label: "Parents",
    icon: Heart,
    iconBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
    stroke: "#D97706",
    gradientId: "sparkline-amber",
    trend: "↑ 12%",
    subtext: "+15 this month",
  },
  {
    key: "staff",
    label: "Staff",
    icon: UserCog,
    iconBg: "bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600 dark:text-fuchsia-400",
    stroke: "#C026D3",
    gradientId: "sparkline-fuchsia",
    trend: "↑ 4%",
    subtext: "+2 this month",
  },
  {
    key: "admin",
    label: "Admins",
    icon: Shield,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
    stroke: "#059669",
    gradientId: "sparkline-emerald",
    trend: "↑ 0%",
    subtext: "No change",
  },
] as const;

export const PAGE_SIZE = 10;

