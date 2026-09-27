"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { hasPermission } from "@/lib/permissions";

// Sub-components
import { StaffHeader } from "./staff/StaffHeader";
import { StaffTable } from "./staff/StaffTable";
import { StaffDialogs } from "./staff/StaffDialogs";

// Types
import { StaffRecord, PlatformRole, StaffFormData, emptyFormData, StaffViewMode } from "./staff/types";

export function SuperAdminStaff() {
  const { currentUser } = useAppStore();
  
  // Data state
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<StaffViewMode>("table");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(emptyFormData);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Permission checks
  const canCreate = hasPermission(currentUser, "staff", "create");
  const canEdit = hasPermission(currentUser, "staff", "edit");
  const canDelete = hasPermission(currentUser, "staff", "delete");

  // --- Fetch data ---

  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiFetch("/api/super-admins?type=staff");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setStaffList(json);
    } catch {
      console.error("Error fetching staff");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiFetch("/api/platform/roles");
      if (res.ok) {
        const json = await res.json();
        setRoles(
          json.map((r: { id: string; name: string; color: string; permissions: string }) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            permissions: r.permissions
          })),
        );
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStaff();
    fetchRoles();
  }, [fetchStaff, fetchRoles]);

  // --- Filtering ---

  const filtered = useMemo(() => {
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone && s.phone.toLowerCase().includes(search.toLowerCase())) ||
        (s.platformRole &&
          s.platformRole.name.toLowerCase().includes(search.toLowerCase())),
    );
  }, [staffList, search]);

  // --- Handlers ---

  const handleOpenAdd = () => {
    if (!canCreate) {
      toast.error("You don't have permission to create staff");
      return;
    }
    setEditingStaff(null);
    setFormData(emptyFormData);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (member: StaffRecord) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit staff");
      return;
    }
    setShowPassword(false);
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: "",
      phone: member.phone || "",
      platformRoleId: member.platformRoleId || "none",
      isActive: member.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const isEdit = !!editingStaff;

      if (isEdit) {
        const res = await apiFetch("/api/super-admins", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStaff.id,
            name: formData.name,
            ...(formData.password ? { password: formData.password } : {}),
            phone: formData.phone,
            platformRoleId:
              formData.platformRoleId === "none"
                ? null
                : formData.platformRoleId,
            isActive: formData.isActive,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "Failed to update staff");
        }
        toast.success("Staff member updated successfully");
      } else {
        const res = await apiFetch("/api/super-admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone || null,
            platformRoleId:
              formData.platformRoleId === "none"
                ? null
                : formData.platformRoleId,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "Failed to add staff");
        }
        toast.success("Staff member added successfully");
      }

      setDialogOpen(false);
      setEditingStaff(null);
      setFormData(emptyFormData);
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/super-admins?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete staff");
      }
      toast.success("Staff member deleted successfully");
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setDeletingId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete staff",
      );
    }
  };

  const isFormValid =
    formData.name.trim() !== "" &&
    (!editingStaff
      ? formData.email.trim() !== "" && formData.password.trim().length >= 6
      : true);

  return (
    <div className="space-y-6 pb-12">
      <StaffHeader 
        search={search}
        onSearchChange={setSearch}
        canCreate={canCreate}
        onAddClick={handleOpenAdd}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <StaffTable 
        loading={loading}
        staffList={staffList}
        filtered={filtered}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
        setDeletingId={setDeletingId}
        viewMode={viewMode}
      />

      <StaffDialogs 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingStaff={editingStaff}
        formData={formData}
        setFormData={setFormData}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        roles={roles}
        onSubmit={handleSubmit}
        submitting={submitting}
        isFormValid={isFormValid}
      />
    </div>
  );
}
