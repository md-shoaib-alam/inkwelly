"use client";

import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Scissors,
  UserX,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardPill, SoonNote } from "./card";
import { useTenantHref } from "../../hooks/use-tenant-href";
import type {
  StudentsAlert,
  StudentsUntrackedTile,
} from "../../hooks/use-students-command-center";

/**
 * The checks this build can run, each with the icon the reference draws for its kind of
 * gap. An alert that has no entry here still renders — with the generic warning mark —
 * because the server owns the list and this card must not silently drop a row it
 * cannot name.
 */
const ALERT_ICON: Record<string, LucideIcon> = {
  STUDENTS_WITHOUT_CLASS: UserX,
  STUDENTS_WITHOUT_GUARDIAN: Scissors,
  STUDENTS_YOUNGER_THAN_GRADE: CalendarClock,
  STUDENTS_WITHOUT_DOB: CalendarClock,
  CLASSES_OVER_CAPACITY: Users,
};

const SEVERITY = {
  high: {
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    count: "text-rose-600 dark:text-rose-300",
  },
  medium: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    count: "text-amber-600 dark:text-amber-300",
  },
  low: {
    icon: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
    count: "text-slate-600 dark:text-zinc-300",
  },
};

const ORDER = ["high", "medium", "low"];

/**
 * Each alert names a screen in this module, so `View` is a jump to the students causing
 * it. The counts are the server's; a row only appears when its check finds someone, so
 * an empty card means an empty inbox rather than a query that failed.
 */
export function AlertsCard({
  alerts,
  openCount,
  duplicates,
  loading,
}: {
  alerts: StudentsAlert[];
  openCount?: number;
  duplicates?: StudentsUntrackedTile;
  loading: boolean;
}) {
  const router = useRouter();
  const tenantHref = useTenantHref();

  const sorted = [...alerts].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity) || b.count - a.count,
  );
  const totalOpen = openCount ?? sorted.reduce((sum, a) => sum + (a.count || 0), 0);

  return (
    <Card
      title="Alerts"
      subtitle="Records that need attention"
      trailing={
        <CardPill tone="rose">
          <span className="size-1.5 rounded-full bg-rose-500" />
          {totalOpen.toLocaleString()} open
        </CardPill>
      }
      bodyClassName="px-5 pb-5 space-y-2.5"
    >
      {loading ? (
        <p className="text-[13px] text-slate-400 dark:text-zinc-500">Reading this school's records…</p>
      ) : sorted.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-slate-500 dark:text-zinc-400">
          Nothing outstanding. Every student on roll has a class, a guardian and a date of
          birth their grade expects.
        </p>
      ) : (
        sorted.map((a) => {
          const style = SEVERITY[a.severity as keyof typeof SEVERITY] ?? SEVERITY.low;
          const Icon = ALERT_ICON[a.code] ?? AlertTriangle;
          const target = tenantHref(a.screen);
          return (
            <div
              key={a.code}
              className="flex items-center gap-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/40 px-3.5 py-2.5"
            >
              <span className={`size-9 shrink-0 grid place-items-center rounded-xl ${style?.icon ?? ""}`}>
                <Icon className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => router.push(target)}
                title={a.detail}
                className="min-w-0 flex-1 text-left text-[13px] font-medium text-slate-700 dark:text-zinc-200 leading-snug hover:text-slate-900 dark:hover:text-zinc-50"
              >
                {a.title}
              </button>
              <span
                className={`shrink-0 text-[14px] font-semibold tabular-nums ${style?.count ?? ""}`}
              >
                {a.count.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => router.push(target)}
                className="shrink-0 inline-flex items-center gap-0.5 rounded-xl bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-zinc-300 shadow-2xs ring-1 ring-slate-200/80 dark:ring-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              >
                View
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          );
        })
      )}

      {/* The reference's fourth check has no column to match on, so the frame says so. */}
      {duplicates && !loading && <SoonNote reason={`${duplicates.label} — ${duplicates.reason}`} />}
    </Card>
  );
}
