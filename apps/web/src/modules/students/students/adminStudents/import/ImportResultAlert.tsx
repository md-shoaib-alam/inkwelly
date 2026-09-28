"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";

interface ImportResultAlertProps {
  result: {
    success: boolean;
    imported: number;
    skipped?: number;
    errors: number;
    total: number;
    errorDetails?: string[];
  } | null;
}

export function ImportResultAlert({ result }: ImportResultAlertProps) {
  if (!result) return null;

  const allSkipped = result.skipped && result.skipped === result.total && result.imported === 0;

  return (
    <div
      className={`rounded-lg p-4 flex items-start gap-3 w-full ${result.success ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"}`}
    >
      {result.success ? (
        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
      )}
      <div className="text-sm w-full min-w-0">
        <p className="font-medium">
          {result.success
            ? "Import completed"
            : "Import completed with issues"}
        </p>
        <p className="text-muted-foreground">
          {allSkipped
            ? "All students already exist in the selected school. No new records were imported."
            : `${result.imported} of ${result.total} students imported successfully${result.skipped && result.skipped > 0 ? ` · ${result.skipped} skipped (already exist)` : ""}${result.errors > 0 ? ` · ${result.errors} errors` : ""}`}
        </p>
        {result.errorDetails && result.errorDetails.length > 0 && (
          <div className="mt-3 p-2 bg-red-100/50 dark:bg-red-950/20 rounded border border-red-200/40 dark:border-red-900/30 text-xs font-mono max-h-40 overflow-y-auto space-y-1 text-red-900 dark:text-red-300">
            {result.errorDetails.slice(0, 100).map((err, idx) => (
              <div key={idx} className="break-words whitespace-pre-wrap">
                • {err}
              </div>
            ))}
            {result.errorDetails.length > 100 && (
              <div className="text-muted-foreground italic mt-1">
                ...and {result.errorDetails.length - 100} more errors.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
