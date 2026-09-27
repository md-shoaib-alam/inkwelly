"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useParams, redirect } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";
import dynamic from "next/dynamic";

import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";

const LoadingScreen = () => <FullPageSkeleton />;

const AdminDashboard = dynamic(() => import("@/components/screens/admin/dashboard").then((m) => m.AdminDashboard), { loading: LoadingScreen });
const SuperAdminDashboard = dynamic(() => import("@/components/screens/super-admin/dashboard").then((m) => m.SuperAdminDashboard), { loading: LoadingScreen });
const SuperAdminTenants = dynamic(() => import("@/components/screens/super-admin/tenants").then((m) => m.SuperAdminTenants), { loading: LoadingScreen });
const SuperAdminDeletedTenants = dynamic(() => import("@/components/screens/super-admin/deleted-tenants").then((m) => m.SuperAdminDeletedTenants), { loading: LoadingScreen });
const SuperAdminBilling = dynamic(() => import("@/components/screens/super-admin/billing").then((m) => m.SuperAdminBilling), { loading: LoadingScreen });
const SuperAdminUsers = dynamic(() => import("@/components/screens/super-admin/users").then((m) => m.SuperAdminUsers), { loading: LoadingScreen });
const SuperAdminAuditLogs = dynamic(() => import("@/components/screens/super-admin/audit-logs").then((m) => m.SuperAdminAuditLogs), { loading: LoadingScreen });
const SuperAdminAnalytics = dynamic(() => import("@/components/screens/super-admin/analytics").then((m) => m.SuperAdminAnalytics), { loading: LoadingScreen });
const SuperAdminRoadmap = dynamic(() => import("@/components/screens/super-admin/roadmap").then((m) => m.RoadmapPanel), { loading: LoadingScreen });
const SuperAdminIntegrations = dynamic(() => import("@/components/screens/super-admin/integrations").then((m) => m.SuperAdminIntegrations), { loading: LoadingScreen });
const SuperAdminSettings = dynamic(() => import("@/components/screens/super-admin/settings").then((m) => m.SuperAdminSettings), { loading: LoadingScreen });
const SuperAdminRoles = dynamic(() => import("@/components/screens/super-admin/roles").then((m) => m.SuperAdminRoles), { loading: LoadingScreen });
const SuperAdminManage = dynamic(() => import("@/components/screens/super-admin/manage-admins").then((m) => m.SuperAdminManage), { loading: LoadingScreen });
const SuperAdminStaff = dynamic(() => import("@/components/screens/super-admin/staff").then((m) => m.SuperAdminStaff), { loading: LoadingScreen });
const SuperAdminSubscriptions = dynamic(() => import("@/components/screens/super-admin/subscriptions").then((m) => m.SuperAdminSubscriptions), { loading: LoadingScreen });
const SuperAdminSchoolSubscriptions = dynamic(() => import("@/components/screens/super-admin/school-subscriptions").then((m) => m.SuperAdminSchoolSubscriptions), { loading: LoadingScreen });
const SuperAdminPlatformNotices = dynamic(() => import("@/components/screens/super-admin/platform-notices").then((m) => m.SuperAdminPlatformNotices), { loading: LoadingScreen });
const SuperAdminReports = dynamic(() => import("@/components/screens/super-admin/reports").then((m) => m.SuperAdminReports), { loading: LoadingScreen });
const SuperAdminBulkAttendance = dynamic(() => import("@/components/screens/super-admin/bulk-attendance-import").then((m) => m.SuperAdminBulkAttendance), { loading: LoadingScreen });
const SuperAdminQueueStatus = dynamic(() => import("@/components/screens/super-admin/queue-status").then((m) => m.SuperAdminQueueStatus), { loading: LoadingScreen });

