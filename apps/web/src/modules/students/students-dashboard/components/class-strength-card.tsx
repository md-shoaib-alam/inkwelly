"use client";

import { School } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentsClassStrength } from "../../hooks/use-students-command-center";

/**
 * Every class, fullest first, each measured against the seats it declares. A class over
 * capacity is drawn in red rather than clipped, because the overflow is the point.
 */
export function ClassStrengthCard({
  classes,
  loading,
}: {
  classes: StudentsClassStrength[];
  loading: boolean;
}) {
  const sorted = [...classes].sort((a, b) => b.students - a.students);
  const over = classes.filter((c) => c.students > c.capacity).length;
  const empty = classes.filter((c) => c.students === 0).length;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-sky-600 dark:text-sky-400">
          <School className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Class strength</span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {classes.length.toLocaleString()} classes
          {over > 0 ? ` · ${over} over capacity` : ""}
          {empty > 0 ? ` · ${empty} with nobody on roll` : ""}
        </span>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-full rounded-md" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-[12px] text-slate-400 dark:text-zinc-500">No classes created yet.</p>
        ) : (
          <ul className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {sorted.map((c) => {
              const fullest = Math.max(c.students, c.capacity, 1);
              const scale = (n: number) => (n / fullest) * 100;
              const isOver = c.students > c.capacity;
              return (
                <li key={c.classId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12px] text-slate-600 dark:text-zinc-300 truncate">
                      {c.label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums shrink-0">
                      / {c.capacity} seats
                    </span>
                  </div>
                  <span
                    className={`text-[12px] font-semibold tabular-nums ${
                      isOver ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-zinc-100"
                    }`}
                  >
                    {c.students.toLocaleString()}
                  </span>
                  <div
                    className="col-span-2 relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800"
                    title={`${c.label}: ${c.students} students, ${c.capacity} seats`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${scale(Math.min(c.students, c.capacity))}%`,
                        backgroundColor: isOver ? "#DC2626" : "#0EA5E9",
                      }}
                    />
                    <div
                      className="absolute inset-y-[-3px] w-px bg-slate-400 dark:bg-zinc-500"
                      style={{ left: `${scale(c.capacity)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && sorted.length > 0 && (
        <p className="px-4 pb-3 text-[11px] text-slate-400 dark:text-zinc-500">
          All {sorted.length.toLocaleString()} classes, fullest first.
        </p>
      )}
    </div>
  );
}
