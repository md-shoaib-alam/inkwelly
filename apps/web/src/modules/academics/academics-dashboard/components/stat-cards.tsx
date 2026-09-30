"use client";

import { BookOpen, School, Scale, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AcademicsStats } from "../../hooks/use-academics-command-center";

/**
 * The reference draws a trend sparkline in each tile. Nothing in this schema records a
 * class, teacher or subject count per session, so a trend would be invented.
 */

function Tile({
  icon: Icon,
  label,
  tint,
  value,
  caption,
}: {
  icon: typeof School;
  label: string;
  tint: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className={tint}>{<Icon className="size-4" />}</span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">{label}</span>
      </div>
      <div className="px-4 pt-3 pb-4">
        <p className="text-[30px] leading-none font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          {value.toLocaleString()}
        </p>
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500 truncate">{caption}</p>
      </div>
    </div>
  );
}

const BAND_TINT: Record<string, string> = {
  Healthy: "#0D9488",
  Watch: "#F59E0B",
  Strained: "#DC2626",
};

function RatioGauge({ label, band, students, teachers }: { label: string; band: string; students: number; teachers: number }) {
  const color = BAND_TINT[band] ?? "#94A3B8";
  const r = 26;
  const c = 2 * Math.PI * r;
  const slot = c / 3;
  const activeIndex = band === "Healthy" ? 0 : band === "Watch" ? 1 : 2;
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-[62px] shrink-0">
        <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke={i === activeIndex ? color : "#E2E8F0"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${slot - 4} ${c - slot + 4}`}
              strokeDashoffset={-(i * slot)}
              className={i === activeIndex ? "" : "dark:opacity-25"}
            />
          ))}
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold text-slate-800 dark:text-zinc-100">
          {label}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold" style={{ color }}>
          {band}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
          {students.toLocaleString()} / {teachers.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function StatCards({
  stats,
  loading,
}: {
  stats: AcademicsStats | undefined;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] p-4">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="mt-4 h-8 w-16 rounded-md" />
            <Skeleton className="mt-4 h-3 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <Tile
        icon={School}
        label="Classes"
        tint="text-teal-600 dark:text-teal-400"
        value={stats.classes}
        caption={`${stats.grades} class level${stats.grades === 1 ? "" : "s"}`}
      />

      <Tile
        icon={Users}
        label="Teachers"
        tint="text-violet-600 dark:text-violet-400"
        value={stats.teachers}
        caption={`${stats.taught.toLocaleString()} of ${stats.offerings.toLocaleString()} offerings assigned`}
      />

      <Tile
        icon={BookOpen}
        label="Subjects"
        tint="text-amber-600 dark:text-amber-400"
        value={stats.subjects}
        caption={`${stats.offerings.toLocaleString()} offerings · ${stats.classesWithOfferings}/${stats.classes} classes covered`}
      />

      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
          <span className="text-sky-600 dark:text-sky-400">
            <Scale className="size-4" />
          </span>
          <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Student : Teacher</span>
        </div>
        <div className="px-4 py-4">
          <RatioGauge
            label={stats.ratioLabel}
            band={stats.ratioBand}
            students={stats.students}
            teachers={stats.teachers}
          />
        </div>
      </div>
    </div>
  );
}
