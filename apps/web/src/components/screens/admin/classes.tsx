"use client";

import { apiFetch } from "@/lib/api";
import { useMemo, useReducer } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { School } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import type { ClassInfo } from "@/lib/types";
import { useModulePermissions } from "@/hooks/use-permissions";
import { useClasses, useTeachers } from "@/lib/graphql/hooks";
import { useAppStore } from "@/store/use-app-store";
import { useViewMode } from "@/hooks/use-view-mode";

// Sub-components
import { ReadOnlyBanner } from "./classes/ReadOnlyBanner";
import { ClassesHeader } from "./classes/ClassesHeader";
import { ClassesTableView } from "./classes/ClassesTableView";
import { ClassesGridView } from "./classes/ClassesGridView";
import { ClassDialogs } from "./classes/ClassDialogs";

interface DialogState {
  addOpen: boolean;
  addFormData: {
    name: string;
    section: string;
    grade: string;
    capacity: string;
    classTeacherId: string;
  };
  adding: boolean;
  editOpen: boolean;
  editData: {
    id: string;
    name: string;
    section: string;
    grade: string;
    capacity: string;
    classTeacherId: string;
  };
  editing: boolean;
  deleteOpen: boolean;
  deleteTarget: ClassInfo | null;
  deleting: boolean;
}

type DialogAction =
  | { type: "TOGGLE_ADD"; payload: boolean }
  | { type: "SET_ADD_FORM"; payload: Partial<DialogState["addFormData"]> }
  | { type: "SET_ADDING"; payload: boolean }
  | { type: "RESET_ADD" }
  | { type: "OPEN_EDIT"; payload: ClassInfo }
  | { type: "TOGGLE_EDIT"; payload: boolean }
  | { type: "SET_EDIT_FORM"; payload: Partial<DialogState["editData"]> }
  | { type: "SET_EDITING"; payload: boolean }
  | { type: "OPEN_DELETE"; payload: ClassInfo }
  | { type: "TOGGLE_DELETE"; payload: boolean }
  | { type: "SET_DELETING"; payload: boolean };

const initialDialogState: DialogState = {
  addOpen: false,
  addFormData: { name: "", section: "", grade: "", capacity: "40", classTeacherId: "" },
  adding: false,
  editOpen: false,
  editData: { id: "", name: "", section: "", grade: "", capacity: "40", classTeacherId: "" },
  editing: false,
  deleteOpen: false,
  deleteTarget: null,
  deleting: false,
};

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case "TOGGLE_ADD":
      return { ...state, addOpen: action.payload };
    case "SET_ADD_FORM":
      return { ...state, addFormData: { ...state.addFormData, ...action.payload } };
    case "SET_ADDING":
      return { ...state, adding: action.payload };
    case "RESET_ADD":
      return { ...state, addFormData: { name: "", section: "", grade: "", capacity: "40", classTeacherId: "" } };
    case "OPEN_EDIT":
      return {
        ...state,
        editOpen: true,
        editData: {
          id: action.payload.id,
          name: action.payload.name,
          section: action.payload.section,
          grade: action.payload.grade,
          capacity: String(action.payload.capacity),
          classTeacherId: action.payload.classTeacherId || "",
        },
      };
    case "TOGGLE_EDIT":
      return { ...state, editOpen: action.payload };
    case "SET_EDIT_FORM":
      return { ...state, editData: { ...state.editData, ...action.payload } };
    case "SET_EDITING":
      return { ...state, editing: action.payload };
    case "OPEN_DELETE":
      return { ...state, deleteOpen: true, deleteTarget: action.payload };
    case "TOGGLE_DELETE":
      return { ...state, deleteOpen: action.payload };
    case "SET_DELETING":
      return { ...state, deleting: action.payload };
    default:
      return state;
  }
}

