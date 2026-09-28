import { Skeleton } from "@/components/ui/skeleton";

export function ExamsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[96px] rounded-xl" />
      <Skeleton className="h-[48px] rounded-xl" />
      <Skeleton className="h-[384px] rounded-xl" />
    </div>
  );
}
