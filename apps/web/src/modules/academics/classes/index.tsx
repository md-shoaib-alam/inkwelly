"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { School, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { ClassesStatsRow } from "@/components/shared/classes/ClassesStatsRow";
import { ClassesFilterPanel } from "@/components/shared/classes/ClassesFilterPanel";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { useClassFilterOptions, useClassStats, useClassesFiltered, useTeachers } from "@/lib/graphql/hooks";
import { useViewMode } from "@/hooks/use-view-mode";
import { useAppStore } from "@/store/use-app-store";
import { defaultClassFilters, type ClassFilters } from "@/lib/class-options";
import type { ClassInfo, ClassTeacherRef } from "@/lib/types";

import { ReadOnlyBanner } from "./adminClasses/ReadOnlyBanner";
import { ClassesHeader } from "./adminClasses/ClassesHeader";
import { ClassesTableView } from "./adminClasses/ClassesTableView";
import { ClassesGridView } from "./adminClasses/ClassesGridView";
import { ClassFormDialog, type ClassFormPayload } from "./adminClasses/ClassFormDialog";
import { ClassTeachersDialog } from "./adminClasses/ClassTeachersDialog";
import { ClassDeleteDialog } from "./adminClasses/ClassDeleteDialog";

const PAGE_SIZE = 25;

