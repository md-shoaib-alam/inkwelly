"use client";

import { ArrowRight, ClipboardList, Clock, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { Card, rate } from "./card";
import type { AttendanceMarkingRow } from "../../hooks/use-attendance-command-center";

const AVATAR_TINTS = [
  "bg-violet-500",
  "bg-rose-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-amber-500",
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ row, index }: { row: AttendanceMarkingRow; index: number }) {
  const tint = AVATAR_TINTS[index % AVATAR_TINTS.length];
  const label = row.teacherName || "No class teacher";
  if (row.teacherAvatar) {
    return (
      <img
        src={row.teacherAvatar}
        alt=""
        loading="lazy"
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className={`size-8 shrink-0 grid place-items-center rounded-full ${tint} text-[11px] font-semibold text-white`}
    >
      {initials(label) || "?"}
    </span>
  );
}

/**
 * One row per class: who is meant to open the register, whether they have, and a way to
 * do it for them. The link carries `?classId=` and the Class Register honours it, so the
 * button lands on the class it was pressed for rather than an empty picker.
 */
export function MarkingCard({
  rows,
  markedClasses,
  totalClasses,
  cutoffTime,
  loading,
}: {
  rows: AttendanceMarkingRow[];
  markedClasses: number;
  totalClasses: number;
  cutoffTime: string;
  loading: boolean;
}) {
  const tenantHref = useTenantHref();

  return (
    <Card
      title="Marking status"
      subtitle={`${markedClasses} of ${totalClasses} marked · Cutoff ${cutoffTime}`}
      icon={ClipboardList}
      bodyClassName="p-0"
    >
      {loading ? (
        <div className="divide-y divide-slate-200/70 dark:divide-zinc-800">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="ml-auto h-8 w-32 rounded-lg" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-slate-500 dark:text-zinc-400">
          No classes yet — add a class in Academics and it appears here for marking.
        </p>
      ) : (
        // The reference scrolls this list inside its card instead of growing the page, so
        // the calendar beside it stays level with it however many classes a school has.
        <div className="max-h-[460px] overflow-y-auto">
          <ul className="divide-y divide-slate-200/70 dark:divide-zinc-800">
            {rows.map((row, i) => (
              <li
                key={row.classId}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3"
              >
                <p className="w-[128px] shrink-0 truncate text-[15px] font-semibold text-slate-900 dark:text-zinc-50">
                  {row.label}
                </p>
                {row.marked ? (
                  <span
                    title={`${row.studentsMarked} of ${row.studentsOnRoll} marked · ${rate(row.rate)} in school`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  >
                    <UserCheck className="size-3.5" />
                    Marked
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-1 text-[12px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <Clock className="size-3.5" />
                    Pending
                  </span>
                )}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar row={row} index={i} />
                  <p className="min-w-0 truncate text-[13px] text-slate-600 dark:text-zinc-300">
                    {row.teacherName || (
                      <span className="italic text-slate-400 dark:text-zinc-500">
                        No class teacher
                      </span>
                    )}
                  </p>
                </div>
                <a
                  href={`${tenantHref(`student-attendance/classes`)}?classId=${encodeURIComponent(row.classId)}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/80 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                >
                  {row.marked ? "Open" : "Mark for them"}
                  <ArrowRight className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
