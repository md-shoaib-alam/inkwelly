"use client";

import { CalendarDays, ChevronLeft, ChevronRight, PartyPopper, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, rate } from "./card";
import type {
  AttendanceCalendarDay,
  AttendanceMonthMark,
} from "../../hooks/use-attendance-command-center";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** `YYYY-MM` moved by whole months, staying a key rather than becoming a Date. */
function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

function weekdayOf(iso: string): number {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? 0 : new Date(t).getUTCDay();
}

/** `4 Sept`, the way the reference writes a chip's date. */
function shortDate(iso: string): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const BAND_CELLS: Record<string, string> = {
  good: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  watch: "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  critical: "border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
};

/**
 * The month's grid, coloured by the same target every rate on this screen is measured
 * against. A day with no marks is a plain cell with a dash rather than a zero, because a
 * zero would say nobody came when the truth is nobody wrote it down.
 *
 * The chevrons move this grid alone. Every figure above it stays on today, which is why
 * they refetch the screen at another month instead of re-slicing what is already here.
 */
export function CalendarCard({
  days,
  monthLabel,
  displayedMonth,
  monthMarks,
  today,
  onMonthChange,
  loading,
}: {
  days: AttendanceCalendarDay[];
  monthLabel: string;
  displayedMonth: string;
  monthMarks: AttendanceMonthMark[];
  today: string;
  onMonthChange: (month: string) => void;
  loading: boolean;
}) {
  const nav = (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onMonthChange(shiftMonth(displayedMonth, -1))}
        className="grid size-8 place-items-center rounded-lg border border-slate-200/80 text-slate-500 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onMonthChange(shiftMonth(displayedMonth, 1))}
        className="grid size-8 place-items-center rounded-lg border border-slate-200/80 text-slate-500 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );

  // September 2026 begins on a Tuesday, so the grid needs its leading blanks derived from
  // the first real day rather than assumed — a school whose month starts on Sunday shifts.
  const leading = days.length ? weekdayOf(days[0].date) : 0;

  return (
    <Card
      title="Attendance calendar"
      subtitle={monthLabel}
      icon={CalendarDays}
      trailing={nav}
      bodyClassName="px-5 pb-5"
    >
      {loading || days.length === 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 text-center text-[11px] font-semibold text-slate-400">
                {d}
              </div>
            ))}
          </div>
          {[0, 1, 2, 3, 4].map((r) => (
            <div key={r} className="grid grid-cols-7 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((c) => (
                <Skeleton key={c} className="h-14 rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[11px] font-semibold tracking-wide text-slate-400 dark:text-zinc-500"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: leading }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const isToday = day.date === today;
              const off = !day.isSchoolDay;
              const tone = day.isHoliday
                ? "border-amber-200/80 bg-amber-50/90 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                : off
                  ? "border-transparent bg-slate-100/80 text-slate-400 dark:bg-zinc-800/60 dark:text-zinc-500"
                  : day.marked
                    ? (BAND_CELLS[day.band] ?? BAND_CELLS.good)
                    : "border-slate-200/70 bg-[var(--c-surface)] text-slate-600 dark:border-zinc-800 dark:text-zinc-300";
              return (
                <div
                  key={day.date}
                  title={
                    day.isHoliday || day.markName
                      ? `${day.markName || "Holiday"}`
                      : off
                        ? "Not a school day"
                        : day.marked
                          ? `${rate(day.rate)} in school`
                          : "Not marked"
                  }
                  className={`relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-[13px] font-semibold tabular-nums ${tone} ${
                    isToday ? "ring-2 ring-emerald-500/70 ring-offset-1 ring-offset-white dark:ring-offset-[#0D1526]" : ""
                  }`}
                >
                  <span
                    className={
                      isToday
                        ? "grid size-6 place-items-center rounded-full bg-emerald-500 text-[12px] font-bold text-white"
                        : ""
                    }
                  >
                    {day.dayOfMonth}
                  </span>
                  {off ? null : day.marked ? (
                    <span className="text-[10px] font-medium leading-none tabular-nums opacity-90">
                      {rate(day.rate)}
                    </span>
                  ) : (
                    <span className="text-[11px] leading-none opacity-50">—</span>
                  )}
                  {day.isHoliday && (
                    <PartyPopper className="absolute right-1 bottom-1 size-3 text-amber-500 dark:text-amber-400" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-zinc-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              This month
            </p>
            {monthMarks.length === 0 ? (
              <p className="mt-1.5 text-[12px] text-slate-400 dark:text-zinc-500">
                No holidays or events on the calendar this month.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {monthMarks.map((mark) => (
                  <span
                    key={`${mark.date}-${mark.name}`}
                    title={mark.kind === "holiday" ? "School closed" : "School event"}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold ${
                      mark.kind === "holiday"
                        ? "bg-amber-100/80 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    }`}
                  >
                    {mark.kind === "holiday" ? (
                      <PartyPopper className="size-3.5" />
                    ) : (
                      <Star className="size-3.5" />
                    )}
                    {mark.name}
                    <span className="font-medium opacity-70">{shortDate(mark.date)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Good
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              Watch
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              Critical
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full ring-2 ring-emerald-500/70" />
              Today
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
