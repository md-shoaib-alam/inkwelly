"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";
import { hasPermission, isRootAdmin } from "@/lib/permissions";
import { ChangePasswordModal } from "@/components/modals/change-password-modal";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { navItems } from "./nav-config";
import { useIsFetching } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { PlatformNoticeBar } from "./platform-notice-bar";
import { SubscriptionExpiredScreen } from "@/components/screens/subscription-expired";

function LoadingProgress() {
  const isFetching = useIsFetching();
  if (isFetching === 0) return null;
  return <div className="loading-progress-bar" />;
}

import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";

const PLATFORM_ROUTES = new Set([
  "dashboard",
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

function isTenantRootPath(p: string, currentUser: any, currentTenantSlug: string | null): boolean {
  return p === currentUser?.tenantId ||
         p === currentTenantSlug ||
         p === currentUser?.tenantSlug;
}

function resolveScreenFromPathname(
  pathname: string,
  currentUser: any,
  currentTenantSlug: string | null
): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2) return parts[1];
  if (parts.length === 1) {
    return isTenantRootPath(parts[0], currentUser, currentTenantSlug) ? "dashboard" : parts[0];
  }
  return "dashboard";
}

function shouldIncludeItem(
  item: any,
  currentUser: any
): boolean {
  if (item.key === "dashboard") return true;
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
  currentTenantSlug: string | null;
  currentTenantId: string | null;
  push: any;
  setCurrentScreen: any;
  setSidebarOpen: any;
}) {
  const {
    isSuperAdmin,
    currentTenantSlug,
    currentTenantId,
    push,
    setCurrentScreen,
    setSidebarOpen,
  } = opts;

  const navigateTo = useCallback((screen: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    setCurrentScreen(screen);
    const tenantIdentifier = currentTenantSlug || currentTenantId;

    if (isSuperAdmin && isPlatformRoute(screen)) {
      push(`/${screen}`);
      return;
    }

    if (!tenantIdentifier) {
      push(`/${screen}`);
    } else {
      push(`/${tenantIdentifier}/${screen}`);
    }
  }, [currentTenantId, currentTenantSlug, isSuperAdmin, push, setCurrentScreen, setSidebarOpen]);

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
  const [isMounted, setIsMounted] = useState(false);

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
  const resolvedScreen = useMemo(() => {
    return resolveScreenFromPathname(pathname, currentUser, currentTenantSlug);
  }, [pathname, currentUser, currentTenantSlug]);

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
    currentTenantSlug,
    currentTenantId,
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

  if (!currentUser) return <FullPageSkeleton />;

  return (
    <NotificationProvider>
      <div className={cn(
        "h-dvh flex flex-col overflow-hidden bg-background transition-opacity duration-200",
        !isMounted ? "opacity-0" : "opacity-100"
      )}>
        <PlatformNoticeBar />
        <div className="flex-1 flex min-h-0 overflow-hidden">
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
        <Sidebar
          items={items}
          resolvedScreen={resolvedScreen}
          navigateTo={navigateTo}
          setIsChangePasswordOpen={setIsChangePasswordOpen}
          layoutPref={layoutPref}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <Header
            items={items}
            resolvedScreen={resolvedScreen}
            layoutPref={layoutPref}
            onPasswordChange={() => setIsChangePasswordOpen(true)}
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
      </div>
    </NotificationProvider>
  );
}