export function AdminClasses() {
  const { currentTenantId } = useAppStore();
  const { canCreate, canEdit, canDelete } = useModulePermissions("classes");
  const queryClient = useQueryClient();
  const { push } = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // ⚡ TanStack Query with GraphQL Group-wise hooks
  const { data: classesData, isLoading: classesLoading } = useClasses(currentTenantId || undefined);

  // Fetch school/tenant settings dynamically to determine grade creation mode
  const { data: settingsData } = useQuery({
    queryKey: ["tenant-settings", currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return null;
      const res = await apiFetch("/api/tenant-settings");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!currentTenantId,
  });

  const enableGradeSelection = settingsData?.enableGradeSelection ?? false;

  // Fetch all teachers in the tenant to populate the assign class teacher dropdown
  const { data: teachersData } = useTeachers(currentTenantId || undefined);
  const teachers = teachersData?.teachers || [];

  const classes = useMemo(() => {
    const list = classesData?.classes || [];
    return [...list].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [classesData]);

  const [viewMode, setViewMode] = useViewMode("classes", "grid");

  // Only show full skeleton if we have NO data at all
  const loading = classesLoading && classes.length === 0;

  const refetchClasses = () =>
    queryClient.invalidateQueries({ queryKey: ["classes", currentTenantId] });

  // Dialog State Reducer
  const [state, dispatch] = useReducer(dialogReducer, initialDialogState);
  const {
    addOpen,
    addFormData,
    adding,
    editOpen,
    editData,
    editing,
    deleteOpen,
    deleteTarget,
    deleting,
  } = state;

  const handleAddClass = async () => {
    const promise = (async () => {
      const res = await apiFetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addFormData,
          capacity: parseInt(addFormData.capacity),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add class");
      }
      return res.json();
    })();

    toast.promise(promise, {
      loading: "Creating new class...",
      success: "Class created successfully!",
      error: (err: any) => err.message,
    });

    dispatch({ type: "SET_ADDING", payload: true });
    try {
      await promise;
      dispatch({ type: "TOGGLE_ADD", payload: false });
      dispatch({ type: "RESET_ADD" });
      await refetchClasses();
    } catch (err) {
      // Error handled by toast.promise
    } finally {
      dispatch({ type: "SET_ADDING", payload: false });
    }
  };

  const handleEditClass = async () => {
    const updatedClassData = {
      ...editData,
      capacity: parseInt(editData.capacity),
    };

    // OPTIMISTIC UPDATE: Update the UI instantly
    queryClient.setQueryData(["classes", currentTenantId], (old: any) => {
      if (!old || !old.classes) return old;
      return {
        ...old,
        classes: old.classes.map((cls: any) => 
          cls.id === editData.id ? { ...cls, ...updatedClassData } : cls
        )
      };
    });

    const promise = (async () => {
      const res = await apiFetch("/api/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClassData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update class");
      }
      return res.json();
    })();

    toast.promise(promise, {
      loading: "Updating class details...",
      success: "Class updated successfully!",
      error: (err: any) => err.message,
    });

    dispatch({ type: "SET_EDITING", payload: true });
    try {
      await promise;
      dispatch({ type: "TOGGLE_EDIT", payload: false });
      await refetchClasses();
    } catch (err) {
      // On error, the invalidation in refetchClasses will fix the UI
    } finally {
      dispatch({ type: "SET_EDITING", payload: false });
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteTarget) return;

    const promise = (async () => {
      const res = await apiFetch(`/api/classes?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete class");
      }
      
      dispatch({ type: "TOGGLE_DELETE", payload: false });
      await refetchClasses();
      
      // Force RED pill morphing
      throw new Error("Class record removed");
    })();

    toast.promise(promise, {
      loading: "Deleting class...",
      success: () => "",
      error: (err: any) => err.message,
    });

    dispatch({ type: "SET_DELETING", payload: true });
    try {
      await promise;
    } catch (err) {
      // Error handled by toast.promise
    } finally {
      dispatch({ type: "SET_DELETING", payload: false });
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "[&>div]:bg-red-500";
    if (percentage >= 75) return "[&>div]:bg-amber-500";
    if (percentage >= 50) return "[&>div]:bg-emerald-500";
    return "[&>div]:bg-emerald-400";
  };

  const handleViewStudents = (cls: ClassInfo) => push(`/${slug}/students?classId=${cls.id}`);
  const openEditDialog = (cls: ClassInfo) => dispatch({ type: "OPEN_EDIT", payload: cls });
  const openDeleteDialog = (cls: ClassInfo) => dispatch({ type: "OPEN_DELETE", payload: cls });

  return (
    <div className="space-y-6">
      <ReadOnlyBanner isVisible={!canCreate && !canEdit && !canDelete} />

      <ClassesHeader 
        totalClasses={classes.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        canCreate={canCreate}
        onAddClick={() => dispatch({ type: "TOGGLE_ADD", payload: true })}
      />

      {loading ? (
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
            <p className="text-lg font-medium">No classes found</p>
            <p className="text-sm text-muted-foreground">Create your first class to get started</p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <ClassesTableView 
          classes={classes}
          canEdit={canEdit}
          canDelete={canDelete}
          onViewStudents={handleViewStudents}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          getProgressColor={getProgressColor}
        />
      ) : (
        <ClassesGridView 
          classes={classes}
          canEdit={canEdit}
          canDelete={canDelete}
          onViewStudents={handleViewStudents}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          getProgressColor={getProgressColor}
        />
      )}

      <ClassDialogs 
        addOpen={addOpen}
        setAddOpen={(open) => dispatch({ type: "TOGGLE_ADD", payload: open })}
        addFormData={addFormData}
        setAddFormData={(v) => dispatch({ type: "SET_ADD_FORM", payload: v })}
        adding={adding}
        onAdd={handleAddClass}

        editOpen={editOpen}
        setEditOpen={(open) => dispatch({ type: "TOGGLE_EDIT", payload: open })}
        editData={editData}
        setEditData={(v) => dispatch({ type: "SET_EDIT_FORM", payload: v })}
        editing={editing}
        onEdit={handleEditClass}

        deleteOpen={deleteOpen}
        setDeleteOpen={(open) => dispatch({ type: "TOGGLE_DELETE", payload: open })}
        deleteTarget={deleteTarget}
        deleting={deleting}
        onDelete={handleDeleteClass}
        enableGradeSelection={enableGradeSelection}
        teachers={teachers}
      />
    </div>
  );
}
