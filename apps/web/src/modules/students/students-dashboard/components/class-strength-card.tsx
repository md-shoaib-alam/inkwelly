"use client";

import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./card";
import type { StudentsClassStrength } from "../../hooks/use-students-command-center";

const BOYS = "#2563EB";
const GIRLS = "#EC4899";

/** The class part of a `Name - Section` label, so sections can be counted per class. */
const classOf = (label: string) => label.split(" - ")[0] ?? label;

/**
 * Every class, one bar each, split by gender the way the reference draws it. Capacity is
 * deliberately not shown here: a class over its seats is already an alert with a route to
 * fix it, and a bar that quietly exceeds its track would bury that.
 */
export function ClassStrengthCard({
  classes,
  average,
  largest,
  loading,
}: {
  classes: StudentsClassStrength[];
  average: number;
  largest: { name: string; students: number } | null;
  loading: boolean;
}) {
  const rows = [...classes].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  );
  const fullest = Math.max(1, ...rows.map((c) => c.students));

  const sectionsByClass = new Map<string, number>();
  for (const c of rows) {
    const key = classOf(c.label);
    sectionsByClass.set(key, (sectionsByClass.get(key) ?? 0) + 1);
  }
  const sections = Math.max(0, ...sectionsByClass.values());
  const subtitle = rows.length
    ? `${rows.length.toLocaleString()} classes · ${
        sections === 1 ? "1 section each" : `up to ${sections} sections`
      } · boys vs girls`
    : "Boys vs girls";

  return (
    <Card
      title="Class strength"
      subtitle={subtitle}
      icon={LayoutGrid}
      tint="bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300"
      bodyClassName="px-5 pb-5 space-y-4"
      trailing={
        !loading && rows.length > 0 ? (
          <div className="flex shrink-0 items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: BOYS }} />
              <span className="text-[12px] text-slate-500 dark:text-zinc-400">Boys</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: GIRLS }} />
              <span className="text-[12px] text-slate-500 dark:text-zinc-400">Girls</span>
            </span>
          </div>
        ) : null
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-full rounded-md" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[12px] text-slate-400 dark:text-zinc-500">No classes created yet.</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => {
              const width = (c.students / fullest) * 100;
              const boysShare = c.students ? (c.boys / c.students) * 100 : 0;
              return (
                <li key={c.classId} className="flex items-center gap-3">
                  <span className="w-[92px] shrink-0 truncate text-[13px] text-slate-700 dark:text-zinc-200">
                    {c.label}
                  </span>
                  <span className="h-2.5 flex-1 flex overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <span
                      className="h-full"
                      style={{ width: `${width * (boysShare / 100)}%`, backgroundColor: BOYS }}
                    />
                    <span
                      className="h-full"
                      style={{ width: `${width * (1 - boysShare / 100)}%`, backgroundColor: GIRLS }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-[13px] font-semibold text-slate-900 dark:text-zinc-50 tabular-nums">
                    {c.students.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 px-4 py-3">
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">
              Average class size ·{" "}
              <span className="font-semibold text-slate-900 dark:text-zinc-50">
                {average.toLocaleString()} students
              </span>
            </p>
            {largest && (
              <p className="text-[13px] text-slate-500 dark:text-zinc-400">
                Largest ·{" "}
                <span className="font-semibold text-slate-900 dark:text-zinc-50">
                  {largest.name} ({largest.students.toLocaleString()})
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
