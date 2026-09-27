import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "neutral";

const toneClasses: Record<StatusTone, string> = {
  positive:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400",
  negative:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-400",
  neutral: "border-border bg-muted text-muted-foreground",
};

const dotClasses: Record<StatusTone, string> = {
  positive: "bg-emerald-500",
  negative: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground",
};

interface StatusBadgeProps extends React.ComponentProps<"span"> {
  tone?: StatusTone;
  dot?: boolean;
}

export function StatusBadge({
  tone = "neutral",
  dot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium capitalize", toneClasses[tone], className)}
      {...props}
    >
      {dot && (
        <span aria-hidden className={cn("size-1.5 rounded-full", dotClasses[tone])} />
      )}
      {children}
    </Badge>
  );
}
