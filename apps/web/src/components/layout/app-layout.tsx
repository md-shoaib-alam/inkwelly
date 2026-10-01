"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";
import { hasPermission, isRootAdmin } from "@/lib/permissions";
import { ChangePasswordModal } from "@/components/modals/change-password-modal";
import { SignedInDevicesModal } from "@/components/modals/SignedInDevicesModal";
import { Sidebar } from "./sidebar";
import { ModuleSidebar } from "./sidebar/module-sidebar";
import type { PanelMode } from "./sidebar/panel-mode";
import { getAdminRail, isAdminModuleScreen } from "./sidebar/module-nav-config";
import { adminModuleLandings, adminSharedRoots, servesLandingAtRoot } from "./sidebar/module-roots";
import { parseRoute, qualifiedKey } from "@/lib/routing/module-routes";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { Header } from "./header";
import { navItems } from "./nav-config";
import { useIsFetching } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { PlatformNoticeBar } from "./platform-notice-bar";
import { OffSessionNotice } from "./off-session-notice";
import { SubscriptionExpiredScreen } from "@/modules/tenancy/components/SubscriptionExpired";

function LoadingProgress() {
  const isFetching = useIsFetching();
  if (isFetching === 0) return null;
  return <div className="loading-progress-bar" />;
}

import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { AdminDashboardSkeleton } from "@/modules/dashboard/components/adminDashboard/DashboardSkeleton";

const PLATFORM_ROUTES = new Set([
  "modules",
  "tenants",
  "deleted-tenants",
  "bulk-attendance-import",
  "billing",
  "users",
  "audit-logs",
  "platform-analytics",
  "integrations",
  "roadmap",
  "roles",
  "staff",
  "manage-admins",
  "subscriptions",
  "settings",
  "school-subscriptions",
  "platform-notices",
  "send-notification",
  "profile",
  "reports",
  "queue-status",
]);

function isPlatformRoute(screen: string): boolean {
  return PLATFORM_ROUTES.has(screen);
}

function tenantRootPredicate(currentUser: any, currentTenantSlug: string | null) {
  return (first: string) =>
    first === currentUser?.tenantId ||
    first === currentTenantSlug ||
    first === currentUser?.tenantSlug;
}

// Delegates to the shared contract so the sidebar's active row and the
// dispatcher's switch cannot drift apart on what a path means.
function resolveScreenFromPathname(
  pathname: string,
  currentUser: any,
  currentTenantSlug: string | null,
  yearSlugs: string[] = []
): string {
  const { module, screen } = parseRoute(pathname, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: tenantRootPredicate(currentUser, currentTenantSlug),
    yearSlugs,
  });
  if (module) return qualifiedKey(module, screen);
  // A module root (`/slug/academics`) is not a row key, so the sidebar would light
  // nothing. Resolving it to the row it renders keeps the rail and the panel in
  // agreement with the address bar.
  const landing = adminModuleLandings[screen];
  if (!landing) return screen;
  // A shared root renders its own screen key for the roles that reach it there, so
  // that is the row the panel has to light — not the landing an admin would get.
  if (adminSharedRoots.has(screen) && !servesLandingAtRoot(currentUser?.role)) return screen;
  return qualifiedKey(screen, landing);
}

function shouldIncludeItem(
  item: any,
  currentUser: any
): boolean {
  if (item.key === "modules") return true;
  if (item.rootOnly) return isRootAdmin(currentUser);
  if (!item.permModule) return true;
  return hasPermission(currentUser, item.permModule, "view");
}

function getFilteredNavItems(
  currentUser: any
) {
  if (!currentUser) return [];
  const allItems = navItems[currentUser.role] || [];
  return allItems
    .map((item) => {
      // 1. If the parent group itself requires a permission, check it first
      if (item.permModule && !shouldIncludeItem(item, currentUser)) {
        return null;
      }

      // 2. Filter children
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter((child: any) => {
          const effectiveChild = child.permModule !== undefined
            ? child
            : { ...child, permModule: item.permModule };
          return shouldIncludeItem(effectiveChild, currentUser);
        });
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }

      return shouldIncludeItem(item, currentUser) ? item : null;
    })
    .filter(Boolean) as typeof allItems;
}

function isStatusExpired(status: string | undefined): boolean {
  if (!status) return false;
  return status !== "active" && status !== "trial";
}

function isDateExpired(endDate: string | Date | undefined): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

function checkSubscriptionExpired(resolvedTenant: any, isSuperAdmin: boolean): boolean {
  if (!resolvedTenant || isSuperAdmin) return false;
  return isStatusExpired(resolvedTenant.status) || isDateExpired(resolvedTenant.endDate);
}

function getStaffPref(val: string | null): string {
  return val === "enabled" ? "comprehensive" : "minimal";
}

function resolveLayoutPref(val: string | null, isStaff: boolean): string | null {
  if (!val) return null;
  return isStaff ? getStaffPref(val) : val;
}

