"use client";

import { useState, useReducer } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useModulePermissions } from "@/hooks/use-permissions";
import { useAppStore } from "@/store/use-app-store";
import { useViewMode } from "@/hooks/use-view-mode";
import { toast } from "sonner";

// Sub-components
import { SubjectsHeader } from "./subjects/SubjectsHeader";
import { SubjectsFilters } from "./subjects/SubjectsFilters";
import { SubjectsTableView } from "./subjects/SubjectsTableView";
import { SubjectsGridView } from "./subjects/SubjectsGridView";
import { SubjectDialogs } from "./subjects/SubjectDialogs";
import { Skeleton } from "@/components/ui/skeleton";

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  className: string;
  teacherName?: string;
  classId: string;
  teacherId: string;
}

const emptyForm = { name: "", code: "", classId: "", teacherId: "" };

type State = {
  search: string;
  classFilter: string;
  createOpen: boolean;
  form: typeof emptyForm;
  editOpen: boolean;
  editForm: { id: string } & typeof emptyForm;
  deleteDialogOpen: boolean;
  deleteTarget: SubjectInfo | null;
};

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_CLASS_FILTER'; payload: string }
  | { type: 'SET_CREATE_OPEN'; payload: boolean }
  | { type: 'SET_FORM'; payload: Partial<typeof emptyForm> }
  | { type: 'OPEN_EDIT'; payload: SubjectInfo }
  | { type: 'SET_EDIT_OPEN'; payload: boolean }
  | { type: 'SET_EDIT_FORM'; payload: Partial<{ id: string } & typeof emptyForm> }
  | { type: 'OPEN_DELETE'; payload: SubjectInfo }
  | { type: 'SET_DELETE_OPEN'; payload: boolean };

const initialState: State = {
  search: "",
  classFilter: "",
  createOpen: false,
  form: { ...emptyForm },
  editOpen: false,
  editForm: { id: "", ...emptyForm },
  deleteDialogOpen: false,
  deleteTarget: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_CLASS_FILTER':
      return { ...state, classFilter: action.payload };
    case 'SET_CREATE_OPEN':
      return { ...state, createOpen: action.payload, form: action.payload ? state.form : { ...emptyForm } };
    case 'SET_FORM':
      return { ...state, form: { ...state.form, ...action.payload } };
    case 'OPEN_EDIT':
      return {
        ...state,
        editOpen: true,
        editForm: {
          id: action.payload.id,
          name: action.payload.name,
          code: action.payload.code,
          classId: action.payload.classId,
          teacherId: action.payload.teacherId || "",
        },
      };
    case 'SET_EDIT_OPEN':
      return { ...state, editOpen: action.payload };
    case 'SET_EDIT_FORM':
      return { ...state, editForm: { ...state.editForm, ...action.payload } };
    case 'OPEN_DELETE':
      return { ...state, deleteDialogOpen: true, deleteTarget: action.payload };
    case 'SET_DELETE_OPEN':
      return { ...state, deleteDialogOpen: action.payload, deleteTarget: action.payload ? state.deleteTarget : null };
    default:
      return state;
  }
}

