import React from "react";
import { Building2, Award, Clock, Users, ArrowUpRight, ArrowDownRight, BarChart3, ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionStatsProps {
  isLoading: boolean;
  totalSchools: number;
  activeLicenses: number;
  expiringSoon: number;
  totalStudents: number;
  showStatsOnMobile: boolean;
  setShowStatsOnMobile: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SubscriptionStats({
  isLoading,
  totalSchools,
  activeLicenses,
  expiringSoon,
  totalStudents,
  showStatsOnMobile,
  setShowStatsOnMobile,
}: SubscriptionStatsProps) {
  return (
    <>
      {/* Mobile Toggle Dropdown Button for Stats Cards */}
      <div className="flex sm:hidden items-center justify-between">
        <button
          type="button"
          onClick={() => setShowStatsOnMobile((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="size-3.5" />
            </div>
            <span>License Overview Stats ({totalSchools} Schools)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{showStatsOnMobile ? "Hide" : "Show"}</span>
            {showStatsOnMobile ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </button>
      </div>

      {/* 2. Four Stat Cards (Collapsible on Mobile, 4-col on Desktop) */}
      <div className={`${showStatsOnMobile ? "grid" : "hidden"} sm:grid grid-cols-2 lg:grid-cols-4 gap-3.5`}>
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="size-8 sm:size-9 rounded-xl shrink-0" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <Skeleton className="h-7 w-16 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-3 w-20 rounded-md mt-2" />
            </div>
          ))
        ) : (
          <>
            {/* Total Schools */}
            <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 sm:size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Building2 className="size-4" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Total Schools</p>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {totalSchools}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <ArrowUpRight className="size-2.5 mr-0.5" /> 20%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">+2 this month</p>
            </div>

            {/* Active Licenses */}
            <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 sm:size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Award className="size-4" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Active Licenses</p>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {activeLicenses}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <ArrowUpRight className="size-2.5 mr-0.5" /> 25%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">+2 this month</p>
            </div>

            {/* Expiring Soon */}
            <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 sm:size-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Expiring Soon</p>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {expiringSoon}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400">
                    <ArrowDownRight className="size-2.5 mr-0.5" /> 33%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">-1 this month</p>
            </div>

            {/* Total Students */}
            <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 sm:size-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <Users className="size-4" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Total Students</p>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {totalStudents.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <ArrowUpRight className="size-2.5 mr-0.5" /> 18%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">+750 this month</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
