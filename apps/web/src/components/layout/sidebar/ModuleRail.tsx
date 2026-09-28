"use client";

import { GraduationCap, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleNavItem } from "./module-nav-config";

interface ModuleRailProps {
  items: ModuleNavItem[];
  activeModuleKey: string | null;
  tenantLogo: string | null;
  tenantName: string | null;
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
      className="flex w-[92px] shrink-0 flex-col items-stretch overflow-hidden bg-[#06231D] py-3 h-full"
    >
      {/* Brand / school mark */}
      <div className="flex justify-center pb-3 shrink-0">
        <div className="size-11 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 overflow-hidden flex items-center justify-center">
          {tenantLogo ? (
            <img
              src={tenantLogo}
              alt={tenantName || "School logo"}
              className="size-full object-cover"
              loading="eager"
            />
          ) : (
            <GraduationCap className="size-5 text-[#F2B33D]" />
          )}
        </div>
      </div>

      <div
        data-lenis-scroll-container
        className="flex-1 overflow-y-auto sidebar-scrollbar overscroll-contain touch-pan-y px-2 space-y-1"
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
                "group flex w-full flex-col items-center gap-1.5 rounded-2xl py-2 px-1 outline-none transition-all duration-200 cursor-pointer",
                "focus-visible:ring-2 focus-visible:ring-[#F2B33D]/60",
                !isActive && "hover:bg-white/[0.04]"
              )}
            >
              {/* Icon capsule */}
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl transition-all duration-200 [&>svg]:size-5",
                  isActive
                    ? "bg-[#F2B33D] text-[#06231D] shadow-lg shadow-black/25"
                    : "text-[#8FCEAD] group-hover:bg-white/[0.06] group-hover:text-[#CDEBDA]"
                )}
              >
                {item.icon}
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-[9.5px] leading-tight text-center transition-colors w-full line-clamp-2",
                  isActive
                    ? "font-bold text-white"
                    : "font-medium text-[#7FB69E] group-hover:text-[#CDEBDA]"
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
          className="hidden lg:flex mx-2 h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/[0.07] text-[#8FCEAD] ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D]/60 cursor-pointer"
        >
          <PanelLeftOpen className="size-4" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>
      )}
    </nav>
  );
}
