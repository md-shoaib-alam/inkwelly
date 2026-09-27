"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { toast } from "sonner";

// Sub-components
import { AdminHeader } from "./manage-admins/AdminHeader";
import { AdminTable } from "./manage-admins/AdminTable";
import { AdminDialogs } from "./manage-admins/AdminDialogs";
import { AdminRecord, AdminFormData, emptyFormData, AdminViewMode } from "./manage-admins/types";

type State = {
  admins: AdminRecord[];
  loading: boolean;
  search: string;
  statusFilter: string;
  viewMode: AdminViewMode;
  dialogOpen: boolean;
  editingAdmin: AdminRecord | null;
  formData: AdminFormData;
  submitting: boolean;
  showPassword: boolean;
  deletingId: string | null;
};

type Action =
  | { type: 'SET_ADMINS'; payload: AdminRecord[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: AdminViewMode }
  | { type: 'OPEN_DIALOG'; payload: { editingAdmin: AdminRecord | null; formData: AdminFormData } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_FORM_DATA'; payload: Partial<AdminFormData> }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SHOW_PASSWORD'; payload: boolean }
  | { type: 'SET_DELETING_ID'; payload: string | null };

const initialState: State = {
  admins: [],
  loading: true,
  search: "",
  statusFilter: "all",
  viewMode: "table",
  dialogOpen: false,
  editingAdmin: null,
  formData: emptyFormData,
  submitting: false,
  showPassword: false,
  deletingId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ADMINS':
      return { ...state, admins: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'OPEN_DIALOG':
      return {
        ...state,
        dialogOpen: true,
        editingAdmin: action.payload.editingAdmin,
        formData: action.payload.formData,
        showPassword: false
      };
    case 'CLOSE_DIALOG':
      return {
        ...state,
        dialogOpen: false,
        editingAdmin: null,
        formData: emptyFormData,
        showPassword: false
      };
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload };
    case 'SET_SHOW_PASSWORD':
      return { ...state, showPassword: action.payload };
    case 'SET_DELETING_ID':
      return { ...state, deletingId: action.payload };
    default:
      return state;
  }
}

export function SuperAdminManage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    admins,
    loading,
    search,
    statusFilter,
    viewMode,
    dialogOpen,
    editingAdmin,
    formData,
    submitting,
    showPassword,
    deletingId
  } = state;

  // Root admin is the first one in the list (ordered by createdAt asc)
  const rootAdminId = admins.length > 0 ? admins[0].id : null;

  // --- Fetch ---
  const fetchAdmins = useCallback(async () => {
    try {
      const res = await apiFetch("/api/super-admins?type=admins");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      dispatch({ type: 'SET_ADMINS', payload: json });
    } catch {
      console.error("Error fetching super admins");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // --- Filtering ---
  const filtered = useMemo(() => {
    return admins.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? a.isActive
          : !a.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [admins, search, statusFilter]);

  // --- Handlers ---
  const handleOpenAdd = () => {
    dispatch({
      type: 'OPEN_DIALOG',
      payload: { editingAdmin: null, formData: emptyFormData }
    });
  };

  const handleOpenEdit = (admin: AdminRecord) => {
    if (admin.id === rootAdminId) {
      toast.error("Cannot edit the root platform owner");
      return;
    }
    dispatch({
      type: 'OPEN_DIALOG',
      payload: {
        editingAdmin: admin,
        formData: {
          name: admin.name,
          email: admin.email,
          password: "",
          isActive: admin.isActive,
        }
      }
    });
  };

  const handleSubmit = async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const isEdit = !!editingAdmin;
      const method = isEdit ? "PUT" : "POST";

      const body = isEdit
        ? {
            id: editingAdmin.id,
            name: formData.name,
            ...(formData.password ? { password: formData.password } : {}),
            isActive: formData.isActive,
          }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          };

      const res = await apiFetch("/api/super-admins", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Failed to ${isEdit ? "update" : "create"} super admin`);
      }

      toast.success(`Super admin ${isEdit ? "updated" : "created"} successfully`);
      dispatch({ type: 'CLOSE_DIALOG' });
      fetchAdmins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/super-admins?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete");
      }
      toast.success("Super admin deleted successfully");
      dispatch({ type: 'SET_ADMINS', payload: admins.filter((a) => a.id !== id) });
      dispatch({ type: 'SET_DELETING_ID', payload: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const isFormValid = formData.name.trim() !== "" &&
    (!editingAdmin
      ? formData.email.trim() !== "" && formData.password.trim().length >= 6
      : true);

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader 
        search={search}
        onSearchChange={(s) => dispatch({ type: 'SET_SEARCH', payload: s })}
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => dispatch({ type: 'SET_STATUS_FILTER', payload: status })}
        onAddClick={handleOpenAdd}
        viewMode={viewMode}
        onViewModeChange={(mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode })}
        admins={admins}
      />

      <AdminTable 
        admins={admins}
        filteredAdmins={filtered}
        loading={loading}
        rootAdminId={rootAdminId}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
        setDeletingId={(id) => dispatch({ type: 'SET_DELETING_ID', payload: id })}
        viewMode={viewMode}
      />

      <AdminDialogs 
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) {
            // This case shouldn't happen as we use handleOpenAdd/Edit
          } else {
            dispatch({ type: 'CLOSE_DIALOG' });
          }
        }}
        editingAdmin={editingAdmin}
        formData={formData}
        setFormData={(fd) => dispatch({ type: 'SET_FORM_DATA', payload: fd })}
        showPassword={showPassword}
        setShowPassword={(s) => dispatch({ type: 'SET_SHOW_PASSWORD', payload: s })}
        onSubmit={handleSubmit}
        submitting={submitting}
        isFormValid={isFormValid}
      />
    </div>
  );
}

