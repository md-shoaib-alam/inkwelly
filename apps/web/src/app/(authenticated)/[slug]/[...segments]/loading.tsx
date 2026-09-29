"use client";

import { useParams } from "next/navigation";
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { AdminDashboardSkeleton } from "@/modules/dashboard/components/adminDashboard/DashboardSkeleton";

export default function ScreenLoading() {
  const params = useParams();
  const segments = (params?.segments ?? []) as string[];

  // The last segment is the screen for every shape except a year-only URL,
  // which gets the generic skeleton for a moment; reading the year here would
  // mean duplicating parseRoute's membership rule in a server component.
  if (segments[segments.length - 1] === "dashboard") {
    return <AdminDashboardSkeleton />;
  }

  return <FullPageSkeleton />;
}
