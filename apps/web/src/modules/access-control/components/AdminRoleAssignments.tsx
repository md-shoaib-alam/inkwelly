"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, UserRoundPlus, Users, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/use-app-store";
import { useAssignRoleToUser, useCustomRoles, useStaff } from "@/lib/graphql/hooks";
import type { RoleRecord, UserRecord } from "./adminRoles/types";

const UNASSIGNED = "__unassigned__";
const ALL = "__all__";
const PAGE = 1000;

export function AdminRoleAssignments() {
  const { currentTenantId } = useAppStore();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [pendingUser, setPendingUser] = useState<string | null>(null);

  const { data: roles = [] } = useCustomRoles(currentTenantId || "");
  const { mutateAsync: assignRole } = useAssignRoleToUser();

  // The staff query only filters when a role is passed and returns every user in the
  // tenant otherwise, so employees are read as the two staff roles rather than one.
  const staff = useStaff(currentTenantId || "", "staff", undefined, 1, PAGE);
  const teachers = useStaff(currentTenantId || "", "teacher", undefined, 1, PAGE);

  const isLoading = staff.isLoading || teachers.isLoading;

  const employees = useMemo(() => {
    const byId = new Map<string, UserRecord>();
    for (const row of [...(staff.data?.staff ?? []), ...(teachers.data?.staff ?? [])]) {
      if (!byId.has(row.id)) byId.set(row.id, row as UserRecord);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [staff.data, teachers.data]);

  const assignedCount = employees.filter((e) => e.customRole?.id).length;

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false;
      if (roleFilter === ALL) return true;
      if (roleFilter === UNASSIGNED) return !e.customRole?.id;
      return e.customRole?.id === roleFilter;
    });
  }, [employees, query, roleFilter]);

  const handleChange = async (userId: string, roleId: string) => {
    if (!currentTenantId) return;
    setPendingUser(userId);
    try {
      // The mutation toasts and optimistically rewrites every cached staff query,
      // so the rows update without an explicit refetch here.
      await assignRole({ userId, roleId: roleId === UNASSIGNED ? null : roleId, tenantId: currentTenantId });
    } catch {
      // useAssignRoleToUser already surfaces the failure as a toast.
    } finally {
      setPendingUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-8">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Role Assignments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign or revoke a custom role from an employee.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          `${employees.length} employees`,
          `${assignedCount} with a role`,
          `${employees.length - assignedCount} unassigned`,
          `${roles.length} custom roles`,
        ].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-0 flex-1 sm:max-w-72">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-auto min-w-44 gap-1.5 text-xs">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="text-xs">
                  All employees
                </SelectItem>
                <SelectItem value={UNASSIGNED} className="text-xs">
                  Unassigned only
                </SelectItem>
                {roles.map((role: RoleRecord) => (
                  <SelectItem key={role.id} value={role.id} className="text-xs">
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {roles.length === 0 && (
            <p className="rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
              No custom roles exist yet, so there is nothing to assign. Create one under Roles
              first.
            </p>
          )}

          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Users className="size-6 opacity-80" />
              </div>
              <p className="text-sm font-semibold text-foreground">No employees match</p>
              <p className="mt-1 max-w-sm text-center text-xs">
                {query
                  ? `Nothing matches "${query}". Try a different name or email.`
                  : "Clear the role filter to see the full list."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {displayed.map((employee) => (
                <li key={employee.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar className="size-8.5 shrink-0">
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{ backgroundColor: employee.customRole?.color ?? "#94a3b8" }}
                    >
                      {employee.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{employee.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{employee.email}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {employee.role}
                  </span>
                  <div className="relative w-full shrink-0 sm:w-52">
                    <Select
                      value={employee.customRole?.id ?? UNASSIGNED}
                      onValueChange={(next) => handleChange(employee.id, next)}
                      disabled={pendingUser === employee.id}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED} className="text-xs">
                          No role
                        </SelectItem>
                        {roles.map((role: RoleRecord) => (
                          <SelectItem key={role.id} value={role.id} className="text-xs">
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {pendingUser === employee.id && (
                      <Loader2 className="pointer-events-none absolute right-7 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {employees.length === 0 && (
            <p className="flex items-center justify-center gap-1.5 py-6 text-xs text-muted-foreground">
              <UserRoundPlus className="size-3.5" />
              No staff or teacher accounts in this school yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
