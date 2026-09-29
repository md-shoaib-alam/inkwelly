"use client";

import { useReducer, useEffect, useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, RotateCcw } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { useAppStore } from "@/store/use-app-store";
import { useStudents } from "@/lib/graphql/hooks/academic.hooks";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { ClassSelect } from "@/components/ui/class-select";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/graphql/keys";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";

// Sub-components
import { StudentTable } from "./adminStudents/StudentTable";
import { StudentDialog } from "./adminStudents/StudentDialog";
import { StudentSkeleton } from "./adminStudents/StudentSkeleton";
import { Pagination } from "./adminStudents/Pagination";
import { ImportExportButtons } from "./adminStudents/ImportExportButtons";
import { StudentProfileView } from "./adminStudents/StudentProfileView";

// Types
import type { StudentInfo, ClassInfo, StudentFormData } from "./adminStudents/types";

const ITEMS_PER_PAGE = 15;

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
  currentPage: number;
  itemsPerPage: number;
  dialogOpen: boolean;
  dialogMode: "create" | "edit";
  editingStudent: StudentInfo | null;
  formData: StudentFormData;
  submitting: boolean;
};

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_CLASS_FILTER'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'SET_GENDER_FILTER'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; payload: StudentInfo }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_FORM_DATA'; payload: StudentFormData }
  | { type: 'SET_SUBMITTING'; payload: boolean };

