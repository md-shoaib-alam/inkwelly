"use client";

import { Hourglass } from "lucide-react";
import type { StudentsUntrackedTile } from "../../hooks/use-students-command-center";

/**
 * The shipped design has tiles this build cannot answer. They are drawn empty and labelled,
 * rather than left off or drawn at zero: a compliance tile reading 0% would blame the school
 * for a field its records never had.
 */
export function UntrackedCard({ tiles }: { tiles: StudentsUntrackedTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-slate-400 dark:text-zinc-500">
          <Hourglass className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">
          Not tracked yet
        </span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {tiles.length} tiles waiting on a column
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
        {tiles.map((t) => (
          <div
            key={t.key}
            className="rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/30 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-zinc-400 truncate">
                {t.label}
              </span>
              <span className="ml-auto shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                Soon
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-400 dark:text-zinc-500">
              {t.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