function useLayoutPreference(currentUser: any) {
  const [layoutPref, setLayoutPref] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !currentUser) return;
    const isStaff = currentUser.role === "staff";

    const initializePref = () => {
      const key = isStaff 
        ? "schoolsaas_staff_sidebar_preference" 
        : "schoolsaas_dashboard_layout_preference";
      const pref = localStorage.getItem(key);
      setLayoutPref(resolveLayoutPref(pref, isStaff));
    };

    initializePref();

    const handlePrefChange = (e: any) => {
      if (e.detail) {
        setLayoutPref(resolveLayoutPref(e.detail, isStaff));
      }
    };

    window.addEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
    window.addEventListener("schoolsaas_staff_sidebar_pref_changed", handlePrefChange);
    return () => {
      window.removeEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
      window.removeEventListener("schoolsaas_staff_sidebar_pref_changed", handlePrefChange);
    };
  }, [currentUser?.role, currentUser?.id]);

  return layoutPref;
}

function useTenantSync(
  resolvedTenant: any,
  currentTenantSlug: string | null,
  currentTenantId: string | null,
  setCurrentTenant: any
) {
  useEffect(() => {
    if (!resolvedTenant) return;
    const hasTenantChanged =
      resolvedTenant.slug !== currentTenantSlug ||
      resolvedTenant.id !== currentTenantId;
    if (hasTenantChanged) {
      setCurrentTenant(
        resolvedTenant.id,
        resolvedTenant.name,
        resolvedTenant.slug,
        resolvedTenant.logo
      );
    }
  }, [resolvedTenant, currentTenantSlug, currentTenantId, setCurrentTenant]);
}

function useCookieAuthGuard(currentUser: any) {
  useEffect(() => {
    if (!currentUser) return;

    let redirectPending: ReturnType<typeof setTimeout> | null = null;

    const checkAuth = () => {
      const token = getCookie("school_token");
      if (!token) {
        // Debounce: wait 2 s then re-check before redirecting.
        // This prevents a false-logout during the brief window when
        // the old cookie is cleared and the new rotated token is
        // being written (token rotation race condition).
        if (!redirectPending) {
          redirectPending = setTimeout(() => {
            redirectPending = null;
            if (!getCookie("school_token")) {
              window.location.href = "/";
            }
          }, 2000);
        }
      } else {
        // Cookie is present — cancel any pending redirect
        if (redirectPending) {
          clearTimeout(redirectPending);
          redirectPending = null;
        }
      }
    };

    checkAuth();
    // Check every 30 s instead of 5 s — reduces race risk and CPU overhead
    const interval = setInterval(checkAuth, 30_000);
    return () => {
      clearInterval(interval);
      if (redirectPending) clearTimeout(redirectPending);
    };
  }, [currentUser?.id]);
}

