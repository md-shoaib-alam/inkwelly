'use client';

import { useAppStore } from '@/store/use-app-store';
import { LoginScreen } from '@/components/screens/login';
import { AppLayout } from '@/components/layout/app-layout';
import { useSyncExternalStore, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { MaintenanceScreen } from '@/components/screens/error/maintenance';
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
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  // Check maintenance mode for non-super_admin users
  useEffect(() => {
    if (!isLoggedIn || !currentUser || currentUser.role === "super_admin") {
      setMaintenanceLoading(false);
      return;
    }
    
    setMaintenanceLoading(true);
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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMaintenanceLoading(false);
      });
      
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, currentUser?.role]);

  if (!hydrated) return <FullPageSkeleton />;

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const isSuperAdmin = currentUser?.role === "super_admin";
  if (!isSuperAdmin && maintenanceLoading) {
    return <FullPageSkeleton />;
  }

  if (!isSuperAdmin && maintenanceActive) {
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  return <AppLayout>{children}</AppLayout>;
}
