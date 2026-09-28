"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  AlertOctagon,
  Inbox
} from "lucide-react";

interface QueueStatusItem {
  name: string;
  active: number;
  waiting: number;
  delayed: number;
  failed: number;
  completed: number;
  success: boolean;
  error?: string;
}

export function QueueStatus() {
  const [queues, setQueues] = useState<QueueStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/super-admins/queue-status");
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[QueueStatus Debug] API failed: Status=${res.status}, Body=${text}`);
        throw new Error(`Failed to fetch queue status (HTTP ${res.status}): ${text || "Unknown error"}`);
      }
      const data = await res.json();
      setQueues(data.queues || []);
    } catch (err: any) {
      console.error("Error fetching queue status:", err);
      setError(err.message || "Could not load queue status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const totalActive = queues.reduce((acc, q) => acc + (q.active || 0), 0);
  const totalWaiting = queues.reduce((acc, q) => acc + (q.waiting || 0), 0);
  const totalFailed = queues.reduce((acc, q) => acc + (q.failed || 0), 0);
  const hasFailures = queues.some((q) => q.failed > 0);

  return (
    <div className="space-y-4">
      {/* Quick Summary Cards (Compact & Professional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Active Executions</span>
              <div className="text-xl font-bold text-foreground flex items-center gap-1.5">
                {totalActive > 0 && <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />}
                {totalActive}
              </div>
            </div>
            <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
              <Play className="size-4 fill-current" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Jobs In Queue</span>
              <div className="text-xl font-bold text-foreground">
                {totalWaiting}
              </div>
            </div>
            <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
              <Inbox className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Queue Health</span>
              <div className="text-xs font-semibold mt-1 flex items-center gap-1.5">
                {hasFailures ? (
                  <>
                    <AlertOctagon className="size-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">{totalFailed} Failed Jobs</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">All Operations Healthy</span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchStatus(true)}
              disabled={loading || refreshing}
              title="Refresh status"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card (Compact & Enterprise Style) */}
      <Card className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <span className="font-semibold text-foreground text-xs">Individual Queue Metrics</span>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50/10 dark:bg-red-950/5">
              <AlertCircle className="size-8 text-red-500 mx-auto mb-2" />
              <h4 className="font-semibold text-red-600 dark:text-red-400 text-xs">Synchronization Failed</h4>
              <p className="text-xs text-red-500/80 mt-0.5 max-w-sm mx-auto">{error}</p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => fetchStatus()}
                className="mt-3"
              >
                Reconnect Server
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 text-muted-foreground text-xs font-medium">
                    <TableHead className="py-2.5 px-4">Queue Pipeline</TableHead>
                    <TableHead className="py-2.5 px-3 text-center">Active</TableHead>
                    <TableHead className="py-2.5 px-3 text-center">Waiting</TableHead>
                    <TableHead className="py-2.5 px-3 text-center">Delayed</TableHead>
                    <TableHead className="py-2.5 px-3 text-center">Failed</TableHead>
                    <TableHead className="py-2.5 px-4 text-right">Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {queues.map((q) => {
                    const isPipeActive = q.active > 0;
                    return (
                      <TableRow key={q.name} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className={`size-1.5 rounded-full ${isPipeActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                            <div>
                              <span className="font-medium text-foreground">{q.name}</span>
                              <span className="text-xs text-muted-foreground block">{isPipeActive ? 'Processing' : 'Idle'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          {q.active > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                              {q.active}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          {q.waiting > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20">
                              {q.waiting}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          {q.delayed > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20">
                              {q.delayed}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          {q.failed > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20">
                              {q.failed}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right font-medium text-muted-foreground">
                          {q.completed.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
