"use client";

import { useAppStore } from "@/store/use-app-store";
import { useAcademicsCommandCenter } from "../hooks/use-academics-command-center";
import { StatCards } from "./components/stat-cards";
import { ReadinessCard } from "./components/readiness-card";
import { GrowthCard } from "./components/growth-card";
import { StructureCard } from "./components/structure-card";
import { FindingsCard } from "./components/findings-card";

export function AdminAcademicsDashboard() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { data, isLoading, error } = useAcademicsCommandCenter(currentTenantId);

  const session = data?.session ?? null;
  const stats = data?.stats;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center pt-1 pb-0.5">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Academics command center
        </h1>
        <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500 dark:text-zinc-400">
          {isLoading ? (
            "Reading this school's academic structure…"
          ) : session ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-zinc-200">{session.name}</span>
              {session.isCurrent ? " · current" : ""} · Day {session.dayNumber} of {session.totalDays} ·{" "}
              {session.percentComplete}% complete
            </>
          ) : (
            "No academic session is assigned to this school — the readiness score covers structure only."
          )}
        </p>
      </div>

      {error && !isLoading && (
        <div className="rounded-xl border border-rose-200/80 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/10 px-4 py-3">
          <p className="text-[13px] font-semibold text-rose-700 dark:text-rose-300">
            Could not load the command center
          </p>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}

      <StatCards stats={stats} loading={isLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <ReadinessCard
          score={data?.readiness.score ?? 0}
          axes={data?.readiness.axes ?? []}
          loading={isLoading}
        />
        <GrowthCard
          sessions={data?.growth.sessions ?? 0}
          points={data?.growth.points ?? []}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <StructureCard
          classes={stats?.classes ?? 0}
          students={stats?.students ?? 0}
          stages={data?.stages ?? []}
          loading={isLoading}
        />
        <FindingsCard findings={data?.findings ?? []} loading={isLoading} />
      </div>
    </div>
  );
}
