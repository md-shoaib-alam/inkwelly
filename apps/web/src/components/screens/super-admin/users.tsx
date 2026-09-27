"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  useUsers, 
  useToggleUserStatus, 
  useTenantsInfinite, 
  useCreateUser 
} from "@/lib/graphql/hooks";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Sub-components
import { UserHeader } from "./users/UserHeader";
import { UserFilters } from "./users/UserFilters";
import { UserTable } from "./users/UserTable";
import { UserDetailSheet } from "./users/UserDetailSheet";

// Types
import { PlatformUser, ROLES } from "./users/types";

export function SuperAdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail sheet
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Add User Dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("admin");
  const [newUserTenantId, setNewUserTenantId] = useState("none");

  // Mutations
  const toggleStatus = useToggleUserStatus();
  const createUser = useCreateUser();

  // Fetch users via GraphQL
  const { data, isLoading: loading } = useUsers({
    role: roleFilter !== "all" ? roleFilter : undefined,
    tenantId: tenantFilter !== "all" ? tenantFilter : undefined,
    search: search.trim() || undefined,
    page: currentPage,
    limit: pageSize,
  });

  // Role counts map
  const roleCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    const roleCounts = data?.roleCounts;
    if (Array.isArray(roleCounts)) {
      roleCounts.forEach((rc) => {
        map[rc.role] = rc.count;
      });
    }
    return map;
  }, [data]);

  const totalCount = data?.total ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const [tenantSearch, setTenantSearch] = useState("");
  const [debouncedTenantSearch, setDebouncedTenantSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTenantSearch(tenantSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [tenantSearch]);

  // Fetch list of tenants via infinite query for selection
  const { 
    data: tenantsInfiniteData, 
    fetchNextPage: fetchNextTenantsPage, 
    hasNextPage: hasNextTenantsPage, 
    isFetchingNextPage: isFetchingNextTenantsPage 
  } = useTenantsInfinite({ 
    search: debouncedTenantSearch.trim() || undefined,
    limit: 40 
  });

  // Derive unique tenants from all pages
  const tenants = useMemo(() => {
    if (!tenantsInfiniteData) return [];
    const list = tenantsInfiniteData.pages.flatMap((page) => page.tenants || []);
    return list.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug || "",
    }));
  }, [tenantsInfiniteData]);

  // Handlers
  const handleRoleChange = (v: string) => {
    setRoleFilter(v);
    setCurrentPage(1);
  };

  const handleTenantChange = (v: string) => {
    setTenantFilter(v);
    setCurrentPage(1);
  };

  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setCurrentPage(1);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (userId: string, currentActive?: boolean) => {
    try {
      const activeState = currentActive !== undefined ? currentActive : (selectedUser?.isActive ?? true);
      await toggleStatus.mutateAsync({ 
        id: userId, 
        isActive: !activeState 
      });
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, isActive: !activeState });
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  // Date Formatters
  const formatDate = (dateValue: string) => {
    if (!dateValue) return "–";
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "–";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateValue: string) => {
    if (!dateValue) return "–";
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "–";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUserClick = (user: PlatformUser) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  // Filter users by client status if active/inactive selected
  const rawUsers = Array.isArray(data?.users) ? data.users : [];
  const displayUsers = useMemo(() => {
    if (statusFilter === "all") return rawUsers;
    const wantActive = statusFilter === "active";
    return rawUsers.filter((u) => u.isActive === wantActive);
  }, [rawUsers, statusFilter]);

  // Export users to CSV
  const handleExport = () => {
    if (!rawUsers || rawUsers.length === 0) {
      toast.error("No users available to export");
      return;
    }
    const headers = ["Name", "Email", "Role", "School", "Status", "Joined"];
    const rows = rawUsers.map((u) => [
      `"${u.name || ""}"`,
      `"${u.email || ""}"`,
      `"${u.role || ""}"`,
      `"${u.tenant?.name || ""}"`,
      u.isActive ? "Active" : "Inactive",
      `"${formatDate(u.createdAt)}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `schoolconnect_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users exported successfully");
  };

  // Create User submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createUser.mutateAsync({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
        tenantId: newUserTenantId && newUserTenantId !== "none" ? newUserTenantId : undefined,
      });
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("admin");
      setNewUserTenantId("none");
      setAddUserOpen(false);
    } catch (err: any) {
      toast.error("Failed to create user", {
        description: err.message || "An unexpected error occurred",
      });
    }
  };

  const selectableRoles = ROLES.filter((r) => r.value !== "all");

  return (
    <div className="space-y-5 pb-10">
      <UserHeader 
        totalCount={totalCount} 
        roleCountsMap={roleCountsMap} 
      />

      <UserFilters 
        search={search}
        onSearchChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleChange}
        tenantFilter={tenantFilter}
        onTenantFilterChange={handleTenantChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusChange}
        tenants={tenants}
        fetchNextPage={fetchNextTenantsPage}
        hasNextPage={hasNextTenantsPage}
        isFetchingNextPage={isFetchingNextTenantsPage}
        tenantSearch={tenantSearch}
        onTenantSearchChange={setTenantSearch}
        totalCount={totalCount}
        startItem={startItem}
        endItem={endItem}
        onExport={handleExport}
        onAddUser={() => setAddUserOpen(true)}
      />

      <UserTable 
        loading={loading}
        users={displayUsers}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onPageChange={setCurrentPage}
        onUserClick={handleUserClick}
        onToggleStatus={handleToggleStatus}
        formatDate={formatDate}
      />

      <UserDetailSheet 
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        user={selectedUser}
        onToggleStatus={(userId) => handleToggleStatus(userId)}
        onUserUpdated={(updatedUser) => setSelectedUser(updatedUser)}
        toggling={toggleStatus.isPending}
        formatDateTime={formatDateTime}
        tenants={tenants}
      />

      {/* Add User Modal Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Add New User
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new user account across platform tenants.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                placeholder="e.g. John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Temporary Password *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role *</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {selectableRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">School Tenant</Label>
                <Select value={newUserTenantId} onValueChange={setNewUserTenantId}>
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    <SelectItem value="none" className="text-xs">Platform (No Tenant)</SelectItem>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddUserOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createUser.isPending}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {createUser.isPending ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
