"use client";

import { UserCheck } from "lucide-react";

export function AttendanceEmptyState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full">
        <UserCheck className="size-12 text-zinc-300" />
      </div>
      <div className="max-w-xs">
        <h4 className="text-lg font-medium text-zinc-900 dark:text-white">
          Ready to track?
        </h4>
        <p className="text-sm text-zinc-500 italic">
          Please select a class from the dropdown above to view student
          attendance data.
        </p>
      </div>
    </div>
  );
}
