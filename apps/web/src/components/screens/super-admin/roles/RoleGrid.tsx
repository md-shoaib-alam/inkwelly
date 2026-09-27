"use client";

import { useState, useMemo } from "react";
import { 
  UserCheck, 
  Search, 
  Shield, 
  Layers, 
  Users, 
  MoreVertical, 
  Pencil, 
  UserPlus, 
  Trash2, 
  Headphones, 
  FileText, 
  FileCode2, 
  Eye,
  ArrowUpDown,
  List,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { PlatformRoleRecord, isSystemRole, PLATFORM_MODULES, ACTION_LABELS } from "./types";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  view: "bg-zinc-100 text-zinc-700 border-zinc-200/50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/50",
  create: "bg-emerald-50 text-emerald-700 border-emerald-100/70 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
  edit: "bg-amber-50 text-amber-700 border-amber-100/70 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
  delete: "bg-rose-50 text-rose-700 border-rose-100/70 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

interface RoleGridProps {
  roles: PlatformRoleRecord[];
  onEdit: (role: PlatformRoleRecord) => void;
  onDelete: (id: string) => void;
  onAssignUsers: (role: PlatformRoleRecord) => void;
  isMobileTab?: boolean;
}

function getRoleIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("support")) return <Headphones className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("bill")) return <FileText className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("moderator") || lower.includes("content")) return <FileCode2 className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("secur")) return <Shield className="size-4 sm:size-4.5 stroke-[2.2]" />;
  if (lower.includes("read") || lower.includes("view")) return <Eye className="size-4 sm:size-4.5 stroke-[2.2]" />;
  return <Shield className="size-4 sm:size-4.5 stroke-[2.2]" />;
}

function getRoleIconBoxStyle(name: string, customColor?: string) {
  const lower = name.toLowerCase();
  if (lower.includes("support")) return "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-100 dark:border-blue-900/40";
  if (lower.includes("bill")) return "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-100 dark:border-amber-900/40";
  if (lower.includes("moderator") || lower.includes("content")) return "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-100 dark:border-purple-900/40";
  if (lower.includes("secur")) return "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-100 dark:border-rose-900/40";
  if (lower.includes("read") || lower.includes("view")) return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40";
  
  if (customColor) {
    return "border-border text-white shadow-2xs";
  }
  return "bg-muted text-muted-foreground border-border";
}

