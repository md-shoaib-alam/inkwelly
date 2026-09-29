"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useStudentsCommandCenter } from "../hooks/use-students-command-center";
import { StatCards } from "./components/stat-cards";
import { MovementCard } from "./components/movement-card";
import { AgePyramidCard } from "./components/age-pyramid-card";
import { StagesCard } from "./components/stages-card";
import { AlertsCard } from "./components/alerts-card";
import { ClassStrengthCard } from "./components/class-strength-card";
import { BirthdaysCard } from "./components/birthdays-card";
import { UntrackedCard } from "./components/untracked-card";

export function AdminStudentsDashboard() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { data, isLoading, error } = useStudentsCommandCenter(currentTenantId);
  const [showMore, setShowMore] = useState(false);

  const session = data?.session ?? null;
  const stats = data?.stats;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center pt-1 pb-0.5">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Students command center
        </h1>
        <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500 dark:text-zinc-400">
          {isLoading ? (
            "Reading this school's students…"
          ) : session ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-zinc-200">{session.name}</span>
              {session.isCurrent ? " · current" : ""} · Day {session.dayNumber} of {session.totalDays} ·{" "}
              {session.percentComplete}% complete
            </>
          ) : (
            "No academic session is assigned to this school — counts cover every student on roll."
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

      <StatCards
        stats={stats}
        agePyramid={data?.agePyramid ?? []}
        loading={isLoading}
      />

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <StagesCard stages={data?.stages ?? []} loading={isLoading} />
        <AlertsCard alerts={data?.alerts ?? []} loading={isLoading} />
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-[#0D1526]/70 px-4 py-2.5 text-[12px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors"
      >
        {showMore ? "Show fewer insights" : "Show more insights"}
        <ChevronDown className={`size-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
      </button>

      {/* Mounted on expand, so the rows below are not built until someone asks for them. */}
      {showMore && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <ClassStrengthCard classes={data?.classStrength ?? []} loading={isLoading} />
            <BirthdaysCard birthdays={data?.birthdays ?? []} loading={isLoading} />
          </div>
          <UntrackedCard tiles={data?.untracked ?? []} />
        </>
      )}
    </div>
  );
}
