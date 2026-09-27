"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface TicketStatsProps {
  stats: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
}

export function TicketStats({ stats }: TicketStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Open
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.open}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <AlertCircle className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.in_progress}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Resolved
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.resolved}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Closed
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.closed}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <XCircle className="size-5 text-zinc-500 dark:text-zinc-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
