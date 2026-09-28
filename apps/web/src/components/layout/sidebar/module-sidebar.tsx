"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import {
  findModuleForScreen,
  getDefaultScreen,
  type ModuleNavItem,
} from "./module-nav-config";
import { ModuleRail } from "./ModuleRail";
import { ModulePanel } from "./ModulePanel";

const COLLAPSED_STORAGE_KEY = "inkwelly_module_sidebar_collapsed";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

interface ModuleSidebarProps {
  items: ModuleNavItem[];
  resolvedScreen: string;
  navigateTo: (screen: string) => void;
  /** Admin dashboard: the grid is the navigation, so drop the rail on desktop only. */
  desktopHidden?: boolean;
}

export function ModuleSidebar({
  items,
  resolvedScreen,
  navigateTo,
  desktopHidden = false,
}: ModuleSidebarProps) {
  const { currentUser, currentTenantLogo, currentTenantName, sidebarOpen, setSidebarOpen } =
    useAppStore();
  const isMobile = useIsMobile();

  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(
    () => findModuleForScreen(items, resolvedScreen)?.key ?? items[0]?.key ?? null
  );
  const [drillOpen, setDrillOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Follow URL-driven screen changes so the right module stays selected
  // (adjust-during-render pattern instead of an effect).
  const [prevScreen, setPrevScreen] = useState(resolvedScreen);
  if (resolvedScreen !== prevScreen) {
    setPrevScreen(resolvedScreen);
    const matched = findModuleForScreen(items, resolvedScreen);
    if (matched) setActiveModuleKey(matched.key);
  }

  // A closed drawer must not come back up stuck on the drilled-in panel.
  useEffect(() => {
    if (!sidebarOpen) setDrillOpen(false);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isMobile && drillOpen) setDrillOpen(false);
      else setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sidebarOpen, drillOpen, isMobile, setSidebarOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable — collapse just won't persist
      }
      return next;
    });
  }, []);

  const handleSelectModule = useCallback(
    (module: ModuleNavItem) => {
      const alreadyActive = module.key === activeModuleKey;
      setActiveModuleKey(module.key);

      if (isMobile) {
        // The drawer is too narrow for the rail and the panel side by side, so a
        // second tap on the selected module drills into its sub-links. Without
        // this they would be unreachable on a phone.
        if (alreadyActive) {
          setDrillOpen(true);
          return;
        }
        navigateTo(getDefaultScreen(module));
        setSidebarOpen(false);
        return;
      }

      if (collapsed) toggleCollapsed();
      navigateTo(getDefaultScreen(module));
    },
    [activeModuleKey, isMobile, collapsed, toggleCollapsed, navigateTo, setSidebarOpen]
  );

  const handlePanelToggle = useCallback(() => {
    if (isMobile) setDrillOpen(false);
    else toggleCollapsed();
  }, [isMobile, toggleCollapsed]);

  if (!currentUser) return null;

  const activeModule = items.find((i) => i.key === activeModuleKey) ?? items[0];
  if (!activeModule) return null;

  const showRail = !isMobile || !drillOpen;
  const showPanel = isMobile ? drillOpen : !collapsed;

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-full overflow-hidden",
        "rounded-r-2xl lg:rounded-r-none shadow-2xl lg:shadow-none",
        // v4 emits translate-x-* as the `translate` property, not `transform`, so
        // listing transform here would animate the fade but never the slide.
        "transition-[translate,opacity,width,visibility] duration-300 ease-out will-change-transform",
        "max-w-[calc(100vw-3.5rem)] lg:max-w-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        // display:none cannot be transitioned, so the dashboard exit collapses the
        // column instead and lets the main content glide into the freed space.
        // `invisible` (not `hidden`) keeps it out of the tab order once the fade ends.
        desktopHidden
          ? "lg:w-0 lg:min-w-0 lg:-translate-x-3 lg:opacity-0 lg:invisible"
          : "lg:w-auto lg:min-w-0 lg:translate-x-0 lg:opacity-100 lg:visible"
      )}
    >
      {showRail && (
        <ModuleRail
          items={items}
          activeModuleKey={activeModule.key}
          tenantLogo={currentTenantLogo}
          tenantName={currentTenantName}
          collapsed={collapsed}
          onExpand={toggleCollapsed}
          onSelect={handleSelectModule}
        />
      )}
      {showPanel && (
        <ModulePanel
          module={activeModule}
          resolvedScreen={resolvedScreen}
          onToggleCollapse={handlePanelToggle}
          backToRail={isMobile}
          onNavigate={navigateTo}
        />
      )}
    </aside>
  );
}
