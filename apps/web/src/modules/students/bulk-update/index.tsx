"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { ClassSelect } from "@/components/ui/class-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Layers, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/graphql/keys";
import { useAppStore } from "@/store/use-app-store";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";

import { Pagination } from "../students/adminStudents/Pagination";
import { StudentSkeleton } from "../students/adminStudents/StudentSkeleton";
import { FieldPicker } from "./components/field-picker";
import { BulkUpdateTable, type BulkStudent, type ClassOption } from "./components/bulk-update-table";
import { BULK_FIELDS, type BulkField } from "./fields";

const DEFAULT_PAGE_SIZE = 15;

function AdminBulkUpdateContent() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { canEdit } = useModulePermissions("students");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const [students, setStudents] = useState<BulkStudent[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [pickedFields, setPickedFields] = useState<Set<string>>(new Set());
  // studentId -> fieldKey -> new value. Only keys present here are sent.
  const [edits, setEdits] = useState<Record<string, Record<string, string | boolean>>>({});
  const [selected, setSelected] = useState<Map<string, BulkStudent>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  const resetPage = () => setCurrentPage(1);

  useEffect(() => {
    let alive = true;
    apiFetch("/api/classes?limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && Array.isArray(d?.items)) {
          setClasses(d.items.map((c: any) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });
      if (search.trim()) params.set("search", search.trim());
      if (classFilter && classFilter !== "all") params.set("classId", classFilter);
      if (genderFilter && genderFilter !== "all") params.set("gender", genderFilter);
      const res = await apiFetch(`/api/bulk-update/students?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
      const data = await res.json();
      setStudents(data.items ?? []);
      setTotalItems(data.totalItems ?? 0);
    } catch (err) {
      toast.error((err as Error).message || "Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, search, classFilter, genderFilter]);

  useEffect(() => {
    load();
  }, [load, currentTenantId]);

  const activeFields: BulkField[] = useMemo(
    () => BULK_FIELDS.filter((f) => pickedFields.has(f.key) && !f.disabled),
    [pickedFields],
  );

  const setCell = (studentId: string, key: string, value: string | boolean) => {
    setEdits((prev) => {
      const row = { ...(prev[studentId] ?? {}) };
      row[key] = value;
      return { ...prev, [studentId]: row };
    });
  };

  const toggleStudent = (student: BulkStudent) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(student.id)) next.delete(student.id);
      else next.set(student.id, student);
      return next;
    });
  };

  const allSelected = students.length > 0 && students.every((s) => selected.has(s.id));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allSelected) students.forEach((s) => next.delete(s.id));
      else students.forEach((s) => next.set(s.id, s));
      return next;
    });
  };

  // Only checked students with at least one edited cell are sent.
  const requests = useMemo(() => {
    const out: { id: string; fields: Record<string, string | boolean> }[] = [];
    for (const [id] of selected) {
      const row = edits[id];
      if (row && Object.keys(row).length > 0) out.push({ id, fields: row });
    }
    return out;
  }, [selected, edits]);

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const [id] of selected) {
      if (edits[id] && Object.keys(edits[id]).length > 0) n++;
    }
    return n;
  }, [selected, edits]);

  const handleSubmit = async () => {
    if (requests.length === 0) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: requests }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Bulk update failed");

      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard", currentTenantId] });

      const failedIds = new Set<string>((data.failed ?? []).map((f: { id: string }) => f.id));
      const ok = requests.length - failedIds.size;
      if ((data.failed ?? []).length === 0) {
        toast.success(ok === 1 ? "1 student updated" : `${ok} students updated`);
        setSelected(new Map());
        setEdits({});
      } else {
        toast.error(
          `${ok} of ${requests.length} updated. ${data.failed.length} did not: ${data.failed
            .map((f: { error: string }) => f.error)
            .slice(0, 2)
            .join("; ")}${data.failed.length > 2 ? "…" : ""}`,
        );
        // Keep the failed rows selected and their edits intact for a retry;
        // drop the ones that saved so they are not sent twice.
        setSelected((prev) => {
          const next = new Map();
          for (const id of failedIds) {
            const s = prev.get(id);
            if (s) next.set(id, s);
          }
          return next;
        });
        setEdits((prev) => {
          const next: Record<string, Record<string, string | boolean>> = {};
          for (const id of failedIds) if (prev[id]) next[id] = prev[id];
          return next;
        });
      }
      load();
    } catch (err) {
      toast.error((err as Error).message || "Bulk update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Bulk update
        </h1>
        <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500 dark:text-zinc-400">
          {totalItems} students shown · pick fields, edit inline, then update many at once
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/25 flex items-center justify-center shrink-0">
            <Layers className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-slate-800 dark:text-zinc-100">Fields to edit</div>
            <div className="text-[12px] text-slate-500 dark:text-zinc-400">
              Pick the columns you want to edit inline.
            </div>
          </div>
        </div>
        <FieldPicker selected={pickedFields} onChange={setPickedFields} />
        {activeFields.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFields.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() =>
                  setPickedFields((prev) => {
                    const next = new Set(prev);
                    next.delete(f.key);
                    return next;
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200/70 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              >
                {f.label}
                <X className="size-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          id="search_bulk_update"
          value={search}
          onChange={(val) => {
            setSearch(val);
            resetPage();
          }}
          placeholder="Search students..."
          delay={400}
          className="w-full max-w-[280px]"
          inputClassName="rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 h-10 text-sm placeholder:text-slate-400 pl-9 shadow-2xs"
        />
        <ClassSelect
          value={classFilter}
          onValueChange={(v) => {
            setClassFilter(v);
            resetPage();
          }}
          showAllOption
          className="w-[150px] h-10 rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-2xs text-xs sm:text-sm text-slate-700 dark:text-zinc-200"
          placeholder="All classes"
        />
        <Select
          value={genderFilter}
          onValueChange={(v) => {
            setGenderFilter(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-2xs text-xs sm:text-sm text-slate-700 dark:text-zinc-200">
            <SelectValue placeholder="All genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Read-only mode: you need edit permission on Students to bulk-update records.
          </span>
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/15 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">
            {selected.size} student{selected.size === 1 ? "" : "s"} selected
          </span>
          {dirtyCount > 0 && (
            <span className="text-[12px] text-emerald-700/80 dark:text-emerald-400/80">
              {dirtyCount} with edits
            </span>
          )}
          <button
            type="button"
            onClick={() => setSelected(new Map())}
            className="inline-flex items-center gap-1 text-[13px] text-emerald-700/80 dark:text-emerald-400/80 hover:text-emerald-900 dark:hover:text-emerald-200"
          >
            <X className="size-3.5" />
            Clear
          </button>
          <Button
            size="sm"
            className="ml-auto h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={!canEdit || submitting || requests.length === 0}
          >
            {submitting ? "Updating..." : `Update ${requests.length} student${requests.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
        {isLoading ? (
          <StudentSkeleton />
        ) : (
          <>
            {activeFields.length === 0 ? (
              <div className="px-4 py-12 text-center text-[13px] text-slate-400 dark:text-zinc-500">
                Pick at least one field above to start editing inline.
              </div>
            ) : (
              <BulkUpdateTable
                students={students}
                fields={activeFields}
                classes={classes}
                edits={edits}
                onEdit={setCell}
                isSelected={(id) => selected.has(id)}
                onToggle={toggleStudent}
                onToggleAll={toggleAllOnPage}
                allSelected={allSelected}
                readOnly={!canEdit}
              />
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onLimitChange={(limit) => {
                setItemsPerPage(limit);
                resetPage();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function AdminBulkUpdate() {
  return (
    <Suspense fallback={<StudentSkeleton />}>
      <AdminBulkUpdateContent />
    </Suspense>
  );
}
