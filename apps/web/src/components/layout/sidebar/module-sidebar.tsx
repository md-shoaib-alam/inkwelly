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

interface ModuleSidebarProps {
  items: ModuleNavItem[];
  resolvedScreen: string;
  navigateTo: (screen: string) => void;
}

export function ModuleSidebar({ items, resolvedScreen, navigateTo }: ModuleSidebarProps) {
  const { currentUser, currentTenantLogo, currentTenantName, sidebarOpen, setSidebarOpen } =
    useAppStore();

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

  // Follow URL-driven screen changes so the right module stays selected
  // (adjust-during-render pattern instead of an effect).
  const [prevScreen, setPrevScreen] = useState(resolvedScreen);
  if (resolvedScreen !== prevScreen) {
    setPrevScreen(resolvedScreen);
    const matched = findModuleForScreen(items, resolvedScreen);
    if (matched) setActiveModuleKey(matched.key);
  }

  // Escape closes the mobile drawer
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
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
        // storage unavailable — collapse just won't persist
      }
      return next;
    });
  }, []);

  const handleSelectModule = useCallback(
    (module: ModuleNavItem) => {
      setActiveModuleKey(module.key);
      if (collapsed) toggleCollapsed();
      navigateTo(getDefaultScreen(module));
    },
    [collapsed, toggleCollapsed, navigateTo]
  );

  const handlePanelToggle = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    } else {
      toggleCollapsed();
    }
  }, [setSidebarOpen, toggleCollapsed]);

  if (!currentUser) return null;

  const activeModule =
    items.find((i) => i.key === activeModuleKey) ?? items[0];
  if (!activeModule) return null;

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-full overflow-hidden",
        "rounded-r-2xl lg:rounded-r-none shadow-2xl lg:shadow-none",
        "transition-transform duration-300 ease-out will-change-transform transform-gpu lg:transform-none",
        "max-w-[calc(100vw-3.5rem)]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <ModuleRail
        items={items}
        activeModuleKey={activeModule.key}
        tenantLogo={currentTenantLogo}
        tenantName={currentTenantName}
        onSelect={handleSelectModule}
      />
      {/* Collapse preference only applies on desktop; the mobile drawer always
          shows rail + panel together like the reference app. */}
      <div className={cn("flex h-full min-w-0", collapsed && "lg:hidden")}>
        <ModulePanel
          module={activeModule}
          resolvedScreen={resolvedScreen}
          onToggleCollapse={handlePanelToggle}
          onNavigate={navigateTo}
        />
      </div>
    </aside>
  );
}
