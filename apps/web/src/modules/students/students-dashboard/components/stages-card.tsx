"use client";

import { GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./card";
import type { StudentsStage } from "../../hooks/use-students-command-center";

const BAR = "#0D9488";

/**
 * The NEP 2020 stages, read off `Class.classLevel`. Drawn as one bar per stage against the
 * largest stage rather than against the whole roll, which is what makes the four rows
 * comparable at a glance.
 */
export function StagesCard({
  stages,
  loading,
}: {
  stages: StudentsStage[];
  loading: boolean;
}) {
  const largest = stages.reduce((max, s) => Math.max(max, s.students), 0);

  return (
    <Card
      title="By NEP stage"
      subtitle="Foundational → Secondary"
      icon={GraduationCap}
      tint="bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
      bodyClassName="px-5 pb-5 flex-1 flex flex-col justify-center items-center py-6"
    >
      {loading ? (
        [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full rounded-md" />)
      ) : stages.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="size-10 rounded-full grid place-items-center bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-2">
            <GraduationCap className="size-4" />
          </span>
          <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
            No stage data yet.
          </p>
        </div>
      ) : (
        stages.map((s) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-[76px] shrink-0 truncate text-[13px] text-slate-600 dark:text-zinc-300">
              {s.label}
            </span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${largest > 0 ? (s.students / largest) * 100 : 0}%`,
                  backgroundColor: BAR,
                }}
                title={`${s.students.toLocaleString()} students`}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-[13px] font-semibold tabular-nums text-slate-900 dark:text-zinc-50">
              {s.students.toLocaleString()}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}
