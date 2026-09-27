"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plug, AlertTriangle, Link2, School2, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SchoolRow } from "./integrations/types";
import { useIntegrationsOverview, useIntegrationProviders } from "./integrations/hooks";
import { SchoolIntegrationTable } from "./integrations/SchoolIntegrationTable";
import { ProviderCatalog } from "./integrations/ProviderCatalog";
import { ConnectionSheet } from "./integrations/ConnectionSheet";

type Filter = "all" | "connected" | "attention" | "none";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All schools" },
  { value: "connected", label: "Has a connection" },
  { value: "attention", label: "Needs attention" },
  { value: "none", label: "Nothing connected" },
];

function matches(school: SchoolRow, filter: Filter) {
  const live = Object.values(school.connections);
  if (filter === "connected") return live.length > 0;
  if (filter === "none") return live.length === 0;
  if (filter === "attention")
    return live.some((c) => c.status === "error" || c.status === "pending");
  return true;
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Plug;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-semibold leading-tight">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

export function SuperAdminIntegrations() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"schools" | "catalog">("schools");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetSchool, setSheetSchool] = useState<SchoolRow | null>(null);
  const [sheetProviderId, setSheetProviderId] = useState<string | null>(null);

  const overview = useIntegrationsOverview();
  const providersQuery = useIntegrationProviders();

  const providers = providersQuery.data?.providers ?? [];
  const data = overview.data;
  const preselected = searchParams.get("school");

  const schools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.tenants ?? []).filter(
      (s) =>
        matches(s, filter) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.slug.includes(q) ||
          (s.address ?? "").toLowerCase().includes(q)),
    );
  }, [data, search, filter]);

  const visible = preselected
    ? schools.filter((s) => s.slug === preselected || s.tenantId === preselected)
    : schools;

  const openConnection = (school: SchoolRow, providerId: string) => {
    setSheetSchool(school);
    setSheetProviderId(providerId);
  };

  const openPicker = (school: SchoolRow) => {
    setSheetSchool(school);
    setSheetProviderId(null);
  };

  if (overview.isPending) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (overview.isError) {
    return (
      <div className="p-4 sm:p-6">
        <PageHeader icon={<Plug />} title="Third-Party Integrations" />
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>Could not load integrations: {(overview.error as Error).message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader
        icon={<Plug />}
        title="Third-Party Integrations"
        description={
          preselected
            ? `Connected accounts per school · filtered to /${preselected}`
            : "Which school has connected what, and what each one still costs."
        }
      />

      {!data?.encryptionConfigured && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
          <ShieldAlert className="mt-px size-3.5 shrink-0" />
          <span>
            <span className="font-medium">Credentials cannot be saved yet.</span>{" "}
            <code className="font-mono">INTEGRATION_ENCRYPTION_KEY</code> is not set on the API
            server, so connection details can be recorded but secrets will be rejected.
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={School2}
          label="Schools"
          value={data?.schools ?? 0}
          hint={`${(data?.tenants ?? []).filter((s) => Object.keys(s.connections).length > 0).length} with at least one connection`}
        />
        <Kpi
          icon={Link2}
          label="Active connections"
          value={data?.activeConnections ?? 0}
          hint={`${data?.offered ?? 0} providers offered`}
        />
        <Kpi
          icon={AlertTriangle}
          label="Needs attention"
          value={data?.needsAttention ?? 0}
          hint={`${data?.schoolsWithIssues ?? 0} school${data?.schoolsWithIssues === 1 ? "" : "s"} affected`}
        />
        <Kpi
          icon={Plug}
          label="Built in"
          value={data?.builtIn ?? 0}
          hint="Payments, push and storage — no setup"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "schools" | "catalog")}>
          <TabsList className="h-9 rounded-xl border border-border bg-muted/60 p-1">
            <TabsTrigger value="schools" className="rounded-lg text-xs">
              By school
            </TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-lg text-xs">
              Provider catalog
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "schools" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search school, slug or address…"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {tab === "schools" ? (
        <SchoolIntegrationTable
          schools={visible}
          providers={providers}
          onOpenConnection={openConnection}
          onOpenPicker={openPicker}
        />
      ) : (
        <ProviderCatalog providers={providers} schools={data?.tenants ?? []} />
      )}

      <p className="text-[11px] text-muted-foreground">
        {providers.length} providers tracked · status is derived from plan entitlement first, then
        the school's own connection record.
      </p>

      <ConnectionSheet
        open={!!sheetSchool}
        onOpenChange={(open) => {
          if (!open) {
            setSheetSchool(null);
            setSheetProviderId(null);
          }
        }}
        school={sheetSchool ? (data?.tenants.find((t) => t.tenantId === sheetSchool.tenantId) ?? sheetSchool) : null}
        providerId={sheetProviderId}
        providers={providers}
        onPickProvider={(id) => setSheetProviderId(id || null)}
      />
    </div>
  );
}