export function RoleGrid({ roles, onEdit, onDelete, onAssignUsers, isMobileTab = false }: RoleGridProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "custom" | "system">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [roleToDelete, setRoleToDelete] = useState<PlatformRoleRecord | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Counts
  const counts = useMemo(() => {
    let system = 0;
    let custom = 0;
    roles.forEach((r) => {
      if (isSystemRole(r)) system++;
      else custom++;
    });
    return { all: roles.length, system, custom };
  }, [roles]);

  // Filtered & Sorted roles
  const filteredRoles = useMemo(() => {
    return roles
      .filter((r) => {
        // Tab filter
        const isSys = isSystemRole(r);
        if (filter === "custom" && isSys) return false;
        if (filter === "system" && !isSys) return false;

        // Search query
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [roles, filter, search, sortBy]);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden p-3.5 sm:p-5">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/80 dark:border-blue-900/40 shrink-0">
            <UserCheck className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground leading-tight">
              Your Roles
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              View, edit, and manage permissions
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="h-8.5 text-xs pl-8 rounded-xl bg-card border-border focus:bg-card placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Filter Tabs & Sort Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 bg-muted/70 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              filter === "all"
                ? "bg-card text-foreground font-semibold shadow-2xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter("custom")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              filter === "custom"
                ? "bg-card text-foreground font-semibold shadow-2xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Custom ({counts.custom})
          </button>
          <button
            type="button"
            onClick={() => setFilter("system")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              filter === "system"
                ? "bg-card text-foreground font-semibold shadow-2xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            System ({counts.system})
          </button>
        </div>

        {/* Controls: View Mode Toggle & Sort Selector */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-muted/80 rounded-xl border border-border/50 shrink-0">
            <button
              type="button"
              className={cn(
                "h-7.5 px-2.5 gap-1.5 text-xs rounded-lg transition-all flex items-center justify-center cursor-pointer",
                viewMode === "table"
                  ? "bg-card shadow-2xs font-semibold text-blue-600 dark:text-blue-400 border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              className={cn(
                "h-7.5 px-2.5 gap-1.5 text-xs rounded-lg transition-all flex items-center justify-center cursor-pointer",
                viewMode === "grid"
                  ? "bg-card shadow-2xs font-semibold text-blue-600 dark:text-blue-400 border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Sort Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-xl border border-border bg-card shadow-2xs cursor-pointer h-8"
              >
                <ArrowUpDown className="size-3 text-muted-foreground" />
                <span>
                  {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "A-Z"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl text-xs">
              <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")}>Oldest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>Alphabetical</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Role List / Table View */}
      {filteredRoles.length === 0 ? (
        <div className="py-8 text-center rounded-xl border border-dashed border-border">
          <Shield className="size-7 text-muted-foreground/40 mx-auto mb-1.5" />
          <p className="font-semibold text-xs text-foreground">No roles found</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {search ? "Try adjusting your search query" : "No roles in this category"}
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[240px] sm:w-[280px]">Role Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Users Assigned</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => {
                let perms: Record<string, string[]> = {};
                try {
                  perms = JSON.parse(role.permissions || "{}");
                } catch {
                  perms = {};
                }
                const permCount = Object.values(perms).flat().length;
                const userCount = role._count?.users ?? 0;
                const isSys = isSystemRole(role);

                return (
                  <TableRow
                    key={role.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* Role Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-8.5 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs",
                            getRoleIconBoxStyle(role.name, role.color)
                          )}
                          style={
                            !getRoleIconBoxStyle(role.name).includes("bg-")
                              ? { backgroundColor: role.color }
                              : undefined
                          }
                        >
                          {getRoleIcon(role.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {role.name}
                          </p>
                          {role.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                          isSys
                            ? "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {isSys ? "System" : "Custom"}
                      </span>
                    </TableCell>

                    {/* Users Assigned */}
                    <TableCell>
                      {userCount === 0 ? (
                        <span className="text-xs text-muted-foreground italic pl-1">0 users</span>
                      ) : (
                        <Badge
                          variant="outline"
                          onClick={() => onAssignUsers(role)}
                          className="cursor-pointer bg-muted/40 hover:bg-muted text-foreground font-semibold border-border px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors select-none w-fit text-xs"
                        >
                          <Users className="size-3 text-muted-foreground" />
                          <span>{userCount} {userCount === 1 ? "user" : "users"}</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Permissions */}
                    <TableCell>
                      {permCount === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No permissions</span>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge
                              variant="outline"
                              className="cursor-pointer bg-blue-50/50 hover:bg-blue-100/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold border-blue-200/60 dark:border-blue-800/40 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors select-none w-fit text-xs"
                            >
                              <Shield className="size-3 text-blue-600 dark:text-blue-400" />
                              <span>{permCount} permissions</span>
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-80 p-3.5 space-y-3 bg-popover/95 backdrop-blur-md shadow-xl border border-border rounded-xl"
                            align="start"
                          >
                            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                              <Shield className="size-3.5" />
                              <span>Granted Permissions ({permCount})</span>
                            </div>
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                              {Object.entries(perms).map(([mod, actions]) => {
                                if (!Array.isArray(actions) || actions.length === 0) return null;
                                const moduleLabel =
                                  PLATFORM_MODULES.find((m) => m.key === mod)?.label || mod;
                                return (
                                  <div
                                    key={mod}
                                    className="flex items-start justify-between gap-3 p-2 rounded-lg bg-muted/40 border border-border/60"
                                  >
                                    <span className="font-semibold text-xs text-foreground mt-0.5">
                                      {moduleLabel}
                                    </span>
                                    <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                                      {actions.map((action: string) => {
                                        const colorClass =
                                          ACTION_COLORS[action] ||
                                          "bg-muted text-muted-foreground border-border";
                                        return (
                                          <span
                                            key={action}
                                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider border ${colorClass}`}
                                          >
                                            {ACTION_LABELS[action] || action}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </TableCell>

                    {/* Created At */}
                    <TableCell
                      className="text-xs text-muted-foreground whitespace-nowrap"
                      suppressHydrationWarning
                    >
                      {formatDate(role.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer"
                          title="Assign Users"
                          onClick={() => onAssignUsers(role)}
                        >
                          <UserPlus className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg cursor-pointer"
                          title="Edit Role"
                          onClick={() => onEdit(role)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {!isSys ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                            title="Delete Role"
                            onClick={() => setRoleToDelete(role)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : (
                          <div className="size-8" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredRoles.map((role) => {
            let perms: Record<string, string[]> = {};
            try {
              perms = JSON.parse(role.permissions || "{}");
            } catch {
              perms = {};
            }
            const permCount = Object.values(perms).flat().length;
            const userCount = role._count?.users ?? 0;
            const isSys = isSystemRole(role);

            return (
              <div
                key={role.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card hover:border-blue-200 dark:hover:border-blue-800/60 hover:shadow-md transition-all duration-200 p-4 sm:p-4.5 gap-3"
              >
                <div>
                  {/* Card Header: Icon + Name + Actions */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "size-10 sm:size-11 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0 transition-transform group-hover:scale-105 duration-200",
                          getRoleIconBoxStyle(role.name, role.color)
                        )}
                        style={
                          !getRoleIconBoxStyle(role.name).includes("bg-")
                            ? { backgroundColor: role.color }
                            : undefined
                        }
                      >
                        {getRoleIcon(role.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {role.name}
                          </h4>
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.2 rounded-md border",
                              isSys
                                ? "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {isSys ? "System" : "Custom"}
                          </span>
                        </div>
                        {role.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7.5 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 cursor-pointer"
                        onClick={() => onAssignUsers(role)}
                        title="Assign users"
                      >
                        <UserPlus className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7.5 rounded-lg text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40 cursor-pointer"
                        onClick={() => onEdit(role)}
                        title="Edit role"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {!isSys && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7.5 rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer"
                          onClick={() => setRoleToDelete(role)}
                          title="Delete role"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Info Badges */}
                  <div className="flex items-center gap-2 text-xs flex-wrap mt-3">
                    <Badge
                      variant="outline"
                      onClick={() => onAssignUsers(role)}
                      className="cursor-pointer bg-muted/40 hover:bg-muted text-foreground font-semibold border-border px-2 py-0.5 rounded-md flex items-center gap-1.5 transition-colors select-none text-[11px]"
                    >
                      <Users className="size-3 text-muted-foreground" />
                      <span>{userCount} {userCount === 1 ? "user" : "users"}</span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className="bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 font-semibold border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 rounded-md flex items-center gap-1.5 text-[11px] cursor-default"
                    >
                      <Shield className="size-3 text-blue-600 dark:text-blue-400" />
                      <span>{permCount} perms</span>
                    </Badge>
                  </div>

                  {/* Granted Permissions Chips */}
                  {permCount > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {Object.entries(perms).map(([mod, actions]) => {
                        if (!Array.isArray(actions) || actions.length === 0) return null;
                        const moduleLabel =
                          PLATFORM_MODULES.find((m) => m.key === mod)?.label || mod;
                        return (
                          <div
                            key={mod}
                            className="flex items-center gap-1.5 bg-muted/40 border border-border/60 rounded-lg px-2 py-0.5 text-[10px] shrink-0"
                          >
                            <span className="font-semibold text-foreground">{moduleLabel}</span>
                            <div className="flex flex-wrap gap-1">
                              {actions.map((action: string) => {
                                const colorClass =
                                  ACTION_COLORS[action] ||
                                  "bg-muted text-muted-foreground border-border";
                                return (
                                  <span
                                    key={action}
                                    className={`text-[8.5px] px-1 py-0.2 rounded font-semibold uppercase tracking-wider border ${colorClass}`}
                                  >
                                    {ACTION_LABELS[action] || action}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                  <span>Created {formatDate(role.createdAt)}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-foreground">Delete Platform Role</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete &quot;
              <span className="font-semibold text-foreground">{roleToDelete?.name}</span>&quot;?
              {(roleToDelete?._count?.users ?? 0) > 0 ? (
                `\n\n⚠️ ${roleToDelete?._count?.users} user(s) are currently assigned to this role. You must unassign them before deleting.`
              ) : (
                "\n\nThis action cannot be undone and will remove all associated permissions."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-8.5 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-8.5 text-xs font-semibold"
              onClick={() => {
                if (roleToDelete) {
                  onDelete(roleToDelete.id);
                  setRoleToDelete(null);
                }
              }}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
