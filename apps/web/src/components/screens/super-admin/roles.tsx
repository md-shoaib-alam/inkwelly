"use client";

import { apiFetch } from "@/lib/api";
import { useState, useReducer, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Sub-components
import { RoleHeader } from "./roles/RoleHeader";
import { RoleHeroBanner } from "./roles/RoleHeroBanner";
import { RoleTemplates } from "./roles/RoleTemplates";
import { RoleGrid } from "./roles/RoleGrid";
import { RoleDialogs } from "./roles/RoleDialogs";

// Types & Reducer
import { 
  PlatformRoleRecord, 
  ROLE_TEMPLATES 
} from "./roles/types";
import { rolesReducer, initialState } from "./roles/reducer";

export function SuperAdminRoles() {
  const [activeTab, setActiveTab] = useState<"templates" | "roles">("templates");
  const [state, dispatch] = useReducer(rolesReducer, initialState);

  const {
    roles,
    loading,
    dialogOpen,
    editingRole,
    saving,
    name,
    description,
    color,
    permissions,
    assignDialogOpen,
    assigningRole,
    assignedUsers,
    availableUsers,
    assignLoading,
    assignSaving,
    userSearch,
  } = state;

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiFetch("/api/platform/roles");
      if (!res.ok) throw new Error();
      const data = await res.json();
      dispatch({ type: "SET_ROLES", roles: data });
    } catch {
      toast.error("Failed to load platform roles");
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // ── Role CRUD handlers ──

  const openCreateDialog = (template?: (typeof ROLE_TEMPLATES)[0]) => {
    dispatch({ type: "SET_EDITING_ROLE", role: null });
    if (template) {
      dispatch({ type: "SET_NAME", name: template.name });
      dispatch({ type: "SET_DESCRIPTION", description: template.description });
      dispatch({ type: "SET_COLOR", color: template.color });
      dispatch({ type: "SET_PERMISSIONS", permissions: { ...template.permissions } });
    } else {
      dispatch({ type: "SET_NAME", name: "" });
      dispatch({ type: "SET_DESCRIPTION", description: "" });
      dispatch({ type: "SET_COLOR", color: "#059669" });
      dispatch({ type: "SET_PERMISSIONS", permissions: {} });
    }
    dispatch({ type: "SET_DIALOG_OPEN", open: true });
  };

  const openEditDialog = (role: PlatformRoleRecord) => {
    dispatch({ type: "SET_EDITING_ROLE", role });
    dispatch({ type: "SET_NAME", name: role.name });
    dispatch({ type: "SET_DESCRIPTION", description: role.description || "" });
    dispatch({ type: "SET_COLOR", color: role.color });
    dispatch({ type: "SET_PERMISSIONS", permissions: JSON.parse(role.permissions || "{}") });
    dispatch({ type: "SET_DIALOG_OPEN", open: true });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }
    dispatch({ type: "SET_SAVING", saving: true });
    try {
      const body = { name, description, color, permissions };
      const url = editingRole ? `/api/platform/roles/${editingRole.id}` : "/api/platform/roles";
      const res = await apiFetch(url, {
        method: editingRole ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${editingRole ? "update" : "create"} role`);
      }
      toast.success(`Platform role "${name}" ${editingRole ? "updated" : "created"} successfully`);
      dispatch({ type: "SET_DIALOG_OPEN", open: false });
      fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const usersRes = await apiFetch(`/api/platform/roles/${id}/users`);
      const usersData = await usersRes.json();
      if (Array.isArray(usersData) && usersData.length > 0) {
        toast.error(`Cannot delete: ${usersData.length} user(s) are assigned to this role.`);
        return;
      }

      const res = await apiFetch(`/api/platform/roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      toast.success("Platform role deleted successfully");
      fetchRoles();
    } catch {
      toast.error("Failed to delete role");
    }
  };

  // ── User Assignment handlers ──

  const openAssignDialog = async (role: PlatformRoleRecord) => {
    dispatch({ type: "SET_ASSIGNING_ROLE", role });
    dispatch({ type: "SET_ASSIGNED_USERS", users: [] });
    dispatch({ type: "SET_AVAILABLE_USERS", users: [] });
    dispatch({ type: "SET_USER_SEARCH", search: "" });
    dispatch({ type: "SET_ASSIGN_DIALOG_OPEN", open: true });
    dispatch({ type: "SET_ASSIGN_LOADING", loading: true });

    try {
      const [assignedRes, availableRes] = await Promise.all([
        apiFetch(`/api/platform/roles/${role.id}/users`),
        apiFetch(`/api/platform/roles/${role.id}/available-users`),
      ]);
      if (!assignedRes.ok || !availableRes.ok) throw new Error();
      dispatch({ type: "SET_ASSIGNED_USERS", users: await assignedRes.json() });
      dispatch({ type: "SET_AVAILABLE_USERS", users: await availableRes.json() });
    } catch {
      toast.error("Failed to load users");
    } finally {
      dispatch({ type: "SET_ASSIGN_LOADING", loading: false });
    }
  };

  const handleAssignAction = async (userId: string, action: "assign" | "unassign") => {
    if (!assigningRole) return;
    dispatch({ type: "SET_ASSIGN_SAVING", saving: true });
    try {
      const res = await apiFetch(`/api/platform/roles/${assigningRole.id}/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) throw new Error();

      dispatch({ type: "UPDATE_USER_LISTS", action, userId });
      toast.success(`Role ${action}ed successfully`);
      fetchRoles();
    } catch {
      toast.error(`Failed to ${action} role`);
    } finally {
      dispatch({ type: "SET_ASSIGN_SAVING", saving: false });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="size-10 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Syncing platform permissions…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* 1. Hero Banner */}
      <RoleHeroBanner />

      {/* 2. Header with Tabs in place of that text */}
      <RoleHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateRole={() => openCreateDialog()} 
      />

      {/* 3. Main Content: Toggled View for Desktop & Mobile */}
      <div className="space-y-4 animate-in fade-in-50 duration-200">
        {activeTab === "templates" ? (
          <RoleTemplates 
            onSelectTemplate={(t) => openCreateDialog(t)} 
          />
        ) : (
          <RoleGrid 
            roles={roles}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onAssignUsers={openAssignDialog}
          />
        )}
      </div>

      {/* 4. CRUD and Assignment Dialogs */}
      <RoleDialogs 
        dialogOpen={dialogOpen} setDialogOpen={(v) => dispatch({ type: "SET_DIALOG_OPEN", open: v })}
        editingRole={editingRole}
        name={name} setName={(v) => dispatch({ type: "SET_NAME", name: v })}
        description={description} setDescription={(v) => dispatch({ type: "SET_DESCRIPTION", description: v })}
        color={color} setColor={(v) => dispatch({ type: "SET_COLOR", color: v })}
        permissions={permissions} togglePermission={(m, a) => dispatch({ type: "TOGGLE_PERMISSION", module: m, action: a })}
        onSave={handleSave} saving={saving}

        assignDialogOpen={assignDialogOpen} setAssignDialogOpen={(v) => dispatch({ type: "SET_ASSIGN_DIALOG_OPEN", open: v })}
        assigningRole={assigningRole}
        assignedUsers={assignedUsers}
        availableUsers={availableUsers}
        assignLoading={assignLoading}
        assignSaving={assignSaving}
        userSearch={userSearch} setUserSearch={(v) => dispatch({ type: "SET_USER_SEARCH", search: v })}
        onAssign={(uid) => handleAssignAction(uid, "assign")}
        onUnassign={(uid) => handleAssignAction(uid, "unassign")}
      />
    </div>
  );
}

