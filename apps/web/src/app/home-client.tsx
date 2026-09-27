"use client";

import { useEffect, useSyncExternalStore, useReducer } from "react";
import { useRouter, redirect } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { apiFetch } from "@/lib/api";
import { LoginScreen } from "@/components/screens/login";
import { MaintenanceScreen } from "@/components/screens/error/maintenance";
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";

// Prevents hydration mismatch: returns false on server, true on client
const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface MaintenanceState {
  active: boolean;
  message: string;
  loading: boolean;
}

type MaintenanceAction = 
  | { type: 'START_LOADING' }
  | { type: 'SET_DATA', payload: { active: boolean, message: string } }
  | { type: 'STOP_LOADING' };

function maintenanceReducer(state: MaintenanceState, action: MaintenanceAction): MaintenanceState {
  switch (action.type) {
    case 'START_LOADING': return { ...state, loading: true };
    case 'SET_DATA': return { ...state, active: action.payload.active, message: action.payload.message, loading: false };
    case 'STOP_LOADING': return { ...state, loading: false };
    default: return state;
  }
}

export default function HomeClient({ initialHasToken }: { initialHasToken: boolean }) {
  const { isLoggedIn, currentUser, currentScreen, currentTenantId } =
    useAppStore();
  const mounted = useHydrated();
  
  const [maintenance, dispatchMaintenance] = useReducer(maintenanceReducer, {
    active: false,
    message: "",
    loading: true
  });

  const userRole = currentUser?.role;

  // 1. Unified Redirection Logic (DURING RENDER)
  // We do this BEFORE any other render logic to avoid 404 flashes
  if (mounted && isLoggedIn && currentUser) {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const isSuperAdmin = currentUser.role === "super_admin";
    const expectedPrefix = currentUser.tenantSlug || currentUser.tenantId || currentTenantId;

    // Only redirect if we are literally at the root "/"
    if (parts.length === 0 && (expectedPrefix || isSuperAdmin)) {
      const url = !expectedPrefix
        ? `/${currentScreen}`
        : currentScreen === "dashboard"
          ? `/${expectedPrefix}/dashboard`
          : `/${expectedPrefix}/${currentScreen}`;

      redirect(url);
    }
  }

  // Check maintenance mode for non-super_admin users
  useEffect(() => {
    if (!isLoggedIn || !currentUser || userRole === "super_admin") {
      dispatchMaintenance({ type: 'STOP_LOADING' });
      return;
    }
    
    dispatchMaintenance({ type: 'START_LOADING' });
    let cancelled = false;
    
    apiFetch("/api/platform-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const modeSetting = data.find((s: any) => s.key === "maintenance_mode");
          const msgSetting = data.find((s: any) => s.key === "maintenance_message");
          
          dispatchMaintenance({
            type: 'SET_DATA',
            payload: {
              active: modeSetting?.value === "true",
              message: msgSetting?.value || ""
            }
          });
        } else if (!cancelled) {
          dispatchMaintenance({ type: 'STOP_LOADING' });
        }
      })
      .catch(() => {
        if (!cancelled) dispatchMaintenance({ type: 'STOP_LOADING' });
      });
      
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, currentUser, userRole]);

  // Not mounted yet → render appropriate component based on server cookie (avoids hydration mismatch)
  if (!mounted) {
    return initialHasToken ? <FullPageSkeleton /> : <LoginScreen />;
  }

  // Not logged in → show login
  if (!isLoggedIn) return <LoginScreen />;

  // If logged in but still at "/", show skeleton while redirect takes over
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return <FullPageSkeleton />;
  }

  // Maintenance mode check
  const isSuperAdmin = userRole === "super_admin";
  if (isLoggedIn && !isSuperAdmin && maintenance.loading) {
    return <FullPageSkeleton />;
  }

  if (isLoggedIn && !isSuperAdmin && maintenance.active) {
    return <MaintenanceScreen message={maintenance.message} />;
  }

  return <FullPageSkeleton />;
}
