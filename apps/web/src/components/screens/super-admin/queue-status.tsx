"use client";

import { QueueStatus } from "./dashboard_components/QueueStatus";
import { Cpu } from "lucide-react";

export function SuperAdminQueueStatus() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Queue & Worker Status</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Admin console for monitoring processing pipelines and active background jobs</p>
        </div>
      </div>

      <div className="mt-4">
        <QueueStatus />
      </div>
    </div>
  );
}
