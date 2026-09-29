"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useStudentsCommandCenter } from "../hooks/use-students-command-center";
import { SectionLabel } from "./components/card";
import { StatTiles } from "./components/stat-tiles";
import { DashboardSearch } from "./components/search-bar";
import { AlertsCard } from "./components/alerts-card";
import { BirthdaysCard } from "./components/birthdays-card";
import { GenderSplitCard } from "./components/gender-split-card";
import { StagesCard } from "./components/stages-card";
import { CategoryCard, ComplianceCard, DocumentsCard } from "./components/untracked-cards";
import { RecentActivityCard } from "./components/recent-activity-card";
import { MovementCard } from "./components/movement-card";
import { AgePyramidCard } from "./components/age-pyramid-card";
import { ClassStrengthCard } from "./components/class-strength-card";

/**
 * Students -> Dashboard. The reference gives this module a roll-shaped screen of its
 * own — four counts, a search, then Alerts and birthdays, composition, records — and
 * it is deliberately not the Academics center: that one answers "is school running
 * today", this one answers "whose paperwork is missing".
 */
export function AdminStudentsDashboard() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { data, isLoading, error } = useStudentsCommandCenter(currentTenantId);
  const [showMore, setShowMore] = useState(false);

  const stats = data?.stats;
  // The server names the gap in each tile's own words, so the frames that have no data
  // say which one is missing rather than showing a spinner that never resolves.
  const reasons: Record<string, string> = {};
  for (const tile of data?.untracked ?? []) reasons[tile.key] = tile.reason;
  const duplicates = (data?.untracked ?? []).find((t) => t.key === "duplicates");

  return (
    <div className="space-y-3 sm:space-y-4">
      {error && !isLoading && (
        <div className="rounded-xl border border-rose-200/80 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/10 px-4 py-3">
          <p className="text-[13px] font-semibold text-rose-700 dark:text-rose-300">
            Could not load this school's students
          </p>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}

      <StatTiles stats={stats} loading={isLoading} />

      <DashboardSearch />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3">
        <AlertsCard
          alerts={data?.alerts ?? []}
          openCount={stats?.openAlerts ?? 0}
          duplicates={duplicates}
          loading={isLoading}
        />
        <BirthdaysCard birthdays={data?.birthdays ?? []} loading={isLoading} />
      </div>

      <SectionLabel>Composition</SectionLabel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GenderSplitCard stats={stats} loading={isLoading} />
        <CategoryCard reasons={reasons} />
        <StagesCard stages={data?.stages ?? []} loading={isLoading} />
      </div>

      <SectionLabel>Records</SectionLabel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        <DocumentsCard reasons={reasons} />
        <div className="space-y-3">
          <ComplianceCard reasons={reasons} />
          <RecentActivityCard activity={data?.recentActivity ?? []} loading={isLoading} />
        </div>
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] px-5 py-2.5 text-[13px] font-semibold text-slate-600 dark:text-zinc-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors"
        >
          <ChevronDown className={`size-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
          {showMore ? "Show fewer insights" : "Show more insights"}
        </button>
      </div>

      {/* Mounted on expand, so the charts below are not built until someone asks for them. */}
      {showMore && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <MovementCard
              movement={data?.movement ?? []}
              enrolment={data?.enrolment ?? []}
              loading={isLoading}
            />
            <AgePyramidCard
              bands={data?.agePyramid ?? []}
              unknown={stats?.ageUnknown ?? 0}
              loading={isLoading}
            />
          </div>
          <ClassStrengthCard classes={data?.classStrength ?? []} loading={isLoading} />
        </>
      )}
    </div>
  );
}
