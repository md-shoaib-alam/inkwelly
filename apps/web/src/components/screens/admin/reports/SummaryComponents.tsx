"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="size-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// react-doctor-disable-next-line react-doctor/no-multi-comp
export function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full" />;
}

// react-doctor-disable-next-line react-doctor/no-multi-comp
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3">
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="h-10 w-full" />
      ))}
    </div>
  );
}
