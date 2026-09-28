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
      <div className="flex justify-center pb-2 shrink-0">
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

      {/* Rail list: 6px gap, 8px margin-top, 4px padding-x */}
      <div
        data-lenis-scroll-container
        className="flex-1 flex flex-col gap-[6px] mt-2 px-1 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain touch-pan-y"
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
                "ink-rail-item group flex w-full flex-col items-center shrink-0 gap-[4px] py-[4px] px-0 bg-transparent border-0 outline-none font-[inherit] transition-colors duration-150 cursor-pointer",
                "focus-visible:ring-2 focus-visible:ring-[#F2B33D]/60"
              )}
            >
              {/* Capsule pill: 48px x 30px with linear gradient */}
              <span
                style={isActive ? { background: "linear-gradient(135deg, #f7da8b 0%, #e6ae45 100%)" } : undefined}
                className={cn(
                  "flex w-[48px] h-[30px] shrink-0 items-center justify-center rounded-full transition-all duration-200 [&>svg]:size-5",
                  isActive
                    ? "text-[#06231D] shadow-md shadow-black/20"
                    : "text-[#99F6E4] group-hover:bg-white/[0.08] group-hover:text-white"
                )}
              >
                {item.icon}
              </span>

              {/* Label: 10px font, line-clamp 2, 84px x 24px */}
              <span
                style={{
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "keep-all",
                  overflowWrap: "normal",
                  hyphens: "none",
                  whiteSpace: "pre-line",
                  textWrap: "balance",
                }}
                className={cn(
                  "ink-rail-label w-full max-w-full text-center text-[10px] leading-[1.2] transition-colors line-clamp-2 overflow-hidden",
                  isActive
                    ? "font-bold text-white opacity-100"
                    : "font-medium text-[#99F6E4] opacity-85 group-hover:opacity-100 group-hover:text-white"
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
          className="hidden lg:flex mx-2 h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] text-white ring-1 ring-white/10 transition-colors hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[#F2B33D]/60 cursor-pointer"
        >
          <PanelLeftOpen className="size-4" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>
      )}
    </nav>
  );
}
