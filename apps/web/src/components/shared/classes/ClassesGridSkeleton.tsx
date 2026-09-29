"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The grid view's loading shape, one bar per element the real card renders:
 * title, two chips, two label/value stat rows, the capacity meter and the
 * full-width button. Kept next to the table skeleton so the two agree on row
 * height and the screen does not jump when the first page arrives.
 */
export function ClassesGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: cards }, (_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 space-y-2">
              <Skeleton className="h-5 w-28" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <div className="mt-6 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-12" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-2.5 w-10" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
