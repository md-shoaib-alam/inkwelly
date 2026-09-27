import React from "react";
import { 
  Building2, 
  Users, 
  Receipt, 
  ScrollText, 
  PieChart, 
  Plug, 
  Settings, 
  Globe, 
  Lock, 
  Eye, 
  Server,
  UserPlus,
  Shield,
  UserCog,
  Bell,
  Send
} from "lucide-react";

export interface PlatformRoleRecord {
  id: string;
  name: string;
  description: string | null;
  color: string;
  permissions: string;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
}

export interface AssignedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isActive: boolean;
}

export interface AvailableUser extends AssignedUser {
  platformRoleId: string | null;
}

export const PLATFORM_MODULES = [
  { 
    key: "tenants", 
    label: "Schools / Tenants", 
    desc: "Manage schools and tenants",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
    icon: React.createElement(Building2, { className: "size-4" }) 
  },
  { 
    key: "users", 
    label: "All Users", 
    desc: "Manage all platform users",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
    icon: React.createElement(Users, { className: "size-4" }) 
  },
  { 
    key: "billing", 
    label: "Billing & Revenue", 
    desc: "Manage billing, invoices, plans",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40",
    icon: React.createElement(Receipt, { className: "size-4" }) 
  },
  { 
    key: "audit-logs", 
    label: "Audit Logs", 
    desc: "View system audit logs",
    iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40",
    icon: React.createElement(ScrollText, { className: "size-4" }) 
  },
  { 
    key: "analytics", 
    label: "Analytics", 
    desc: "View platform analytics",
    iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40",
    icon: React.createElement(PieChart, { className: "size-4" }) 
  },
  { 
    key: "integrations", 
    label: "Integrations", 
    desc: "Manage third-party integrations",
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40",
    icon: React.createElement(Plug, { className: "size-4" }) 
  },
  { 
    key: "security", 
    label: "Security", 
    desc: "Manage security settings",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
    icon: React.createElement(Lock, { className: "size-4" }) 
  },
  { 
    key: "settings", 
    label: "Platform Settings", 
    desc: "Manage platform configuration",
    iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40",
    icon: React.createElement(Settings, { className: "size-4" }) 
  },
  { 
    key: "notifications", 
    label: "Notifications", 
    desc: "Manage notification settings",
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40",
    icon: React.createElement(Bell, { className: "size-4" }) 
  },
  { 
    key: "reports", 
    label: "Reports & Export", 
    desc: "Generate and export reports",
    iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40",
    icon: React.createElement(Eye, { className: "size-4" }) 
  },
  { 
    key: "staff", 
    label: "Platform Staff", 
    desc: "Manage staff accounts",
    iconBg: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/40",
    icon: React.createElement(UserPlus, { className: "size-4" }) 
  },
  { 
    key: "support", 
    label: "Support Tickets", 
    desc: "Customer support tickets",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40",
    icon: React.createElement(Server, { className: "size-4" }) 
  },
  { 
    key: "api", 
    label: "API & Integrations", 
    desc: "Webhooks and API keys",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
    icon: React.createElement(Globe, { className: "size-4" }) 
  },
  { 
    key: "manage-admins", 
    label: "Admin Management", 
    desc: "Cross-school school administrators",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40",
    icon: React.createElement(UserCog, { className: "size-4" }) 
  },
  { 
    key: "notices", 
    label: "Platform Notices", 
    desc: "Broadcast platform announcements",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
    icon: React.createElement(Bell, { className: "size-4" }) 
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
  "#2563eb", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
];

export const ROLE_TEMPLATES = [
  {
    name: "Support Agent",
    description: "Handle support tickets and view tenant data",
    color: "#06b6d4",
    permissions: {
      tenants: ["view"],
      users: ["view"],
      billing: ["view"],
      "audit-logs": ["view"],
      analytics: ["view"],
      support: ["view", "create", "edit"],
    },
  },
  {
    name: "Billing Manager",
    description: "Manage billing, invoices, and subscription plans",
    color: "#f59e0b",
    permissions: {
      billing: ["view", "create", "edit", "delete"],
      tenants: ["view"],
      users: ["view"],
      analytics: ["view"],
      reports: ["view", "create"],
    },
  },
  {
    name: "Content Moderator",
    description: "Manage platform content and integrations",
    color: "#8b5cf6",
    permissions: {
      tenants: ["view"],
      integrations: ["view", "edit"],
      settings: ["view"],
      api: ["view"],
    },
  },
  {
    name: "Security Analyst",
    description: "Monitor security, audit logs, and user activity",
    color: "#ef4444",
    permissions: {
      "audit-logs": ["view", "create"],
      users: ["view", "edit"],
      security: ["view", "edit"],
      settings: ["view"],
      reports: ["view", "create", "edit"],
    },
  },
  {
    name: "Read-Only Viewer",
    description: "View-only access to all platform data",
    color: "#64748b",
    permissions: Object.fromEntries(
      PLATFORM_MODULES.map((m) => [m.key, ["view"]])
    ),
  },
];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isSystemRole(role: PlatformRoleRecord): boolean {
  if ((role as any).isSystem !== undefined) {
    return Boolean((role as any).isSystem);
  }
  // In demo / default data, Security Analyst is custom while others are default system templates
  const lower = role.name.trim().toLowerCase();
  if (lower === "security analyst") return false;
  return ROLE_TEMPLATES.some((t) => t.name.toLowerCase() === lower);
}

export interface RoleThemeConfig {
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
}

export const ROLE_THEMES: Record<string, RoleThemeConfig> = {
  "support agent": {
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-50 dark:bg-blue-950/60",
    badgeText: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    borderHover: "hover:border-blue-300",
  },
  "billing manager": {
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-950/60",
    badgeText: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    borderHover: "hover:border-amber-300",
  },
  "content moderator": {
    iconBg: "bg-purple-50 dark:bg-purple-950/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-50 dark:bg-purple-950/60",
    badgeText: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    borderHover: "hover:border-purple-300",
  },
  "security analyst": {
    iconBg: "bg-red-50 dark:bg-red-950/50",
    iconColor: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-50 dark:bg-red-950/60",
    badgeText: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    borderHover: "hover:border-red-300",
  },
  "read-only viewer": {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
    badgeText: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    borderHover: "hover:border-emerald-300",
  },
};

export function getRoleTheme(name: string): RoleThemeConfig {
  const lower = name.trim().toLowerCase();
  return (
    ROLE_THEMES[lower] || {
      iconBg: "bg-slate-100 dark:bg-zinc-800",
      iconColor: "text-slate-700 dark:text-zinc-300",
      badgeBg: "bg-slate-100 dark:bg-zinc-800",
      badgeText: "text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
      borderHover: "hover:border-slate-300",
    }
  );
}

