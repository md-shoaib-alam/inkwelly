"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/pagination";
import { ROSTER_TABLE_COLUMNS, ClassesTableSkeleton } from "@/components/shared/classes/ClassesTableSkeleton";
import { useAppStore } from "@/store/use-app-store";
import { useClassFilterOptions, useClassStats, useClassesFiltered } from "@/lib/graphql/hooks";
import { ALL, defaultClassFilters, filtersAreDefault, formatGradeLabel, type ClassFilters } from "@/lib/class-options";
import type { ClassInfo } from "@/lib/types";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { ClassRosterTable } from "./ClassRosterTable";

const PAGE_SIZE = 25;

const SELECT_CLASS =
  "h-10 w-[160px] rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 " +
  "text-[13px] text-slate-700 dark:text-zinc-200 shadow-2xs";

/** One of the three inline filters. The frame is a row of selects, not a panel. */
function RosterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={SELECT_CLASS}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Students -> Classes: how full and how complete each class is. The Academics screen
 * of the same name edits these rows and is laid out for that — stat cards, a filter
 * panel, a capacity column. This one is a read-only summary, so it carries its own
 * header line, its own inline filters and its own columns, and the two are expected
 * to differ. Both ask the server to filter, sort and page.
 */
export function ClassRoster() {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const { currentTenantId } = useAppStore();

  const [filters, setFilters] = useState<ClassFilters>(defaultClassFilters);
  const [page, setPage] = useState(1);

  // A filter can strand the viewer on a page that no longer exists, so changing
  // criteria always goes back to the first page — in the handler, not an effect.
  const applyFilters = (patch: Partial<ClassFilters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const { data, isLoading, isPlaceholderData } = useClassesFiltered(
    currentTenantId || undefined,
    filters,
    page,
    PAGE_SIZE,
  );
  const { data: stats } = useClassStats(currentTenantId || undefined);
  const { data: optionData } = useClassFilterOptions(currentTenantId || undefined);

  const classes = (data?.classes ?? []) as ClassInfo[];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const matching = filtersAreDefault(filters) ? null : total;
  const avgPerClass = stats && stats.total > 0 ? Math.round(stats.enrolled / stats.total) : 0;

  // `enabled: !!tenantId` keeps `isLoading` false while the tenant is still resolving,
  // so the first paint would otherwise read an empty table as "no classes".
  const listPending = isLoading || (!currentTenantId && classes.length === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">Classes</h1>
          {listPending && !stats ? (
            <Skeleton className="mt-1.5 h-3.5 w-64" />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">
              <span className="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">{stats?.total ?? 0}</span>{" "}
              {stats?.total === 1 ? "class" : "classes"} ·{" "}
              <span className="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">{stats?.enrolled ?? 0}</span>{" "}
              students · avg{" "}
              <span className="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">{avgPerClass}</span> per class
              {matching !== null && (
                <span> · <button
                  type="button"
                  onClick={() => applyFilters(defaultClassFilters())}
                  className="underline underline-offset-2 decoration-slate-300 hover:text-slate-700 dark:decoration-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {matching} matching, clear filters
                </button></span>
              )}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => push(tenantHref("academics/classes"))}
          className="h-10 px-3.5 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[13px] font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs"
        >
          <Settings className="size-4 text-slate-400 dark:text-zinc-500" /> Manage
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={filters.search ?? ""}
          onChange={(v) => applyFilters({ search: v })}
          placeholder="Search classes..."
          className="w-full max-w-[420px]"
          inputClassName="rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 h-10 text-sm placeholder:text-slate-400 pl-9 shadow-2xs"
        />
        <RosterSelect
          value={filters.grade ?? ALL}
          onChange={(v) => applyFilters({ grade: v })}
          allLabel="All grades"
          options={(optionData?.grades ?? []).map((g) => ({ value: g, label: formatGradeLabel(g) }))}
        />
        <RosterSelect
          value={filters.section ?? ALL}
          onChange={(v) => applyFilters({ section: v })}
          allLabel="All sections"
          options={(optionData?.sections ?? []).map((s) => ({ value: s, label: s }))}
        />
        <RosterSelect
          value={filters.medium ?? ALL}
          onChange={(v) => applyFilters({ medium: v })}
          allLabel="All mediums"
          options={(optionData?.mediums ?? []).map((m) => ({ value: m, label: m }))}
        />
      </div>

      {listPending || (isPlaceholderData && classes.length === 0) ? (
        <ClassesTableSkeleton columns={ROSTER_TABLE_COLUMNS} />
      ) : (
        <ClassRosterTable
          classes={classes}
          onOpen={(cls) => push(tenantHref(`students?classId=${cls.id}`))}
        />
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
