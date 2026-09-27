import { Skeleton } from "@/components/ui/skeleton";

export function TicketSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-[110px] rounded-xl" />
      ))}
    </div>
  );
}
