"use client";

import { ArrowRight, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleCard, ModuleTint } from "./moduleCatalogue";

// Since FavoritesStrip is a dark navy container in both themes, pinned card icons
// use the sleek dark-mode tint (subtle colored background + colored icon) instead of white/cream.
const FAVORITE_TINT_CLASSES: Record<ModuleTint, string> = {
  emerald: "bg-emerald-400/10 text-emerald-400",
  green: "bg-green-400/10 text-green-400",
  teal: "bg-teal-400/10 text-teal-400",
  cyan: "bg-cyan-400/10 text-cyan-400",
  blue: "bg-blue-400/10 text-blue-400",
  indigo: "bg-indigo-400/10 text-indigo-400",
  violet: "bg-violet-400/10 text-violet-400",
  purple: "bg-purple-400/10 text-purple-400",
  amber: "bg-amber-400/10 text-amber-400",
  orange: "bg-orange-400/10 text-orange-400",
  rose: "bg-rose-400/10 text-rose-400",
  slate: "bg-zinc-800 text-zinc-300",
};

interface FavoritesStripProps {
  cards: ModuleCard[];
  onNavigate: (screen: string) => void;
  onUnpin: (id: string) => void;
  onClearAll: () => void;
}

export function FavoritesStrip({ cards, onNavigate, onUnpin, onClearAll }: FavoritesStripProps) {
  if (cards.length === 0) return null;

  return (
    <section
      aria-label="Favorites"
      className="rounded-2xl bg-[#0D1526] border border-white/[0.06] p-3.5 sm:p-4.5"
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white leading-none">Favorites</h2>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/70 leading-none">
              {cards.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            Your quick-launch modules — pin any card below to keep it here.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="shrink-0 text-[11px] font-medium text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded px-1"
        >
          Clear all
        </button>
      </div>

      {/* Grid: 1 col mobile → 2 col sm → 4 col lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {cards.map((card) => {
          const isComingSoon = card.screen === null;

          return (
            <div
              key={card.id}
              role={isComingSoon ? "note" : "button"}
              tabIndex={isComingSoon ? undefined : 0}
              aria-disabled={isComingSoon || undefined}
              aria-label={isComingSoon ? `${card.title} (coming soon)` : `Open ${card.title}`}
              onClick={() => {
                if (!isComingSoon && card.screen) {
                  onNavigate(card.screen);
                }
              }}
              onKeyDown={(e) => {
                if (!isComingSoon && card.screen && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onNavigate(card.screen);
                }
              }}
              className={cn(
                "group/card relative flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3.5 py-3 transition-all select-none",
                isComingSoon
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-white/10 hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              )}
            >
              {/* Unpin button — top-right on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpin(card.id);
                }}
                aria-label={`Unpin ${card.title}`}
                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-slate-700 text-slate-300 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-slate-600 hover:text-white outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/40 z-10 shadow-sm cursor-pointer"
              >
                <PinOff className="size-3" />
              </button>

              {/* Icon bubble — dark mode tint (no white background) */}
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  FAVORITE_TINT_CLASSES[card.tint],
                )}
              >
                <card.icon className="size-4.5" />
              </span>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold leading-tight text-amber-400">
                  {card.title}
                </p>
                <p className="truncate text-[11px] text-slate-400 mt-0.5">
                  {card.subtitle}
                </p>
              </div>

              {/* Arrow indicator */}
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-slate-400 transition-all group-hover/card:bg-white/10 group-hover/card:text-white group-hover/card:translate-x-0.5"
              >
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
