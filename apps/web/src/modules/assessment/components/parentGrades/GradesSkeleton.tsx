"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function GradesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Skeleton className="h-80 w-full lg:col-span-2 rounded-xl" />
        <Skeleton className="h-80 w-full lg:col-span-3 rounded-xl" />
      </div>
    </div>
  );
}
