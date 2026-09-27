"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { SchoolDetail } from "./school-detail";
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useToggleTenantStatus,
  useCreateUser,
} from "@/lib/graphql/hooks";
import { useModulePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";

// Sub-components
import { TenantStats } from "./tenants/TenantStats";
import { TenantFilters } from "./tenants/TenantFilters";
import { TenantTable } from "./tenants/TenantTable";
import { TenantDialogs } from "./tenants/TenantDialogs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Tenant,
  ITEMS_PER_PAGE,
  emptyFormData
} from "./tenants/types";
import { tenantsReducer, initialState } from "./tenants/reducer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SuperAdminTenants() {
  const { canCreate, canEdit, canDelete } = useModulePermissions("tenants");
  const [state, dispatch] = useReducer(tenantsReducer, initialState);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageParam = searchParams.get("page");

  // Sync initial URL search params into state (run once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const parsedPage = pageParam ? Number(pageParam) : NaN;
    if (Number.isInteger(parsedPage) && parsedPage > 0) {
      dispatch({ type: "SET_CURRENT_PAGE", page: parsedPage });
    }
  }, []);

  const updateUrlParams = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page)); else params.delete("page");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  const {
    search,
    planFilter,
    statusFilter,
    viewMode,
    currentPage,
    formDialogOpen,
    deleteDialogOpen,
    adminModalOpen,
    selectedTenant,
    editingTenant,
    viewingTenant,
    deletingTenant,
    targetTenantForAdmin,
    formData,
    submitting,
    autoSlug,
    adminFormData,
    showAdminPassword,
  } = state;

  // -- GraphQL Hooks --
  const { data: tenantsData, isLoading: loading } = useTenants({
    status: statusFilter !== "all" ? statusFilter : undefined,
    plan: planFilter !== "all" ? planFilter : undefined,
    search: search || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });
  
  const tenants = (tenantsData?.tenants ?? []) as Tenant[];
  const totalPages = tenantsData?.totalPages ?? 1;

  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();
  const toggleTenantStatus = useToggleTenantStatus();
  const createUser = useCreateUser();

  // Status toggle confirmation state
  const [pendingStatusTenant, setPendingStatusTenant] = useState<Tenant | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Sorted tenants list
  const sortedTenants = useMemo(() => {
    const list = [...tenants];
    if (sortBy === "oldest") {
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (sortBy === "name_asc") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "students_desc") {
      return list.sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
    }
    // Default newest
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tenants, sortBy]);

  // -- Computed Stats --
  const stats = useMemo(() => {
    if (tenantsData?.stats) {
      return tenantsData.stats;
    }
    return {
      total: tenantsData?.total || 0,
      active: 0,
      trial: 0,
      suspended: 0,
    };
  }, [tenantsData]);

  // -- Helpers --
  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  };

  // -- Handlers --
  const handleNameChange = (name: string) => {
    dispatch({
      type: "SET_FORM_DATA",
      data: {
        name,
        ...(autoSlug ? { slug: generateSlug(name) } : {}),
      }
    });
  };

  const handleOpenAddDialog = () => {
    dispatch({ type: "SET_EDITING_TENANT", tenant: null });
    dispatch({ type: "RESET_FORM_DATA" });
    dispatch({ type: "SET_AUTO_SLUG", autoSlug: true });
    dispatch({ type: "SET_FORM_DIALOG_OPEN", open: true });
  };

  const handleOpenAddAdmin = (tenant: Tenant) => {
    dispatch({ type: "SET_TARGET_TENANT_FOR_ADMIN", tenant });
    dispatch({ type: "SET_ADMIN_FORM_DATA", data: { name: "", email: "", phone: "", password: "" } });
    dispatch({ type: "SET_ADMIN_MODAL_OPEN", open: true });
  };

  const handleOpenEditDialog = (tenant: Tenant) => {
    dispatch({
      type: "SET_EDITING_TENANT",
      tenant,
      formData: {
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo || "",
        email: tenant.email || "",
        phone: tenant.phone || "",
        address: tenant.address || "",
        website: tenant.website || "",
        plan: tenant.plan,
        maxStudents: tenant.maxStudents,
        maxTeachers: tenant.maxTeachers,
        maxParents: tenant.maxParents,
        maxClasses: tenant.maxClasses,
        status: tenant.status,
      }
    });

    dispatch({ type: "SET_AUTO_SLUG", autoSlug: false });
    dispatch({ type: "SET_FORM_DIALOG_OPEN", open: true });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) return;
    dispatch({ type: "SET_SUBMITTING", submitting: true });
    try {
      if (editingTenant) {
        await updateTenant.mutateAsync({ id: editingTenant.id, data: formData as any });
      } else {
        await createTenant.mutateAsync(formData);
      }
      dispatch({ type: "SET_FORM_DIALOG_OPEN", open: false });
    } finally {
      dispatch({ type: "SET_SUBMITTING", submitting: false });
    }
  };

  const handleToggleStatus = async () => {
    if (!pendingStatusTenant) return;
    const newStatus = pendingStatusTenant.status === "active" ? "suspended" : "active";
    await toggleTenantStatus.mutateAsync({ id: pendingStatusTenant.id, status: newStatus });
    setPendingStatusTenant(null);
  };

  const onRequestToggleStatus = (tenant: Tenant) => {
    setPendingStatusTenant(tenant);
  };

  const handleDelete = async () => {
    if (!deletingTenant) return;
    await deleteTenant.mutateAsync(deletingTenant.id);
    dispatch({ type: "SET_DELETE_DIALOG_OPEN", open: false });
    dispatch({ type: "SET_DELETING_TENANT", tenant: null });
  };

  const handleCreateAdmin = async () => {
    if (!targetTenantForAdmin || !adminFormData.name || !adminFormData.email || !adminFormData.password) return;
    dispatch({ type: "SET_SUBMITTING", submitting: true });
    try {
      await createUser.mutateAsync({
        ...adminFormData,
        role: "admin",
        tenantId: targetTenantForAdmin.id,
      });
      toast.success('Admin account created successfully');
      dispatch({ type: "SET_ADMIN_MODAL_OPEN", open: false });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create admin account');
    } finally {
      dispatch({ type: "SET_SUBMITTING", submitting: false });
    }
  };

  // -- Layout Switch --
  if (selectedTenant) {
    return (
      <SchoolDetail
        tenantId={selectedTenant.id}
        tenantName={selectedTenant.name}
        tenantSlug={selectedTenant.slug}
        tenantPlan={selectedTenant.plan}
        onBack={() => dispatch({ type: "SET_SELECTED_TENANT", tenant: null })}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top School Management Header */}
      <div className="flex flex-col gap-1 sm:gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
              School Management
            </h2>
          </div>

          {canCreate && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 sm:h-9 px-3 sm:px-4 rounded-xl gap-1.5 shadow-xs transition-all shrink-0"
              onClick={handleOpenAddDialog}
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>Add School</span>
            </Button>
          )}
        </div>

        <p className="hidden sm:block text-xs text-muted-foreground font-normal">
          Manage all schools on your platform. Add, monitor, and manage school accounts.
        </p>
      </div>

      <TenantStats stats={stats} />
      
      <TenantFilters 
        search={search}
        onSearchChange={(v) => {
          dispatch({ type: "SET_SEARCH", search: v });
          updateUrlParams(1);
        }}
        planFilter={planFilter}
        onPlanFilterChange={(v) => {
          dispatch({ type: "SET_PLAN_FILTER", filter: v });
          updateUrlParams(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          dispatch({ type: "SET_STATUS_FILTER", filter: v });
          updateUrlParams(1);
        }}
        viewMode={viewMode}
        onViewModeChange={(v) => dispatch({ type: "SET_VIEW_MODE", mode: v })}
        sortBy={sortBy}
        onSortChange={(s) => setSortBy(s)}
      />

      <TenantTable 
        tenants={sortedTenants}
        loading={loading}
        viewMode={viewMode}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          dispatch({ type: "SET_CURRENT_PAGE", page: p });
          updateUrlParams(p);
        }}
        onView={(t) => dispatch({ type: "SET_VIEWING_TENANT", tenant: t })} 
        onEdit={handleOpenEditDialog}
        onToggleStatus={onRequestToggleStatus}
        onDelete={(t) => {
          dispatch({ type: "SET_DELETING_TENANT", tenant: t });
          dispatch({ type: "SET_DELETE_DIALOG_OPEN", open: true });
        }}
        onManageData={(t) => dispatch({ type: "SET_SELECTED_TENANT", tenant: t })} 
        onAddAdmin={handleOpenAddAdmin}
        onIntegrations={(t) => router.push(`/integrations?school=${encodeURIComponent(t.slug || t.id)}`)}
      />

      <TenantDialogs 
        formOpen={formDialogOpen}
        onFormOpenChange={(v) => dispatch({ type: "SET_FORM_DIALOG_OPEN", open: v })}
        editingTenant={editingTenant}
        formData={formData}
        setFormData={(data) => {
           if (typeof data === 'function') {
             dispatch({ type: "SET_FORM_DATA", data: (data as any)(formData) });
           } else {
             dispatch({ type: "SET_FORM_DATA", data });
           }
        }}
        autoSlug={autoSlug}
        setAutoSlug={(v) => dispatch({ type: "SET_AUTO_SLUG", autoSlug: v })}
        onNameChange={handleNameChange}
        onSubmit={handleSubmit}
        submitting={submitting}
        
        detailOpen={!!viewingTenant}
        onDetailOpenChange={(open) => !open && dispatch({ type: "SET_VIEWING_TENANT", tenant: null })}
        viewingTenant={viewingTenant}
        onEditClick={handleOpenEditDialog}
        onDeleteClick={(tenant) => {
          dispatch({ type: "SET_VIEWING_TENANT", tenant: null });
          dispatch({ type: "SET_DELETING_TENANT", tenant });
          dispatch({ type: "SET_DELETE_DIALOG_OPEN", open: true });
        }}

        deleteOpen={deleteDialogOpen}
        onDeleteOpenChange={(v) => dispatch({ type: "SET_DELETE_DIALOG_OPEN", open: v })}
        deletingTenant={deletingTenant}
        onDeleteConfirm={handleDelete}

        adminOpen={adminModalOpen}
        onAdminOpenChange={(v) => dispatch({ type: "SET_ADMIN_MODAL_OPEN", open: v })}
        targetTenant={targetTenantForAdmin}
        adminFormData={adminFormData}
        setAdminFormData={(data) => {
          if (typeof data === 'function') {
            dispatch({ type: "SET_ADMIN_FORM_DATA", data: (data as any)(adminFormData) });
          } else {
            dispatch({ type: "SET_ADMIN_FORM_DATA", data });
          }
        }}
        showAdminPassword={showAdminPassword}
        setShowAdminPassword={(v) => dispatch({ type: "SET_SHOW_ADMIN_PASSWORD", show: v })}
        onCreateAdmin={handleCreateAdmin}
      />

      {/* Status Toggle Confirmation */}
      <AlertDialog open={!!pendingStatusTenant} onOpenChange={(open) => !open && setPendingStatusTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatusTenant?.status === "active" ? "Suspend this school?" : "Activate this school?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusTenant?.status === "active"
                ? `Suspending immediately blocks all users of ${pendingStatusTenant?.name} from signing in until reactivated.`
                : `This reactivates ${pendingStatusTenant?.name} and restores access for all of its users.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusTenant(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleToggleStatus(); }}
              className={pendingStatusTenant?.status === "active" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {pendingStatusTenant?.status === "active" ? "Suspend" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
