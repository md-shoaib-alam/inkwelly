"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, UserPlus, Users, Shield } from "lucide-react";
import { ACTION_LABELS, PERMISSION_MODULES } from "./constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RoleRecord } from "./types";

const ACTION_COLORS: Record<string, string> = {
  view: "bg-zinc-100 text-zinc-700 border-zinc-200/50 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700/50",
  create: "bg-emerald-50 text-emerald-700 border-emerald-100/70 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
  edit: "bg-amber-50 text-amber-700 border-amber-100/70 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
  delete: "bg-rose-50 text-rose-700 border-rose-100/70 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
};

interface RoleTableProps {
  roles: RoleRecord[];
  allStaff?: any[];
  onEdit: (role: RoleRecord) => void;
  onAssign: (role: RoleRecord) => void;
  onDelete: (id: string) => void;
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
};

export function RoleTable({ roles, allStaff = [], onEdit, onAssign, onDelete }: RoleTableProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
          <TableRow>
            <TableHead className="w-[250px]">Role Name</TableHead>
            <TableHead>Staff Assigned</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
             let perms = {};
             try {
               perms = typeof role.permissions === 'string' 
                 ? JSON.parse(role.permissions || "{}") 
                 : (role.permissions || {});
             } catch (e) { perms = {}; }
             const permCount = Object.values(perms).flat().length;

             return (
              <TableRow key={role.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: role.color }}
                    >
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{role.name}</p>
                      {role.description && (
                        <p className="text-[10px] text-zinc-500 line-clamp-1">{role.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {role.userCount === 0 ? (
                    <span className="text-xs text-zinc-400 italic pl-3 select-none">0 staff</span>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer bg-zinc-50/50 hover:bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 font-semibold border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors select-none w-fit"
                        >
                          <Users className="size-3 text-zinc-500" />
                          <span>{role.userCount} staff</span>
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 bg-popover/95 backdrop-blur-md shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-xl" align="start">
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-2">
                          <Users className="size-3.5" />
                          <span>Assigned Staff ({role.userCount})</span>
                        </div>
                        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                          {allStaff
                            .filter((u) => u.customRole?.id === role.id)
                            .map((staff) => (
                              <div key={staff.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                <div className="size-6 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {staff.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-foreground truncate">{staff.name}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{staff.email}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </TableCell>
                <TableCell>
                  {permCount === 0 ? (
                    <span className="text-xs text-zinc-400 italic">No permissions</span>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer bg-zinc-50/50 hover:bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 font-semibold border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors select-none w-fit"
                        >
                          <Shield className="size-3 text-zinc-500" />
                          <span>{permCount} permissions</span>
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4 space-y-3 bg-popover/95 backdrop-blur-md shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-xl" align="start">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
                          <Shield className="size-3.5" />
                          <span>Granted Permissions</span>
                        </div>
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {Object.entries(perms).map(([mod, actions]) => {
                            if (!Array.isArray(actions) || actions.length === 0) return null;
                            const moduleLabel = PERMISSION_MODULES.find((m) => m.key === mod)?.label || mod;
                            return (
                              <div 
                                key={mod} 
                                className="flex items-start justify-between gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/30"
                              >
                                <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 mt-0.5">{moduleLabel}</span>
                                <div className="flex flex-wrap gap-1 justify-end max-w-[70%]">
                                  {actions.map((action: string) => {
                                    const colorClass = ACTION_COLORS[action] || "bg-zinc-100 text-zinc-700 border-zinc-200/50 dark:bg-zinc-850 dark:text-zinc-300";
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
                <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                  {formatDate(role.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      onClick={() => onAssign(role)}
                    >
                      <UserPlus className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      onClick={() => onEdit(role)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <p>
                              Are you sure you want to delete &quot;{role.name}&quot;? This action cannot be undone.
                            </p>
                            {role.userCount > 0 && (
                              <span className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs flex flex-col gap-1 text-left block">
                                <strong className="font-semibold block">⚠️ Warning</strong>
                                <span>
                                  There are <strong>{role.userCount} staff member(s)</strong> currently assigned to this role. Deleting this role will automatically remove it from them.
                                </span>
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => onDelete(role.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
