"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useParams, redirect } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { hasPermission } from "@/lib/permissions";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { canonicalTenantUrl, yearSlugOf } from "@/lib/routing/academic-year-url";
import { decideYearGate } from "@/lib/routing/year-gate";
import dynamic from "next/dynamic";

import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { AdminDashboardSkeleton } from "@/modules/dashboard/components/adminDashboard/DashboardSkeleton";

const LoadingScreen = () => <FullPageSkeleton />;
const DashboardLoadingScreen = () => <AdminDashboardSkeleton />;

const AdminDashboard = dynamic(() => import("@/modules/dashboard/components/adminDashboard/index").then((m) => m.AdminDashboard), { loading: DashboardLoadingScreen });
const SuperAdminDashboard = dynamic(() => import("@/modules/dashboard/components/SuperAdminDashboard").then((m) => m.SuperAdminDashboard), { loading: LoadingScreen });
const SuperAdminTenants = dynamic(() => import("@/modules/tenancy/components/SuperAdminTenants").then((m) => m.SuperAdminTenants), { loading: LoadingScreen });
const SuperAdminDeletedTenants = dynamic(() => import("@/modules/tenancy/components/SuperAdminDeletedTenants").then((m) => m.SuperAdminDeletedTenants), { loading: LoadingScreen });
const SuperAdminBilling = dynamic(() => import("@/modules/finance/components/SuperAdminBilling").then((m) => m.SuperAdminBilling), { loading: LoadingScreen });
const SuperAdminUsers = dynamic(() => import("@/modules/people/components/SuperAdminUsers").then((m) => m.SuperAdminUsers), { loading: LoadingScreen });
const SuperAdminAuditLogs = dynamic(() => import("@/modules/platform/components/SuperAdminAuditLogs").then((m) => m.SuperAdminAuditLogs), { loading: LoadingScreen });
const SuperAdminAnalytics = dynamic(() => import("@/modules/platform/components/SuperAdminAnalytics").then((m) => m.SuperAdminAnalytics), { loading: LoadingScreen });
const SuperAdminRoadmap = dynamic(() => import("@/modules/platform/components/SuperAdminRoadmap").then((m) => m.RoadmapPanel), { loading: LoadingScreen });
const SuperAdminIntegrations = dynamic(() => import("@/modules/platform/components/SuperAdminIntegrations").then((m) => m.SuperAdminIntegrations), { loading: LoadingScreen });
const SuperAdminSettings = dynamic(() => import("@/modules/platform/components/SuperAdminSettings").then((m) => m.SuperAdminSettings), { loading: LoadingScreen });
const SuperAdminRoles = dynamic(() => import("@/modules/access-control/components/SuperAdminRoles").then((m) => m.SuperAdminRoles), { loading: LoadingScreen });
const SuperAdminManage = dynamic(() => import("@/modules/people/components/SuperAdminManageAdmins").then((m) => m.SuperAdminManage), { loading: LoadingScreen });
const SuperAdminStaff = dynamic(() => import("@/modules/people/components/SuperAdminStaff").then((m) => m.SuperAdminStaff), { loading: LoadingScreen });
const SuperAdminSubscriptions = dynamic(() => import("@/modules/tenancy/components/SuperAdminSubscriptions").then((m) => m.SuperAdminSubscriptions), { loading: LoadingScreen });
const SuperAdminSchoolSubscriptions = dynamic(() => import("@/modules/tenancy/components/SuperAdminSchoolSubscriptions").then((m) => m.SuperAdminSchoolSubscriptions), { loading: LoadingScreen });
const SuperAdminPlatformNotices = dynamic(() => import("@/modules/communication/components/SuperAdminPlatformNotices").then((m) => m.SuperAdminPlatformNotices), { loading: LoadingScreen });
const SuperAdminReports = dynamic(() => import("@/modules/data-io/components/SuperAdminReports").then((m) => m.SuperAdminReports), { loading: LoadingScreen });
const SuperAdminBulkAttendance = dynamic(() => import("@/modules/attendance/components/SuperAdminBulkAttendanceImport").then((m) => m.SuperAdminBulkAttendance), { loading: LoadingScreen });
const SuperAdminQueueStatus = dynamic(() => import("@/modules/platform/components/SuperAdminQueueStatus").then((m) => m.SuperAdminQueueStatus), { loading: LoadingScreen });

const TeacherDashboard = dynamic(() => import("@/modules/dashboard/components/teacherDashboard/index").then((m) => m.TeacherDashboard), { loading: LoadingScreen });
const StudentDashboard = dynamic(() => import("@/modules/dashboard/components/StudentDashboard").then((m) => m.StudentDashboard), { loading: LoadingScreen });
const ParentDashboard = dynamic(() => import("@/modules/dashboard/components/ParentDashboard").then((m) => m.ParentDashboard), { loading: LoadingScreen });
const StaffDashboard = dynamic(() => import("@/modules/dashboard/components/staffDashboard/index").then((m) => m.StaffDashboard), { loading: LoadingScreen });
const NotFoundScreen = dynamic(() => import("@/components/shared/error/not-found").then((m) => m.NotFoundScreen));

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function GenericSlugDispatcherClient() {
  const { slug } = useParams();
  const mounted = useHydrated();
  const { currentUser, currentTenantSlug, currentTenantId, setCurrentTenant } = useAppStore();
  const { status: yearStatus, yearSlug, years } = useActiveAcademicYear();
  const activeYearSlug =
    yearSlug ?? yearSlugOf(years.find((y: any) => y.isCurrent)?.name ?? years[0]?.name ?? '');

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

    // 1. Wrong Slug? Auto-correct. The year is not known for the right school
    // yet, so the bare root is emitted and resolved on the next pass.
    if (correctSlug && slug !== correctSlug) {
      redirect(`/${correctSlug}`);
    }

    // 2. Base Slug? Go to the dashboard, under a year where the school has one.
    if (isTenantContext) {
      const gate = decideYearGate({
        role: currentUser.role,
        status: yearStatus,
        yearSlug: null,
        screen: 'dashboard',
        maySetUp:
          currentUser.role === 'admin' ||
          hasPermission(currentUser, 'academic-years', 'view'),
        activeYearSlug,
      });
      if (gate.kind === 'skeleton') return <DashboardLoadingScreen />;
      if (gate.kind === 'canonicalise') {
        redirect(
          canonicalTenantUrl({ slug, segments: ['dashboard'], yearSlug: gate.toYearSlug, search: '' }),
        );
      }
      // A school with no session belongs on its setup screen; a non-admin lands
      // there too and the tenant dispatcher answers them with the notice, so
      // this file never has to render one. The setup screen is the one tenant
      // screen that carries no year, so its literal stays bare.
      if (gate.kind === 'to-setup' || gate.kind === 'notice') {
        redirect(`/${slug}/academic-years`);
      }
      redirect(
        canonicalTenantUrl({ slug, segments: ['dashboard'], yearSlug: activeYearSlug, search: '' }),
      );
    }
  }

  if (!mounted || !currentUser || typeof slug !== 'string') return <DashboardLoadingScreen />;

  // 1. Platform Screens (Super Admin only)
  if (currentUser.role === "super_admin") {
    switch (slug) {
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
    // The tenant root again, for the same reason as arm 1: this file cannot
    // know the year of a school it has not resolved.
    redirect(fallback ? `/${fallback}` : "/dashboard");
  }

  return <NotFoundScreen />;
}
