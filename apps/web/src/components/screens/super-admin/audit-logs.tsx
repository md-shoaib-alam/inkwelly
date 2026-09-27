"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuditLogs, useTenants } from "@/lib/graphql/hooks";

// Sub-components
import { LogStats } from "./audit-logs/LogStats";
import { LogTable } from "./audit-logs/LogTable";

export function SuperAdminAuditLogs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageParam = searchParams.get("page");
  const rawPage = pageParam ? Number(pageParam) : 1;
  const initialPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [page, setPage] = useState(initialPage);
  const limit = 10;

  const updateUrlParams = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set("page", String(newPage)); else params.delete("page");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  // Fetch simple list of tenants for selection
  const { data: tenantsData } = useTenants({ limit: 100 });

  // Fetch via GraphQL
  const {
    data,
    isLoading: loading,
  } = useAuditLogs({
    action: actionFilter !== "all" ? actionFilter : undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    tenantId: tenantFilter !== "all" ? tenantFilter : undefined,
    page,
    limit,
  });

  const filteredLogs = useMemo(() => {
    const list = data?.logs;
    if (!Array.isArray(list)) return [];
    
    return list.filter((log) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.tenant?.name?.toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const totalLogs = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleActionFilterChange = (val: string) => {
    setActionFilter(val);
    setPage(1);
    updateUrlParams(1);
  };

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val);
    setPage(1);
    updateUrlParams(1);
  };

  const handleTenantFilterChange = (val: string) => {
    setTenantFilter(val);
    setPage(1);
    updateUrlParams(1);
  };

  return (
    <div className="space-y-8 pb-12">

      <LogTable 
        loading={loading}
        logs={filteredLogs}
        totalLogs={totalLogs}
        page={page}
        totalPages={totalPages}
        limit={limit}
        onPageChange={(p) => {
          setPage(p);
          updateUrlParams(p);
        }}
        search={search}
        onSearchChange={setSearch}
        actionFilter={actionFilter}
        onActionFilterChange={handleActionFilterChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        tenantFilter={tenantFilter}
        onTenantFilterChange={handleTenantFilterChange}
        tenants={tenantsData?.tenants || []}
        actionTypes={data?.actionTypes || []}
      />
    </div>
  );
}
