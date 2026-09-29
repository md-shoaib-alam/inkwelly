"use client";

import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./card";
import type { StudentsStats } from "../../hooks/use-students-command-center";

const BOYS = "#3B82F6";
const GIRLS = "#EC4899";
const OTHER = "#94A3B8";

/**
 * The ring is a `strokeDasharray` on one circle per segment rather than a chart library:
 * three values and a hole in the middle do not need a dependency, and the geometry is
 * legible at a glance. `otherGenders` is drawn when a school records it, so the ring
 * always closes on the roll it claims to show.
 */
function Donut({ segments, centre }: { segments: { value: number; color: string }[]; centre: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="size-[104px] shrink-0 -rotate-90" role="img" aria-label={centre}>
      <circle cx="50" cy="50" r={R} fill="none" strokeWidth="16" className="stroke-slate-100 dark:stroke-zinc-800" />
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s) => {
            const len = (s.value / total) * C;
            const dash = `${len} ${C - len}`;
            const el = (
              <circle
                key={s.color}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        transform="rotate(90 50 50)"
        className="fill-slate-900 dark:fill-zinc-50 text-[15px] font-semibold tabular-nums"
      >
        {centre}
      </text>
    </svg>
  );
}

function LegendRow({
  color,
  label,
  percent,
  count,
}: {
  color: string;
  label: string;
  percent: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-slate-700 dark:text-zinc-200">{label}</span>
        <span className="block text-[12px] text-slate-400 dark:text-zinc-500 tabular-nums">{percent}%</span>
      </span>
      <span className="shrink-0 text-[14px] font-semibold tabular-nums text-slate-900 dark:text-zinc-50">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

export function GenderSplitCard({
  stats,
  loading,
}: {
  stats: StudentsStats | undefined;
  loading: boolean;
}) {
  const rows: React.ReactNode = (() => {
    if (loading || !stats) return <Skeleton className="h-[104px] w-[104px] rounded-full" />;
    const other = Math.max(stats.otherGenders, 0);
    const segments = [
      { value: stats.boys, color: BOYS },
      { value: stats.girls, color: GIRLS },
      { value: other, color: OTHER },
    ];
    const pct = (n: number) => (stats.total > 0 ? Math.round((n / stats.total) * 100) : 0);
    return (
      <div className="flex items-center gap-5">
        <Donut segments={segments} centre={stats.total.toLocaleString()} />
        <div className="min-w-0 flex-1 space-y-3">
          <LegendRow color={BOYS} label="Boys" percent={pct(stats.boys)} count={stats.boys} />
          <LegendRow color={GIRLS} label="Girls" percent={pct(stats.girls)} count={stats.girls} />
          {other > 0 && <LegendRow color={OTHER} label="Other" percent={pct(other)} count={other} />}
        </div>
      </div>
    );
  })();

  return (
    <Card
      title="Gender split"
      subtitle={stats ? `${stats.total.toLocaleString()} students` : "Students on roll"}
      icon={Users}
      tint="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
    >
      {rows}
    </Card>
  );
}
