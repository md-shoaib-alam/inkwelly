"use client";

import { GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./card";
import type { StudentsStage } from "../../hooks/use-students-command-center";

const BAR = "#0D9488";

/**
 * The NEP 2020 stages, read off `Class.grade`. Drawn as one bar per stage against the
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
      bodyClassName="px-5 pb-5 space-y-2.5"
    >
      {loading ? (
        [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full rounded-md" />)
      ) : stages.length === 0 ? (
        <p className="text-[13px] text-slate-400 dark:text-zinc-500">No students on roll yet.</p>
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
