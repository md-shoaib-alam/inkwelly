"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  Database,
  Clock,
  Layers,
  HardDrive,
  Zap,
  RefreshCw,
  Box,
  Server,
  Cpu,
  Wifi,
  Cloud,
  Code,
  Shield,
  Users,
  Building2,
  CreditCard,
  Workflow,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

export function SuperAdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState("");
  const isFetchingRef = useRef(false);

  const fetchHealth = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/health");
      // Health check returns 503 when degraded/disconnected, but still sends the payload
      if (res.status === 200 || res.status === 503) {
        const json = await res.json();
        setData(json);
        setLastChecked(new Date().toLocaleTimeString());
        setError(null);
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error("Failed to fetch health data:", err);
      setError(err.message || "Failed to load system performance metrics.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0m";
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-64 rounded-md" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-card border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="size-7 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 max-w-md w-full rounded-3xl overflow-hidden shadow-lg">
          <CardContent className="p-8 text-center text-red-600">
            <div className="size-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="size-8" />
            </div>
            <p className="text-xl font-semibold mb-2">Metrics Fetch Failed</p>
            <p className="text-sm font-medium opacity-80 mb-6">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={fetchHealth}
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = data?.services || {};
  const memory = data?.memory || {};
  const pool = data?.pool || {};
  const server = data?.server || {};
  const records = services?.database?.records || {};

  const coreMetrics = [
    { label: "System Uptime", value: formatUptime(data?.uptime), icon: <Clock className="size-4" />, color: "text-emerald-600" },
    { label: "Server Latency", value: server?.totalLatency || "0ms", icon: <Activity className="size-4" />, color: "text-blue-600" },
    { label: "Memory (RSS)", value: memory?.rss || "0 MB", icon: <Cpu className="size-4" />, color: "text-violet-600" },
    { label: "Node Version", value: server?.nodeVersion || "N/A", icon: <Code className="size-4" />, color: "text-amber-600" },
  ];

  const getStatusTone = (status: string | undefined): "positive" | "negative" | "warning" | "neutral" => {
    if (!status) return "neutral";
    const s = status.toLowerCase();
    if (s === "operational" || s === "healthy" || s === "connected") return "positive";
    if (s === "degraded") return "warning";
    if (s === "down" || s === "error" || s === "disconnected") return "negative";
    return "neutral";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">System Performance & Health</h1>
          <p className="text-sm text-muted-foreground">Comprehensive real-time infrastructure and service monitoring</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          Sync Health Data
        </Button>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${data?.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="text-sm font-medium text-muted-foreground">
            Platform Status:
          </span>
          <StatusBadge tone={getStatusTone(data?.status)}>
            {data?.status || "unknown"}
          </StatusBadge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
           <span className="hidden sm:inline">Environment: <span className="font-semibold uppercase text-foreground">{server?.environment || "N/A"}</span></span>
           <span className="hidden sm:inline h-4 w-px bg-border" />
           <span>Checked: {lastChecked}</span>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreMetrics.map((metric) => (
          <Card key={metric.label} className="border shadow-sm bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${metric.color}`}>
                  {metric.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metric.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Connectivity */}
        <Card className="lg:col-span-2 border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wifi className="size-4 text-emerald-600" />
              Service Connectivity
            </CardTitle>
            <CardDescription className="text-xs">Connection status and latency for core platform services</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Database", status: services?.database?.status, latency: services?.database?.latency, icon: <Database className="size-4" /> },
              { label: "Redis Cache", status: services?.redis?.status, latency: services?.redis?.latency, icon: <Zap className="size-4" /> },
              { label: "Razorpay", status: services?.razorpay?.status, icon: <CreditCard className="size-4" /> },
              { label: "BullMQ (Queues)", status: services?.bullmq?.status, icon: <Workflow className="size-4" /> },
              { label: "Firebase (FCM)", status: services?.firebase?.status, sub: services?.firebase?.serviceAccountName, icon: <Cloud className="size-4" /> },
              { label: "Object Storage (R2)", status: services?.storage?.status, icon: <Box className="size-4" /> },
            ].map((svc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className={svc.status === "connected" ? "text-emerald-500" : "text-muted-foreground"}>
                    {svc.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{svc.label}</span>
                    {svc.sub && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{svc.sub}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <StatusBadge tone={getStatusTone(svc.status)} className="text-xs">
                    {svc.status || "offline"}
                  </StatusBadge>
                  {svc.latency && <span className="text-xs text-muted-foreground mt-1">{svc.latency}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <Card className="border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="size-4 text-teal-600" />
              Platform Records
            </CardTitle>
            <CardDescription className="text-xs">Aggregate counts across all tenants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[
              { label: "Total Schools", value: records?.schools, icon: <Building2 className="size-3.5" /> },
              { label: "Total Users", value: records?.users, icon: <Users className="size-3.5" /> },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {stat.icon}
                  {stat.label}
                </div>
                <span className="text-sm font-bold text-foreground">{(stat.value || 0).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Memory Allocation */}
        <Card className="border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HardDrive className="size-4 text-violet-600" />
              Memory Allocation
            </CardTitle>
            <CardDescription className="text-xs">Node.js process memory distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {(() => {
              const parseMB = (val: string) => {
                if (!val) return 0;
                const num = parseInt(val.replace(/[^\d]/g, ""), 10);
                return isNaN(num) ? 0 : num;
              };
              const rssVal = parseMB(memory?.rss) || 1;
              const getPercent = (val: string) => {
                const num = parseMB(val);
                return `${Math.min(100, Math.max(2, Math.round((num / rssVal) * 100)))}%`;
              };
              return [
                { label: "Heap Used", value: memory?.heapUsed, percent: getPercent(memory?.heapUsed), color: "bg-violet-500" },
                { label: "Heap Total", value: memory?.heapTotal, percent: getPercent(memory?.heapTotal), color: "bg-blue-500" },
                { label: "External", value: memory?.external, percent: getPercent(memory?.external), color: "bg-amber-500" },
              ].map((mem) => (
                <div key={mem.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{mem.label}</span>
                    <span className="text-foreground">{mem.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${mem.color} transition-all duration-500`} style={{ width: mem.percent }} />
                  </div>
                </div>
              ));
            })()}
          </CardContent>
        </Card>

        {/* Connection Pool */}
        <Card className="border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="size-4 text-amber-600" />
              Connection Pool
            </CardTitle>
            <CardDescription className="text-xs">Database pooling and saturation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Active / Max</span>
              <span className="text-sm font-bold text-foreground">{pool?.active} / {pool?.max}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Idle / Waiting</span>
              <span className="text-sm font-bold text-foreground">{pool?.idle} / {pool?.waiting}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Total Count</span>
              <span className="text-sm font-bold text-foreground">{pool?.totalCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Runtime Environment */}
        <Card className="border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Server className="size-4 text-muted-foreground" />
              Runtime Details
            </CardTitle>
            <CardDescription className="text-xs">System environment and node version</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">OS Platform</span>
              <span className="text-sm font-bold text-foreground uppercase">{server?.platform || "Unknown"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Node Engine</span>
              <span className="text-sm font-bold text-foreground">{server?.nodeVersion || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Environment</span>
              <span className="text-sm font-bold text-foreground capitalize">{server?.environment || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
