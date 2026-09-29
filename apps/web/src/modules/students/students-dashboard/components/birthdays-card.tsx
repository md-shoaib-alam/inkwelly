"use client";

import { Cake } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentsBirthday } from "../../hooks/use-students-command-center";

/** The next ten, nearest first. A list of names is only worth reading if it can be reached. */
export function BirthdaysCard({
  birthdays,
  loading,
}: {
  birthdays: StudentsBirthday[];
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-rose-500 dark:text-rose-400">
          <Cake className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">
          Birthdays in the next ten days
        </span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {birthdays.length.toLocaleString()} listed
        </span>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-5 w-full rounded-md" />
            ))}
          </div>
        ) : birthdays.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-slate-400 dark:text-zinc-500">
              Nobody on roll has a birthday in the next ten days.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {birthdays.map((b) => (
              <li key={b.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-slate-800 dark:text-zinc-100 truncate">
                    {b.name}
                  </span>
                  <span className="block text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                    {b.className}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[12px] font-semibold tabular-nums text-slate-700 dark:text-zinc-200">
                    {b.daysAway === 0 ? "Today" : `in ${b.daysAway} day${b.daysAway === 1 ? "" : "s"}`}
                  </span>
                  <span className="block text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                    {b.date.slice(5).replace("-", "/")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
