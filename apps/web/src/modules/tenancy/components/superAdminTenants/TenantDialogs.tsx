import React from "react";
import { CreateTenantDialog } from "./CreateTenantDialog";
import { DetailTenantDialog } from "./DetailTenantDialog";
import { DeleteTenantDialog } from "./DeleteTenantDialog";
import { AdminTenantDialog } from "./AdminTenantDialog";
import { Tenant, TenantFormData } from "./types";

interface TenantDialogsProps {
  // Form Dialog
  formOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
  editingTenant: Tenant | null;
  formData: TenantFormData;
  setFormData: React.Dispatch<React.SetStateAction<TenantFormData>>;
  autoSlug: boolean;
  setAutoSlug: (auto: boolean) => void;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  submitting: boolean;

  // Detail Dialog
  detailOpen: boolean;
  onDetailOpenChange: (open: boolean) => void;
  viewingTenant: Tenant | null;
  onEditClick: (tenant: Tenant) => void;
  onDeleteClick?: (tenant: Tenant) => void;

  // Delete Dialog
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  deletingTenant: Tenant | null;
  onDeleteConfirm: () => void;

  // Admin Dialog
  adminOpen: boolean;
  onAdminOpenChange: (open: boolean) => void;
  targetTenant: Tenant | null;
  adminFormData: any;
  setAdminFormData: any;
  showAdminPassword: boolean;
  setShowAdminPassword: (show: boolean) => void;
  onCreateAdmin: () => void;
}

export function TenantDialogs({
  formOpen,
  onFormOpenChange,
  editingTenant,
  formData,
  setFormData,
  autoSlug,
  setAutoSlug,
  onNameChange,
  onSubmit,
  submitting,
  detailOpen,
  onDetailOpenChange,
  viewingTenant,
  onEditClick,
  onDeleteClick,
  deleteOpen,
  onDeleteOpenChange,
  deletingTenant,
  onDeleteConfirm,
  adminOpen,
  onAdminOpenChange,
  targetTenant,
  adminFormData,
  setAdminFormData,
  showAdminPassword,
  setShowAdminPassword,
  onCreateAdmin,
}: TenantDialogsProps) {
  return (
    <>
      {/* ── Create/Edit Dialog ── */}
      <CreateTenantDialog
        formOpen={formOpen}
        onFormOpenChange={onFormOpenChange}
        editingTenant={editingTenant}
        formData={formData}
        setFormData={setFormData}
        autoSlug={autoSlug}
        setAutoSlug={setAutoSlug}
        onNameChange={onNameChange}
        onSubmit={onSubmit}
        submitting={submitting}
      />

      {/* ── View Details Dialog ── */}
      <DetailTenantDialog
        detailOpen={detailOpen}
        onDetailOpenChange={onDetailOpenChange}
        viewingTenant={viewingTenant}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteTenantDialog
        deleteOpen={deleteOpen}
        onDeleteOpenChange={onDeleteOpenChange}
        deletingTenant={deletingTenant}
        onDeleteConfirm={onDeleteConfirm}
      />

      {/* ── Create Admin Modal ── */}
      <AdminTenantDialog
        adminOpen={adminOpen}
        onAdminOpenChange={onAdminOpenChange}
        targetTenant={targetTenant}
        adminFormData={adminFormData}
        setAdminFormData={setAdminFormData}
        showAdminPassword={showAdminPassword}
        setShowAdminPassword={setShowAdminPassword}
        onCreateAdmin={onCreateAdmin}
        submitting={submitting}
      />
    </>
  );
}
