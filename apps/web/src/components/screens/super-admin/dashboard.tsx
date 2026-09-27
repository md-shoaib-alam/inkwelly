"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Sub-components
import { DashboardHero } from "./dashboard_components/DashboardHero";
import { StatusCards } from "./dashboard_components/StatusCards";
import { GrowthCharts } from "./dashboard_components/GrowthCharts";
import { TopPerformance } from "./dashboard_components/TopPerformance";


export function SuperAdminDashboard() {
  const { data, isLoading: loading, error, isError } = useQuery({
    queryKey: ["platform", "dashboard"],
    queryFn: async () => {
      const res = await apiFetch("/api/platform");
      if (!res.ok) throw new Error("Failed to fetch platform dashboard");
      return res.json();
    },
  });

  const handleNavigate = (screen: string) => {
    window.dispatchEvent(
      new CustomEvent("super-admin-navigate", {
        detail: screen,
      }),
    );
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 max-w-md w-full rounded-3xl overflow-hidden shadow-lg">
          <CardContent className="p-8 text-center text-red-600">
            <div className="size-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="size-8" />
            </div>
            <p className="text-xl font-semibold mb-2">System Sync Failed</p>
            <p className="text-sm font-medium opacity-80 mb-6">
              {error?.message || "We encountered a network error while syncing platform data."}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <DashboardHero loading={loading} data={data} onNavigate={handleNavigate} />

      <StatusCards
        loading={loading}
        data={data}
        onNavigate={handleNavigate}
      />

      {/* Bottom Grid: Recent Schools (7 cols) & Platform Insights (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7">
          <TopPerformance loading={loading} data={data} onNavigate={handleNavigate} />
        </div>
        <div className="lg:col-span-5">
          <GrowthCharts loading={loading} data={data} />
        </div>
      </div>
    </div>
  );
}
