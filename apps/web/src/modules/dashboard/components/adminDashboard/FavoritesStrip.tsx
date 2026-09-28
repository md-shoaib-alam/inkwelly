"use client";

import { ArrowRight, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TINT_CLASSES, type ModuleCard } from "./moduleCatalogue";

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
      className="rounded-3xl bg-slate-900 p-5 sm:p-6 ring-1 ring-white/5 dark:bg-slate-950"
    >
      <div className="flex items-start gap-3 pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
          <Pin className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            Favorites
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
              {cards.length}
            </span>
          </h2>
          <p className="text-[13px] text-slate-400">
            Your quick-launch modules — pin any card below to keep it here.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-medium text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-amber-400/50"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "group flex min-w-[15rem] flex-1 basis-56 items-center gap-3 rounded-2xl border border-amber-400/20 bg-white/[0.04] p-4",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                TINT_CLASSES[card.tint],
              )}
            >
              <card.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-amber-300">{card.title}</p>
              <p className="truncate text-[13px] text-slate-400">{card.subtitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onUnpin(card.id)}
                aria-label={`Unpin ${card.title}`}
                className="flex size-9 items-center justify-center rounded-full text-slate-500 outline-none transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                <Pin className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate(card.screen as string)}
                aria-label={`Open ${card.title}`}
                className="flex size-9 items-center justify-center rounded-full border border-white/10 text-slate-300 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
