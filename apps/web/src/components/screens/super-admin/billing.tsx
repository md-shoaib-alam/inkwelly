"use client";

import { useState, useMemo } from "react";
import { useBillingData } from "@/lib/graphql/hooks";

// Sub-components
import { BillingHeader } from "./billing/BillingHeader";
import { MetricCards } from "./billing/MetricCards";
import { RevenueTrends } from "./billing/RevenueTrends";
import { DistributionCharts } from "./billing/DistributionCharts";
import { TenantBillingTable } from "./billing/TenantBillingTable";
import { TransactionTable } from "./billing/TransactionTable";

// Types & Config
import { 
  SortKey, 
  SortDir, 
  DONUT_COLORS, 
  STATUS_COLORS, 
  statusConfig, 
  paymentMethodConfig 
} from "./billing/types";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const SCHOOL_PRICES: Record<string, number> = {
  basic: 499,
  standard: 1499,
  premium: 3999,
};

export function SuperAdminBilling() {
  const [activeTab, setActiveTab] = useState<string>("school");
  const { data, isLoading: loading, refetch: fetchBilling } = useBillingData(activeTab as any);

  const [sortKey, setSortKey] = useState<SortKey>("totalRevenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── SCHOOL REVENUE COMPUTATIONS ──
  const schoolMetrics = useMemo(() => {
    if (!data?.tenantBilling) return { totalRev: 0, active: 0, mrr: 0 };
    let totalRev = 0;
    let active = 0;
    data.tenantBilling.forEach((t: any) => {
      if (t.status === 'active') active++;
      const price = SCHOOL_PRICES[t.plan?.toLowerCase()] || 0;
      totalRev += price;
    });
    return { totalRev, active, mrr: totalRev };
  }, [data?.tenantBilling]);

  // ── PARENT COMPUTED CALCULATIONS ──
  const totalStatusCount = data?.statusDistribution
    ? Object.values(data.statusDistribution).reduce((s: number, v: any) => s + v, 0)
    : 0;
  const totalSubscriptions = totalStatusCount;
  const activeCount = data?.statusDistribution?.active ?? 0;
  const expiredCount = data?.statusDistribution?.expired ?? 0;
  const cancelledCount = data?.statusDistribution?.cancelled ?? 0;
  const churnedSubscriptions = expiredCount + cancelledCount;

  const totalRevenue = useMemo(() => {
    const revenueData = data?.methodRevenue;
    if (!revenueData || typeof revenueData !== 'object') return 0;
    return Object.values(revenueData).reduce((s, m: any) => s + (m?.revenue || 0), 0);
  }, [data]);

  const mrr = data?.totalActiveRevenue ?? 0;

  const avgRevenuePerTenant = useMemo(() => {
    if (!data?.tenantBilling?.length) return 0;
    return Math.round(totalRevenue / data.tenantBilling.length);
  }, [data, totalRevenue]);

  const churnRate = useMemo(() => {
    if (totalStatusCount === 0) return 0;
    return Math.round((churnedSubscriptions / totalStatusCount) * 100);
  }, [churnedSubscriptions, totalStatusCount]);

  // ── Chart Data Preparation ──
  const planChartData = useMemo(() => {
    const plans = data?.planRevenue;
    if (!plans || typeof plans !== 'object') return [];
    return Object.entries(plans)
      .filter(([_, v]: [string, any]) => v?.count > 0)
      .map(([plan, v]: [string, any]) => ({ plan, revenue: v.revenue, count: v.count }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const methodChartData = useMemo(() => {
    const methods = data?.methodRevenue;
    if (!methods || typeof methods !== 'object') return [];
    return Object.entries(methods)
      .filter(([_, v]: [string, any]) => v?.count > 0)
      .map(([method, v]: [string, any]) => ({
        method: paymentMethodConfig[method]?.label || method,
        count: v.count,
        revenue: v.revenue,
        fill: DONUT_COLORS[method] || "var(--muted-foreground)",
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const statusChartData = useMemo(() => {
    const statusDist = data?.statusDistribution;
    if (!statusDist || typeof statusDist !== 'object') return [];
    return Object.entries(statusDist)
      .filter(([_, v]: [string, any]) => v > 0)
      .map(([status, count]: [string, any]) => ({
        status: statusConfig[status]?.label || status,
        count,
        fill: STATUS_COLORS[status] || "var(--muted-foreground)",
      }));
  }, [data]);

  // ── Table Data Preparation ──
  const sortedTenants = useMemo(() => {
    const list = data?.tenantBilling;
    if (!Array.isArray(list)) return [];
    
    const tenants = [...list];
    tenants.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "activeRevenue": return dir * ((a.activeRevenue || 0) - (b.activeRevenue || 0));
        case "totalRevenue": return dir * ((a.totalRevenue || 0) - (b.totalRevenue || 0));
        case "name": return dir * (a.name || "").localeCompare(b.name || "");
        case "activeSubscriptions": return dir * ((a.activeSubscriptions || 0) - (b.activeSubscriptions || 0));
        case "plan": {
          const getRank = (p: string) => {
            const pl = p?.toLowerCase() || "";
            if (pl === "premium") return 3;
            if (pl === "standard") return 2;
            return 1; // basic or other
          };
          return dir * (getRank(a.plan) - getRank(b.plan));
        }
        default: return 0;
      }
    });
    return tenants;
  }, [data, sortKey, sortDir]);

  const recentTransactions = useMemo(() => {
    const list = data?.subscriptions;
    if (!Array.isArray(list)) return [];
    return list.slice(0, 20);
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <BillingHeader 
        onRefresh={fetchBilling}
        loading={loading}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-2 h-10 p-1 rounded-xl bg-muted/70 border border-border">
            <TabsTrigger value="school" className="rounded-lg text-xs font-semibold px-4 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs">School Revenue</TabsTrigger>
            <TabsTrigger value="parent" className="rounded-lg text-xs font-semibold px-4 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs">Parent Revenue</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="school" className="space-y-5 animate-in fade-in-50 duration-300">
          <MetricCards 
            loading={loading}
            totalActiveRevenue={schoolMetrics.totalRev}
            activeCount={schoolMetrics.active}
            totalSubscriptions={schoolMetrics.active}
            churnedSubscriptions={0}
            expiredCount={0}
            cancelledCount={0}
            avgRevenuePerTenant={Math.round(schoolMetrics.totalRev / Math.max(data?.tenantBilling?.length || 1, 1))}
            tenantCount={data?.tenantBilling?.length ?? 0}
            churnRate={0}
          />
          
          <TenantBillingTable 
            loading={loading}
            tenants={sortedTenants}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            viewMode="school"
          />
        </TabsContent>

        <TabsContent value="parent" className="space-y-6 animate-in fade-in-50 duration-300">
          <MetricCards 
            loading={loading}
            totalActiveRevenue={data?.totalActiveRevenue ?? 0}
            activeCount={activeCount}
            totalSubscriptions={totalSubscriptions}
            churnedSubscriptions={churnedSubscriptions}
            expiredCount={expiredCount}
            cancelledCount={cancelledCount}
            avgRevenuePerTenant={avgRevenuePerTenant}
            tenantCount={data?.tenantBilling?.length ?? 0}
            churnRate={churnRate}
          />

          <DistributionCharts 
            loading={loading}
            planChartData={planChartData}
            methodChartData={methodChartData}
            statusChartData={statusChartData}
          />

          <TransactionTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
