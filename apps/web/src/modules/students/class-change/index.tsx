"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, MoveRight, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/graphql/keys";
import { useAppStore } from "@/store/use-app-store";
import { useStudents } from "@/lib/graphql/hooks/academic.hooks";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { Suspense } from "react";

import { Pagination } from "../students/adminStudents/Pagination";
import { StudentSkeleton } from "../students/adminStudents/StudentSkeleton";
import { ClassChangeTable, type RosterStudent } from "./components/class-change-table";
import { ChangeClassDialog } from "./components/change-class-dialog";
import {
  buildChangeClassRequests,
  type ChangeClassForm,
  type ChangeClassTarget,
} from "./class-change.request";

const DEFAULT_PAGE_SIZE = 15;

const toTarget = (student: RosterStudent): ChangeClassTarget => ({
  id: student.id,
  name: student.name,
  classId: student.classId,
  className: student.className || "Unassigned",
  rollNumber: student.rollNumber,
});

function AdminClassChangeContent() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { canEdit } = useModulePermissions("students");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  // Arriving from one class page carries that class in the URL, so the list opens
  // already filtered to it.
  useEffect(() => {
    const classId = new URLSearchParams(window.location.search).get("classId");
    if (classId) setClassFilter(classId);
  }, []);

  // Keyed by student id and held as the full row, so a selection survives a page
  // turn or a filter change and the dialog can still name everyone in it.
  const [selected, setSelected] = useState<Map<string, ChangeClassTarget>>(new Map());
  const [dialogTargets, setDialogTargets] = useState<ChangeClassTarget[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: studentData, isLoading } = useStudents(
    currentTenantId || undefined,
    classFilter === "all" ? undefined : classFilter,
    search || undefined,
    statusFilter,
    genderFilter,
    currentPage,
    itemsPerPage,
  );

  const students = useMemo(
    () => (studentData?.students ?? []) as RosterStudent[],
    [studentData],
  );
  const totalItems = studentData?.total ?? 0;
  const totalPages = studentData?.totalPages ?? 1;

  const resetPage = () => setCurrentPage(1);

  const toggleStudent = useCallback((student: RosterStudent) => {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(student.id)) next.delete(student.id);
      else next.set(student.id, toTarget(student));
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback((checked: boolean) => {
    setSelected((current) => {
      const next = new Map(current);
      for (const student of students) {
        if (checked) next.set(student.id, toTarget(student));
        else next.delete(student.id);
      }
      return next;
    });
  }, [students]);

  const openForOne = (student: RosterStudent) => {
    setDialogTargets([toTarget(student)]);
    setDialogOpen(true);
  };
  const openForMany = () => {
    setDialogTargets([...selected.values()]);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setDialogTargets([]);
  };

  const handleSubmit = async (form: ChangeClassForm) => {
    const targets = dialogTargets;
    setSubmitting(true);
    try {
      const requests = buildChangeClassRequests(targets, form);
      const failed: ChangeClassTarget[] = [];
      // One request per student: the endpoint moves one student at a time, and a
      // partial move is an outcome to report rather than a transaction to undo.
      for (const request of requests) {
        try {
          const res = await apiFetch("/api/students", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Request failed");
          }
        } catch {
          const target = targets.find((t) => t.id === request.id);
          if (target) failed.push(target);
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard", currentTenantId] });

      const moved = requests.length - failed.length;
      if (failed.length === 0) {
        toast.success(
          moved === 1
            ? `${targets[0]?.name ?? "Student"} moved to the new class`
            : `${moved} students moved to the new class`,
        );
        setSelected(new Map());
      } else {
        toast.error(
          `${moved} of ${requests.length} moved. ${failed.length} did not: ${failed
            .map((t) => t.name)
            .slice(0, 3)
            .join(", ")}${failed.length > 3 ? "…" : ""}`,
        );
        // Keep only the students who did not move selected, so they can be retried.
        setSelected(new Map(failed.map((t) => [t.id, t])));
      }
      closeDialog();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Class change
        </h1>
        <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500 dark:text-zinc-400">
          {totalItems} students · move between classes within this session
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          id="search_class_change"
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
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-2xs text-xs sm:text-sm text-slate-700 dark:text-zinc-200">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Read-only mode: you need edit permission on Students to move a student.
          </span>
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/15 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">
            {selected.size} student{selected.size === 1 ? "" : "s"} selected
          </span>
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
            onClick={openForMany}
          >
            <MoveRight className="size-3.5 mr-1.5" />
            Change class
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
        {isLoading ? (
          <StudentSkeleton />
        ) : (
          <>
            <ClassChangeTable
              students={students}
              isSelected={(id) => selected.has(id)}
              onToggle={toggleStudent}
              onToggleAll={toggleAllOnPage}
              onChange={openForOne}
              canChange={canEdit}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
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

      <ChangeClassDialog
        open={dialogOpen}
        targets={dialogTargets}
        submitting={submitting}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export function AdminClassChange() {
  return (
    <Suspense fallback={<StudentSkeleton />}>
      <AdminClassChangeContent />
    </Suspense>
  );
}
