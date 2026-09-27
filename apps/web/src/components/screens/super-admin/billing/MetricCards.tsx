import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Receipt,
  Building2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MetricCardsProps {
  loading: boolean;
  totalActiveRevenue: number;
  activeCount: number;
  totalSubscriptions: number;
  churnedSubscriptions: number;
  expiredCount: number;
  cancelledCount: number;
  avgRevenuePerTenant: number;
  tenantCount: number;
  churnRate: number;
}

export function MetricCards({
  loading,
  totalActiveRevenue,
  activeCount,
  totalSubscriptions,
  churnedSubscriptions,
  expiredCount,
  cancelledCount,
  avgRevenuePerTenant,
  tenantCount,
  churnRate,
}: MetricCardsProps) {
  const [showStatsOnMobile, setShowStatsOnMobile] = useState(false);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border border-border rounded-2xl bg-card p-3 sm:p-4.5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
                <Skeleton className="size-8 sm:size-9 rounded-xl shrink-0" />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-6 sm:h-7 w-28 rounded-md mt-1.5" />
            </div>
            <Skeleton className="h-3 w-24 rounded-md mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-0">
      {/* Mobile Toggle Button */}
      <div className="block sm:hidden">
        <button
          type="button"
          onClick={() => setShowStatsOnMobile((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/40">
              <BarChart3 className="size-3.5" />
            </div>
            <span className="font-semibold text-xs">Revenue Overview Stats</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span>{showStatsOnMobile ? "Hide" : "Show"}</span>
            {showStatsOnMobile ? (
              <ChevronUp className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </button>
      </div>

      {/* Metric Cards Grid: Collapsible on Mobile, always visible on Desktop */}
      <div className={`${showStatsOnMobile ? "grid" : "hidden"} sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`}>
      {/* Total Active Revenue */}
      <div className="border border-border rounded-2xl bg-card p-3 sm:p-4.5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IndianRupee className="size-4 sm:size-4.5" />
            </div>
            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5">
              <ArrowUpRight className="size-2.5 sm:size-3 mr-0.5" /> Active
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Active Revenue</p>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground mt-0.5 flex items-center">
            <IndianRupee className="size-3.5 sm:size-4.5" />
            {totalActiveRevenue.toLocaleString()}
          </p>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-medium truncate">
          From {activeCount} active subs
        </p>
      </div>

      {/* Total Subscriptions */}
      <div className="border border-border rounded-2xl bg-card p-3 sm:p-4.5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="size-4 sm:size-4.5" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-border bg-muted/60 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5">
              <BarChart3 className="size-2.5 sm:size-3 mr-0.5" /> Total
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Subscriptions</p>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
            {totalSubscriptions}
          </p>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-medium truncate">
          {activeCount} active, {churnedSubscriptions} churned
        </p>
      </div>

      {/* Avg Revenue Per Tenant */}
      <div className="border border-border rounded-2xl bg-card p-3 sm:p-4.5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Building2 className="size-4 sm:size-4.5" />
            </div>
            <Badge variant="outline" className="text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/30 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5">
              <Users className="size-2.5 sm:size-3 mr-0.5" /> {tenantCount}
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">ARPT</p>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground mt-0.5 flex items-center">
            <IndianRupee className="size-3.5 sm:size-4.5" />
            {avgRevenuePerTenant.toLocaleString()}
          </p>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-medium truncate">
          Average per tenant
        </p>
      </div>

      {/* Churn Analytics */}
      <div className="border border-border rounded-2xl bg-card p-3 sm:p-4.5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight className="size-4 sm:size-4.5" />
            </div>
            <Badge variant="outline" className="text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/30 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5">
              {churnRate}% rate
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Churn Analytics</p>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
            {churnedSubscriptions}
          </p>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-medium truncate">
          {expiredCount} expired, {cancelledCount} churn
        </p>
      </div>
    </div>
    </div>
  );
}
