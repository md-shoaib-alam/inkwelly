"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { ViewMode } from "./types";

interface TimetableSkeletonProps {
  viewMode: ViewMode;
}

export function TimetableSkeleton({ viewMode }: TimetableSkeletonProps) {
  if (viewMode === "grid") {
    return (
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 shrink-0" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>
        {[...Array(7)].map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-2">
            <Skeleton className="h-16 w-32 shrink-0" />
            {[...Array(5)].map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-16 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="p-6 space-y-6">
        {[...Array(3)].map((_, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            <Skeleton className="h-5 w-28" />
            {[...Array(4)].map((_, itemIdx) => (
              <Skeleton key={itemIdx} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Day view skeleton
  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-14 rounded-full" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-4 rounded-full mt-4" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
