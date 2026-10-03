"use client";

import { cn } from "@/lib/utils";

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  // Mirrors real DedicatedModulesScreen section distribution
  const sections = [
    { titleWidth: "w-44", count: 5 },   // People & Attendance
    { titleWidth: "w-48", count: 8 },   // Teaching & Learning
    { titleWidth: "w-36", count: 4 },   // Fees & Finance
    { titleWidth: "w-32", count: 3 },   // Administration
  ];

  return (
    <div className={cn("iwm", className)}>
      {/* ── Top Navigation Bar Skeleton ─────────────────────── */}
      <header className="iwm-topbar shrink-0">
        {/* Left: Brand logo & name */}
        <div className="iwm-brand">
          <div className="iwm-brand-badge animate-pulse bg-white/20" />
          <div className="h-4 w-32 rounded-full bg-white/20 animate-pulse" />
        </div>

        {/* Right: Search, AI button, Session, Theme, Avatar */}
        <div className="iwm-topbar-right">
          {/* Search bar skeleton */}
          <div className="hidden sm:block h-10 w-[260px] rounded-full bg-white/[0.08] border border-white/10 animate-pulse" />

          {/* Ask AI button skeleton */}
          <div className="hidden md:block h-9 w-20 rounded-full bg-[#f9dc82]/30 animate-pulse" />

          {/* Session selector skeleton */}
          <div className="h-10 w-24 rounded-full bg-white/[0.08] border border-white/10 animate-pulse" />

          {/* Theme toggle skeleton */}
          <div className="size-10 rounded-full bg-white/[0.08] animate-pulse" />

          {/* Avatar ring skeleton */}
          <div className="size-10 rounded-full bg-white/15 animate-pulse" />
        </div>
      </header>

      {/* ── Content Canvas Skeleton ───────────────────────────── */}
      {/* Light mode: cream (#faf7ed) | Dark mode (.dark): dark emerald (#0c1e19) */}
      <main className="iwm-body-canvas">
        <div className="w-full animate-in fade-in duration-200">
          {sections.map((section, sIdx) => (
            <section key={sIdx} className="iwm-section">
              {/* Section title skeleton */}
              <div className="mb-3">
                <div
                  className={cn(
                    "h-2.5 rounded-full animate-pulse",
                    /* light mode (cream canvas): dark shimmer */
                    "bg-[#14312a]/20",
                    /* dark mode (dark emerald canvas): white shimmer */
                    "dark:bg-white/10",
                    section.titleWidth
                  )}
                />
              </div>

              {/* Cards grid: .iwm-grid */}
              <div className="iwm-grid">
                {Array.from({ length: section.count }).map((_, i) => (
                  <div
                    key={i}
                    className="iwm-card pointer-events-none select-none"
                  >
                    {/* Icon box skeleton */}
                    <div className="iwm-icon-box bg-[#14312a]/10 dark:bg-white/10 animate-pulse" />

                    {/* Text content skeleton */}
                    <div className="iwm-content space-y-1.5">
                      <div className="h-3.5 w-28 rounded bg-[#14312a]/15 dark:bg-white/10 animate-pulse" />
                      <div className="h-2.5 w-36 rounded bg-[#14312a]/10 dark:bg-white/[0.06] animate-pulse" />
                    </div>

                    {/* Arrow skeleton */}
                    <div className="size-4 shrink-0 rounded-full bg-[#14312a]/10 dark:bg-white/[0.06] animate-pulse" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

// Alias for convenience
export const AdminDashboardSkeleton = DashboardSkeleton;
