"use client";

import { useReducer, useEffect, useMemo, useState } from "react";
import { useViewMode } from "@/hooks/use-view-mode";
import { toast } from "sonner";
import { useModulePermissions } from "@/hooks/use-permissions";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { useTeachers } from "@/lib/graphql/hooks/academic.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/graphql/keys";
import { Pagination } from "@/components/shared/pagination";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Sub-components
import { TeacherDialog } from "./teachers/TeacherDialog";
import { TeacherDetailDialog } from "./teachers/TeacherDetailDialog";
import { TeacherProfileView } from "./teachers/TeacherProfileView";
import { TeacherSkeleton } from "./teachers/TeacherSkeleton";
import { TeachersHeader } from "./teachers/TeachersHeader";
import { TeachersTableView } from "./teachers/TeachersTableView";
import { TeachersGridView } from "./teachers/TeachersGridView";
import { TeachersEmptyState } from "./teachers/TeachersEmptyState";
import { Eye } from "lucide-react";
import type { TeacherInfo } from "./teachers/types";

const emptyFormData = {
  name: "",
  email: "",
  phone: "",
  qualification: "B.Ed",
  experience: "",
  password: "",
  gender: "male",
  dateOfBirth: "",
  teacherId: "",
  alternatePhone: "",
  address: "",
  role: "Faculty Member",
  subjects: "Mathematics",
  joiningDate: "",
  status: "active",
};

function validateTeacherForm(formData: typeof emptyFormData): boolean {
  if (!formData.name || !formData.email) {
    toast.error("Name and Email are required");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    toast.error("Please enter a valid email address");
    return false;
  }

  return true;
}

function updateTeacherOptimistic(
  queryClient: any,
  queryKey: any[],
  editingTeacher: TeacherInfo,
  formData: typeof emptyFormData
) {
  const updatedTeacher = { ...editingTeacher, ...formData };
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old || !old.teachers) return old;
    return {
      ...old,
      teachers: old.teachers.map((t: any) => t.id === editingTeacher.id ? updatedTeacher : t)
    };
  });
}


type State = {
  search: string;
  currentPage: number;
  itemsPerPage: number;
  dialogOpen: boolean;
  editingTeacher: TeacherInfo | null;
  formData: typeof emptyFormData;
  submitting: boolean;
  deletingId: string | null;
};

type Action =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_ITEMS_PER_PAGE"; payload: number }
  | { type: "OPEN_DIALOG"; payload: { teacher: TeacherInfo | null; formData: typeof emptyFormData } }
  | { type: "CLOSE_DIALOG" }
  | { type: "SET_FORM_DATA"; payload: typeof emptyFormData }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_DELETING_ID"; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.payload, currentPage: 1 };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_ITEMS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case "OPEN_DIALOG":
      return {
        ...state,
        dialogOpen: true,
        editingTeacher: action.payload.teacher,
        formData: action.payload.formData,
      };
    case "CLOSE_DIALOG":
      return {
        ...state,
        dialogOpen: false,
        editingTeacher: null,
        formData: emptyFormData,
      };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "SET_DELETING_ID":
      return { ...state, deletingId: action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  search: "",
  currentPage: 1,
  itemsPerPage: 15,
  dialogOpen: false,
  editingTeacher: null,
  formData: emptyFormData,
  submitting: false,
  deletingId: null,
};

