"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ModuleNavItem } from "./module-nav-config";

interface ModulePanelProps {
  module: ModuleNavItem;
  resolvedScreen: string;
  onToggleCollapse: () => void;
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
  const activeSection = module.sections.find((s) =>
    s.items.some((i) => i.key === resolvedScreen)
  );

  return (
    <div className="flex flex-1 h-full w-full sm:w-[210px] min-w-0 shrink-0 flex-col overflow-hidden bg-white dark:bg-[#0A0A0A] border-r border-slate-200/80 dark:border-zinc-800/80 lg:w-[210px] lg:rounded-tl-[24px] lg:rounded-bl-[24px]">
      {/* Module header: height 56px, gap 10px, padding: 0 10px 0 14px */}
      <div className="flex h-[56px] shrink-0 items-center gap-[10px] pl-[14px] pr-[10px] border-b border-slate-100 dark:border-zinc-800/80">
        {/* Icon: .ink-mod-tile */}
        <div
          style={{
            background: "linear-gradient(#fffdf7 0%, #fbf1d9 100%)",
            boxShadow: "inset 0 0 0 1px #d4962f59, inset 0 1px #ffffffe6, 0 4px 10px -5px #b4781e59",
          }}
          className="size-[36px] rounded-[11px] flex items-center justify-center text-[#B4781E] shrink-0 [&>svg]:size-[18px]"
        >
          {module.icon}
        </div>

        {/* Text stack */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[13.5px] font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 truncate leading-tight">
            {module.panelTitle ?? module.label}
          </h2>
          <span
            style={{ background: "linear-gradient(90deg, #e9b949, #e9b94900)" }}
            className="ink-mod-underline block w-[22px] h-[2px] rounded-[2px] mt-1"
          />
        </div>

        {/* Collapse / back button — matches closed button: amber ring, cream bg, amber chevron */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={backToRail ? "Back to modules" : "Collapse navigation panel"}
          className="size-7 shrink-0 rounded-full border border-amber-400/80 dark:border-amber-500/60 bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        >
          <ChevronLeft className="size-3.5" />
        </button>
      </div>

      {/* Module nav: gap 16px, padding 12px 8px */}
      <div
        data-lenis-scroll-container
        className="flex flex-1 flex-col gap-4 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y px-2 py-3"
      >
        {module.sections.map((section, sectionIdx) => (
          <div key={section.label ?? `section-${sectionIdx}`}>
            {section.label && (
              <p className="ink-subnav-section-label m-0 pt-0 px-[10px] pb-[6px] text-[11px] font-medium uppercase tracking-[0.05em] text-[#64748B] dark:text-zinc-400">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((entry) => {
                const isActive = resolvedScreen === entry.key;
                if (entry.disabled) {
                  return (
                    <div
                      key={entry.key}
                      aria-disabled
                      title={`${entry.label} is coming soon`}
                      className="ink-subnav-link relative flex w-full items-center gap-[10px] h-[36px] pl-[12px] pr-[10px] rounded-[6px] text-[14px] font-medium text-slate-400 dark:text-zinc-600 cursor-not-allowed select-none"
                    >
                      <span className="shrink-0 [&>svg]:size-4 text-slate-300 dark:text-zinc-700">
                        {entry.icon}
                      </span>
                      <span className="flex-1 text-left truncate">{entry.label}</span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
                        Soon
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => onNavigate(entry.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "ink-subnav-link relative flex w-full items-center gap-[10px] h-[36px] pl-[12px] pr-[10px] text-[14px] transition-[background-color,color] duration-100 cursor-pointer outline-none",
                      "focus-visible:ring-2 focus-visible:ring-teal-500/50",
                      isActive
                        ? "bg-[#CCFBF1] text-[#0F766E] font-semibold rounded-[10px] shadow-[inset_0_0_0_1px_#0d94882e] hover:bg-[#CCFBF1] dark:bg-teal-950/50 dark:text-teal-200 dark:shadow-[inset_0_0_0_1px_#2dd4bf2e]"
                        : "rounded-[6px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 transition-colors [&>svg]:size-4",
                        isActive
                          ? "text-[#0F766E] dark:text-teal-300"
                          : "text-slate-400 dark:text-zinc-500"
                      )}
                    >
                      {entry.icon}
                    </span>
                    <span className="flex-1 text-left truncate">{entry.label}</span>
                    {entry.badge ? (
                      <span
                        className={cn(
                          "text-[9px] h-4 px-1.5 rounded-full font-bold uppercase tracking-wide flex items-center justify-center border-0 leading-none",
                          entry.badge === "NEW"
                            ? "bg-[#CCFBF1] text-[#0F766E] dark:bg-teal-950/60 dark:text-teal-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
                        )}
                      >
                        {entry.badge}
                      </span>
                    ) : isActive ? (
                      <span
                        aria-hidden
                        className="chevron-run flex shrink-0 items-center -space-x-1.5 text-[#0F766E] dark:text-teal-400"
                      >
                        <ChevronRight className="size-3.5" />
                        <ChevronRight className="size-3.5" />
                      </span>
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
