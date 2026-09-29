"use client";

import type { LucideIcon } from "lucide-react";

/**
 * The frame every card on the Students dashboard shares: a tinted icon, a title with a
 * one-line qualifier, an optional pill on the right, and a body. The reference draws
 * these as plain white cards with a hairline border and no header rule, so there is
 * none here — unlike the Academics center, which this screen is not a copy of.
 */

/** The tinted square a card or tile leads with. */
export function IconTile({
  icon: Icon,
  tint,
  className = "",
}: {
  icon: LucideIcon;
  tint: string;
  className?: string;
}) {
  return (
    <span
      className={`size-10 shrink-0 grid place-items-center rounded-xl ${tint} ${className}`}
    >
      <Icon className="size-[18px]" />
    </span>
  );
}

export function Card({
  title,
  subtitle,
  icon,
  tint,
  trailing,
  children,
  className = "",
  bodyClassName = "px-5 pb-5",
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      style={{
        borderRadius: "20px",
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow)",
      }}
      className={
        "h-full flex flex-col " +
        className
      }
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon && <IconTile icon={icon} tint={tint ?? "bg-slate-100 text-slate-600"} />}
          <div className="min-w-0">
            <h2 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[13px] text-slate-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
        </div>
        {trailing}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** The small pill that sits opposite a card title: `441 open`, `10 students`. */
export function CardPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "rose" | "emerald" | "amber";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
    rose: "bg-rose-100/80 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    emerald: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-100/80 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** A section label across the page: `COMPOSITION`, `RECORDS`. The rule runs on past it. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 pt-1">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
        {children}
      </p>
      <span className="h-px flex-1 bg-slate-200/70 dark:bg-zinc-800" />
    </div>
  );
}

/** A number-and-label box inside a card: `+286` over `Admitted`. */
export function MiniTile({
  value,
  label,
  tone = "slate",
  soon = false,
  title,
}: {
  value: React.ReactNode;
  label: string;
  tone?: "slate" | "teal" | "amber" | "rose" | "emerald";
  /** Renders the box empty and dashed: the reference's frame with no number behind it. */
  soon?: boolean;
  title?: string;
}) {
  const tones = {
    slate: "text-slate-900 dark:text-zinc-50",
    teal: "text-teal-600 dark:text-teal-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div
      title={title}
      className={
        "rounded-xl px-4 py-3 " +
        (soon
          ? "border border-dashed border-slate-300/80 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30"
          : "bg-slate-50/80 dark:bg-zinc-900/40")
      }
    >
      <p
        className={`text-[15px] font-semibold leading-6 tabular-nums ${
          soon ? "text-slate-400 dark:text-zinc-500" : tones[tone]
        }`}
      >
        {value}
      </p>
      <p className="text-[12px] text-slate-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

/**
 * A card the shipped design shows and this build has no table for. The frame and its
 * real title stay, so the layout matches; the numbers are replaced by this note rather
 * than invented, and the reason is the server's, not a guess.
 */
export function SoonNote({ reason }: { reason?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300/80 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900/40 px-4 py-3">
      <p className="text-[12px] font-semibold text-slate-600 dark:text-zinc-300">
        Soon — not tracked yet
      </p>
      {reason && (
        <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400 leading-snug">
          {reason}
        </p>
      )}
    </div>
  );
}
