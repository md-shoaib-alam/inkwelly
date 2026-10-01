"use client";

import { Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AcademicsStage } from "../../hooks/use-academics-command-center";

const STAGE_TINT: Record<string, string> = {
  foundational: "#0D9488",
  preparatory: "#8B5CF6",
  middle: "#F59E0B",
  secondary: "#0EA5E9",
  unclassified: "#94A3B8",
};

/** Bands from NEP 2020, read off `Class.classLevel`. A level that does not parse is listed
 *  as Unclassified rather than silently dropped from the totals. */
export function StructureCard({
  classes,
  students,
  stages,
  loading,
}: {
  classes: number;
  students: number;
  stages: AcademicsStage[];
  loading: boolean;
}) {
  const totalStageClasses = stages.reduce((sum, s) => sum + s.classes, 0);

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-teal-600 dark:text-teal-400">
          <Layers className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Structure</span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {classes.toLocaleString()} classes · {students.toLocaleString()} students
        </span>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                NEP stages
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">by classes</p>
            </div>
            <div className="mt-2 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              {totalStageClasses > 0 &&
                stages
                  .filter((s) => s.classes > 0)
                  .map((s) => (
                    <div
                      key={s.key}
                      title={`${s.label}: ${s.classes} classes`}
                      style={{
                        width: `${(s.classes / totalStageClasses) * 100}%`,
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
                    {s.classes}
                  </span>
                  <span className="tabular-nums text-slate-400 dark:text-zinc-500 w-14 text-right">
                    · {s.students.toLocaleString()}
                  </span>
                </div>
              ))}
              {stages.length === 0 && (
                <p className="text-[12px] text-slate-400 dark:text-zinc-500">No classes created yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