export function AdminSubjects() {
  const { currentTenantId } = useAppStore();
  const { canCreate, canEdit, canDelete } = useModulePermissions("subjects");
  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects", currentTenantId],
    queryFn: async () => {
      const res = await apiFetch("/api/subjects");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes", "min"],
    queryFn: async () => {
      const res = await apiFetch("/api/classes?mode=min");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["teachers", "min"],
    queryFn: async () => {
      const res = await apiFetch("/api/teachers?mode=min");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    search,
    classFilter,
    createOpen,
    form,
    editOpen,
    editForm,
    deleteDialogOpen,
    deleteTarget,
  } = state;

  const [viewMode, setViewMode] = useViewMode("subjects", "table");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiFetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create subject");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiFetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update subject");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/subjects?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete subject");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const loading = (subjectsLoading && subjects.length === 0) || (classesLoading && classes.length === 0);

  const filtered = (subjects as SubjectInfo[]).filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.code.toLowerCase().includes(search.toLowerCase()) || 
      s.className.toLowerCase().includes(search.toLowerCase()) ||
      (s.teacherName && s.teacherName.toLowerCase().includes(search.toLowerCase()));
    const matchesClass = classFilter === "all" || s.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleCreate = async () => {
    if (!form.name || !form.code || !form.classId) {
      toast.error("Please fill in all required fields");
      return;
    }
    const promise = createMutation.mutateAsync({ ...form, teacherId: form.teacherId || null });
    toast.promise(promise, { loading: "Creating subject...", success: "Subject created successfully!", error: (err: any) => err.message || "Failed to create subject" });
    try {
      await promise;
      dispatch({ type: 'SET_CREATE_OPEN', payload: false });
    } catch {}
  };

  const handleEdit = async () => {
    if (!editForm.name || !editForm.code || !editForm.classId) {
      toast.error("Please fill in all required fields");
      return;
    }
    const promise = updateMutation.mutateAsync({ ...editForm, teacherId: editForm.teacherId || null });
    toast.promise(promise, { loading: "Updating subject...", success: "Subject updated successfully!", error: (err: any) => err.message || "Failed to update subject" });
    try {
      await promise;
      dispatch({ type: 'SET_EDIT_OPEN', payload: false });
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const promise = (async () => {
      await deleteMutation.mutateAsync(deleteTarget.id);
      dispatch({ type: 'SET_DELETE_OPEN', payload: false });
      return "Subject record removed";
    })();
    toast.promise(promise, { loading: "Deleting subject...", success: (msg) => msg, error: (err: any) => err.message });
    try { await promise; } catch {}
  };

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

      <SubjectsHeader 
        totalSubjects={subjects.length}
        canCreate={canCreate}
        onAddClick={() => dispatch({ type: 'SET_CREATE_OPEN', payload: true })}
      />

      <SubjectsFilters 
        search={search}
        onSearchChange={(v) => dispatch({ type: 'SET_SEARCH', payload: v })}
        classFilter={classFilter}
        onClassFilterChange={(v) => dispatch({ type: 'SET_CLASS_FILTER', payload: v })}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-40">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !classFilter ? (
        <div className="animate-in fade-in-50 duration-300 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
              <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Select a Class</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose a class below to view its subjects</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {(classes || []).map((c: any) => (
              <button
                key={c.id}
                type="button"
                onClick={() => dispatch({ type: 'SET_CLASS_FILTER', payload: c.id })}
                className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 px-3 py-5 text-center shadow hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:border-emerald-500/60 transition-all duration-200 active:scale-95 cursor-pointer overflow-hidden"
              >
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-2xl" />
                <span className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 flex items-center justify-center transition-colors duration-200">
                  <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-tight">{c.name}</span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full">{c.section}</span>
              </button>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="py-20 text-center text-muted-foreground">
            <BookOpen className="size-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No subjects found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <SubjectsTableView 
          filtered={filtered}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(s) => dispatch({ type: 'OPEN_EDIT', payload: s })}
          onDelete={(s) => dispatch({ type: 'OPEN_DELETE', payload: s })}
        />
      ) : (
        <SubjectsGridView 
          filtered={filtered}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(s) => dispatch({ type: 'OPEN_EDIT', payload: s })}
          onDelete={(s) => dispatch({ type: 'OPEN_DELETE', payload: s })}
        />
      )}

      <SubjectDialogs 
        createOpen={createOpen}
        setCreateOpen={(v) => dispatch({ type: 'SET_CREATE_OPEN', payload: v })}
        form={form}
        setForm={(v) => dispatch({ type: 'SET_FORM', payload: v })}
        classes={classes}
        teachers={teachers}
        onCreate={handleCreate}
        creating={createMutation.isPending}
        editOpen={editOpen}
        setEditOpen={(v) => dispatch({ type: 'SET_EDIT_OPEN', payload: v })}
        editForm={editForm}
        setEditForm={(v) => dispatch({ type: 'SET_EDIT_FORM', payload: v })}
        onEdit={handleEdit}
        updating={updateMutation.isPending}
        deleteOpen={deleteDialogOpen}
        setDeleteOpen={(v) => dispatch({ type: 'SET_DELETE_OPEN', payload: v })}
        deleteTarget={deleteTarget}
        onDelete={handleDelete}
      />
    </div>
  );
}
