"use client";

import { LayoutGrid, School, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassStats } from "@/lib/types";

interface ClassesStatsRowProps {
  stats?: ClassStats;
  loading: boolean;
}

const cards = [
  {
    key: "total",
    label: "TOTAL CLASSES",
    icon: LayoutGrid,
    chip: "bg-[#E6F7F5] text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-400",
  },
  {
    key: "active",
    label: "ACTIVE",
    icon: School,
    chip: "bg-[#E6F7F5] text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-400",
  },
  {
    key: "enrolled",
    label: "TOTAL ENROLLED",
    icon: Users,
    chip: "bg-[#EFF6FF] text-[#3B82F6] dark:bg-blue-950/40 dark:text-blue-400",
  },
] as const;

/**
 * Tenant-wide totals, deliberately not derived from the filtered page — a school
 * with 12 classes that is filtered to 3 must still read 12 here.
 */
export function ClassesStatsRow({ stats, loading }: ClassesStatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="ink-kpi-tile rounded-lg px-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/80 shadow-2xs flex items-center justify-between"
        >
          {loading || !stats ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ) : (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {card.label}
                </p>
                <p className="mt-0.5 text-[26px] font-bold tabular-nums text-slate-800 dark:text-zinc-50 leading-tight">
                  {stats[card.key]}
                </p>
              </div>
              <span className={`grid size-9.5 place-items-center rounded-lg ${card.chip}`}>
                <card.icon className="size-4.5" />
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
