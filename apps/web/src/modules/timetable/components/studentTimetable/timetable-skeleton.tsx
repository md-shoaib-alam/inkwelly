import { Skeleton } from "@/components/ui/skeleton";

export function TimetableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header + toggle skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Main content */}
      <Skeleton className="h-[400px] rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  );
}
