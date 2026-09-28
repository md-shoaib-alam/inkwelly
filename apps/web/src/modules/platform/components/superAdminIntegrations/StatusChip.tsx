import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { STATUS_META, type ConnectionStatus } from "./types";

export function StatusChip({
  status,
  label,
  className,
}: {
  status: ConnectionStatus;
  label?: string;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <StatusBadge
      tone={meta.tone}
      className={cn(
        "text-[11px] capitalize",
        meta.ghost && "border-dashed bg-transparent",
        meta.struck && "line-through decoration-muted-foreground/50",
        className,
      )}
    >
      {label ?? meta.label}
    </StatusBadge>
  );
}
