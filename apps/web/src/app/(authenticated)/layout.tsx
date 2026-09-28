'use client';

import { useAppStore } from '@/store/use-app-store';
import { LoginScreen } from '@/modules/auth/components/Login';
import { AppLayout } from '@/components/layout/app-layout';
import { useSyncExternalStore, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { MaintenanceScreen } from '@/components/shared/error/maintenance';
import { FullPageSkeleton } from '@/components/ui/full-page-skeleton';

// Prevents hydration mismatch
const emptySubscribe = () => () => { };
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, currentUser } = useAppStore();
  const hydrated = useHydrated();
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  // Check maintenance mode for non-super_admin users in the background
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role === "super_admin") {
      return;
    }
    
    let cancelled = false;
    
    apiFetch("/api/platform-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const modeSetting = data.find((s: any) => s.key === "maintenance_mode");
          const msgSetting = data.find((s: any) => s.key === "maintenance_message");
          setMaintenanceActive(modeSetting?.value === "true");
          if (msgSetting?.value) {
            setMaintenanceMessage(msgSetting.value);
          }
        }
      })
      .catch(() => {});
      
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, currentUser?.role]);

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const isSuperAdmin = currentUser?.role === "super_admin";

  if (!isSuperAdmin && maintenanceActive) {
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  return <AppLayout>{children}</AppLayout>;
}
