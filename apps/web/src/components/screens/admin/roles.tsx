"use client";

import { useReducer, useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { 
  useCustomRoles, 
  useStaff, 
  useCreateCustomRole, 
  useUpdateCustomRole, 
  useDeleteCustomRole, 
  useAssignRoleToUser 
} from "@/lib/graphql/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Shield, ShieldCheck, LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";

// Sub-components
import { RoleCard } from "./roles/RoleCard";
import { RoleTable } from "./roles/RoleTable";
import { RoleDialog } from "./roles/RoleDialog";
import { AssignRoleDialog } from "./roles/AssignRoleDialog";

// Types & Constants
import type { RoleRecord } from "./roles/types";
import { RoleSkeleton } from "./roles/RoleSkeleton";

type State = {
  viewMode: 'grid' | 'table';
  dialogOpen: boolean;
  editingRole: RoleRecord | null;
  saving: boolean;
  assignOpen: boolean;
  activeRole: RoleRecord | null;
  assigningLoading: string | null;
  searchQuery: string;
  name: string;
  description: string;
  color: string;
  permissions: Record<string, string[]>;
};

type Action =
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'table' }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'OPEN_CREATE_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG'; payload: RoleRecord }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'OPEN_ASSIGN_DIALOG'; payload: RoleRecord }
  | { type: 'SET_ASSIGN_OPEN'; payload: boolean }
  | { type: 'SET_ASSIGNING_LOADING'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FORM'; payload: Partial<Pick<State, 'name' | 'description' | 'color' | 'permissions'>> };

const initialState: State = {
  viewMode: 'grid',
  dialogOpen: false,
  editingRole: null,
  saving: false,
  assignOpen: false,
  activeRole: null,
  assigningLoading: null,
  searchQuery: "",
  name: "",
  description: "",
  color: "#3b82f6",
  permissions: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };
    case 'SET_DIALOG_OPEN': return { ...state, dialogOpen: action.payload };
    case 'OPEN_CREATE_DIALOG':
      return {
        ...state,
        editingRole: null,
        name: "",
        description: "",
        color: "#3b82f6",
        permissions: {},
        dialogOpen: true
      };
    case 'OPEN_EDIT_DIALOG': {
      const role = action.payload;
      let perms = {};
      if (typeof role.permissions === 'string') {
        try {
          if (role.permissions !== "[object Object]") {
            perms = JSON.parse(role.permissions || "{}");
          }
        } catch (e) {
          console.error("Malformed permissions JSON:", e);
        }
      } else {
        perms = role.permissions || {};
      }
      return {
        ...state,
        editingRole: role,
        name: role.name,
        description: role.description || "",
        color: role.color || "#10b981",
        permissions: perms,
        dialogOpen: true
      };
    }
    case 'SET_SAVING': return { ...state, saving: action.payload };
    case 'OPEN_ASSIGN_DIALOG':
      return { ...state, activeRole: action.payload, assignOpen: true, searchQuery: "" };
    case 'SET_ASSIGN_OPEN': return { ...state, assignOpen: action.payload };
    case 'SET_ASSIGNING_LOADING': return { ...state, assigningLoading: action.payload };
    case 'SET_SEARCH_QUERY': return { ...state, searchQuery: action.payload };
    case 'SET_FORM': return { ...state, ...action.payload };
    default: return state;
  }
}