const initialState: State = {
  search: "",
  classFilter: "all",
  statusFilter: "active",
  genderFilter: "all",
  currentPage: 1,
  itemsPerPage: 15,
  dialogOpen: false,
  dialogMode: "create",
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
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case 'OPEN_CREATE':
      return { ...state, dialogMode: "create", formData: emptyFormData, dialogOpen: true };
    case 'OPEN_EDIT':
      return {
        ...state,
        dialogMode: "edit",
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
  const { canCreate, canEdit, canDelete } = useModulePermissions("students");

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    search,
    classFilter,
    statusFilter,
    genderFilter,
    currentPage,
    itemsPerPage,
    dialogOpen,
    dialogMode,
    editingStudent,
    formData,
    submitting,
  } = state;


  const queryClient = useQueryClient();

  // Queries
  const { data: studentData, isLoading: loadingStudents } = useStudents(
    currentTenantId || undefined,
    classFilter === "all" ? undefined : classFilter,
    search || undefined,
    statusFilter,
    genderFilter,
    currentPage,
    itemsPerPage,
  );

  const students = useMemo(() => {
    const list = studentData?.students || [];
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
  }, [studentData]);
  const totalItems = studentData?.total || 0;
  const totalPages = studentData?.totalPages || 1;
  const loading = loadingStudents; // only true on first load, not on search refetches

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { year } = useActiveAcademicYear();
  const classIdParam = searchParams.get("classId");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const studentUrlParam = searchParams.get("student") || searchParams.get("studentId");

  // Sync initial URL search params into state (run once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (classIdParam) {
      dispatch({ type: 'SET_CLASS_FILTER', payload: classIdParam });
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

  // Update browser URL query params whenever pagination or filters change
  const updateUrlParams = useCallback((page: number, limit: number, searchVal?: string, classVal?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page)); else params.delete("page");
    if (limit !== 15) params.set("limit", String(limit)); else params.delete("limit");
    if (searchVal) params.set("search", searchVal); else params.delete("search");
    if (classVal && classVal !== "all") params.set("classId", classVal); else if (classVal === "all") params.delete("classId");

    const newQuery = params.toString();
    const newPath = newQuery ? `${pathname}?${newQuery}` : pathname;
    router.replace(newPath, { scroll: false });
  }, [pathname, router, searchParams]);

  // --- Handlers ---

  const handleOpenCreate = () => dispatch({ type: 'OPEN_CREATE' });

  const handleOpenEdit = (student: StudentInfo) => dispatch({ type: 'OPEN_EDIT', payload: student });

  const [viewingStudentSnapshot, setViewingStudentSnapshot] = useState<StudentInfo | null>(null);

  // Synchronize URL ?student= query parameter into viewingStudent on initial load, refresh, or URL change
  useEffect(() => {
    if (!studentUrlParam) {
      if (viewingStudentSnapshot) {
        setViewingStudentSnapshot(null);
      }
      return;
    }

    // 1. Check if student is already in current students list
    const found = students.find(
      (s) => s.id === studentUrlParam || s.rollNumber === studentUrlParam || (s as any).username === studentUrlParam
    );
    if (found) {
      if (viewingStudentSnapshot?.id !== found.id) {
        setViewingStudentSnapshot(found);
      }
      return;
    }

    // 2. If not in current page list, fetch this specific student by search
    let isMounted = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/students?tenantId=${currentTenantId}&search=${encodeURIComponent(studentUrlParam)}`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.students || data.items || [];
          const match = items.find(
            (s: any) => s.id === studentUrlParam || s.rollNumber === studentUrlParam || s.username === studentUrlParam
          );
          if (match && isMounted) {
            setViewingStudentSnapshot(match);
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
  }, [studentUrlParam, students, currentTenantId]);

  // Derive viewing student dynamically from the latest students list
  const viewingStudent = useMemo(() => {
    if (!viewingStudentSnapshot) return null;
    return students.find((s) => s.id === viewingStudentSnapshot.id) || viewingStudentSnapshot;
  }, [students, viewingStudentSnapshot]);

  const handleOpenView = (student: StudentInfo) => {
    setViewingStudentSnapshot(student);
    const params = new URLSearchParams(searchParams.toString());
    params.set("student", student.rollNumber || (student as any).username || student.id);
    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  const handleCloseView = () => {
    setViewingStudentSnapshot(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("student");
    params.delete("studentId");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  const handleSubmit = async () => {
    const isCreate = dialogMode === "create";

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

    // OPTIMISTIC UPDATE: Update the UI instantly if editing
    if (!isCreate && editingStudent) {
      const updatedStudent = { ...editingStudent, ...formData };
      queryClient.setQueriesData(
        { queryKey: queryKeys.students },
        (old: any) => {
          if (!old || !old.students) return old;
          return {
            ...old,
            students: old.students.map((s: any) =>
              s.id === editingStudent.id ? updatedStudent : s,
            ),
          };
        },
      );
    }

    toast.promise(
      (async () => {
        dispatch({ type: 'SET_SUBMITTING', payload: true });
        try {
          const url = "/api/students";
          const method = isCreate ? "POST" : "PUT";

          // Clean payload: omit empty strings for optional fields to avoid backend schema validation errors
          const payload: Record<string, any> = {
            name: formData.name.trim(),
            rollNumber: formData.rollNumber.trim(),
            classId: formData.classId,
            gender: formData.gender || "male",
            transportEnabled: Boolean(formData.transportEnabled),
          };

          if (isCreate && year?.name) {
            payload.academicYear = year.name;
          }

          if (!isCreate && editingStudent) {
            payload.id = editingStudent.id;
          }
          if (formData.email?.trim()) {
            payload.email = formData.email.trim();
          }
          if (formData.phone?.trim()) {
            payload.phone = formData.phone.trim();
          }
          if (formData.username?.trim()) {
            payload.username = formData.username.trim();
          }
          if (formData.password?.trim()) {
            payload.password = formData.password.trim();
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

          const res = await apiFetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to ${dialogMode} student`);
          }

          const resData = await res.json().catch(() => ({}));
          dispatch({ type: 'CLOSE_DIALOG' });
          // Refresh from server to ensure total accuracy
          queryClient.invalidateQueries({ queryKey: queryKeys.students });
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard", currentTenantId],
          });
          // The profile view caches by id, so a write has to clear that too.
          if (!isCreate && editingStudent?.id) {
            queryClient.invalidateQueries({ queryKey: ["student-detail", editingStudent.id] });
          }
          if (isCreate && resData.username) {
            return `Student registered! School ID: ${resData.username}`;
          }
          return isCreate
            ? "Student registered successfully"
            : "Student details updated";
        } finally {
          dispatch({ type: 'SET_SUBMITTING', payload: false });
        }
      })(),
      {
        loading: isCreate
          ? "Registering new student..."
          : "Updating student details...",
        success: (msg) => msg,
        error: (err: any) => err.message,
      },
    );
  };

  const handleDelete = async (id: string) => {
    toast.promise(
      (async () => {
        const res = await apiFetch(`/api/students?id=${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to delete student");
        }

        // Refresh from server
        queryClient.invalidateQueries({ queryKey: queryKeys.students });
        queryClient.invalidateQueries({
          queryKey: ["admin-dashboard", currentTenantId],
        });

        // Force a RED morphing pill for deletion
        throw new Error("Student record removed");
      })(),
      {
        loading: "Deleting student records...",
        success: () => "", // Not reached
        error: (err: any) => err.message, // Shows the red pill
      },
    );
  };

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
          mode={dialogMode}
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
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1">
          <SearchInput
              id="search_students"
              value={search}
              onChange={(val) => dispatch({ type: 'SET_SEARCH', payload: val })}
              placeholder="Search by name..."
              delay={400}
              className="flex-1 max-w-sm"
              inputClassName="h-9 sm:h-10"
            />
          <ClassSelect
            value={classFilter}
            onValueChange={(v) => {
              dispatch({ type: 'SET_CLASS_FILTER', payload: v });
              updateUrlParams(1, itemsPerPage, search, v);
            }}
            showAllOption
            className="w-full sm:w-44 h-9 sm:h-10"
            placeholder="Filter by class"
          />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
            <Select
              value={genderFilter}
              onValueChange={(v) => {
                dispatch({ type: 'SET_GENDER_FILTER', payload: v });
                updateUrlParams(1, itemsPerPage, search, classFilter);
              }}
            >
              <SelectTrigger className="w-full sm:w-36 h-9 sm:h-10">
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
                updateUrlParams(1, itemsPerPage, search, classFilter);
              }}
            >
              <SelectTrigger className="w-full sm:w-36 h-9 sm:h-10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(canCreate || canEdit || canDelete) && (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <ImportExportButtons
              canCreate={canCreate}
              tenantId={currentTenantId || ""}
              onImportSuccess={() =>
                queryClient.invalidateQueries({ queryKey: queryKeys.students })
              }
            />
            {canCreate && (
              <Button
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white h-9 sm:h-10"
                onClick={handleOpenCreate}
                disabled={!year?.name}
                title={!year?.name ? "Choose an academic session first" : undefined}
              >
                <Plus className="size-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Read-only banner */}
      {!canCreate && !canEdit && !canDelete && (
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
          {loading ? (
            <StudentSkeleton />
          ) : (
            <>
              <StudentTable
                students={students}
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
                  updateUrlParams(p, itemsPerPage, search, classFilter);
                }}
                onLimitChange={(limit) => {
                  dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: limit });
                  updateUrlParams(1, limit, search, classFilter);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={(open) => dispatch({ type: open ? 'OPEN_CREATE' : 'CLOSE_DIALOG' })}
        mode={dialogMode}
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
