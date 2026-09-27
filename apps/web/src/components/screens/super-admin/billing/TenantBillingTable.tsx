import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ArrowUpDown, IndianRupee, ChevronLeft, ChevronRight, ExternalLink, Users } from "lucide-react";
import { TenantBilling, SortKey, SortDir, planBadgeConfig } from "./types";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { StatusBadge } from "@/components/ui/status-badge";

interface TenantBillingTableProps {
  loading: boolean;
  tenants: TenantBilling[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  viewMode?: 'school' | 'parent';
}

const SCHOOL_PRICES: Record<string, number> = {
  basic: 499,
  standard: 1499,
  premium: 3999,
};

export function TenantBillingTable({
  loading,
  tenants,
  sortKey,
  sortDir,
  onSort,
  viewMode = 'parent'
}: TenantBillingTableProps) {
  const isSchoolMode = viewMode === 'school';
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [tenants]);

  const totalItems = tenants.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tenants.slice(start, start + itemsPerPage);
  }, [tenants, currentPage, itemsPerPage]);

  const getAriaSort = (key: SortKey) => {
    if (sortKey !== key) return "none" as const;
    return sortDir === "asc" ? ("ascending" as const) : ("descending" as const);
  };

  return (
    <div className="border border-border rounded-2xl bg-card shadow-2xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" /> {isSchoolMode ? "School Revenue" : "Revenue by Tenant"}
          </h3>
          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
            {isSchoolMode
              ? "Platform income generated from school license plans"
              : "Detailed breakdown of parent subscription contribution from each school"}
          </p>
        </div>
      </div>
      <div className="p-3 sm:p-5">
        {/* Mobile View: Card Grid (matching theme) */}
        <div className="sm:hidden space-y-3">
          {loading
            ? [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border-2 border-neutral-900 dark:border-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-2xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                  </div>
                </div>
              ))
            : paginatedTenants.map((tenant) => {
                const planCfg = planBadgeConfig[tenant.plan] || planBadgeConfig.Basic;
                const schoolPrice = SCHOOL_PRICES[tenant.plan?.toLowerCase()] || 0;

                return (
                  <div
                    key={tenant.id}
                    className="bg-white dark:bg-zinc-950 text-foreground rounded-2xl p-4 border-2 border-neutral-900 dark:border-white shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Emblem, Title, /slug */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-11 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            <span className="text-neutral-900 dark:text-white font-bold text-sm">
                              {tenant.name?.slice(0, 2).toUpperCase() || "SC"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-foreground leading-snug truncate" title={tenant.name}>
                              {tenant.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-muted-foreground font-normal truncate">
                                /{tenant.slug || "school"}
                              </span>
                              {tenant.slug && (
                                <a
                                  href={`https://schoolconnect.in/${tenant.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`https://schoolconnect.in/${tenant.slug}`}
                                  className="text-muted-foreground/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <StatusBadge
                          tone={
                            tenant.status === "active"
                              ? "positive"
                              : tenant.status === "trial"
                              ? "warning"
                              : ["suspended", "expired", "inactive"].includes(tenant.status)
                              ? "negative"
                              : "neutral"
                          }
                        >
                          {tenant.status}
                        </StatusBadge>
                      </div>

                      {/* Plan Badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant="outline"
                          className={`${planCfg.bg} ${planCfg.text} ${planCfg.border} text-xs font-medium`}
                        >
                          {tenant.plan} Plan
                        </Badge>
                      </div>

                      {/* Info Stat Boxes */}
                      <div className="grid grid-cols-2 gap-2 mt-3.5">
                        {isSchoolMode ? (
                          <>
                            {/* Plan Price */}
                            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
                              <span className="text-[10px] text-muted-foreground font-medium">Plan Price</span>
                              <div className="flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                <IndianRupee className="size-3 mr-0.5" />
                                {schoolPrice.toLocaleString()}
                                <span className="text-[10px] text-muted-foreground ml-0.5 font-normal">/mo</span>
                              </div>
                            </div>
                            {/* Total Users */}
                            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
                              <span className="text-[10px] text-muted-foreground font-medium">Total Users</span>
                              <div className="flex items-center gap-1 text-sm font-bold text-foreground mt-0.5">
                                <Users className="size-3.5 text-muted-foreground" />
                                {tenant._count?.users ?? 0}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Active Revenue */}
                            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
                              <span className="text-[10px] text-muted-foreground font-medium">Active Rev</span>
                              <div className="flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                <IndianRupee className="size-3 mr-0.5" />
                                {tenant.activeRevenue.toLocaleString()}
                              </div>
                            </div>
                            {/* Active Subs / Total Users */}
                            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
                              <span className="text-[10px] text-muted-foreground font-medium">Active Subs</span>
                              <div className="flex items-center gap-1 text-sm font-bold text-foreground mt-0.5">
                                <Users className="size-3.5 text-muted-foreground" />
                                {tenant.activeSubscriptions}
                                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                                  ({tenant._count?.users ?? 0} users)
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead aria-sort={getAriaSort("name")}>
                  <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={() => onSort("name")}>
                    School {sortKey === "name" && <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className={isSchoolMode ? "w-[15%]" : "w-[12%]"}>
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                </TableHead>
                <TableHead
                  className={`${isSchoolMode ? "w-[15%] text-center" : "w-[12%] text-center"}`}
                  aria-sort={getAriaSort("plan")}
                >
                  <button type="button" className="inline-flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full" onClick={() => onSort("plan")}>
                    Active Plan {sortKey === "plan" && <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>

                {isSchoolMode ? (
                  <TableHead
                    className="w-[15%] text-right"
                    aria-sort={getAriaSort("plan")}
                  >
                    <button type="button" className="inline-flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full" onClick={() => onSort("plan")}>
                      Plan Price {sortKey === "plan" && <ArrowUpDown className="size-3" />}
                    </button>
                  </TableHead>
                ) : (
                  <>
                    <TableHead
                      className="w-[12%] text-right"
                      aria-sort={getAriaSort("activeRevenue")}
                    >
                      <button type="button" className="inline-flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full" onClick={() => onSort("activeRevenue")}>
                        Active Rev {sortKey === "activeRevenue" && <ArrowUpDown className="size-3" />}
                      </button>
                    </TableHead>
                    <TableHead
                      className="w-[12%] text-right"
                      aria-sort={getAriaSort("totalRevenue")}
                    >
                      <button type="button" className="inline-flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full" onClick={() => onSort("totalRevenue")}>
                        Total Rev {sortKey === "totalRevenue" && <ArrowUpDown className="size-3" />}
                      </button>
                    </TableHead>
                  </>
                )}

                {!isSchoolMode && (
                  <TableHead
                    className="w-[12%] text-center"
                    aria-sort={getAriaSort("activeSubscriptions")}
                  >
                    <button type="button" className="inline-flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full" onClick={() => onSort("activeSubscriptions")}>
                      Active Subs {sortKey === "activeSubscriptions" && <ArrowUpDown className="size-3" />}
                    </button>
                  </TableHead>
                )}
                <TableHead className={isSchoolMode ? "w-[15%] text-center" : "w-[12%] text-center"}>
                  <span className="text-xs font-medium text-muted-foreground">Total Users</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? [...Array(8)].map((_, i) => (
                    <TableRow key={i} className="border-b last:border-none">
                      {/* School Name + Slug */}
                      <TableCell className="py-3.5">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 rounded-md" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                      </TableCell>
                      {/* Status */}
                      <TableCell className="py-3.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      {/* Plan */}
                      <TableCell className="py-3.5 text-center">
                        <Skeleton className="h-5 w-18 mx-auto rounded-full" />
                      </TableCell>
                      {/* Price or Rev columns */}
                      {isSchoolMode ? (
                        <TableCell className="py-3.5 text-right">
                          <Skeleton className="h-4 w-16 ml-auto rounded-md" />
                        </TableCell>
                      ) : (
                        <>
                          <TableCell className="py-3.5 text-right">
                            <Skeleton className="h-4 w-16 ml-auto rounded-md" />
                          </TableCell>
                          <TableCell className="py-3.5 text-right">
                            <Skeleton className="h-4 w-16 ml-auto rounded-md" />
                          </TableCell>
                          <TableCell className="py-3.5 text-center">
                            <Skeleton className="h-4 w-12 mx-auto rounded-md" />
                          </TableCell>
                        </>
                      )}
                      {/* Total Users */}
                      <TableCell className="py-3.5 text-center">
                        <Skeleton className="h-4 w-10 mx-auto rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                : paginatedTenants.map((tenant) => {
                    const planCfg = planBadgeConfig[tenant.plan] || planBadgeConfig.Basic;
                    const schoolPrice = SCHOOL_PRICES[tenant.plan?.toLowerCase()] || 0;

                    return (
                      <TableRow key={tenant.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-sm">{tenant.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">/{tenant.slug}</div>
                        </TableCell>
                        <TableCell>
                           <StatusBadge tone={tenant.status === 'active' ? 'positive' : tenant.status === 'trial' ? 'warning' : ['suspended', 'expired', 'inactive'].includes(tenant.status) ? 'negative' : 'neutral'}>
                             {tenant.status}
                           </StatusBadge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`${planCfg.bg} ${planCfg.text} ${planCfg.border} text-xs font-medium`}
                          >
                            {tenant.plan}
                          </Badge>
                        </TableCell>

                        {isSchoolMode ? (
                          <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            <div className="flex items-center justify-end">
                              <IndianRupee className="size-3 mr-0.5" />
                              {schoolPrice.toLocaleString()}
                              <span className="text-xs text-muted-foreground ml-1 font-normal">/mo</span>
                            </div>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              <div className="flex items-center justify-end">
                                <IndianRupee className="size-3 mr-0.5" />
                                {tenant.activeRevenue.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-muted-foreground">
                              <div className="flex items-center justify-end">
                                <IndianRupee className="size-3 mr-0.5" />
                                {tenant.totalRevenue.toLocaleString()}
                              </div>
                            </TableCell>
                          </>
                        )}

                        {!isSchoolMode && (
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] px-1 font-medium">
                              {tenant.activeSubscriptions}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <div className="text-xs font-medium text-muted-foreground">
                            {tenant._count?.users ?? 0}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="mt-4 pt-4 border-t">
            <DataTablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              summary={`Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} entries`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
