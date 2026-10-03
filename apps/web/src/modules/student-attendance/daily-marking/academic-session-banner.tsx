"use client";

import { CalendarDays } from "lucide-react";
import { formatSessionDate, isDateOutsideSession } from "./academic-session";

/**
 * Rose warning shown when the date being marked falls outside the academic
 * session. Matches the shipped screen: it informs, it does not block — the
 * backend accepts attendance for any date, so marking stays possible.
 * Renders nothing when the date is inside the session or no range is known.
 */
export function AcademicSessionBanner({
  dateStr,
  startDate,
  endDate,
}: {
  dateStr: string;
  startDate?: string | null;
  endDate?: string | null;
}) {
  if (!isDateOutsideSession(dateStr, startDate, endDate)) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/40">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
        <CalendarDays className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-rose-700 dark:text-rose-300">
          Outside the academic session
        </p>
        <p className="text-[12px] text-rose-600/90 dark:text-rose-400/90">
          Attendance can only be recorded between {formatSessionDate(startDate!)} and{" "}
          {formatSessionDate(endDate!)}.
        </p>
      </div>
    </div>
  );
}
