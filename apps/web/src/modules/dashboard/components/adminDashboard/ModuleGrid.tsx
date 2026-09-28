"use client";

import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TINT_CLASSES, type ModuleCard } from "./moduleCatalogue";

interface ModuleGridProps {
  cards: ModuleCard[];
  pinned: string[];
  onTogglePin: (id: string) => void;
  onNavigate: (screen: string) => void;
}

export function ModuleGrid({ cards, pinned, onTogglePin, onNavigate }: ModuleGridProps) {
  return (
    <section aria-label="Modules">
      {/* Section header */}
      <div className="flex items-baseline gap-2 pb-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
          Modules
        </h2>
        <p className="text-[12px] text-slate-500 dark:text-slate-400">{cards.length} modules</p>
      </div>

      {/* Grid: 2 cols on mobile, 3 on sm, 4 on lg, 6 on xl */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {cards.map((card) => {
          const isPinned = pinned.includes(card.id);
          // A card with no screen is announced but not built in this copy, so it is drawn
          // dashed, colourless and inert — the same way the reference draws a module that
          // isn't there yet. Colour is reserved for cards that actually open.
          const isComingSoon = card.screen === null;

          const cardContent = (
            <>
              {/* Icon bubble */}
              <span
                className={cn(
                  "mb-2 flex size-11 items-center justify-center rounded-2xl",
                  TINT_CLASSES[isComingSoon ? "slate" : card.tint],
                )}
              >
                <card.icon className="size-5" />
              </span>

              {/* Title */}
              <span className="text-[12px] font-semibold leading-tight text-slate-900 dark:text-zinc-50 text-center">
                {card.title}
              </span>

              {!isComingSoon && (
                <span className="text-[11px] leading-tight text-slate-500 dark:text-zinc-400 text-center mt-0.5">
                  {card.subtitle}
                </span>
              )}

              {isComingSoon && (
                <span className="mt-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
                  Coming soon
                </span>
              )}
            </>
          );

          const faceClasses = cn(
            "relative flex h-full w-full flex-col items-center justify-center gap-0 rounded-2xl bg-white pt-4 pb-3.5 px-2.5 text-center outline-none transition-all dark:bg-[#0D1526]",
            isComingSoon
              ? "cursor-default opacity-75"
              : "cursor-pointer border border-slate-200/80 dark:border-zinc-800/60 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 dark:hover:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-brand/50",
          );

          return (
            <div key={card.id} className="group relative">
              {isComingSoon ? (
                <div role="note" aria-disabled className={faceClasses}>
                  <svg
                    className="pointer-events-none absolute inset-0 size-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="calc(100% - 2px)"
                      height="calc(100% - 2px)"
                      style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
                      rx="16"
                      fill="none"
                      className="stroke-[#0F251E] dark:stroke-[#0F251E]"
                      strokeWidth="1.5"
                      strokeDasharray="2 8"
                      strokeLinecap="round"
                    />
                  </svg>
                  {cardContent}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate(card.screen as string)}
                  aria-label={`Open ${card.title}`}
                  className={faceClasses}
                >
                  {cardContent}
                </button>
              )}

              {/* Pin toggle — top-right, visible on hover or when pinned */}
              {!isComingSoon && (
                <button
                  type="button"
                  onClick={() => onTogglePin(card.id)}
                  aria-label={`${isPinned ? "Unpin" : "Pin"} ${card.title}`}
                  aria-pressed={isPinned}
                  className={cn(
                    "absolute right-2 top-2 flex size-6 items-center justify-center rounded-md outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand/50",
                    isPinned
                      ? "text-brand opacity-100"
                      : "text-slate-300 opacity-0 group-hover:opacity-100 dark:text-zinc-600 hover:text-slate-500",
                  )}
                >
                  <Pin className={cn("size-3.5", isPinned && "fill-current")} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
