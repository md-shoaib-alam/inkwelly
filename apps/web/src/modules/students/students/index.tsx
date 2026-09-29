"use client";

import { useCallback, useEffect, useMemo, useReducer, useState, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eye, ArrowUpDown } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { useAppStore } from "@/store/use-app-store";
import { useQueryClient } from "@tanstack/react-query";
import { ClassSelect } from "@/components/ui/class-select";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Sub-components
import { RosterTable } from "./adminStudents/RosterTable";
import { ColumnsPopover } from "./adminStudents/ColumnsPopover";
import { StudentDialog } from "./adminStudents/StudentDialog";
import { StudentSkeleton } from "./adminStudents/StudentSkeleton";
import { Pagination } from "./adminStudents/Pagination";
import { StudentProfileView } from "./adminStudents/StudentProfileView";

// Types
import { DEFAULT_VISIBLE, ROSTER_COLUMNS, type RosterRow } from "./adminStudents/columns";
import type { StudentInfo, StudentFormData } from "./adminStudents/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
];
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "rollNumber", label: "Roll no." },
  { value: "admissionNo", label: "Admission no." },
  { value: "dateOfBirth", label: "DOB" },
  { value: "admissionDate", label: "Admission date" },
  { value: "className", label: "Class" },
  { value: "createdAt", label: "Newest" },
];

const emptyFormData: StudentFormData = {
  name: "",
  email: "",
  username: "",
  password: "",
  phone: "",
  rollNumber: "",
  classId: "",
  gender: "male",
  dateOfBirth: "",
  bloodGroup: "",
  house: "",
  transportEnabled: false,
  routeId: "",
  pickupPoint: "",
};

type State = {
  search: string;
  classFilter: string;
  statusFilter: string;
  genderFilter: string;
  categoryFilter: string;
  bloodGroupFilter: string;
  rteFilter: string;
  sort: string;
  sortDir: "asc" | "desc";
  currentPage: number;
  itemsPerPage: number;
  dialogOpen: boolean;
  editingStudent: StudentInfo | null;
  formData: StudentFormData;
  submitting: boolean;
};

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_CLASS_FILTER'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'SET_GENDER_FILTER'; payload: string }
  | { type: 'SET_CATEGORY_FILTER'; payload: string }
  | { type: 'SET_BLOOD_GROUP_FILTER'; payload: string }
  | { type: 'SET_RTE_FILTER'; payload: string }
  | { type: 'SET_SORT'; payload: string }
  | { type: 'SET_SORT_DIR'; payload: "asc" | "desc" }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'OPEN_EDIT'; payload: StudentInfo }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_FORM_DATA'; payload: StudentFormData }
  | { type: 'SET_SUBMITTING'; payload: boolean };

const initialState: State = {
  search: "",
  classFilter: "all",
  statusFilter: "active",
  genderFilter: "all",
  categoryFilter: "all",
  bloodGroupFilter: "all",
  rteFilter: "all",
  sort: "name",
  sortDir: "asc",
  currentPage: 1,
  itemsPerPage: 25,
  dialogOpen: false,
  editingStudent: null,
  formData: emptyFormData,
  submitting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload, currentPage: 1 };
    case 'SET_CLASS_FILTER':
      return { ...state, classFilter: action.payload, currentPage: 1 };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload, currentPage: 1 };
    case 'SET_GENDER_FILTER':
      return { ...state, genderFilter: action.payload, currentPage: 1 };
    case 'SET_CATEGORY_FILTER':
      return { ...state, categoryFilter: action.payload, currentPage: 1 };
    case 'SET_BLOOD_GROUP_FILTER':
      return { ...state, bloodGroupFilter: action.payload, currentPage: 1 };
    case 'SET_RTE_FILTER':
      return { ...state, rteFilter: action.payload, currentPage: 1 };
    case 'SET_SORT':
      return { ...state, sort: action.payload, currentPage: 1 };
    case 'SET_SORT_DIR':
      return { ...state, sortDir: action.payload, currentPage: 1 };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case 'OPEN_EDIT':
      return {
        ...state,
        editingStudent: action.payload,
        formData: {
          name: action.payload.name,
          email: action.payload.email,
          phone: action.payload.phone || "",
          rollNumber: action.payload.rollNumber,
          classId: action.payload.classId || "",
          gender: action.payload.gender || "male",
          dateOfBirth: action.payload.dateOfBirth || "",
          bloodGroup: action.payload.bloodGroup || "",
          house: action.payload.house || "",
          transportEnabled: !!action.payload.transport,
          routeId: action.payload.transport?.routeId || "",
          pickupPoint: action.payload.transport?.pickupPoint || "",
        },
        dialogOpen: true,
      };
    case 'CLOSE_DIALOG':
      return { ...state, dialogOpen: false };
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload };
    default:
      return state;
  }
}

