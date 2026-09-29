"use client";

import { Cake, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardPill } from "./card";
import type { StudentsBirthday } from "../../hooks/use-students-command-center";

/** The reference cycles avatar tints rather than tying one to a student. */
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

function when(daysAway: number): string {
  if (daysAway === 0) return "today";
  if (daysAway === 1) return "in 1 day";
  return `in ${daysAway} days`;
}

/**
 * The next ten, nearest first. The card is the only rose one on the page, which is why
 * it carries its own frame rather than the shared `Card`. `Wish` is drawn but disabled:
 * nothing in this build sends a message, and a button that looks live and does nothing
 * is worse than one that says so.
 */
export function BirthdaysCard({
  birthdays,
  loading,
}: {
  birthdays: StudentsBirthday[];
  loading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-rose-100/80 dark:border-rose-500/20 bg-gradient-to-br from-rose-50 via-white to-pink-50/70 dark:from-rose-500/10 dark:via-[#0D1526] dark:to-pink-500/10 shadow-2xs">
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="size-10 shrink-0 grid place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            <Cake className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">
              Upcoming birthdays
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">Next 10 days</p>
          </div>
        </div>
        <CardPill tone="rose">{birthdays.length.toLocaleString()} students</CardPill>
      </header>

      <div className="px-5 pb-5 space-y-2.5">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[52px] w-full rounded-xl" />)
        ) : birthdays.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-500 dark:text-zinc-400">
            Nobody on roll has a birthday in the next ten days.
          </p>
        ) : (
          birthdays.map((b, i) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-xl bg-white/90 dark:bg-[#0D1526]/80 ring-1 ring-rose-100/70 dark:ring-rose-500/15 px-3 py-2.5"
            >
              <span
                className={`size-9 shrink-0 grid place-items-center rounded-full text-[12px] font-semibold text-white ${
                  AVATAR_TINTS[i % AVATAR_TINTS.length] ?? "bg-slate-500"
                }`}
              >
                {initials(b.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-slate-800 dark:text-zinc-100">
                  {b.name}
                </span>
                <span className="block truncate text-[12px] text-slate-500 dark:text-zinc-400">
                  {b.className} · {when(b.daysAway)}
                </span>
              </span>
              <span
                title="Birthday wishes are not sent by this build yet"
                aria-disabled="true"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 dark:border-rose-500/25 px-2.5 py-1 text-[12px] font-semibold text-rose-400 dark:text-rose-400/70 cursor-not-allowed"
              >
                <Gift className="size-3.5" />
                Wish
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
