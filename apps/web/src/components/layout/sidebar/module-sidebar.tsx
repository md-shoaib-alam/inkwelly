"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import {
  findModuleForScreen,
  type ModuleNavItem,
} from "./module-nav-config";
import { ModuleRail } from "./ModuleRail";
import { ModulePanel } from "./ModulePanel";
import { decidePanelMode } from "./panel-mode";

const COLLAPSED_STORAGE_KEY = "inkwelly_module_sidebar_collapsed";

// A rail's tail is its own key: the module root *is* its landing screen, so
// `/academics` opens the Academics command center and no redirect is needed to
// get there. It is also unambiguous across modules — `transport` and
// `student-fees` are different roots even though they share a landing screen.

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
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function ModuleSidebar({
  items,
  resolvedScreen,
  navigateTo,
  desktopHidden = false,
  onCollapsedChange,
}: ModuleSidebarProps) {
  const { currentUser, currentTenantLogo, currentTenantName, sidebarOpen, setSidebarOpen } =
    useAppStore();
  const isMobile = useIsMobile();

  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(
    () => findModuleForScreen(items, resolvedScreen)?.key ?? items[0]?.key ?? null
  );
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  // Follow URL-driven screen changes
  const [prevScreen, setPrevScreen] = useState(resolvedScreen);
  if (resolvedScreen !== prevScreen) {
    setPrevScreen(resolvedScreen);
    const matched = findModuleForScreen(items, resolvedScreen);
    if (matched) setActiveModuleKey(matched.key);
  }

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sidebarOpen, setSidebarOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleToggle = () => toggleCollapsed();
    window.addEventListener("inkwelly_module_sidebar_toggle", handleToggle);
    return () => window.removeEventListener("inkwelly_module_sidebar_toggle", handleToggle);
  }, [toggleCollapsed]);

  // Rail item selected: on mobile, just switch the active module (panel stays open).
  // On desktop, expand if collapsed and navigate.
  const handleSelectModule = useCallback(
    (module: ModuleNavItem) => {
      setActiveModuleKey(module.key);

      if (isMobile) {
        // Switch panel content; don't close the drawer.
        // If the module is a single direct item, navigate right away.
        const totalItems = module.sections.flatMap((s) => s.items).length;
        if (totalItems === 1) {
          navigateTo(module.key);
          setSidebarOpen(false);
        }
        return;
      }

      if (collapsed) toggleCollapsed();
      navigateTo(module.key);
    },
    [isMobile, collapsed, toggleCollapsed, navigateTo, setSidebarOpen]
  );

  // Panel toggle: on desktop collapses the panel; on mobile closes the drawer.
  const handlePanelToggle = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
    else toggleCollapsed();
  }, [isMobile, setSidebarOpen, toggleCollapsed]);

  // Panel navigation: navigate and close sidebar on mobile.
  const handlePanelNavigate = useCallback(
    (screen: string) => {
      navigateTo(screen);
      if (isMobile) setSidebarOpen(false);
    },
    [navigateTo, isMobile, setSidebarOpen]
  );

  if (!currentUser) return null;

  const activeModule = items.find((i) => i.key === activeModuleKey) ?? items[0];
  if (!activeModule) return null;

  // The launcher's landing is the module grid itself, so it gets no panel at any
  // width — not a collapsed one, which would still paint for a frame.
  const panelMode = decidePanelMode({
    isMobile,
    collapsed,
    activeModuleKey: activeModule.key,
  });

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-full overflow-hidden",
        "rounded-r-2xl lg:rounded-none shadow-2xl lg:shadow-none bg-[#06231D]",
        "transition-[translate,opacity,width,visibility] duration-300 ease-out will-change-transform",
        "max-w-[calc(100vw-3.5rem)] lg:max-w-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        desktopHidden
          ? "lg:w-0 lg:min-w-0 lg:-translate-x-3 lg:opacity-0 lg:invisible"
          : "lg:w-auto lg:min-w-0 lg:translate-x-0 lg:opacity-100 lg:visible"
      )}
    >
      {/* Rail — always visible */}
      <ModuleRail
        items={items}
        activeModuleKey={activeModule.key}
        tenantLogo={currentTenantLogo}
        tenantName={currentTenantName}
        collapsed={collapsed}
        onExpand={toggleCollapsed}
        onSelect={handleSelectModule}
      />

      {/* Panel with smooth slide animation on desktop, side-by-side on mobile */}
      {panelMode === "none" ? null : (
        <div
          className={cn(
            "h-full overflow-hidden transition-[width,opacity] duration-300 ease-in-out shrink-0",
            panelMode === "shown"
              ? isMobile
                ? "w-full"
                : "w-[210px] opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="w-[210px] h-full lg:h-[calc(100%-16px)] lg:my-2 flex flex-col">
            <ModulePanel
              module={activeModule}
              resolvedScreen={resolvedScreen}
              onToggleCollapse={handlePanelToggle}
              backToRail={isMobile}
              onNavigate={handlePanelNavigate}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
