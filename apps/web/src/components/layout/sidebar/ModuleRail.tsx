"use client";

import { GraduationCap, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleNavItem } from "./module-nav-config";

interface ModuleRailProps {
  items: ModuleNavItem[];
  activeModuleKey: string | null;
  tenantLogo: string | null;
  tenantName: string | null;
  /** Only reachable on desktop: the mobile drawer never collapses. */
  collapsed?: boolean;
  onExpand?: () => void;
  onSelect: (item: ModuleNavItem) => void;
}

export function ModuleRail({
  items,
  activeModuleKey,
  tenantLogo,
  tenantName,
  collapsed = false,
  onExpand,
  onSelect,
}: ModuleRailProps) {
  return (
    <nav
      aria-label="Modules"
      className="flex w-[92px] shrink-0 flex-col items-stretch overflow-hidden border-r border-slate-200/80 bg-white py-3 dark:border-zinc-800/80 dark:bg-[#0A0A0A] h-full"
    >
      {/* Brand / school mark */}
      <div className="flex justify-center pb-3 shrink-0">
        <div className="size-11 rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 dark:bg-zinc-900 dark:ring-zinc-800 overflow-hidden flex items-center justify-center">
          {tenantLogo ? (
            <img
              src={tenantLogo}
              alt={tenantName || "School logo"}
              className="size-full object-cover"
              loading="eager"
            />
          ) : (
            <GraduationCap className="size-6 text-brand" />
          )}
        </div>
      </div>

      <div
        data-lenis-scroll-container
        className="flex-1 overflow-y-auto sidebar-scrollbar overscroll-contain touch-pan-y space-y-1"
      >
        {items.map((item) => {
          const isActive = item.key === activeModuleKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex w-full flex-col items-center gap-1.5 rounded-xl px-1 pt-1 pb-2 outline-none transition-colors cursor-pointer",
                "focus-visible:ring-2 focus-visible:ring-brand/50",
                !isActive && "hover:bg-slate-100/80 dark:hover:bg-zinc-800/60"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-brand-solid text-white shadow-sm"
                    : "bg-transparent text-slate-600 group-hover:bg-slate-100 dark:text-zinc-400 dark:group-hover:bg-zinc-800"
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "text-[10.5px] leading-tight text-center transition-colors",
                  isActive
                    ? "font-semibold text-slate-900 dark:text-zinc-50"
                    : "font-medium text-slate-600 group-hover:text-slate-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {collapsed && onExpand && (
        <button
          type="button"
          onClick={onExpand}
          aria-label="Show module navigation"
          className="hidden lg:flex mx-2 h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 transition-colors hover:bg-slate-200/70 hover:text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-brand/50 cursor-pointer dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <PanelLeftOpen className="size-4" />
          <span className="text-[11px] font-semibold">Menu</span>
        </button>
      )}
    </nav>
  );
}
