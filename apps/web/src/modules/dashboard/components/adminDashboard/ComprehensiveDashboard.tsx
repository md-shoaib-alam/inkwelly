"use client";

import { SubscriptionAlert } from "../adminDashboardComponents/SubscriptionAlert";
import { WelcomeBanner } from "../adminDashboardComponents/WelcomeBanner";
import { MetricStats } from "../adminDashboardComponents/MetricStats";
import { AttendanceTrend } from "../adminDashboardComponents/AttendanceTrend";
import { ClassDistribution } from "../adminDashboardComponents/ClassDistribution";
import { FeeCollection } from "../adminDashboardComponents/FeeCollection";
import { RecentNotices } from "../adminDashboardComponents/RecentNotices";
import { FeePieDistribution } from "../adminDashboardComponents/FeePieDistribution";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";

interface ComprehensiveDashboardProps {
  isLoading: boolean;
  dashboardData: any;
  recharts: any;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number | null;
  tenantId: string | null;
  currentTenantSlug: string | null;
  currentTenantName: string | null;
  currentTenantLogo: string | null;
  currentUser: any;
}

export function ComprehensiveDashboard({
  isLoading,
  dashboardData,
  recharts,
  isExpired,
  isExpiringSoon,
  daysRemaining,
  tenantId,
  currentTenantSlug,
  currentTenantName,
  currentTenantLogo,
  currentUser,
}: ComprehensiveDashboardProps) {
  const tenantHref = useTenantHref();
  return (
    <div className="space-y-6">
      <SubscriptionAlert 
        isExpired={isExpired}
        isExpiringSoon={isExpiringSoon}
        daysRemaining={daysRemaining}
        onRenew={() => { window.location.href = tenantHref("school-subscription"); }}
      />

      <WelcomeBanner
        userName={currentUser?.name || "Admin"}
        tenantName={currentTenantName || "the school"}
        tenantLogo={currentTenantLogo || currentUser?.tenantLogo || "/test.webp"}
        isLoading={isLoading}
        summaryData={dashboardData ? {
          totalStudents: dashboardData.totalStudents,
          totalTeachers: dashboardData.totalTeachers,
          attendanceRate: dashboardData.attendanceRate,
          upcomingEvents: dashboardData.upcomingEvents,
        } : undefined}
      />

      <MetricStats 
        isLoading={isLoading}
        data={dashboardData ? {
          totalParents: dashboardData.totalParents,
          totalClasses: dashboardData.totalClasses,
          totalRevenue: dashboardData.totalRevenue,
          totalStaff: dashboardData.totalStaff,
        } : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AttendanceTrend 
          isLoading={isLoading}
          data={dashboardData?.monthlyAttendance ?? []}
          recharts={recharts}
        />

        <ClassDistribution 
          isLoading={isLoading}
          data={dashboardData?.classDistribution ?? []}
          recharts={recharts}
          maleStudents={dashboardData?.maleStudents}
          femaleStudents={dashboardData?.femaleStudents}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FeePieDistribution 
          isLoading={isLoading}
          data={dashboardData?.feeByType ?? []}
          recharts={recharts}
        />

        <FeeCollection 
          isLoading={isLoading}
          data={dashboardData?.monthlyRevenue ?? []}
          recharts={recharts}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentNotices 
          isLoading={isLoading}
          data={dashboardData?.recentNotices ?? []}
        />
      </div>
    </div>
  );
}
