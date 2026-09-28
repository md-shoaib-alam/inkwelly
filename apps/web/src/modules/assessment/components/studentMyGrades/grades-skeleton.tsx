import { Skeleton } from "@/components/ui/skeleton";

export function GradesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Skeleton className="col-span-2 sm:col-span-1 h-32 sm:h-36 rounded-xl" />
        <Skeleton className="h-32 sm:h-36 rounded-xl" />
        <Skeleton className="h-32 sm:h-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
