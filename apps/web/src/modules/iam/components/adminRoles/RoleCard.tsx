"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Pencil, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { ACTION_LABELS, PERMISSION_MODULES } from "./constants";
import type { RoleRecord } from "./types";

interface RoleCardProps {
  role: RoleRecord;
  onEdit: (role: RoleRecord) => void;
  onAssign: (role: RoleRecord) => void;
  onDelete: (id: string) => void;
}

const ACTION_COLORS: Record<string, string> = {
  view: "bg-zinc-100 text-zinc-700 border-zinc-200/50 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700/50",
  create: "bg-emerald-50 text-emerald-700 border-emerald-100/70 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
  edit: "bg-amber-50 text-amber-700 border-amber-100/70 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
  delete: "bg-rose-50 text-rose-700 border-rose-100/70 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
};

export function RoleCard({ role, onEdit, onAssign, onDelete }: RoleCardProps) {
  let perms = {};
  if (typeof role.permissions === "string") {
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
  const permCount = Object.values(perms).flat().length;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden bg-card/80 border border-zinc-200 dark:border-zinc-800"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="size-11 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0 transition-transform group-hover:scale-105 duration-300"
              style={{ backgroundColor: role.color }}
            >
              {role.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {role.name}
              </CardTitle>
              {role.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 leading-normal">
                  {role.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-zinc-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
              onClick={() => onAssign(role)}
              title="Assign staff"
            >
              <UserPlus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
              onClick={() => onEdit(role)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="size-3.5" />
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
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Info pills */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge 
            variant="outline" 
            onClick={() => onAssign(role)}
            className="cursor-pointer bg-blue-50/40 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 font-semibold border-blue-100/50 dark:border-blue-900/40 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
          >
            <Users className="size-3 shrink-0" />
            <span>{role.userCount} staff</span>
          </Badge>
          
          <Badge 
            variant="outline" 
            className="bg-indigo-50/40 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 font-semibold border-indigo-100/50 dark:border-indigo-900/40 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-default"
          >
            <Shield className="size-3 shrink-0" />
            <span>{permCount} permissions</span>
          </Badge>
        </div>

        {permCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(perms).map(([mod, actions]) => {
              if (!Array.isArray(actions) || actions.length === 0) return null;
              const moduleLabel = PERMISSION_MODULES.find((m) => m.key === mod)?.label || mod;
              return (
                <div 
                  key={mod} 
                  className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/30 rounded-lg px-2.5 py-1 text-[11px] shadow-sm shrink-0"
                >
                  <span className="font-bold text-zinc-700 dark:text-zinc-350">{moduleLabel}</span>
                  <div className="flex flex-wrap gap-1">
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
        )}
      </CardContent>
    </Card>
  );
}