const UserProfileScreen = dynamic(() => import("@/components/screens/profile").then((m) => m.UserProfileScreen), { loading: LoadingScreen });
const TeacherDashboard = dynamic(() => import("@/components/screens/teacher/dashboard").then((m) => m.TeacherDashboard), { loading: LoadingScreen });
const StudentDashboard = dynamic(() => import("@/components/screens/student/dashboard").then((m) => m.StudentDashboard), { loading: LoadingScreen });
const ParentDashboard = dynamic(() => import("@/components/screens/parent/dashboard").then((m) => m.ParentDashboard), { loading: LoadingScreen });
const StaffDashboard = dynamic(() => import("@/components/screens/staff/dashboard").then((m) => m.StaffDashboard), { loading: LoadingScreen });
const NotFoundScreen = dynamic(() => import("@/components/screens/error/not-found").then((m) => m.NotFoundScreen));

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function GenericSlugDispatcherClient() {
  const { slug } = useParams();
  const mounted = useHydrated();
  const { currentUser, currentTenantSlug, currentTenantId, setCurrentTenant } = useAppStore();

  const { data: resolvedTenant } = useTenantResolution(slug as string);

  useEffect(() => {
    if (mounted && resolvedTenant && (resolvedTenant.slug !== currentTenantSlug || resolvedTenant.id !== currentTenantId)) {
      setCurrentTenant(resolvedTenant.id, resolvedTenant.name, resolvedTenant.slug, resolvedTenant.logo);
    }
  }, [mounted, resolvedTenant, currentTenantSlug, currentTenantId, setCurrentTenant]);

  // REDIRECTION LOGIC (DURING RENDER)
  if (mounted && currentUser && typeof slug === 'string') {
    const urlSlug = slug.toLowerCase();
    const userTenantId = currentUser?.tenantId?.toLowerCase() || '';
    const userTenantSlug = currentUser?.tenantSlug?.toLowerCase() || '';
    const isTenantMatch = (urlSlug === userTenantId || urlSlug === userTenantSlug);
    const isTenantContext = isTenantMatch || (currentUser?.role === "super_admin" && !!resolvedTenant);

    const correctSlug = currentUser.role !== "super_admin" ? (currentUser.tenantSlug || currentUser.tenantId) : null;
    
    // 1. Wrong Slug? Auto-correct
    if (correctSlug && slug !== correctSlug) {
      redirect(`/${correctSlug}`);
    }
    
    // 2. Base Slug? Go to Dashboard
    if (isTenantContext) {
      redirect(`/${slug}/dashboard`);
    }
  }

  if (!mounted || !currentUser || typeof slug !== 'string') return <LoadingScreen />;

  // 1. Platform Screens (Super Admin only)
  if (currentUser.role === "super_admin") {
    switch (slug) {
      case "profile": return <UserProfileScreen />;
      case "dashboard": return <SuperAdminDashboard />;
      case "tenants": return <SuperAdminTenants />;
      case "deleted-tenants": return <SuperAdminDeletedTenants />;
      case "bulk-attendance-import": return <SuperAdminBulkAttendance />;
      case "billing": return <SuperAdminBilling />;
      case "users": return <SuperAdminUsers />;
      case "audit-logs": return <SuperAdminAuditLogs />;
      case "platform-analytics": return <SuperAdminAnalytics />;
      case "roadmap": return <SuperAdminRoadmap />;
      case "integrations": return <SuperAdminIntegrations />;
      case "roles": return <SuperAdminRoles />;
      case "staff": return <SuperAdminStaff />;
      case "settings": return <SuperAdminSettings />;
      case "manage-admins": return <SuperAdminManage />;
      case "subscriptions": return <SuperAdminSubscriptions />;
      case "school-subscriptions": return <SuperAdminSchoolSubscriptions />;
      case "platform-notices": return <SuperAdminPlatformNotices />;
      case "reports": return <SuperAdminReports />;
      case "queue-status": return <SuperAdminQueueStatus />;
      default: {
        // If super admin is at a school slug, it's handled by isTenantContext above
        // But if they are at an unknown slug, we stay here and fall through to FAIL-SAFE
      }
    }
  }

  // 2. Tenant Base Slugs for all other roles
  // (Redirection to dashboard is already handled in the REDIRECTION LOGIC block above)

  // FAIL-SAFE: If we got here and the user is logged in, 
  // they are at an unknown slug. Redirect them home.
  if (mounted && currentUser) {
    const fallback = currentUser.tenantSlug || currentUser.tenantId || "";
    redirect(fallback ? `/${fallback}/dashboard` : "/dashboard");
  }

  return <NotFoundScreen />;
}
