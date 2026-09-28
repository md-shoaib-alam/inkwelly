"use client";

import { ArrowRight, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TINT_CLASSES, type ModuleCard } from "./moduleCatalogue";

interface ModuleGridProps {
  cards: ModuleCard[];
  pinned: string[];
  onTogglePin: (id: string) => void;
  onNavigate: (screen: string) => void;
}

export function ModuleGrid({ cards, pinned, onTogglePin, onNavigate }: ModuleGridProps) {
  const liveCount = cards.filter((c) => c.screen !== null).length;

  return (
    <section aria-label="Modules">
      <div className="flex items-baseline gap-2 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Modules
        </h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400">{liveCount} available</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((card) => {
          const isLive = card.screen !== null;
          const isPinned = pinned.includes(card.id);

          const faceClasses = cn(
            "flex h-full w-full flex-col items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-5 text-center outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950",
            isLive
              ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              : "opacity-70",
          );

          const face = (
            <>
              <span
                className={cn(
                  "mb-1 flex size-12 items-center justify-center rounded-2xl",
                  TINT_CLASSES[card.tint],
                )}
              >
                <card.icon className="size-6" />
              </span>
              <span className="text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-50">
                {card.title}
              </span>
              <span className="text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                {card.subtitle}
              </span>
              <span className="mt-auto pt-2">
                {isLive ? (
                  <ArrowRight className="size-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                    Coming soon
                  </span>
                )}
              </span>
            </>
          );

          return (
            <div key={card.id} className="group relative">
              {isLive ? (
                <button
                  type="button"
                  onClick={() => onNavigate(card.screen as string)}
                  aria-label={`Open ${card.title}`}
                  className={faceClasses}
                >
                  {face}
                </button>
              ) : (
                <div role="note" aria-disabled className={faceClasses}>
                  {face}
                </div>
              )}

              {isLive && (
                <button
                  type="button"
                  onClick={() => onTogglePin(card.id)}
                  aria-label={`${isPinned ? "Unpin" : "Pin"} ${card.title}`}
                  aria-pressed={isPinned}
                  className={cn(
                    "absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                    isPinned
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-slate-300 opacity-0 hover:text-slate-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-zinc-600",
                  )}
                >
                  <Pin className={cn("size-4", isPinned && "fill-current")} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
