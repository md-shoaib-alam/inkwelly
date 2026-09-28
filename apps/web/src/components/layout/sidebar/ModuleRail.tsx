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
      className="flex w-[108px] shrink-0 flex-col overflow-hidden bg-[#06231D] h-full"
    >
      {/* Brand / school mark */}
      <div className="flex justify-center pt-4 pb-3 shrink-0">
        <div className="size-11 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 overflow-hidden flex items-center justify-center">
          {tenantLogo ? (
            <img
              src={tenantLogo}
              alt={tenantName || "School logo"}
              className="size-full object-cover"
              loading="eager"
            />
          ) : (
            <GraduationCap className="size-6 text-[#F2B33D]" />
          )}
        </div>
      </div>

      <div
        data-lenis-scroll-container
        className="flex-1 overflow-y-auto sidebar-scrollbar overscroll-contain touch-pan-y px-2 pb-3 space-y-1"
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
                "focus-visible:ring-2 focus-visible:ring-[#F2B33D]/60",
                !isActive && "hover:bg-white/[0.04]"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-[#F2B33D] shadow-lg shadow-black/25"
                    : "bg-transparent group-hover:bg-white/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-[#06231D]"
                      : "text-[#8FCEAD] group-hover:text-[#CDEBDA]"
                  )}
                >
                  {item.icon}
                </span>
              </span>
              <span
                className={cn(
                  "text-[10.5px] font-semibold leading-tight text-center transition-colors",
                  isActive
                    ? "text-white"
                    : "text-[#7FB69E] group-hover:text-[#CDEBDA]"
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
          className="hidden lg:flex mx-2 mb-3 h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white/[0.07] text-[#8FCEAD] ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D]/60 cursor-pointer"
        >
          <PanelLeftOpen className="size-4" />
          <span className="text-[11px] font-semibold">Menu</span>
        </button>
      )}
    </nav>
  );
}
