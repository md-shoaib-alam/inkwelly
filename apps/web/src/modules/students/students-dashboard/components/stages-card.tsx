"use client";

import { Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentsStage } from "../../hooks/use-students-command-center";

const STAGE_TINT: Record<string, string> = {
  foundational: "#0D9488",
  preparatory: "#8B5CF6",
  middle: "#F59E0B",
  secondary: "#0EA5E9",
  unclassified: "#94A3B8",
};

/** The NEP 2020 stages, read off `Class.grade` — the same bands the Academics center draws. */
export function StagesCard({
  stages,
  loading,
}: {
  stages: StudentsStage[];
  loading: boolean;
}) {
  const inStages = stages.reduce((sum, s) => sum + s.students, 0);

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-teal-600 dark:text-teal-400">
          <Layers className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">NEP stages</span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {inStages.toLocaleString()} students on roll
        </span>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              {stages
                .filter((s) => s.students > 0)
                .map((s) => (
                  <div
                    key={s.key}
                    title={`${s.label}: ${s.students.toLocaleString()} students`}
                    style={{
                      width: `${inStages > 0 ? (s.students / inStages) * 100 : 0}%`,
                      backgroundColor: STAGE_TINT[s.key] ?? "#94A3B8",
                    }}
                  />
                ))}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {stages.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STAGE_TINT[s.key] ?? "#94A3B8" }}
                  />
                  <span className="text-slate-600 dark:text-zinc-300 truncate">{s.label}</span>
                  <span className="ml-auto tabular-nums font-semibold text-slate-800 dark:text-zinc-100">
                    {s.students.toLocaleString()}
                  </span>
                  <span className="tabular-nums text-slate-400 dark:text-zinc-500 w-12 text-right">
                    {inStages > 0 ? Math.round((s.students / inStages) * 100) : 0}%
                  </span>
                </div>
              ))}
              {stages.length === 0 && (
                <p className="text-[12px] text-slate-400 dark:text-zinc-500">No students on roll yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