/** Reads the API's error envelope, throwing so `toast.promise` renders the reason. */
async function classRequest(path: string, init?: RequestInit) {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function AdminClasses() {
  const { currentTenantId } = useAppStore();
  const { canCreate, canEdit, canDelete } = useModulePermissions("classes");
  const queryClient = useQueryClient();
  const { push } = useRouter();
  const tenantHref = useTenantHref();

  const [filters, setFilters] = useState<ClassFilters>(defaultClassFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [page, setPage] = useState(1);

  // A filter that shrinks the result set can strand the viewer on a page that no
  // longer exists, so every change of criteria goes back to the first page. Both
  // the search box and the panel go through here, which keeps the reset in the
  // event handler rather than an effect that fires after the render.
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
  const { data: teachersData, isLoading: teachersLoading } = useTeachers(currentTenantId || undefined);
  const teachers = teachersData?.teachers || [];

  const classes = (data?.classes ?? []) as ClassInfo[];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const [viewMode, setViewMode] = useViewMode("classes", "table");

  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<ClassInfo | null>(null);
  // Bumped on each open so the dialog remounts with a clean draft — see ClassFormDialog.
  const [formSession, setFormSession] = useState(0);
  const openFormDialog = (cls: ClassInfo | null) => {
    setFormTarget(cls);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  };
  const [saving, setSaving] = useState(false);

  const [teachersTarget, setTeachersTarget] = useState<ClassInfo | null>(null);
  const [teachersSession, setTeachersSession] = useState(0);
  const openTeachersDialog = (cls: ClassInfo) => {
    setTeachersTarget(cls);
    setTeachersSession((n) => n + 1);
  };
  const [savingTeachers, setSavingTeachers] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClassInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Every class read hangs off the ["classes"] prefix — list, filtered page,
  // stats and filter options — so one invalidation covers all four.
  const refetchClasses = () => queryClient.invalidateQueries({ queryKey: ["classes"] });

  const handleSubmitForm = async (payload: ClassFormPayload) => {
    const isEdit = !!payload.id;
    const promise = (async () => {
      await classRequest("/api/classes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    })();

    toast.promise(promise, {
      loading: isEdit ? "Updating class details..." : "Creating new class...",
      success: isEdit ? "Class updated successfully!" : "Class created successfully!",
      error: (err: Error) => err.message,
    });

    setSaving(true);
    try {
      await promise;
      setFormOpen(false);
      setFormTarget(null);
      await refetchClasses();
    } catch {
      // toast.promise already surfaced the reason.
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeachers = async (classId: string, assigned: ClassTeacherRef[]) => {
    const promise = (async () => {
      await classRequest("/api/classes/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          teachers: assigned.map((t) => ({ id: t.id, isPrimary: t.isPrimary })),
        }),
      });
    })();

    toast.promise(promise, {
      loading: "Saving teachers...",
      success: "Class teachers updated",
      error: (err: Error) => err.message,
    });

    setSavingTeachers(true);
    try {
      await promise;
      setTeachersTarget(null);
      await refetchClasses();
    } catch {
      // The dialog stays open so the edit can be retried.
    } finally {
      setSavingTeachers(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const promise = (async () => {
      await classRequest(`/api/classes?id=${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await refetchClasses();
    })();

    toast.promise(promise, {
      loading: "Deleting class...",
      success: "Class deleted",
      error: (err: Error) => err.message,
    });

    setDeleting(true);
    try {
      await promise;
    } catch {
      // Blocked deletes (students still enrolled) surface through the toast.
    } finally {
      setDeleting(false);
    }
  };

  const loading = isLoading && classes.length === 0;
  const showSkeleton = loading || (isPlaceholderData && classes.length === 0);

  return (
    <div className="space-y-6">
      <ReadOnlyBanner isVisible={!canCreate && !canEdit && !canDelete} />

      <ClassesHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        canCreate={canCreate}
        onAddClick={() => openFormDialog(null)}
      />

      <ClassesStatsRow stats={stats} loading={isLoading && !stats} />

      <div className="flex items-center gap-2.5 mb-4">
        <SearchInput
          value={filters.search ?? ""}
          onChange={(v) => applyFilters({ search: v })}
          placeholder="Search classes..."
          className="w-full max-w-[340px]"
          inputClassName="rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 h-10 text-sm placeholder:text-slate-400 pl-9 shadow-2xs"
        />
        <Button
          variant="outline"
          onClick={() => setFiltersVisible((v) => !v)}
          className={cn(
            "h-10 px-3.5 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer",
            filtersVisible && "bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700"
          )}
        >
          <SlidersHorizontal className="size-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Filters</span>
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

      {showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="py-20 text-center text-muted-foreground">
            <School className="size-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No classes match these filters</p>
            <p className="text-sm text-muted-foreground">
              Clear the filters, or create a class to get started
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <ClassesTableView
          classes={classes}
          canEdit={canEdit}
          canDelete={canDelete}
          canManageTeachers={canEdit}
          onViewStudents={(cls) => push(tenantHref(`students?classId=${cls.id}`))}
          onManageTeachers={openTeachersDialog}
          onEdit={openFormDialog}
          onDelete={setDeleteTarget}
        />
      ) : (
        <ClassesGridView
          classes={classes}
          canEdit={canEdit}
          canDelete={canDelete}
          onViewStudents={(cls) => push(tenantHref(`students?classId=${cls.id}`))}
          onEdit={openFormDialog}
          onDelete={setDeleteTarget}
          getProgressColor={getProgressColor}
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

      <ClassFormDialog
        key={formSession}
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formTarget}
        busy={saving}
        onSubmit={handleSubmitForm}
      />

      <ClassTeachersDialog
        key={teachersSession}
        open={!!teachersTarget}
        onOpenChange={(open) => { if (!open) setTeachersTarget(null); }}
        cls={teachersTarget}
        teachers={teachers}
        teachersLoading={teachersLoading}
        busy={savingTeachers}
        onSave={handleSaveTeachers}
      />

      <ClassDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        target={deleteTarget}
        deleting={deleting}
        onDelete={handleDelete}
      />
    </div>
  );
}

function getProgressColor(percentage: number) {
  if (percentage >= 90) return "[&>div]:bg-red-500";
  if (percentage >= 75) return "[&>div]:bg-amber-500";
  if (percentage >= 50) return "[&>div]:bg-emerald-500";
  return "[&>div]:bg-emerald-400";
}
