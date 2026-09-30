"use client";

import { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import {
  DEFAULT_CUTOFF,
  DEFAULT_TARGET,
  useAttendanceCommandCenter,
} from "../hooks/use-attendance-command-center";
import { StatTiles } from "./components/stat-tiles";
import { StatusCard } from "./components/status-card";
import { MarkingCard } from "./components/marking-card";
import { CalendarCard } from "./components/calendar-card";

/**
 * Students Attendance -> Dashboard.
 *
 * The reference opens this screen with the day stated in the middle of the page — the
 * date, how far into the session it is, and whether school is on — because every figure
 * below it is measured on that day. The date comes from the server's `today`, not the
 * browser's clock, so the header cannot disagree with the numbers it introduces.
 *
 * The cutoff time and the target percentage are this school's own settings, read from
 * `AttendanceSetting`; a school that has never set them gets 09:00 and 92%.
 */
export function AdminAttendanceDashboard() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  // null is "the month the server is in". Naming it here rather than seeding a browser-side
  // month key keeps a UTC/local boundary from opening the screen on the wrong calendar.
  const [month, setMonth] = useState<string | null>(null);
  const { data, isLoading, error } = useAttendanceCommandCenter(currentTenantId, null, month);

  const stats = data?.stats;
  const settings = data?.settings;
  const session = data?.session;

  const longDate = data?.today
    ? new Date(`${data.today}T00:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      })
    : "";

  const day = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        settings?.todayHolidayName
          ? "bg-amber-100/80 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          : settings?.isSchoolDayToday
            ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          settings?.todayHolidayName
            ? "bg-amber-500"
            : settings?.isSchoolDayToday
              ? "bg-emerald-500"
              : "bg-slate-400 dark:bg-zinc-500"
        }`}
      />
      {settings?.todayHolidayName
        ? `Holiday · ${settings.todayHolidayName}`
        : settings?.isSchoolDayToday
          ? "Working day"
          : "Not a school day"}
    </span>
  );

  return (
    <div className="-mt-1 lg:-mt-2 space-y-3 sm:space-y-4">
      <header className="pt-2 text-center">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          Students attendance
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[13px] text-slate-500 dark:text-zinc-400">
          {longDate && <span>{longDate}</span>}
          {session && session.totalDays > 0 && (
            <>
              <span aria-hidden className="opacity-60">
                ·
              </span>
              <span className="tabular-nums">
                Day {session.dayNumber} of {session.totalDays}
              </span>
            </>
          )}
          <span aria-hidden className="opacity-60">
            ·
          </span>
          {day}
        </div>
      </header>

      {error && !isLoading && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-[13px] font-semibold text-rose-700 dark:text-rose-300">
            Could not load this school's attendance
          </p>
          <p className="mt-0.5 text-[11px] text-rose-600/80 dark:text-rose-400/80">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}

      <StatTiles
        stats={stats}
        target={settings?.targetRate ?? DEFAULT_TARGET}
        cutoffTime={settings?.cutoffTime ?? DEFAULT_CUTOFF}
        loading={isLoading}
      />

      <StatusCard cells={data?.statusBreakdown ?? []} loading={isLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        <MarkingCard
          rows={data?.marking ?? []}
          markedClasses={stats?.markedClasses ?? 0}
          totalClasses={stats?.totalClasses ?? 0}
          cutoffTime={settings?.cutoffTime ?? DEFAULT_CUTOFF}
          loading={isLoading}
        />
        <CalendarCard
          days={data?.calendar ?? []}
          monthLabel={data?.monthLabel ?? ""}
          displayedMonth={data?.displayedMonth ?? month ?? ""}
          monthMarks={data?.monthMarks ?? []}
          today={data?.today ?? ""}
          onMonthChange={setMonth}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