function AdminStudentsContent() {
  const { currentTenantId } = useAppStore();
  const { canEdit, canDelete } = useModulePermissions("students");

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    search,
    classFilter,
    statusFilter,
    genderFilter,
    categoryFilter,
    bloodGroupFilter,
    rteFilter,
    sort,
    sortDir,
    currentPage,
    itemsPerPage,
    dialogOpen,
    editingStudent,
    formData,
    submitting,
  } = state;

  const queryClient = useQueryClient();

  const [rows, setRows] = useState<RosterRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    if (!currentTenantId) return;
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
      sort,
      dir: sortDir,
    });
    if (search) params.set("search", search);
    if (classFilter !== "all") params.set("classId", classFilter);
    if (genderFilter !== "all") params.set("gender", genderFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (bloodGroupFilter !== "all") params.set("bloodGroup", bloodGroupFilter);
    if (rteFilter !== "all") params.set("rte", rteFilter);

    apiFetch(`/api/student-roster?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setRows(data.items ?? []);
        setTotalItems(data.totalItems ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
        toast.error(err.message || "Failed to load students");
      });

    return () => controller.abort();
  }, [
    currentTenantId, search, classFilter, genderFilter, statusFilter,
    categoryFilter, bloodGroupFilter, rteFilter, sort, sortDir,
    currentPage, itemsPerPage, reloadTick,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const studentUrlParam = searchParams.get("student") || searchParams.get("studentId");

  // Sync initial URL search params into state (run once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const classIdParam = sp.get("classId");
    const searchParam = sp.get("search");
    const sortParam = sp.get("sort");
    const dirParam = sp.get("dir");
    const limitParam = sp.get("limit");
    const pageParam = sp.get("page");

    if (classIdParam) {
      dispatch({ type: 'SET_CLASS_FILTER', payload: classIdParam });
    }
    // Before the page, because `SET_SEARCH` resets to page 1 and a deep link that
    // carries both should land where it said.
    if (searchParam) {
      dispatch({ type: 'SET_SEARCH', payload: searchParam });
    }
    if (sortParam && SORT_OPTIONS.some((o) => o.value === sortParam)) {
      dispatch({ type: 'SET_SORT', payload: sortParam });
    }
    if (dirParam === "asc" || dirParam === "desc") {
      dispatch({ type: 'SET_SORT_DIR', payload: dirParam });
    }
    const parsedLimit = limitParam ? Number(limitParam) : NaN;
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: parsedLimit });
    }
    const parsedPage = pageParam ? Number(pageParam) : NaN;
    if (Number.isInteger(parsedPage) && parsedPage > 0) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: parsedPage });
    }
  }, []); // Only on mount — URL seeds the initial state

  // Keep the browser URL in sync with the active filters, sort and pagination
  const syncUrl = useCallback((next: Partial<State>) => {
    const merged = { ...state, ...next };
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string, keep: boolean) => {
      if (keep) params.set(key, value); else params.delete(key);
    };
    setOrDelete("page", String(merged.currentPage), merged.currentPage > 1);
    setOrDelete("limit", String(merged.itemsPerPage), merged.itemsPerPage !== 25);
    setOrDelete("search", merged.search, Boolean(merged.search));
    setOrDelete("classId", merged.classFilter, merged.classFilter !== "all");
    setOrDelete("gender", merged.genderFilter, merged.genderFilter !== "all");
    setOrDelete("status", merged.statusFilter, merged.statusFilter !== "active");
    setOrDelete("category", merged.categoryFilter, merged.categoryFilter !== "all");
    setOrDelete("bloodGroup", merged.bloodGroupFilter, merged.bloodGroupFilter !== "all");
    setOrDelete("rte", merged.rteFilter, merged.rteFilter !== "all");
    setOrDelete("sort", merged.sort, merged.sort !== "name");
    setOrDelete("dir", merged.sortDir, merged.sortDir !== "asc");

    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, state]);

  const handleOpenEdit = (student: StudentInfo) => dispatch({ type: 'OPEN_EDIT', payload: student });

  const [viewingStudentSnapshot, setViewingStudentSnapshot] = useState<StudentInfo | null>(null);

  const handleCloseView = useCallback(() => {
    setViewingStudentSnapshot(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("student");
    params.delete("studentId");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // Synchronize URL ?student= query parameter into viewingStudent on initial load, refresh, or URL change
  useEffect(() => {
    if (!studentUrlParam) {
      if (viewingStudentSnapshot) {
        setViewingStudentSnapshot(null);
      }
      return;
    }

    // 1. Check if student is already on the current roster page
    const found = rows.find(
      (s) => s.id === studentUrlParam || s.rollNumber === studentUrlParam || s.username === studentUrlParam
    );
    if (found) {
      if (viewingStudentSnapshot?.id !== found.id) {
        setViewingStudentSnapshot(found as unknown as StudentInfo);
      }
      return;
    }

    // 2. If not on the current page, fetch this specific student by search
    let isMounted = true;
    (async () => {
      try {
        const res = await apiFetch(
          `/api/student-roster?limit=1&search=${encodeURIComponent(studentUrlParam)}`,
        );
        if (res.ok) {
          const data = await res.json();
          const items: RosterRow[] = data.items || [];
          const match = items.find(
            (s) => s.id === studentUrlParam || s.rollNumber === studentUrlParam || s.username === studentUrlParam
          );
          if (match && isMounted) {
            setViewingStudentSnapshot(match as unknown as StudentInfo);
          } else if (!match && isMounted) {
            toast.error("Student not found");
            handleCloseView();
          }
        }
      } catch (err) {
        console.error("Failed to load student from URL:", err);
        if (isMounted) {
          toast.error("Failed to load student");
          handleCloseView();
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentUrlParam, rows, currentTenantId]);

  // Derive viewing student dynamically from the latest roster rows
  const viewingStudent = useMemo(() => {
    if (!viewingStudentSnapshot) return null;
    return (rows.find((s) => s.id === viewingStudentSnapshot.id) as unknown as StudentInfo) || viewingStudentSnapshot;
  }, [rows, viewingStudentSnapshot]);

  const handleOpenView = (student: StudentInfo) => {
    setViewingStudentSnapshot(student);
    const params = new URLSearchParams(searchParams.toString());
    params.set("student", student.rollNumber || student.username || student.id);
    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  const handleSubmit = async () => {
    if (!editingStudent) return;

    // Required fields validation
    if (!formData.name || !formData.rollNumber || !formData.classId) {
      toast.error("Name, Roll Number, and Class are required");
      return;
    }

    // Email format validation (only if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    toast.promise(
      (async () => {
        dispatch({ type: 'SET_SUBMITTING', payload: true });
        try {
          // Clean payload: omit empty strings for optional fields to avoid backend schema validation errors
          const payload: Record<string, any> = {
            id: editingStudent.id,
            name: formData.name.trim(),
            rollNumber: formData.rollNumber.trim(),
            classId: formData.classId,
            gender: formData.gender || "male",
            transportEnabled: Boolean(formData.transportEnabled),
          };

          if (formData.email?.trim()) {
            payload.email = formData.email.trim();
          }
          if (formData.phone?.trim()) {
            payload.phone = formData.phone.trim();
          }
          if (formData.dateOfBirth?.trim()) {
            payload.dateOfBirth = formData.dateOfBirth.trim();
          }
          if (formData.bloodGroup?.trim()) {
            payload.bloodGroup = formData.bloodGroup.trim();
          }
          if (formData.transportEnabled && formData.routeId?.trim()) {
            payload.routeId = formData.routeId.trim();
            if (formData.pickupPoint?.trim()) {
              payload.pickupPoint = formData.pickupPoint.trim();
            }
          }

          const res = await apiFetch("/api/students", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to update student");
          }

          dispatch({ type: 'CLOSE_DIALOG' });
          // Refresh the roster from the server to ensure total accuracy
          reload();
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard", currentTenantId],
          });
          // The profile view caches by id, so a write has to clear that too.
          queryClient.invalidateQueries({ queryKey: ["student-detail", editingStudent.id] });
          return "Student details updated";
        } finally {
          dispatch({ type: 'SET_SUBMITTING', payload: false });
        }
      })(),
      {
        loading: "Updating student details...",
        success: (msg) => msg,
        error: (err: any) => err.message,
      },
    );
  };

  const handleDelete = async (id: string, reason?: string) => {
    toast.promise(
      (async () => {
        const params = new URLSearchParams({ id });
        if (reason) params.set("reason", reason);
        const res = await apiFetch(`/api/students?${params.toString()}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to delete student");
        }

        reload();
        queryClient.invalidateQueries({
          queryKey: ["admin-dashboard", currentTenantId],
        });
        queryClient.invalidateQueries({ queryKey: ["student-trash"] });

        // Force a RED morphing pill for deletion
        throw new Error("Student moved to Trash");
      })(),
      {
        loading: "Deleting student record...",
        success: () => "", // Not reached
        error: (err: any) => err.message, // Shows the red pill
      },
    );
  };

  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => DEFAULT_VISIBLE);
  const activeColumns = useMemo(
    () => ROSTER_COLUMNS.filter((c) => visibleCols.has(c.key)),
    [visibleCols],
  );

  if (loading || (studentUrlParam && !viewingStudent)) return <StudentSkeleton />;

  // --- Profile view (full page replace, like teachers) ---
  if (viewingStudent) {
    return (
      <div className="space-y-6">
        <StudentProfileView
          student={viewingStudent}
          onBack={handleCloseView}
          canEdit={canEdit}
          onEdit={(s) => {
            handleCloseView();
            handleOpenEdit(s);
          }}
        />

        <StudentDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) dispatch({ type: 'CLOSE_DIALOG' });
          }}
          formData={formData}
          setFormData={(fd) => dispatch({ type: 'SET_FORM_DATA', payload: fd })}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All students</h1>
        <p className="text-sm text-muted-foreground">{totalItems} enrolled</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          id="search_students"
          value={search}
          onChange={(val) => {
            dispatch({ type: 'SET_SEARCH', payload: val });
            syncUrl({ search: val });
          }}
          placeholder="Search by name..."
          delay={400}
          className="w-full sm:w-64"
          inputClassName="h-9 sm:h-10"
        />

        <Select
          value={genderFilter}
          onValueChange={(v) => {
            dispatch({ type: 'SET_GENDER_FILTER', payload: v });
            syncUrl({ genderFilter: v });
          }}
        >
          <SelectTrigger className="w-[calc(50%-4px)] sm:w-36 h-9 sm:h-10">
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            dispatch({ type: 'SET_STATUS_FILTER', payload: v });
            syncUrl({ statusFilter: v });
          }}
        >
          <SelectTrigger className="w-[calc(50%-4px)] sm:w-36 h-9 sm:h-10">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            dispatch({ type: 'SET_CATEGORY_FILTER', payload: v });
            syncUrl({ categoryFilter: v });
          }}
        >
          <SelectTrigger className="w-[calc(50%-4px)] sm:w-36 h-9 sm:h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[13px] font-medium shadow-2xs"
            >
              More filters
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[280px] rounded-xl space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Class</label>
              <ClassSelect
                value={classFilter}
                onValueChange={(v) => {
                  dispatch({ type: 'SET_CLASS_FILTER', payload: v });
                  syncUrl({ classFilter: v });
                }}
                showAllOption
                className="w-full h-9"
                placeholder="All classes"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Blood group</label>
              <Select
                value={bloodGroupFilter}
                onValueChange={(v) => {
                  dispatch({ type: 'SET_BLOOD_GROUP_FILTER', payload: v });
                  syncUrl({ bloodGroupFilter: v });
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {BLOOD_GROUPS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">RTE</label>
              <Select
                value={rteFilter}
                onValueChange={(v) => {
                  dispatch({ type: 'SET_RTE_FILTER', payload: v });
                  syncUrl({ rteFilter: v });
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">RTE only</SelectItem>
                  <SelectItem value="no">Non-RTE only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1 sm:ml-auto">
          <Select
            value={sort}
            onValueChange={(v) => {
              dispatch({ type: 'SET_SORT', payload: v });
              syncUrl({ sort: v });
            }}
          >
            <SelectTrigger className="w-36 sm:w-40 h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-xl"
            onClick={() => {
              const dir = sortDir === "asc" ? "desc" : "asc";
              dispatch({ type: 'SET_SORT_DIR', payload: dir });
              syncUrl({ sortDir: dir });
            }}
            title={sortDir === "asc" ? "Sorted A→Z — click for Z→A" : "Sorted Z→A — click for A→Z"}
          >
            <ArrowUpDown className="size-4 text-slate-500" />
          </Button>
          <ColumnsPopover visible={visibleCols} onChange={setVisibleCols} />
        </div>
      </div>

      {/* Read-only banner */}
      {!canEdit && !canDelete && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Read-only mode: you have view permission only for this module.
          </span>
        </div>
      )}

      {/* Table Content */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <RosterTable
            rows={rows}
            columns={activeColumns}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onView={handleOpenView}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => {
              dispatch({ type: 'SET_CURRENT_PAGE', payload: p });
              syncUrl({ currentPage: p });
            }}
            onLimitChange={(limit) => {
              dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: limit });
              syncUrl({ itemsPerPage: limit });
            }}
          />
        </CardContent>
      </Card>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_DIALOG' });
        }}
        formData={formData}
        setFormData={(fd) => dispatch({ type: 'SET_FORM_DATA', payload: fd })}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export function AdminStudents() {
  return (
    <Suspense fallback={<StudentSkeleton />}>
      <AdminStudentsContent />
    </Suspense>
  );
}