function useAppNavigation(opts: {
  isSuperAdmin: boolean;
  push: any;
  setCurrentScreen: any;
  setSidebarOpen: any;
}) {
  const {
    isSuperAdmin,
    push,
    setCurrentScreen,
    setSidebarOpen,
  } = opts;

  const tenantHref = useTenantHref();

  const navigateTo = useCallback((screen: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    setCurrentScreen(screen);

    if (isSuperAdmin && isPlatformRoute(screen)) {
      push(`/${screen}`);
      return;
    }

    push(tenantHref(screen));
  }, [isSuperAdmin, push, setCurrentScreen, setSidebarOpen, tenantHref]);

  useEffect(() => {
    const handleNavigationEvent = (e: any) => {
      if (e.detail) {
        navigateTo(e.detail);
      }
    };
    window.addEventListener("super-admin-navigate", handleNavigationEvent);
    return () => window.removeEventListener("super-admin-navigate", handleNavigationEvent);
  }, [navigateTo]);

  return navigateTo;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams();
  const {
    currentUser,
    currentTenantId,
    currentTenantSlug,
    currentTenantName,
    setCurrentTenant,
    currentScreen,
    setCurrentScreen,
    sidebarOpen,
    setSidebarOpen,
    refreshPermissions,
  } = useAppStore();

  const pathname = usePathname();
  const { push } = useRouter();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("shown");

  // Sync tenant context from slug
  const { data: resolvedTenant } = useTenantResolution(slug as string);

  const layoutPref = useLayoutPreference(currentUser);
  useTenantSync(resolvedTenant, currentTenantSlug, currentTenantId, setCurrentTenant);
  useCookieAuthGuard(currentUser);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Refresh permissions from DB on mount
  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  // Determine current screen from pathname
  const { yearSlugs } = useActiveAcademicYear();

  const resolvedScreen = useMemo(() => {
    return resolveScreenFromPathname(pathname, currentUser, currentTenantSlug, yearSlugs);
  }, [pathname, currentUser, currentTenantSlug, yearSlugs]);

  // Sync store screen with URL resolved screen to prevent navigation locks
  useEffect(() => {
    if (resolvedScreen && resolvedScreen !== currentScreen) {
      setCurrentScreen(resolvedScreen);
    }
  }, [resolvedScreen, currentScreen, setCurrentScreen]);

  const isSuperAdmin = currentUser?.role === "super_admin";

  // Filter nav items based on permissions
  const items = useMemo(() => {
    return getFilteredNavItems(currentUser);
  }, [currentUser]);

  // Only admins get the two-level module sidebar for now; every other role keeps
  // the legacy accordion.
  const isAdmin = currentUser?.role === "admin";
  const moduleItems = useMemo(
    () => (isAdmin ? getAdminRail(currentUser) : []),
    [isAdmin, currentUser]
  );
  const useModuleSidebar = isAdmin && moduleItems.length > 0;
  // On the admin dashboard the module grid is the navigation, so the rail is there
  // for phones only — the hamburger still opens it below the lg breakpoint.
  const hideRailOnDesktop = resolvedScreen === "modules";

  // --- SUBSCRIPTION CHECK LOGIC ---
  const isExpired = useMemo(() => {
    return checkSubscriptionExpired(resolvedTenant, isSuperAdmin);
  }, [resolvedTenant, isSuperAdmin]);

  // Whitelist screen so admin can actually pay while expired!
  const isExemptFromLock = 
    resolvedScreen === "school-subscription" || 
    resolvedScreen === "manage-plan" || 
    isSuperAdmin;

  const navigateTo = useAppNavigation({
    isSuperAdmin,
    push,
    setCurrentScreen,
    setSidebarOpen,
  });

  // Listen for open-change-password events from deep components
  useEffect(() => {
    const handleOpenPasswordModal = () => {
      setIsChangePasswordOpen(true);
    };
    window.addEventListener("open-change-password", handleOpenPasswordModal);
    return () => window.removeEventListener("open-change-password", handleOpenPasswordModal);
  }, []);

  // Listen for open-signed-in-devices events from account affordances
  useEffect(() => {
    const handleOpenDevicesModal = () => {
      setIsDevicesOpen(true);
    };
    window.addEventListener("open-signed-in-devices", handleOpenDevicesModal);
    return () => window.removeEventListener("open-signed-in-devices", handleOpenDevicesModal);
  }, []);

  if (!currentUser) {
    if (resolvedScreen === "modules") {
      return <AdminDashboardSkeleton />;
    }
    return <FullPageSkeleton />;
  }

  return (
    <NotificationProvider>
      <div className={cn(
        "h-dvh flex flex-col overflow-hidden bg-background transition-opacity duration-200",
        !isMounted ? "opacity-0" : "opacity-100"
      )}>
        <PlatformNoticeBar />
        <OffSessionNotice />
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[#06231D]">
          <LoadingProgress />
        {/* Mobile overlay */}

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden border-none p-0"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSidebarOpen(false);
              }
            }}
          />
        )}

        {/* Sidebar */}
        {useModuleSidebar && layoutPref !== "minimal" ? (
          <ModuleSidebar
            items={moduleItems}
            resolvedScreen={resolvedScreen}
            navigateTo={navigateTo}
            desktopHidden={hideRailOnDesktop}
            onPanelModeChange={setPanelMode}
          />
        ) : (
          <Sidebar
            items={items}
            resolvedScreen={resolvedScreen}
            navigateTo={navigateTo}
            setIsChangePasswordOpen={setIsChangePasswordOpen}
            layoutPref={layoutPref}
          />
        )}

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden bg-background lg:transition-[border-radius] lg:duration-300",
          useModuleSidebar && "lg:my-2 lg:h-[calc(100%-16px)]",
          // The gap tracks the rail, which the URL does decide. The corners track the
          // panel, which the URL decides a router transition too late: while it still
          // said `modules` the panel was already open against a square left edge.
          useModuleSidebar && (hideRailOnDesktop ? "lg:mx-2" : "lg:mr-2"),
          useModuleSidebar && (panelMode !== "shown" ? "lg:rounded-[24px]" : "lg:rounded-r-[24px]")
        )}>
          {/* Top Header */}
          <Header
            items={items}
            resolvedScreen={resolvedScreen}
            layoutPref={layoutPref}
            onPasswordChange={() => setIsChangePasswordOpen(true)}
            sidebarPanelCollapsed={useModuleSidebar && !hideRailOnDesktop && panelMode === "hidden"}
            onExpandSidebarPanel={() => window.dispatchEvent(new CustomEvent("inkwelly_module_sidebar_toggle"))}
          />

          {/* Page Content */}
          <main data-lenis-scroll-container className="flex-1 overflow-y-auto p-4 lg:p-6 overscroll-contain">
            {isExpired && !isExemptFromLock ? (
              <SubscriptionExpiredScreen 
                tenantName={resolvedTenant?.name || currentTenantName || "School"} 
                tenantSlug={resolvedTenant?.slug || currentTenantSlug || ""}
                role={currentUser.role}
                endDate={resolvedTenant?.endDate}
                status={resolvedTenant?.status}
              />
            ) : (
              children
            )}
          </main>
        </div>

        </div>
        <ChangePasswordModal
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        />
        <SignedInDevicesModal open={isDevicesOpen} onOpenChange={setIsDevicesOpen} />
      </div>
    </NotificationProvider>
  );
}
