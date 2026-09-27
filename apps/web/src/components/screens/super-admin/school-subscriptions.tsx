"use client";

import { useState } from "react";
import { useTenants, useUpdateTenant } from "@/lib/graphql/hooks";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";

// Modular sub-components
import { SubscriptionHero } from "./school-subscriptions/SubscriptionHero";
import { SubscriptionStats } from "./school-subscriptions/SubscriptionStats";
import { SubscriptionFilters } from "./school-subscriptions/SubscriptionFilters";
import { SchoolCard } from "./school-subscriptions/SchoolCard";
import { SchoolTable } from "./school-subscriptions/SchoolTable";
import { ManageSubscriptionModal } from "./school-subscriptions/ManageSubscriptionModal";
import { TenantSubscription } from "./school-subscriptions/types";

const ITEMS_PER_PAGE = 10;

export function SuperAdminSchoolSubscriptions() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showStatsOnMobile, setShowStatsOnMobile] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tenantsData, isLoading, refetch } = useTenants({
    search: search || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const updateTenant = useUpdateTenant();

  const handleEdit = (tenant: any) => {
    setEditingTenant({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug || "",
      logo: tenant.logo || null,
      address: tenant.address || "Bengaluru, Karnataka",
      plan: tenant.plan,
      startDate: tenant.startDate || tenant.createdAt || "",
      endDate: tenant.endDate || "",
      maxStudents: tenant.maxStudents,
      maxTeachers: tenant.maxTeachers,
      maxParents: tenant.maxParents,
      maxClasses: tenant.maxClasses,
      status: tenant.status,
      studentCount: tenant.studentCount ?? tenant._count?.users ?? 0,
      teacherCount: tenant.teacherCount ?? 0,
      parentCount: tenant.parentCount ?? 0,
    });
    setIsDialogOpen(true);
  };

  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const handleUpdate = async () => {
    setIsSubmittingAction(true);
    try {
      const payload = {
        plan: editingTenant.plan,
        status: editingTenant.status,
        maxStudents: parseInt(editingTenant.maxStudents) || 0,
        maxTeachers: parseInt(editingTenant.maxTeachers) || 0,
        maxParents: parseInt(editingTenant.maxParents) || 0,
        maxClasses: parseInt(editingTenant.maxClasses) || 0,
        endDate: editingTenant.endDate || null,
      };

      await updateTenant.mutateAsync({
        id: editingTenant.id,
        data: payload,
      });

      toast.success("School subscription updated successfully");
      setIsConfirmUpdateOpen(false);
      setIsDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update subscription");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmCancelSubscription = async () => {
    setIsSubmittingAction(true);
    try {
      await updateTenant.mutateAsync({
        id: editingTenant.id,
        data: { status: "suspended" },
      });
      toast.success("Subscription has been suspended");
      setIsConfirmCancelOpen(false);
      setIsDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel subscription");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const totalSchools = tenantsData?.stats?.total ?? 0;
  const activeLicenses = (tenantsData?.stats?.active ?? 0) + (tenantsData?.stats?.trial ?? 0);
  const expiringSoon = tenantsData?.stats?.expiring ?? 0;
  const totalStudents = tenantsData?.tenants?.reduce((acc: number, t: any) => acc + (t.maxStudents || 0), 0) ?? 0;

  const filteredTenants: TenantSubscription[] = (tenantsData?.tenants || []).filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (planFilter !== "all" && t.plan?.toLowerCase() !== planFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Hero Banner */}
      <SubscriptionHero />

      {/* 2. Overview Stat Cards */}
      <SubscriptionStats
        isLoading={isLoading}
        totalSchools={totalSchools}
        activeLicenses={activeLicenses}
        expiringSoon={expiringSoon}
        totalStudents={totalStudents}
        showStatsOnMobile={showStatsOnMobile}
        setShowStatsOnMobile={setShowStatsOnMobile}
      />

      {/* 3. Filters Row */}
      <SubscriptionFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 4. Main Subscriptions Content */}
      <div className="space-y-4">
        {/* Mobile View: Always Grid */}
        <div className="grid grid-cols-1 gap-3 sm:hidden">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-2xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              </div>
            ))
          ) : filteredTenants.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border bg-card text-muted-foreground text-xs">
              No schools found matching your search.
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <SchoolCard key={tenant.id} tenant={tenant} onEdit={handleEdit} />
            ))
          )}
        </div>

        {/* Desktop View: Grid or Table based on viewMode */}
        {viewMode === "grid" ? (
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-2xl shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-36 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                  </div>
                </div>
              ))
            ) : filteredTenants.length === 0 ? (
              <div className="col-span-full p-12 text-center rounded-2xl border bg-card text-muted-foreground text-xs">
                No schools found matching your search.
              </div>
            ) : (
              filteredTenants.map((tenant) => (
                <SchoolCard key={tenant.id} tenant={tenant} onEdit={handleEdit} />
              ))
            )}
          </div>
        ) : (
          <div className="hidden sm:block rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            {/* Table summary row */}
            <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Showing <strong className="text-foreground font-bold">{filteredTenants.length}</strong> of {totalSchools} schools
              </p>
            </div>

            <SchoolTable
              isLoading={isLoading}
              tenants={filteredTenants}
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onEdit={handleEdit}
            />
          </div>
        )}

        {/* Unified Pagination for both Mobile Grid and Desktop */}
        {!isLoading && tenantsData && tenantsData.totalPages > 1 && (
          <div className="p-3 sm:px-6 sm:py-4 rounded-2xl border border-border bg-card shadow-2xs">
            <DataTablePagination
              page={currentPage}
              totalPages={tenantsData.totalPages}
              onPageChange={setCurrentPage}
              summary={`Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, tenantsData.total)} of ${tenantsData.total} entries`}
            />
          </div>
        )}
      </div>

      {/* Manage Subscription Dialog & Confirmations */}
      <ManageSubscriptionModal
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTenant={editingTenant}
        setEditingTenant={setEditingTenant}
        onSave={handleUpdate}
        onCancelSubscription={handleConfirmCancelSubscription}
        isSubmittingAction={isSubmittingAction}
        isConfirmUpdateOpen={isConfirmUpdateOpen}
        setIsConfirmUpdateOpen={setIsConfirmUpdateOpen}
        isConfirmCancelOpen={isConfirmCancelOpen}
        setIsConfirmCancelOpen={setIsConfirmCancelOpen}
      />
    </div>
  );
}
