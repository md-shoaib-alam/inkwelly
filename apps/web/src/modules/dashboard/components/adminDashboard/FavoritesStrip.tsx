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
      className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start gap-3 pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Pin className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-zinc-50">
            Favorites
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
              {cards.length}
            </span>
          </h2>
          <p className="text-base leading-6 text-slate-900 dark:text-zinc-100">
            Your quick-launch modules — pin any card below to keep it here.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-medium text-slate-500 outline-none transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand/50 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "group flex min-w-[15rem] flex-1 basis-56 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40",
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
              <p className="truncate text-base font-semibold leading-6 text-slate-900 dark:text-zinc-50">
                {card.title}
              </p>
              <p className="truncate text-base leading-6 text-slate-900 dark:text-zinc-100">
                {card.subtitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onUnpin(card.id)}
                aria-label={`Unpin ${card.title}`}
                className="flex size-9 items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-slate-200/70 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand/50 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <Pin className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate(card.screen as string)}
                aria-label={`Open ${card.title}`}
                className="flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand/50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
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
