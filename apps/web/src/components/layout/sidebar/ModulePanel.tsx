"use client";

import { ChevronLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ModuleNavItem } from "./module-nav-config";

interface ModulePanelProps {
  module: ModuleNavItem;
  resolvedScreen: string;
  onToggleCollapse: () => void;
  /** On the mobile drawer this button goes back to the rail rather than collapsing. */
  backToRail?: boolean;
  onNavigate: (screen: string) => void;
}

export function ModulePanel({
  module,
  resolvedScreen,
  onToggleCollapse,
  backToRail = false,
  onNavigate,
}: ModulePanelProps) {
  return (
    <div className="flex w-full min-w-0 shrink-0 flex-col overflow-hidden bg-white dark:bg-[#0A0A0A] border-r border-slate-200/80 dark:border-zinc-800/80 h-full lg:w-[min(288px,calc(100vw-10.25rem))]">
      {/* Module header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0">
        <div className="size-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
          {module.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 truncate">
            {module.label}
          </h2>
          <div className="mt-1 h-1 w-7 rounded-full bg-brand" />
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={backToRail ? "Back to modules" : "Collapse navigation panel"}
          className="size-8 shrink-0 rounded-full border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* Module nav */}
      <div
        data-lenis-scroll-container
        className="flex-1 overflow-y-auto sidebar-scrollbar overscroll-contain touch-pan-y px-3 pb-6"
      >
        {module.sections.map((section, sectionIdx) => (
          <div key={section.label ?? `section-${sectionIdx}`} className="pt-4 first:pt-1">
            {section.label && (
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-zinc-500">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((entry) => {
                const isActive = resolvedScreen === entry.key;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => onNavigate(entry.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 h-11 px-3 rounded-xl text-[15px] font-medium transition-colors cursor-pointer outline-none",
                      "focus-visible:ring-2 focus-visible:ring-brand/50",
                      isActive
                        ? "bg-brand/10 text-slate-900 dark:text-white font-semibold"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive
                          ? "text-brand"
                          : "text-slate-400 dark:text-zinc-500"
                      )}
                    >
                      {entry.icon}
                    </span>
                    <span className="flex-1 text-left truncate">{entry.label}</span>
                    {entry.badge ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400 border-0"
                      >
                        {entry.badge}
                      </Badge>
                    ) : isActive ? (
                      <ChevronsRight className="size-4 shrink-0 text-brand" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
