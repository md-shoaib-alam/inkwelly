"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useParentDashboard } from "@/lib/graphql/hooks";
import { toast } from "sonner";

// Sub-components
import { WelcomeBanner } from "./dashboard_components/WelcomeBanner";
import { QuickStats } from "./dashboard_components/QuickStats";
import { ChildrenOverview } from "./dashboard_components/ChildrenOverview";
import { NoticeSidebar } from "./dashboard_components/NoticeSidebar";
import { DashboardSkeleton } from "./dashboard_components/DashboardSkeleton";
import { ResultPublishedBanner } from "@/components/shared/result-published-banner";
import { MinimalDashboard } from "./dashboard_components/MinimalDashboard";

export function ParentDashboard() {
  const { currentUser } = useAppStore();
  const { data, isPending, fetchStatus, isError, error } = useParentDashboard(
    currentUser?.name || "",
  );
  const [layoutPref, setLayoutPref] = useState("comprehensive");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("schoolsaas_dashboard_layout_preference");
      if (stored) setLayoutPref(stored);

      const handlePrefChange = (e: any) => {
        if (e.detail) setLayoutPref(e.detail);
      };
      window.addEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
      return () => {
        window.removeEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
      };
    }
  }, []);

  // In React Query v5, when enabled:false, isPending=true but fetchStatus='idle'
  const isActuallyLoading = isPending && fetchStatus === 'fetching';

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load dashboard", { description: error?.message });
    }
  }, [isError, error]);

  if (isActuallyLoading) return <DashboardSkeleton />;

  // Data from GraphQL hook
  const childrenData = data?.children ?? [];
  const feesData = data?.fees ?? [];
  const performanceSummary = data?.performanceSummary ?? [];
  const allNotices = data?.notices ?? [];

  // Data Mappings
  const childrenWithStats = childrenData.map(child => {
    const perf = performanceSummary.find(p => p.name === child.name);
    return {
      ...child,
      attendancePct: perf?.attendanceRate ?? 0,
      avgPct: perf?.avgGrade ?? 0,
      grade: perf?.grade ?? "N/A"
    };
  });

  const pendingFees = feesData.filter(f => f.status === "pending" || f.status === "overdue" || f.status === "partially_paid");
  const overdueFees = feesData.filter(f => f.status === "overdue");
  const parentNotices = allNotices.filter(n => n.targetRole === "parent" || n.targetRole === "all");
  
  const performanceList = childrenData.map(child => {
    const perf = performanceSummary.find(p => p.name === child.name);
    return {
      name: child.name,
      avg: perf?.avgGrade ?? 0,
      grade: perf?.grade ?? "N/A"
    };
  });

  // Resolve active child: prefer last-selected from cookie, fall back to first child
  const savedStudentId = typeof document !== "undefined"
    ? document.cookie.split("; ").find(r => r.startsWith("lastSelectedStudent="))?.split("=")[1]
    : undefined;
  const activeChildId = (savedStudentId && childrenData.some(c => c.id === savedStudentId))
    ? savedStudentId
    : childrenData[0]?.id;

  if (layoutPref === "minimal") {
    return (
      <div className="space-y-6 pb-10">
        {/* Result Published Notification - shown at top of dashboard */}
        {childrenData.length > 0 && <ResultPublishedBanner studentId={activeChildId} />}

        <WelcomeBanner userName={currentUser?.name} />

        <MinimalDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Result Published Notification - shown at top of dashboard */}
      {childrenData.length > 0 && <ResultPublishedBanner studentId={activeChildId} />}

      <WelcomeBanner userName={currentUser?.name} />

      <QuickStats 
        childrenCount={childrenData.length}
        noticeCount={parentNotices.length}
        pendingFees={pendingFees.reduce((s, f) => s + f.amount - (f.paidAmount || 0), 0)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChildrenOverview childrenList={childrenWithStats} />
        </div>

        <div className="lg:col-span-1">
          <NoticeSidebar 
            notices={parentNotices}
            overdueFees={overdueFees}
            performance={performanceList}
          />
        </div>
      </div>
    </div>
  );
}
