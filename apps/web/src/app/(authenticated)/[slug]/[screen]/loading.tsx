"use client";

import { useParams } from "next/navigation";
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { AdminDashboardSkeleton } from "@/modules/dashboard/components/adminDashboard/DashboardSkeleton";

export default function ScreenLoading() {
  const params = useParams();
  const screen = params?.screen as string | undefined;

  if (screen === "dashboard") {
    return <AdminDashboardSkeleton />;
  }

  return <FullPageSkeleton />;
}

