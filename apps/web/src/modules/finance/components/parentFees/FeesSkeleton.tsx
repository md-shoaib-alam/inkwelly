"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function FeesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
