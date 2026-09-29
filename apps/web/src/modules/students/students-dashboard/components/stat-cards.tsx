"use client";

import { Cake, School, UserPlus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentsAgeBand, StudentsStats } from "../../hooks/use-students-command-center";

/**
 * Four tiles, each a number the rows behind it can actually answer. The reference draws a
 * trend sparkline inside every tile; nothing here is stamped per session except admissions
 * and withdrawals, so each tile carries a composition bar built from real rows instead.
 */

function CompositionBar({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800" />;
  return (
    <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
          />
        ))}
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  tint,
  value,
  caption,
  children,
}: {
  icon: typeof School;
  label: string;
  tint: string;
  /** Pre-formatted: a percent and an age are not counts, and `toLocaleString` would flatten them. */
  value: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className={tint}>{<Icon className="size-4" />}</span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">{label}</span>
      </div>
      <div className="px-4 pt-3 pb-4">
        <p className="text-[30px] leading-none font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          {value}
        </p>
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500 truncate">{caption}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function StatCards({
  stats,
  agePyramid,
  loading,
}: {
  stats: StudentsStats | undefined;
  agePyramid: StudentsAgeBand[];
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] p-4"
          >
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="mt-4 h-8 w-16 rounded-md" />
            <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const otherGenders = Math.max(stats.otherGenders, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <Tile
        icon={Users}
        label="Students"
        tint="text-teal-600 dark:text-teal-400"
        value={stats.total.toLocaleString()}
        caption={`${stats.classes.toLocaleString()} classes · average ${stats.averageClassSize.toLocaleString()}`}
      >
        <CompositionBar
          segments={[
            { value: stats.boys, color: "#0EA5E9", label: "Boys" },
            { value: stats.girls, color: "#8B5CF6", label: "Girls" },
            { value: otherGenders, color: "#94A3B8", label: "Other" },
          ]}
        />
      </Tile>

      <Tile
        icon={UserPlus}
        label="Admitted this session"
        tint="text-emerald-600 dark:text-emerald-400"
        value={stats.admissions.toLocaleString()}
        caption={`${stats.withdrawals.toLocaleString()} withdrawn · ${stats.graduated.toLocaleString()} graduated`}
      >
        <CompositionBar
          segments={[
            { value: stats.admissions, color: "#0D9488", label: "Admitted" },
            { value: stats.withdrawals + stats.graduated, color: "#E2E8F0", label: "Left" },
          ]}
        />
      </Tile>

      <Tile
        icon={Cake}
        label="Median age"
        tint="text-amber-600 dark:text-amber-400"
        value={stats.medianAge > 0 ? `${stats.medianAge} yrs` : "—"}
        caption={
          stats.ageUnknown > 0
            ? `${stats.youngestAge}–${stats.oldestAge} yrs · ${stats.ageUnknown.toLocaleString()} with no date of birth`
            : `${stats.youngestAge}–${stats.oldestAge} yrs across the cohort`
        }
      >
        <CompositionBar
          segments={agePyramid.map((band, i) => ({
            value: band.boys + band.girls,
            color: ["#0D9488", "#0EA5E9", "#8B5CF6", "#F59E0B", "#EF4444", "#94A3B8", "#64748B"][i] ?? "#94A3B8",
            label: band.band,
          }))}
        />
      </Tile>

      <Tile
        icon={School}
        label="Records complete"
        tint="text-sky-600 dark:text-sky-400"
        value={`${stats.profileCompletePercent}%`}
        caption={`Largest class ${stats.largestClassName} with ${stats.largestClassSize.toLocaleString()}`}
      >
        <CompositionBar
          segments={[
            { value: stats.profileCompletePercent, color: "#0EA5E9", label: "Complete" },
            { value: 100 - stats.profileCompletePercent, color: "#E2E8F0", label: "Missing a field" },
          ]}
        />
      </Tile>
    </div>
  );
}
