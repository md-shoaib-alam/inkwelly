"use client";

import { GitCompareArrows } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./card";
import type {
  StudentsAgeBand,
  StudentsStats,
} from "../../hooks/use-students-command-center";

const BOYS = "#2563EB";
const GIRLS = "#EC4899";

/**
 * Age spread drawn the way the reference draws it: two bars growing away from the band in
 * the middle, so the eye compares boys against girls rather than reading a number off an
 * axis. A band with nobody in it is still drawn — an empty 3-5 row in a school that starts
 * at Grade 1 is a fact about the school, not a gap in the data.
 */
export function AgePyramidCard({
  bands,
  stats,
  loading,
}: {
  bands: StudentsAgeBand[];
  stats?: StudentsStats;
  loading: boolean;
}) {
  const rows = bands;
  const widest = Math.max(1, ...rows.map((b) => Math.max(b.boys, b.girls)));
  const tracked = rows.reduce((sum, r) => sum + r.boys + r.girls, 0);
  const unknown = stats?.ageUnknown ?? 0;
  const youngest = stats?.youngestAge ?? 0;
  const oldest = stats?.oldestAge ?? 0;

  return (
    <Card
      title="Age pyramid"
      subtitle="Boys (left) vs girls (right) by age band"
      icon={GitCompareArrows}
      tint="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
      bodyClassName="px-5 pb-5 space-y-4"
    >
      {loading ? (
        <Skeleton className="h-[212px] w-full rounded-xl" />
      ) : tracked === 0 ? (
        <p className="py-8 text-center text-[12px] text-slate-400 dark:text-zinc-500">
          {unknown > 0
            ? `None of the ${unknown.toLocaleString()} students on roll has a date of birth, so there is no age to plot.`
            : "No students on roll yet."}
        </p>
      ) : (
        <>
          <ul className="space-y-2.5">
            {rows.map((b) => (
              <li key={b.band} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <span className="flex h-2.5 justify-end overflow-hidden rounded-full bg-slate-100/70 dark:bg-zinc-800/70">
                  <span
                    className="h-full rounded-l-full"
                    style={{ width: `${(b.boys / widest) * 100}%`, backgroundColor: BOYS }}
                    title={`${b.boys.toLocaleString()} boys aged ${b.band}`}
                  />
                </span>
                <span className="w-12 text-center text-[12px] text-slate-500 dark:text-zinc-400 tabular-nums">
                  {b.band}
                </span>
                <span className="flex h-2.5 justify-start overflow-hidden rounded-full bg-slate-100/70 dark:bg-zinc-800/70">
                  <span
                    className="h-full rounded-r-full"
                    style={{ width: `${(b.girls / widest) * 100}%`, backgroundColor: GIRLS }}
                    title={`${b.girls.toLocaleString()} girls aged ${b.band}`}
                  />
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 px-4 py-3">
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">
              Median age ·{" "}
              <span className="font-semibold text-slate-900 dark:text-zinc-50">
                {stats?.medianAge ?? 0} yrs
              </span>
            </p>
            {youngest > 0 && oldest > 0 && (
              <p className="text-[13px] text-slate-500 dark:text-zinc-400">
                Range ·{" "}
                <span className="font-semibold text-slate-900 dark:text-zinc-50">
                  {youngest}–{oldest} yrs
                </span>
              </p>
            )}
          </div>

          {unknown > 0 && (
            <p className="text-[12px] text-slate-400 dark:text-zinc-500">
              {unknown.toLocaleString()} students are missing from this chart because no date
              of birth is on their record.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
