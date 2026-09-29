"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, School, Settings, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ClassesStatsRow } from "@/components/shared/classes/ClassesStatsRow";
import { ClassesFilterPanel } from "@/components/shared/classes/ClassesFilterPanel";
import { ROSTER_TABLE_COLUMNS, ClassesTableSkeleton } from "@/components/shared/classes/ClassesTableSkeleton";
import {
  GradeBadge,
  MediumBadge,
  SectionChip,
  StatusBadge,
  TeacherStack,
} from "@/components/shared/classes/ClassBadges";
import { useAppStore } from "@/store/use-app-store";
import { useClassFilterOptions, useClassStats, useClassesFiltered } from "@/lib/graphql/hooks";
import { defaultClassFilters, filtersAreDefault, formatGradeLabel, type ClassFilters } from "@/lib/class-options";
import type { ClassInfo } from "@/lib/types";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

/**
 * Students -> Classes: how full is each class. The Academics screen of the same name
 * edits these rows; this one only reads them, which is why it is its own component
 * rather than a mode flag on that one. Both ask the server to filter, sort and page,
 * so neither pulls the whole school down to the browser.
 */
export function ClassRoster() {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const { currentTenantId } = useAppStore();

  const [filters, setFilters] = useState<ClassFilters>(defaultClassFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [page, setPage] = useState(1);

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

  // `enabled: !!tenantId` keeps `isLoading` false while the tenant is still resolving,
  // so the first paint would otherwise read an empty table as "no classes". The list
  // area holds the skeleton instead of the old whole-page return, which painted a
  // different screen from the one the admin is about to land on.
  const listPending = isLoading || (!currentTenantId && classes.length === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">Classes</h1>
          {listPending ? (
            <Skeleton className="mt-1 h-3.5 w-48" />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">
              {total} {total === 1 ? "class" : "classes"} match these filters
              {!filtersAreDefault(filters) && " · clear the filters to see all of them"}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => push(tenantHref("academics/classes"))}>
          <Settings className="size-4" /> Manage
        </Button>
      </div>

      <ClassesStatsRow stats={stats} loading={listPending && !stats} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1 max-w-md">
          <SearchInput
            value={filters.search ?? ""}
            onChange={(v) => applyFilters({ search: v })}
            placeholder="Search classes..."
          />
        </div>
        <Button
          variant={filtersVisible ? "default" : "outline"}
          onClick={() => setFiltersVisible((v) => !v)}
        >
          Filters
        </Button>
      </div>

      {filtersVisible && (
        <ClassesFilterPanel
          filters={filters}
          onChange={applyFilters}
          options={{
            grades: optionData?.grades ?? [],
            sections: optionData?.sections ?? [],
            mediums: optionData?.mediums ?? [],
          }}
        />
      )}

      {listPending || (isPlaceholderData && classes.length === 0) ? (
        <ClassesTableSkeleton columns={ROSTER_TABLE_COLUMNS} />
      ) : (
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Section</th>
                    <th className="px-6 py-4">Class teacher</th>
                    <th className="px-6 py-4">Medium</th>
                    <th className="px-6 py-4">Enrolled</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Capacity fill</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {classes.map((cls) => (
                    <RosterRow
                      key={cls.id}
                      cls={cls}
                      onOpenStudents={() => push(tenantHref(`students?classId=${cls.id}`))}
                    />
                  ))}
                  {classes.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center">
                        <School className="size-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          No classes match these filters
                        </p>
                        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                          Clear the filters, or add a class from Academics &gt; Classes
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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

function RosterRow({ cls, onOpenStudents }: { cls: ClassInfo; onOpenStudents: () => void }) {
  const enrolled = cls.studentCount ?? 0;
  const fill = cls.capacity > 0 ? Math.round((enrolled / cls.capacity) * 100) : 0;
  return (
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <GraduationCap className="size-4" />
          </span>
          <div className="min-w-0">
            <button
              type="button"
              onClick={onOpenStudents}
              className="block truncate text-left font-semibold text-zinc-900 hover:text-emerald-600 dark:text-zinc-100"
            >
              {cls.name} - {cls.section}
            </button>
            {cls.slug && (
              <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">{cls.slug}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><GradeBadge grade={formatGradeLabel(cls.grade)} /></td>
      <td className="px-6 py-4"><SectionChip section={cls.section} /></td>
      <td className="px-6 py-4"><TeacherStack cls={cls} /></td>
      <td className="px-6 py-4"><MediumBadge medium={cls.medium} /></td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 tabular-nums text-zinc-700 dark:text-zinc-300">
          <Users className="size-3.5 text-zinc-400" />{enrolled}
        </span>
      </td>
      <td className="px-6 py-4 tabular-nums text-zinc-700 dark:text-zinc-300">{cls.capacity}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full",
                fill >= 100 ? "bg-rose-500" : fill >= 80 ? "bg-amber-500" : "bg-emerald-500",
              )}
              style={{ width: `${Math.min(fill, 100)}%` }}
            />
          </div>
          <span className="text-[12px] tabular-nums text-slate-500 dark:text-zinc-400">{fill}%</span>
        </div>
      </td>
      <td className="px-6 py-4"><StatusBadge isActive={cls.isActive} /></td>
    </tr>
  );
}
