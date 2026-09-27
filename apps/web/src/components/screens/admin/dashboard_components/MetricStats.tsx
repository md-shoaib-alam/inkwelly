"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, School, IndianRupee, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricStatsProps {
  isLoading: boolean;
  data?: {
    totalParents: number;
    totalClasses: number;
    totalRevenue: number;
    totalStaff: number;
  };
}

function StatCardSkeleton() {
  return (
    <Skeleton className="h-27.5 rounded-xl" />
  );
}

export function MetricStats({ isLoading, data }: MetricStatsProps) {
  if (isLoading && !data) {
    return (
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 pb-2 lg:pb-0 scrollbar-none">
        <div className="min-w-50 shrink-0 lg:min-w-0"><StatCardSkeleton /></div>
        <div className="min-w-50 shrink-0 lg:min-w-0"><StatCardSkeleton /></div>
        <div className="min-w-50 shrink-0 lg:min-w-0"><StatCardSkeleton /></div>
        <div className="min-w-50 shrink-0 lg:min-w-0"><StatCardSkeleton /></div>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 pb-2 lg:pb-0 scrollbar-none">
      <Card className="min-w-50 shrink-0 lg:min-w-0 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fee Revenue</p>
              <p className="text-2xl font-bold">₹{(data?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="min-w-50 shrink-0 lg:min-w-0 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Parents</p>
              <p className="text-2xl font-bold">{data?.totalParents ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="min-w-50 shrink-0 lg:min-w-0 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <School className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{data?.totalClasses ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="min-w-50 shrink-0 lg:min-w-0 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{data?.totalStaff ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
