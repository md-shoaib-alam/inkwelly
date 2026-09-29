"use client";

import { cn } from "@/lib/utils";
import type { ClassInfo } from "@/lib/types";

/**
 * Shared by the Academics and Students tables on purpose: the two screens read
 * the same rows, and a pill that means one thing in each of them is worse than
 * no pill at all.
 */

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
      )}
    >
      <span className={cn("size-1.5 rounded-full", isActive ? "bg-[#10B981]" : "bg-slate-400")} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function YesNoBadge({ value }: { value: boolean }) {
  return (
    <span className="text-sm text-slate-600 dark:text-zinc-400 font-normal">
      {value ? "Yes" : "No"}
    </span>
  );
}

export function MediumBadge({ medium }: { medium: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669] dark:bg-emerald-950/40 dark:text-emerald-400">
      {medium}
    </span>
  );
}

export function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#E6F7F5] px-3 py-1 text-xs font-medium text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-400">
      {grade}
    </span>
  );
}

export function SectionChip({ section }: { section: string }) {
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-semibold text-[#3B82F6] dark:bg-blue-950/40 dark:text-blue-400">
      {section}
    </span>
  );
}

/** Up to three of the class's teachers; the full set is in the Manage dialog. */
export function TeacherStack({ cls }: { cls: ClassInfo }) {
  const teachers = cls.teachers ?? [];
  if (teachers.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-zinc-500">Unassigned</span>;
  }
  const shown = teachers.slice(0, 3);
  const extra = teachers.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((t, idx) => (
        <span
          key={t.id}
          title={t.name}
          className="relative inline-block size-7 rounded-full ring-2 ring-white dark:ring-zinc-900 overflow-hidden bg-slate-200 dark:bg-zinc-800 text-[10px] font-semibold text-slate-600 dark:text-zinc-300"
          style={{ zIndex: shown.length - idx }}
        >
          {t.avatar ? (
            <img src={t.avatar} alt={t.name} className="size-full object-cover" />
          ) : (
            <span className="size-full flex items-center justify-center">
              {t.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}
            </span>
          )}
        </span>
      ))}
      {extra > 0 && (
        <span className="pl-2 text-[11px] font-medium text-slate-400 dark:text-zinc-500">+{extra}</span>
      )}
    </div>
  );
}
