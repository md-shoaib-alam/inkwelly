"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  IndianRupee,
  CreditCard,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { DashboardData } from "./types";
import { formatINR } from "@/lib/format";

interface DashboardHeroProps {
  loading: boolean;
  data: DashboardData | undefined;
  onNavigate?: (screen: string) => void;
}

export function DashboardHero({ loading, data, onNavigate }: DashboardHeroProps) {
  return (
    <div className="space-y-5">
      {/* Top Banner with Styled Content & Right-corner School Illustration */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100/90 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/80 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-sky-950/20 p-5 sm:px-8 shadow-xs flex items-center justify-between min-h-[105px] md:h-28">
        {/* Soft decorative background glows */}
        <div className="absolute -top-12 -right-12 size-72 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 size-56 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Left: Heading & Subtitle */}
        <div className="z-10 max-w-[58%] sm:max-w-md shrink-0">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mb-0.5">
            WELCOME BACK, ADMIN
          </p>
          <h1 className="text-base sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-slate-100 leading-tight">
            Platform Dashboard
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Overview of schools, users, revenue, and active subscriptions.
          </p>
        </div>

        {/* Right Corner: 4:3 School Graphic centered vertically on mobile, bottom-anchored on desktop */}
        <div className="absolute right-2 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 h-[70px] sm:h-[95px] md:h-[115px] aspect-[4/3] flex items-center sm:items-end justify-end pointer-events-none select-none">
          {/* Light Mode Image (4:3 ratio) */}
          <img
            src="/assets/super-admin/topdahsbordlight.avif"
            alt="School Illustration"
            className="h-full w-full object-contain object-center sm:object-bottom dark:hidden drop-shadow-xs"
          />
          {/* Dark Mode Image (4:3 ratio) */}
          <img
            src="/assets/super-admin/topdahsborddark.avif"
            alt="School Illustration Dark"
            className="h-full w-full object-contain object-center sm:object-bottom hidden dark:block drop-shadow-xs"
          />
        </div>
      </div>

      {/* 4 Stat Cards Row - 1 row horizontal slide/scroll on mobile, 4-column grid on desktop */}
      <div className="flex lg:grid lg:grid-cols-4 gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-none snap-x snap-mandatory">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[165px] sm:min-w-[210px] lg:min-w-0 flex-1 shrink-0 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs snap-start"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="size-8.5 sm:size-9 rounded-xl" />
                <Skeleton className="size-3.5 rounded-full" />
              </div>
              <div className="mt-2.5 space-y-1.5">
                <Skeleton className="h-3 w-14 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md mt-1" />
              </div>
            </div>
          ))
        ) : (
          <>
            {/* 1. Schools */}
            <div
              onClick={() => onNavigate?.("tenants")}
              className="min-w-[165px] sm:min-w-[210px] lg:min-w-0 flex-1 shrink-0 group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all snap-start"
            >
              <div className="flex items-center justify-between">
                <div className="size-8.5 sm:size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Building2 className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-2.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Schools</p>
                <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                  {(data?.tenants.total ?? 0).toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  <TrendingUp className="size-3 shrink-0" />
                  <span className="truncate">+{data?.tenants.trial ? data.tenants.trial + 1 : 3} this month</span>
                </div>
              </div>
            </div>

            {/* 2. Users */}
            <div
              onClick={() => onNavigate?.("users")}
              className="min-w-[165px] sm:min-w-[210px] lg:min-w-0 flex-1 shrink-0 group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all snap-start"
            >
              <div className="flex items-center justify-between">
                <div className="size-8.5 sm:size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Users className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-2.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Users</p>
                <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                  {(data?.users.total ?? 0).toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  <TrendingUp className="size-3 shrink-0" />
                  <span className="truncate">+12% this month</span>
                </div>
              </div>
            </div>

            {/* 3. Revenue */}
            <div
              onClick={() => onNavigate?.("billing")}
              className="min-w-[165px] sm:min-w-[210px] lg:min-w-0 flex-1 shrink-0 group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all snap-start"
            >
              <div className="flex items-center justify-between">
                <div className="size-8.5 sm:size-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <IndianRupee className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-2.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Revenue</p>
                <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatINR(data?.revenue.total ?? 0)}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  <TrendingUp className="size-3 shrink-0" />
                  <span className="truncate">+18% this month</span>
                </div>
              </div>
            </div>

            {/* 4. Subscriptions */}
            <div
              onClick={() => onNavigate?.("school-subscriptions")}
              className="min-w-[165px] sm:min-w-[210px] lg:min-w-0 flex-1 shrink-0 group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-800 transition-all snap-start"
            >
              <div className="flex items-center justify-between">
                <div className="size-8.5 sm:size-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <CreditCard className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-2.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Subscriptions</p>
                <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                  {(data?.subscriptions.active ?? 0).toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  <TrendingUp className="size-3 shrink-0" />
                  <span className="truncate">+5% this month</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
