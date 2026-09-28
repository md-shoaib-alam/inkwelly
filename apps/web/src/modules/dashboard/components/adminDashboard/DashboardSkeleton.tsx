"use client";

import { cn } from "@/lib/utils";

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl space-y-4 animate-in fade-in duration-200",
        className
      )}
    >
      {/* Favorites Strip Skeleton */}
      <section
        aria-label="Loading favorites"
        className="rounded-2xl bg-[#0D1526] border border-white/[0.06] p-3.5 sm:p-4.5"
      >
        {/* Header row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <div className="size-4 rounded-sm bg-amber-400/40 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 rounded bg-white/20 animate-pulse" />
              <div className="h-4 w-6 rounded-full bg-white/10 animate-pulse" />
            </div>
            <div className="h-3 w-56 rounded bg-white/10 animate-pulse mt-1" />
          </div>
          <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
        </div>

        {/* Favorite pills grid: 1 col mobile → 2 col sm → 4 col lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3.5 py-3"
            >
              <div className="size-9 shrink-0 rounded-xl bg-white/10 animate-pulse" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3.5 w-20 rounded bg-white/20 animate-pulse" />
                <div className="h-2.5 w-14 rounded bg-white/10 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Module Grid Skeleton */}
      <section aria-label="Loading modules">
        {/* Section header */}
        <div className="flex items-baseline gap-2 pb-4">
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-3 w-20 rounded bg-slate-200/60 dark:bg-zinc-800/60 animate-pulse" />
        </div>

        {/* Cards grid: 2 cols on mobile, 3 on sm, 4 on lg, 6 on xl */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white dark:border-zinc-800/60 dark:bg-[#0D1526] pt-4 pb-3.5 px-2.5 text-center min-h-[128px]"
            >
              {/* Icon bubble */}
              <div className="mb-2 size-11 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 animate-pulse" />

              {/* Title */}
              <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-zinc-700 animate-pulse" />

              {/* Subtitle */}
              <div className="mt-1.5 h-2.5 w-20 rounded bg-slate-100 dark:bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Alias for convenience
export const AdminDashboardSkeleton = DashboardSkeleton;
