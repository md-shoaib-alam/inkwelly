"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./card";
import type { AttendanceStatusCell } from "../../hooks/use-attendance-command-center";

/**
 * The six columns the reference draws across one card. Five are statuses a child can be in
 * and count against the roll; the sixth counts registers a teacher still has to open, so it
 * carries a bare number with no share — a percentage of classes next to percentages of
 * children would read as the same kind of figure when it is not.
 */
const DOT_TONES: Record<string, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  halfDay: "bg-violet-500",
  leave: "bg-blue-500",
  absent: "bg-rose-500",
  unmarkedClasses: "bg-slate-400 dark:bg-zinc-500",
};

export function StatusCard({
  cells,
  loading,
}: {
  cells: AttendanceStatusCell[];
  loading: boolean;
}) {
  return (
    <Card title="Today, by status" bodyClassName="p-0">
      {loading || cells.length === 0 ? (
        <div className="grid grid-cols-2 gap-px bg-slate-200/70 dark:bg-zinc-800 sm:grid-cols-3 xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2.5 bg-[var(--c-surface)] px-5 py-4">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-6 w-12 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        // The hairlines are the grid's own background showing through a 1px gap, which is
        // why the body has no padding: the rules have to run to the card's edge.
        <div className="grid grid-cols-2 gap-px bg-slate-200/70 dark:bg-zinc-800 sm:grid-cols-3 xl:grid-cols-6">
          {cells.map((cell) => (
            <div key={cell.key} className="min-w-0 bg-[var(--c-surface)] px-5 py-4">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${DOT_TONES[cell.key] ?? "bg-slate-400"}`}
                />
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
                  {cell.label}
                </p>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[26px] leading-none font-bold tabular-nums text-slate-900 dark:text-zinc-50">
                  {cell.students.toLocaleString()}
                </span>
                {cell.kind === "students" && (
                  <span className="text-[12px] tabular-nums text-slate-500 dark:text-zinc-400">
                    {cell.share.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
