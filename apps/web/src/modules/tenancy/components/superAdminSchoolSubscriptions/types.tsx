import React from "react";
import { format } from "date-fns";

export interface TenantSubscription {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
  address?: string | null;
  plan: string;
  status: string;
  startDate?: string | null;
  createdAt?: string | null;
  endDate?: string | null;
  maxStudents?: number | null;
  maxTeachers?: number | null;
  maxParents?: number | null;
  maxClasses?: number | null;
  studentCount?: number;
  teacherCount?: number;
  parentCount?: number;
  _count?: {
    users?: number;
  };
}

export function getStatusBadge(status: string, endDate: string | null | undefined) {
  const now = new Date();
  const expiry = endDate ? new Date(endDate) : null;

  if (status === "trial") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
        <span className="size-1.5 rounded-full bg-amber-500" /> Trial
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
        <span className="size-1.5 rounded-full bg-rose-500" /> Suspended
      </span>
    );
  }
  if (status !== "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
        <span className="size-1.5 rounded-full bg-rose-500" /> {status}
      </span>
    );
  }
  if (expiry && expiry < now) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
        <span className="size-1.5 rounded-full bg-rose-500" /> Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
      <span className="size-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  );
}

export function getPlanBadge(plan: string) {
  const p = (plan || "").toLowerCase();
  if (p === "premium") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50">
        Premium
      </span>
    );
  }
  if (p === "standard") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
        Standard
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      Basic
    </span>
  );
}
