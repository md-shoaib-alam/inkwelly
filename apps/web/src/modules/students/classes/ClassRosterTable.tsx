"use client";

import { ChevronRight, GraduationCap, School, Users } from "lucide-react";
import { StatusBadge, TeacherStack } from "@/components/shared/classes/ClassBadges";
import { formatGradeLabel } from "@/lib/class-options";
import type { ClassInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Students > Classes. Deliberately not the Academics table: this one reports how
 * full and how complete each class is, so the grade and medium read as plain text,
 * the teachers read as faces, and occupancy gives way to profile completion.
 */

const COLUMNS = ["Class", "Grade", "Section", "Teacher", "Medium", "Enrolled", "Completion", "Status", ""];

/** Amber until the class is mostly filled in, green once it is, red at the bottom. */
function completionTone(percent: number) {
  if (percent >= 70) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (percent >= 40) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
  return { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" };
}

function CompletionCell({ percent }: { percent: number }) {
  const tone = completionTone(percent);
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", tone.bar)}
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>
      <span className={cn("text-[12.5px] font-semibold tabular-nums", tone.text)}>{percent}%</span>
    </div>
  );
}

function RosterRow({ cls, onOpen }: { cls: ClassInfo; onOpen: () => void }) {
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors"
    >
      <td className="py-3.5 pl-5 pr-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#E6F7F5] text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-400">
            <GraduationCap className="size-4" />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="min-w-0 truncate text-left text-sm font-semibold text-slate-900 hover:text-teal-700 dark:text-zinc-100 dark:hover:text-teal-400 cursor-pointer"
          >
            {cls.name} - {cls.section}
          </button>
        </div>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-slate-500 dark:text-zinc-400">{formatGradeLabel(cls.grade)}</td>
      <td className="px-4 py-3.5">
        <span className="inline-flex min-w-[26px] justify-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
          {cls.section}
        </span>
      </td>
      <td className="px-4 py-3.5"><TeacherStack cls={cls} /></td>
      <td className="px-4 py-3.5 text-[13px] text-slate-600 dark:text-zinc-300">{cls.medium}</td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
          <Users className="size-3.5 font-normal text-slate-400 dark:text-zinc-500" />
          {cls.studentCount ?? 0}
        </span>
      </td>
      <td className="px-4 py-3.5"><CompletionCell percent={cls.profileCompletePercent ?? 0} /></td>
      <td className="px-4 py-3.5"><StatusBadge isActive={cls.isActive} /></td>
      <td className="py-3.5 pl-4 pr-5 text-right">
        <ChevronRight className="inline size-4 text-slate-300 dark:text-zinc-600" />
      </td>
    </tr>
  );
}

export function ClassRosterTable({ classes, onOpen }: { classes: ClassInfo[]; onOpen: (cls: ClassInfo) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8FAFC] dark:bg-zinc-800/40 border-b border-slate-200/70 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 uppercase text-[11px] font-bold tracking-wider">
          <tr>
            {COLUMNS.map((label, i) => (
              <th
                key={label + i}
                className={i === 0 ? "py-3 pl-5 pr-4" : i === COLUMNS.length - 1 ? "py-3 pl-4 pr-5 text-right" : "px-4 py-3"}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
          {classes.map((cls) => (
            <RosterRow key={cls.id} cls={cls} onOpen={() => onOpen(cls)} />
          ))}
          {classes.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-6 py-16 text-center">
                <School className="size-9 mx-auto mb-3 text-slate-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">No classes match these filters</p>
                <p className="text-[13px] text-slate-500 dark:text-zinc-400">
                  Clear the filters, or add a class from Academics &gt; Classes
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