export function AdminRoles() {
  const { currentTenantId } = useAppStore();
  const [roleFilter, setRoleFilter] = useState("");
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    viewMode, dialogOpen, editingRole, saving, assignOpen, activeRole,
    assigningLoading, searchQuery, name, description, color, permissions
  } = state;

  // --- Queries ---
  const { 
    data: roles = [], 
    isLoading: loading, 
    refetch: fetchRoles 
  } = useCustomRoles(currentTenantId || "");

  const { 
    data: staffResponse, 
    refetch: refetchStaff,
    isLoading: assignLoading
  } = useStaff(currentTenantId || "", "staff", undefined, 1, 1000);

  const allStaff = staffResponse?.staff || [];

  // --- Mutations ---
  const { mutateAsync: createRole } = useCreateCustomRole();
  const { mutateAsync: updateRole } = useUpdateCustomRole();
  const { mutateAsync: deleteRole } = useDeleteCustomRole();
  const { mutateAsync: assignRoleMut } = useAssignRoleToUser();

  // Load view mode preference
  useEffect(() => {
    const saved = localStorage.getItem('roles_view_mode') as 'grid' | 'table';
    if (saved) dispatch({ type: 'SET_VIEW_MODE', payload: saved });
  }, []);

  // Save view mode preference
  const toggleView = (mode: 'grid' | 'table') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    localStorage.setItem('roles_view_mode', mode);
  };

  // Filtered roles based on search bar
  const displayedRoles = useMemo(() => {
    if (!roleFilter.trim()) return roles;
    const q = roleFilter.toLowerCase();
    return roles.filter((r) => 
      r.name.toLowerCase().includes(q) || 
      (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, roleFilter]);

  // Computed lists for assignment
  const { assignedUsers, availableUsers } = useMemo(() => {
    if (!activeRole) return { assignedUsers: [], availableUsers: [] };
    const assigned = allStaff.filter(u => u.customRole?.id === activeRole.id);
    const available = allStaff.filter(u => u.customRole?.id !== activeRole.id);
    return { assignedUsers: assigned, availableUsers: available };
  }, [allStaff, activeRole]);

  // --- Handlers ---
  const handleAssignChange = async (userId: string, targetRoleId: string | null) => {
    if (!currentTenantId) return;
    dispatch({ type: 'SET_ASSIGNING_LOADING', payload: userId });
    try {
      await assignRoleMut({
        userId,
        roleId: targetRoleId,
        tenantId: currentTenantId,
      });
      refetchStaff();
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || "Assignment failed");
    } finally {
      dispatch({ type: 'SET_ASSIGNING_LOADING', payload: null });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      if (editingRole) {
        await updateRole({
          id: editingRole.id,
          name,
          description,
          color,
          permissions,
        });
      } else {
        await createRole({
          tenantId: currentTenantId!,
          name,
          description,
          color,
          permissions,
        });
      }
      toast.success(`Role "${name}" ${editingRole ? "updated" : "created"} successfully`);
      dispatch({ type: 'SET_DIALOG_OPEN', payload: false });
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || "Failed to save role");
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRole(id);
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  const filteredAvailable = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- Rendering ---
  if (loading) {
    return <RoleSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/40 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/90 dark:border-slate-800 px-4.5 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 right-10 w-48 h-36 bg-sky-300/15 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          <div className="max-w-md min-w-0">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/40 shadow-2xs">
              <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400" />
              <span>Staff Access Control</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-1 sm:mt-1.5">
              Right Staff. Right Access.
            </h3>

            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 leading-snug font-normal">
              Granular access control and permission management for school faculty & staff.
            </p>
          </div>

          <div className="relative flex items-center justify-end shrink-0 pr-0.5 sm:pr-2">
            <div className="relative h-14 sm:h-20 md:h-22 aspect-[16/9] overflow-hidden select-none">
              <Image
                src="/assets/super-admin/roletop.avif"
                alt="Roles & Permissions"
                fill
                priority
                className="object-contain scale-125 drop-shadow-md"
                sizes="(max-width: 640px) 110px, (max-width: 768px) 160px, 200px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8.5 sm:size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100/80 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Shield className="size-4 sm:size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight truncate">
                Roles &amp; Permissions
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60">
                School Staff
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 font-normal truncate">
              Define custom roles and assign granular permissions to staff members
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search roles */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search roles…"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-8 h-8.5 text-xs rounded-xl bg-card border-border"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-muted/80 rounded-xl border border-border/50 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7.5 px-2.5 gap-1.5 text-xs rounded-lg transition-all",
                viewMode === 'grid' && "bg-card shadow-2xs font-semibold text-blue-600 dark:text-blue-400"
              )}
              onClick={() => toggleView('grid')}
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7.5 px-2.5 gap-1.5 text-xs rounded-lg transition-all",
                viewMode === 'table' && "bg-card shadow-2xs font-semibold text-blue-600 dark:text-blue-400"
              )}
              onClick={() => toggleView('table')}
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>

          {/* Create Role Button */}
          <Button 
            onClick={() => dispatch({ type: 'OPEN_CREATE_DIALOG' })} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8.5 sm:h-9 px-3.5 rounded-xl gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Create Role</span>
          </Button>
        </div>
      </div>

      {/* 3. Roles Display */}
      {displayedRoles.length === 0 ? (
        <Card className="border-dashed rounded-2xl bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Shield className="size-6 opacity-80" />
            </div>
            <p className="text-base font-bold text-foreground">
              {roleFilter ? "No matching roles found" : "No custom roles yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
              {roleFilter 
                ? `No roles match your search term "${roleFilter}". Try searching with a different term.`
                : "Create custom roles to grant specific staff permissions like Finance Manager, Registrar, or Coordinator."}
            </p>
            {!roleFilter && (
              <Button onClick={() => dispatch({ type: 'OPEN_CREATE_DIALOG' })} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shadow-xs">
                <Plus className="size-3.5 mr-1.5" /> Create First Role
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
          {displayedRoles.map((role: RoleRecord) => {
            const count = allStaff.filter(u => u.customRole?.id === role.id).length;
            return (
              <RoleCard
                key={role.id}
                role={{ ...role, userCount: count }}
                onEdit={(r) => dispatch({ type: 'OPEN_EDIT_DIALOG', payload: r })}
                onAssign={(r) => dispatch({ type: 'OPEN_ASSIGN_DIALOG', payload: r })}
                onDelete={handleDeleteRole}
              />
            );
          })}
        </div>
      ) : (
        <RoleTable 
          roles={displayedRoles.map(role => ({
            ...role,
            userCount: allStaff.filter(u => u.customRole?.id === role.id).length
          }))}
          allStaff={allStaff}
          onEdit={(r) => dispatch({ type: 'OPEN_EDIT_DIALOG', payload: r })}
          onAssign={(r) => dispatch({ type: 'OPEN_ASSIGN_DIALOG', payload: r })}
          onDelete={handleDeleteRole}
        />
      )}

      {/* 4. Redesigned Create / Edit Role Modal */}
      <RoleDialog
        open={dialogOpen}
        onOpenChange={(v) => dispatch({ type: 'SET_DIALOG_OPEN', payload: v })}
        editingRole={editingRole}
        name={name}
        setName={(v) => dispatch({ type: 'SET_FORM', payload: { name: v } })}
        description={description}
        setDescription={(v) => dispatch({ type: 'SET_FORM', payload: { description: v } })}
        color={color}
        setColor={(v) => dispatch({ type: 'SET_FORM', payload: { color: v } })}
        permissions={permissions}
        setPermissions={(v) => dispatch({ type: 'SET_FORM', payload: { permissions: v } })}
        saving={saving}
        onSave={handleSave}
      />

      {/* 5. Assign Staff Dialog */}
      <AssignRoleDialog
        open={assignOpen}
        onOpenChange={(v) => dispatch({ type: 'SET_ASSIGN_OPEN', payload: v })}
        activeRole={activeRole}
        loading={assignLoading}
        assignedUsers={assignedUsers}
        filteredAvailable={filteredAvailable}
        searchQuery={searchQuery}
        setSearchQuery={(v) => dispatch({ type: 'SET_SEARCH_QUERY', payload: v })}
        assigningLoading={assigningLoading}
        onAssignChange={handleAssignChange}
      />
    </div>
  );
}
