"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, CheckSquare, UserMinus, UserPlus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "./card";
import type { StudentsStats } from "../../hooks/use-students-command-center";

/**
 * The four headline counts. Each is one line — an icon, a label, a number — because the
 * reference puts its detail in the cards below rather than in a caption here. The one
 * exception is the withdrawals pill, which is the same figure the tile already shows
 * expressed against the roll, so it needs no second query to be true.
 */
function Tile({
  icon,
  tint,
  label,
  value,
  trailing,
  title,
}: {
  icon: LucideIcon;
  tint: string;
  label: string;
  value: string;
  trailing?: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs px-5 py-4"
    >
      <IconTile icon={icon} tint={tint} />
      <div className="min-w-0">
        <p className="truncate text-[13px] text-slate-500 dark:text-zinc-400">{label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[24px] leading-7 font-semibold tracking-tight tabular-nums text-slate-900 dark:text-zinc-50">
            {value}
          </span>
          {trailing}
        </div>
      </div>
    </div>
  );
}

export function StatTiles({
  stats,
  loading,
}: {
  stats: StudentsStats | undefined;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#0D1526] px-5 py-4"
          >
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // The reference draws this as a red delta. It is not a change against last month —
  // nothing here is stamped per session but admissions and withdrawals — so it says
  // what it is: the share of the roll that has left.
  const withdrawalShare =
    stats.total > 0 ? (stats.withdrawals / stats.total) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <Tile
        icon={Users}
        tint="bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300"
        label="Total students"
        value={stats.total.toLocaleString()}
        title={`${stats.classes.toLocaleString()} classes · average ${stats.averageClassSize.toLocaleString()} per class`}
      />
      <Tile
        icon={UserPlus}
        tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
        label="New admissions"
        value={stats.admissions.toLocaleString()}
        title={`Admitted since the start of this session · ${stats.graduated.toLocaleString()} graduated`}
      />
      <Tile
        icon={CheckSquare}
        tint="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
        label="Profile completeness"
        value={`${stats.profileCompletePercent}%`}
        title="Share of students on roll with every field the roster asks for filled in"
      />
      <Tile
        icon={UserMinus}
        tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
        label="Withdrawals · TC"
        value={stats.withdrawals.toLocaleString()}
        title="Withdrawals as a share of the students on roll"
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 dark:bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-rose-600 dark:text-rose-300">
            <ArrowDownRight className="size-3" />−{withdrawalShare.toFixed(1)}%
          </span>
        }
      />
    </div>
  );
}
