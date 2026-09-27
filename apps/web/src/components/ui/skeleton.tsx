"use client";

import { cn } from "@/lib/utils";

/**
 * Skeleton - renders a shimmering placeholder block.
 * Uses CSS `animate-pulse` directly; no boneyard bones needed.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
