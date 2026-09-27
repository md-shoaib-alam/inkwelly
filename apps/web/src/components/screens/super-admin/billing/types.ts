import React from "react";
import { CreditCard, Wallet, Building2, Receipt } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";

export interface Subscription {
  id: string;
  tenantId?: string;
  parentId?: string;
  planName: string;
  planId?: string;
  amount: number;
  status: string;
  paymentMethod: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  parent?: { user: { name: string; email?: string } } | null;
  tenant?: { name: string; slug?: string } | null;
}

export interface TenantBilling {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  activeRevenue: number;
  totalRevenue: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  _count?: { users: number; classes: number };
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  newSubscriptions: number;
  churned: number;
}

export interface BillingData {
  subscriptions: Subscription[];
  tenantBilling: TenantBilling[];
  planRevenue: Record<string, { count: number; revenue: number }>;
  methodRevenue: Record<string, { count: number; revenue: number }>;
  monthlyTrend: MonthlyTrend[];
  statusDistribution: Record<string, number>;
  totalActiveRevenue: number;
}

export type SortKey = "activeRevenue" | "totalRevenue" | "name" | "activeSubscriptions" | "plan";
export type SortDir = "asc" | "desc";

export const revenueTrendConfig = {
  revenue: { label: "Revenue (₹)", color: "var(--chart-1)" },
  newSubscriptions: { label: "New Subscriptions", color: "var(--chart-2)" },
  churned: { label: "Churned", color: "var(--chart-3)" },
} satisfies ChartConfig;

export const planRevenueConfig = {
  revenue: { label: "Revenue (₹)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const DONUT_COLORS: Record<string, string> = {
  card: "var(--chart-1)",
  upi: "var(--chart-2)",
  netbanking: "var(--chart-3)",
  wallet: "var(--chart-4)",
  free: "var(--muted-foreground)",
};

export const STATUS_COLORS: Record<string, string> = {
  active: "var(--chart-1)",
  expired: "var(--muted-foreground)",
  cancelled: "var(--chart-3)",
  trial: "var(--chart-4)",
};

export const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  active: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-700",
    dot: "bg-emerald-500",
    label: "Active",
  },
  expired: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground",
    label: "Expired",
  },
  cancelled: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-700",
    dot: "bg-red-500",
    label: "Cancelled",
  },
  trial: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-700",
    dot: "bg-amber-500",
    label: "Trial",
  },
};

export const paymentMethodConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  card: {
    icon: React.createElement(CreditCard, { className: "size-3.5" }),
    color: "text-emerald-600",
    label: "Card",
  },
  upi: {
    icon: React.createElement(Wallet, { className: "size-3.5" }),
    color: "text-violet-600",
    label: "UPI",
  },
  netbanking: {
    icon: React.createElement(Building2, { className: "size-3.5" }),
    color: "text-sky-600",
    label: "Net Banking",
  },
  wallet: {
    icon: React.createElement(Wallet, { className: "size-3.5" }),
    color: "text-amber-600",
    label: "Wallet",
  },
  free: {
    icon: React.createElement(Receipt, { className: "size-3.5" }),
    color: "text-muted-foreground",
    label: "Free",
  },
};

export const planBadgeConfig: Record<string, { bg: string; text: string; border: string }> = {
  Basic: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  Standard: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-700",
  },
  Premium: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-700",
  },
};
