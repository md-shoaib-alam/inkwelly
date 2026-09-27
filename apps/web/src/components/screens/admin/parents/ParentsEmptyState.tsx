"use client";

import { Users } from "lucide-react";

export function ParentsEmptyState() {
  return (
    <div className="text-center py-20 bg-zinc-50/30 dark:bg-zinc-800/10 rounded-2xl border-dashed border-2">
      <Users className="size-12 mx-auto mb-4 opacity-20" />
      <p className="text-lg font-medium">No parents found</p>
      <p className="text-sm text-muted-foreground">Add a parent or adjust your search</p>
    </div>
  );
}
