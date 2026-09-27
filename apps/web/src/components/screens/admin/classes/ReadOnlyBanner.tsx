"use client";

import { Eye } from "lucide-react";

interface ReadOnlyBannerProps {
  isVisible: boolean;
}

export function ReadOnlyBanner({ isVisible }: ReadOnlyBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
      <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
        Read-only mode, you have view permission only for this module.
      </span>
    </div>
  );
}
