"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, ListChecks, Minus, Target, TrendingUp, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { rate } from "./card";
import type { AttendanceStats } from "../../hooks/use-attendance-command-center";

/**
 * The four headline figures the reference draws: today's rate, who is in, how much of the
 * register is still open, and where the session stands against the school's own target.
 *
 * Two of them carry a delta chip. The reference gives no comparison for either, so each
 * says in its `title` what it is measured against — today against the trailing week, and
 * the session against the month before this one. A chip that silently meant "last month"
 * in one card and "last week" in another would be the kind of number nobody trusts.
 */
function Tile({
  icon: Icon,
  label,
  value,
  caption,
  delta,
  deltaTitle,
  bar,
  corner,
  title,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  /** Percentage points; null draws no chip, which is what an uncomparable figure gets. */
  delta?: number | null;
  deltaTitle?: string;
  /** The rule along the bottom: a fill, or a track with a target tick on it. */
  bar?: React.ReactNode;
  corner?: string;
  title?: string;
}) {
  return (
    <div
      title={title}
      style={{
        borderRadius: "20px",
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow)",
      }}
      className="flex flex-col min-w-0 px-4 pt-3.5 pb-4"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-[15px] shrink-0 text-slate-500 dark:text-zinc-400" />
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-700 dark:text-zinc-200">
          {label}
        </p>
        {delta !== null && delta !== undefined && (
          <span
            title={deltaTitle}
            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:text-zinc-300"
          >
            {delta > 0 ? (
              <ArrowUpRight className="size-3" />
            ) : delta < 0 ? (
              <ArrowDownRight className="size-3" />
            ) : (
              <Minus className="size-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="mt-2.5 text-[26px] leading-none font-bold tracking-tight tabular-nums text-slate-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-slate-500 dark:text-zinc-400">{caption}</p>

      {bar}
      {corner && (
        <p className="mt-1.5 self-end text-[12px] font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
          {corner}
        </p>
      )}
    </div>
  );
}

/** The thin rule at the bottom of a tile; `tone` picks how far it fills. */
function Bar({ share, tone }: { share: number; tone: "emerald" | "slate" }) {
  const fills = {
    emerald: "bg-emerald-500",
    slate: "bg-slate-300 dark:bg-zinc-600",
  };
  return (
    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full ${fills[tone]} transition-[width] duration-500`}
        style={{ width: `${Math.max(share > 0 ? 4 : 0, Math.min(100, share))}%` }}
      />
    </div>
  );
}

/**
 * The session tile's track: the fill is the rate, the tick is the school's own target, so
 * the gap the caption states is the gap you can see between them.
 */
function TargetBar({ share, target }: { share: number; target: number }) {
  const tone = share >= target ? "bg-emerald-500" : share >= target - 10 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="relative mt-3 h-1 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full ${tone} transition-[width] duration-500`}
        style={{ width: `${Math.max(share > 0 ? 4 : 0, Math.min(100, share))}%` }}
      />
      <span
        title={`${target}% target`}
        className="absolute -top-1 h-3 w-0.5 rounded-full bg-slate-400 dark:bg-zinc-500"
        style={{ left: `calc(${Math.min(100, Math.max(0, target))}% - 1px)` }}
      />
    </div>
  );
}

export function StatTiles({
  stats,
  target,
  cutoffTime,
  loading,
}: {
  stats: AttendanceStats | undefined;
  target: number;
  cutoffTime: string;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              borderRadius: "20px",
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow)",
            }}
            className="px-4 pt-3.5 pb-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-2.5 w-32 rounded-md" />
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const behind = Math.round((target - stats.sessionRate) * 10) / 10;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <Tile
        icon={TrendingUp}
        label="Attendance today"
        value={rate(stats.todayRate)}
        caption={`7-day avg ${rate(stats.weekRate)}`}
        delta={stats.todayRateDelta}
        deltaTitle="Today against the trailing seven days, in points"
        bar={<Bar share={stats.todayRate} tone="emerald" />}
        title={`${stats.presentToday.toLocaleString()} present of ${stats.rollStrength.toLocaleString()} on roll`}
      />
      <Tile
        icon={UserCheck}
        label="Present today"
        value={stats.presentToday.toLocaleString()}
        caption={`of ${stats.rollStrength.toLocaleString()} · ${Math.round(stats.todayRate)}% in school`}
        delta={null}
        bar={<Bar share={stats.todayRate} tone="emerald" />}
        title={`${stats.unmarkedToday.toLocaleString()} students on roll have no mark yet today`}
      />
      <Tile
        icon={ListChecks}
        label="Marking progress"
        value={`${stats.markedClasses} / ${stats.totalClasses}`}
        caption={`Cutoff ${cutoffTime}`}
        delta={null}
        bar={<Bar share={stats.totalClasses ? (stats.markedClasses / stats.totalClasses) * 100 : 0} tone="slate" />}
        corner={`${stats.classesLeft} left`}
        title={
          stats.classesLeft > 0
            ? `${stats.classesLeft} ${stats.classesLeft === 1 ? "class" : "classes"} still open${stats.totalClasses ? "" : " — no classes yet"}`
            : "Every class is marked for today"
        }
      />
      <Tile
        icon={Target}
        label="Session average"
        value={rate(stats.sessionRate)}
        caption={
          stats.sessionRate <= target
            ? `${Math.abs(behind).toFixed(1)} pp behind ${target}% target`
            : `${Math.abs(behind).toFixed(1)} pp ahead of ${target}% target`
        }
        delta={stats.sessionRateDelta}
        deltaTitle={
          stats.previousMonthRate === null
            ? "Nothing was marked last month, so there is no month to compare against"
            : `This session against last month's ${rate(stats.previousMonthRate)}, in points`
        }
        bar={<TargetBar share={stats.sessionRate} target={target} />}
        title={`Measured across ${stats.rollStrength.toLocaleString()} students on roll since the session began`}
      />
    </div>
  );
}
