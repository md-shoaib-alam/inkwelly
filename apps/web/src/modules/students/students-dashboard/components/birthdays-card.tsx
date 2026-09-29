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
    <section
      style={{
        borderRadius: "20px",
        padding: "18px",
        background:
          "linear-gradient(160deg, color-mix(in srgb, var(--c-pink) 9%, var(--c-surface)), var(--c-surface) 65%)",
        border: "1px solid color-mix(in srgb, var(--c-pink) 22%, var(--c-border))",
        boxShadow: "var(--c-shadow)",
      }}
      className="relative overflow-hidden h-full flex flex-col gap-3"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-11 shrink-0 grid place-items-center rounded-2xl bg-white shadow-xs dark:bg-rose-500/15 text-rose-500">
            <Cake className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] leading-snug font-bold text-slate-900 dark:text-zinc-50">
              Upcoming birthdays
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">Next 10 days</p>
          </div>
        </div>
        {birthdays.length > 0 && (
          <CardPill tone="rose">{birthdays.length.toLocaleString()} students</CardPill>
        )}
      </header>

      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[52px] w-full rounded-2xl" />)}
          </div>
        ) : birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border border-rose-100/60 dark:border-rose-500/15 bg-white/70 dark:bg-[#0D1526]/50 text-center">
            <span className="size-11 rounded-full grid place-items-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 mb-3">
              <Cake className="size-5" />
            </span>
            <p className="text-[14px] font-semibold text-slate-800 dark:text-zinc-100">
              No birthdays in the next 10 days
            </p>
            <p className="mt-1 text-[12px] text-slate-400 dark:text-zinc-400">
              No cakes on the schedule this week.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {birthdays.map((b, i) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-[#0D1526]/80 ring-1 ring-rose-100/70 dark:ring-rose-500/15 px-3.5 py-2.5 shadow-2xs"
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