export function AdminTeachers() {
  const { currentTenantId } = useAppStore();
  const { canCreate, canEdit, canDelete } = useModulePermissions("teachers");

  const [state, dispatch] = useReducer(reducer, initialState);
  const { search, currentPage, itemsPerPage, dialogOpen, editingTeacher, formData, submitting, deletingId } = state;
 

   const queryClient = useQueryClient();
 
   const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const teacherUrlParam = searchParams.get("teacher") || searchParams.get("teacherId");

  // Sync initial URL search params into state (run once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const parsedLimit = limitParam ? Number(limitParam) : NaN;
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      dispatch({ type: "SET_ITEMS_PER_PAGE", payload: parsedLimit });
    }
    const parsedPage = pageParam ? Number(pageParam) : NaN;
    if (Number.isInteger(parsedPage) && parsedPage > 0) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: parsedPage });
    }
  }, []);

  const updateUrlParams = (page: number, limit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page)); else params.delete("page");
    if (limit !== 15) params.set("limit", String(limit)); else params.delete("limit");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  const { data: teachersData, isLoading: loading } = useTeachers(
     currentTenantId || undefined,
     search || undefined,
     currentPage,
     itemsPerPage,
   );

  const teachers = useMemo(() => {
    const list = teachersData?.teachers || [];
    return [...list].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [teachersData]);
  
  const totalItems = teachersData?.total || 0;
  const totalPages = teachersData?.totalPages || 1;
  const [viewMode, setViewMode] = useViewMode("teachers", "grid");

  const handleOpenAdd = () => {
    dispatch({ type: "OPEN_DIALOG", payload: { teacher: null, formData: emptyFormData } });
  };

  const handleOpenEdit = (teacher: TeacherInfo) => {
    dispatch({
      type: "OPEN_DIALOG",
      payload: {
        teacher,
        formData: {
          ...emptyFormData,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone || "",
          qualification: teacher.qualification || "B.Ed",
          experience: teacher.experience || "",
          address: teacher.address || "",
          role: teacher.role || "Faculty Member",
          joiningDate: teacher.joiningDate || "",
          status: teacher.status || "active",
          password: "",
        },
      },
    });
  };

  const submitTeacherRequest = async (isEdit: boolean, queryKey: any[]) => {
    dispatch({ type: "SET_SUBMITTING", payload: true });
    try {
      const url = "/api/teachers";
      const method = isEdit ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingTeacher?.id, ...formData } : formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to ${isEdit ? "update" : "add"} teacher`);
      }

      dispatch({ type: "CLOSE_DIALOG" });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard', currentTenantId] });
      return isEdit ? "Teacher updated" : "Teacher added";
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  const handleSubmit = async () => {
    if (!validateTeacherForm(formData)) {
      return;
    }

    const isEdit = !!editingTeacher;
    const queryKey = [queryKeys.teachers, currentTenantId, search, currentPage, 12];

    if (isEdit && editingTeacher) {
      updateTeacherOptimistic(queryClient, queryKey, editingTeacher, formData);
    }

    toast.promise(
      submitTeacherRequest(isEdit, queryKey),
      {
        loading: `${editingTeacher ? "Updating" : "Adding"} teacher...`,
        success: (msg) => msg,
        error: (err: any) => err.message || "Action failed",
      },
    );
  };

  const deleteTeacherFromCache = (queryKey: any[], id: string) => {
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old || !old.teachers) return old;
      return {
        ...old,
        teachers: old.teachers.filter((t: any) => t.id !== id),
        total: Math.max(0, old.total - 1)
      };
    });
  };

  const deleteTeacherRequest = async (id: string, previousTeachers: any, queryKey: any[]) => {
    try {
      const res = await apiFetch(`/api/teachers?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Deletion failed");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard', currentTenantId] });
      dispatch({ type: "SET_DELETING_ID", payload: null });
      throw new Error("Teacher record removed");
    } catch (err) {
      queryClient.setQueryData(queryKey, previousTeachers);
      throw err;
    }
  };

  const executeDeletion = async (id: string) => {
    const queryKey = [queryKeys.teachers, currentTenantId, search, currentPage, 12];
    const previousTeachers = queryClient.getQueryData(queryKey);
    
    deleteTeacherFromCache(queryKey, id);

    toast.promise(
      deleteTeacherRequest(id, previousTeachers, queryKey),
      {
        loading: "Removing teacher record...",
        success: () => "",
        error: (err: any) => err.message,
      },
    );
  };

  const handleDelete = async (id: string) => {
    executeDeletion(id);
  };

  const [viewingTeacherSnapshot, setViewingTeacherSnapshot] = useState<TeacherInfo | null>(null);

  // Synchronize URL ?teacher= query parameter into viewingTeacher on initial load, refresh, or URL change
  useEffect(() => {
    if (!teacherUrlParam) {
      if (viewingTeacherSnapshot) {
        setViewingTeacherSnapshot(null);
      }
      return;
    }

    // 1. Check if teacher is already in current teachers list
    const found = teachers.find(
      (t) => t.id === teacherUrlParam || (t as any).teacherId === teacherUrlParam || (t as any).username === teacherUrlParam
    );
    if (found) {
      if (viewingTeacherSnapshot?.id !== found.id) {
        setViewingTeacherSnapshot(found);
      }
      return;
    }

    // 2. If not in current page list, fetch this specific teacher
    let isMounted = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/teachers?tenantId=${currentTenantId}&search=${encodeURIComponent(teacherUrlParam)}`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.teachers || [];
          const match = items.find(
            (t: any) => t.id === teacherUrlParam || t.teacherId === teacherUrlParam || t.username === teacherUrlParam
          );
          if (match && isMounted) {
            setViewingTeacherSnapshot(match);
          }
        }
      } catch (err) {
        console.error("Failed to load teacher from URL:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [teacherUrlParam, teachers, currentTenantId]);

  // Derive viewing teacher dynamically from the latest teachers list
  const viewingTeacher = useMemo(() => {
    if (!viewingTeacherSnapshot) return null;
    return teachers.find((t) => t.id === viewingTeacherSnapshot.id) || viewingTeacherSnapshot;
  }, [teachers, viewingTeacherSnapshot]);

  const handleOpenView = (teacher: TeacherInfo) => {
    setViewingTeacherSnapshot(teacher);
    const params = new URLSearchParams(searchParams.toString());
    params.set("teacher", (teacher as any).teacherId || (teacher as any).username || teacher.id);
    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  const handleCloseView = () => {
    setViewingTeacherSnapshot(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("teacher");
    params.delete("teacherId");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  if (loading || (teacherUrlParam && !viewingTeacher)) return <TeacherSkeleton />;

  if (viewingTeacher) {
    return (
      <div className="space-y-6">
        <TeacherProfileView
          teacher={viewingTeacher}
          onBack={handleCloseView}
          canEdit={canEdit}
          onEdit={(teacher) => {
            handleCloseView();
            handleOpenEdit(teacher);
          }}
        />

        <TeacherDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              dispatch({ type: "CLOSE_DIALOG" });
            }
          }}
          editingTeacher={editingTeacher}
          formData={formData}
          setFormData={(data: any) => dispatch({ type: "SET_FORM_DATA", payload: data })}
          submitting={submitting}
          onSubmit={handleSubmit}
          isFormValid={formData.name.trim() !== "" && formData.email.trim() !== ""}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-only banner */}
      {!canCreate && !canEdit && !canDelete && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            Read-only mode, you have view permission only for this module.
          </span>
        </div>
      )}

      <TeachersHeader 
        search={search}
        onSearchChange={(val) => dispatch({ type: "SET_SEARCH", payload: val })}
        viewMode={viewMode}
        setViewMode={setViewMode}
        canCreate={canCreate}
        onAddClick={handleOpenAdd}
      />

      {loading ? (
        <TeacherSkeleton />
      ) : teachers.length === 0 ? (
        <TeachersEmptyState />
      ) : viewMode === "table" ? (
        <TeachersTableView 
          teachers={teachers}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
          setDeletingId={(id) => dispatch({ type: "SET_DELETING_ID", payload: id })}
          onView={handleOpenView}
        />
      ) : (
        <TeachersGridView 
          teachers={teachers}
          canEdit={canEdit}
          canDelete={canDelete}
          deletingId={deletingId}
          setDeletingId={(id) => dispatch({ type: "SET_DELETING_ID", payload: id })}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onView={handleOpenView}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          dispatch({ type: "SET_CURRENT_PAGE", payload: page });
          updateUrlParams(page, itemsPerPage);
        }}
        onLimitChange={(limit) => {
          dispatch({ type: "SET_ITEMS_PER_PAGE", payload: limit });
          updateUrlParams(1, limit);
        }}
      />

      <TeacherDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: "CLOSE_DIALOG" });
          }
        }}
        editingTeacher={editingTeacher}
        formData={formData}
        setFormData={(data: any) => dispatch({ type: "SET_FORM_DATA", payload: data })}
        submitting={submitting}
        onSubmit={handleSubmit}
        isFormValid={formData.name.trim() !== "" && formData.email.trim() !== ""}
      />
    </div>
  );
}
