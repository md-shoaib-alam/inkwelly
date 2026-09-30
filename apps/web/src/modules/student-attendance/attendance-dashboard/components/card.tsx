"use client";

import type { LucideIcon } from "lucide-react";

/**
 * The frame every card on the Students Attendance dashboard shares. Copied from the
 * Students center rather than imported — a module does not reach into another module's
 * components — and trimmed to what this screen draws.
 *
 * Two things differ from that frame, both because the reference draws them differently:
 * these cards carry a hairline rule under the title, and their icons are plain glyphs
 * rather than tinted squares.
 */
export function Card({
  title,
  subtitle,
  icon: Icon,
  trailing,
  children,
  className = "",
  bodyClassName = "px-5 pb-5",
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
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
      className={"h-full flex flex-col " + className}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && <Icon className="size-[17px] shrink-0 text-slate-500 dark:text-zinc-400" />}
          <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
            <h2 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">
              {title}
            </h2>
            {subtitle && (
              <p className="flex items-baseline gap-2 text-[13px] text-slate-500 dark:text-zinc-400">
                <span aria-hidden className="opacity-70">
                  ·
                </span>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {trailing}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/**
 * A status the shipped design counts and this build has no writer for. The column and its
 * real title stay so the row keeps its shape; the number is replaced by this note rather
 * than invented, and the reason is the server's, not a guess.
 */
export function SoonNote({ reason }: { reason?: string }) {
  return (
    <div
      title={reason}
      className="rounded-lg border border-dashed border-slate-300/80 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900/40 px-2.5 py-1.5"
    >
      <p className="text-[11px] font-semibold leading-4 text-slate-600 dark:text-zinc-300">
        Soon — not tracked yet
      </p>
    </div>
  );
}

/** A rate as the reference prints it: one decimal, always, so two cards never disagree. */
export function rate(n: number): string {
  return `${n.toFixed(1)}%`;
}
