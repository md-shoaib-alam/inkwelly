"use client";

import { useState, Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Loader2, 
  Users, 
  Check, 
  X, 
  UserCircle2, 
  Eye, 
  Grid, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  Lightbulb, 
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLOR_PRESETS,
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  ROLE_TEMPLATES,
} from "./constants";
import type { RoleRecord, RoleTemplate } from "./types";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: RoleRecord | null;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  permissions: Record<string, string[]>;
  setPermissions: (v: Record<string, string[]>) => void;
  saving: boolean;
  onSave: () => void;
}

export function RoleDialog({
  open,
  onOpenChange,
  editingRole,
  name,
  setName,
  description,
  setDescription,
  color,
  setColor,
  permissions,
  setPermissions,
  saving,
  onSave,
}: RoleDialogProps) {
  const [expandedMobileModule, setExpandedMobileModule] = useState<string | null>(null);

  const togglePermission = (moduleKey: string, action: string) => {
    const current = permissions[moduleKey] || [];
    const updated = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    setPermissions({ ...permissions, [moduleKey]: updated });
  };

  const handleGrantAll = () => {
    const next: Record<string, string[]> = {};
    PERMISSION_MODULES.forEach((m) => {
      next[m.key] = [...PERMISSION_ACTIONS];
    });
    setPermissions(next);
  };


  const handleClearAll = () => {
    setPermissions({});
  };

  const applyTemplate = (template: RoleTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setColor(template.color);
    setPermissions({ ...template.permissions });
  };

  const totalPermissions = Object.values(permissions).flat().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1.5rem)] sm:w-full sm:max-w-4xl max-h-[94vh] sm:max-h-[90vh] flex flex-col p-0 border border-slate-200 dark:border-slate-800 bg-card rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 sm:size-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-2xs">
              <Shield className="size-5 sm:size-5.5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {editingRole ? `Edit "${editingRole.name}"` : "Create New Role"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
                Define a custom role with granular permissions for school staff members.
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Scrollable Body: 2 Columns on desktop, 1 column on mobile */}
        <div 
          data-lenis-prevent
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain touch-pan-y"
        >
          {/* Quick Role Templates bar */}
          {!editingRole && (
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                  <Sparkles className="size-3.5" />
                  <span>Quick Starter Templates</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Click to autofill role</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {ROLE_TEMPLATES.map((tmpl) => {
                  const isSelected = name.trim().toLowerCase() === tmpl.name.toLowerCase();
                  return (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => applyTemplate(tmpl)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-card border-border text-foreground hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-500/5"
                      )}
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: tmpl.color }}
                      />
                      <span>{tmpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Role Name, Description, Accent Color, Live Role Preview */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-4.5">
              {/* Role Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Role Name <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Finance Manager"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 rounded-xl h-10 text-xs sm:text-sm bg-card border-border font-medium placeholder:text-muted-foreground focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Description</Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {description.length}/300
                  </span>
                </div>
                <Textarea
                  placeholder="Manage student fee collections, school expenses, and financial invoices."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                  rows={3}
                  className="rounded-xl text-xs sm:text-sm bg-card border-border resize-none placeholder:text-muted-foreground focus-visible:ring-blue-500"
                />
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Accent Color</Label>
                <p className="text-[11px] text-muted-foreground">Choose a badge color to visually identify this role across the school.</p>
                <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto py-1.5">
                  {COLOR_PRESETS.map((c) => {
                    const isSelected = color.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        className={cn(
                          "size-8 sm:size-8.5 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-2xs",
                          isSelected
                            ? "ring-2 ring-offset-2 ring-blue-600 dark:ring-offset-slate-900 scale-105"
                            : "hover:scale-105 opacity-90 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                        title={c}
                      >
                        {isSelected && (
                          <Check className="size-3.5 text-white stroke-[3] drop-shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Role Preview Card */}
              <div className="rounded-2xl border border-blue-100/90 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 p-3.5 sm:p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Eye className="size-4 text-blue-600 dark:text-blue-400" />
                  <span>Live Role Preview</span>
                </div>
                <p className="text-[11px] text-muted-foreground">See how this role card will render for school staff</p>

                <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-start gap-3">
                  <div
                    className="size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors font-bold text-base"
                    style={{ 
                      backgroundColor: `${color}18`,
                      color: color 
                    }}
                  >
                    {name.trim() ? name.trim().charAt(0).toUpperCase() : <Users className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {name.trim() || "Finance Manager"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {description.trim() || "Custom role with module-specific permissions."}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/70 text-muted-foreground border border-border">
                        <Users className="size-2.5" /> School Role
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                        <Shield className="size-2.5" /> {totalPermissions} Granted
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Permission Matrix */}
            <div className="lg:col-span-7 space-y-3">
              {/* Header of Permission Matrix */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                    <Grid className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Permission Matrix</h4>
                    <p className="text-[11px] text-muted-foreground">Set module-wise access levels for this role</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGrantAll}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground/30 text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                  <span className="ml-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
                    {PERMISSION_MODULES.length} modules
                  </span>
                </div>
              </div>

              {/* DESKTOP MATRIX TABLE (hidden on small mobile screens) */}
              <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                {/* Table Column Headers */}
                <div className="grid grid-cols-12 bg-muted/40 px-3.5 py-2.5 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider items-center sticky top-0 z-10 backdrop-blur-xs">
                  <div className="col-span-6">Module</div>
                  <div className="col-span-6 grid grid-cols-4 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <Eye className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold text-foreground">View</span>
                      <span className="text-[9px] text-muted-foreground font-normal lowercase">read only</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <PlusCircle className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold text-foreground">Create</span>
                      <span className="text-[9px] text-muted-foreground font-normal lowercase">add new</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Edit3 className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold text-foreground">Edit</span>
                      <span className="text-[9px] text-muted-foreground font-normal lowercase">modify</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Trash2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold text-foreground">Delete</span>
                      <span className="text-[9px] text-muted-foreground font-normal lowercase">remove</span>
                    </div>
                  </div>
                </div>

                {/* Modules Rows */}
                <div 
                  data-lenis-prevent
                  className="divide-y divide-border max-h-[380px] overflow-y-auto overscroll-contain touch-pan-y"
                >
                  {PERMISSION_MODULES.map((module) => {
                    const modPerms = permissions[module.key] || [];
                    return (
                      <div key={module.key} className="grid grid-cols-12 px-3.5 py-2 hover:bg-muted/30 transition-colors items-center">
                        {/* Module name & icon */}
                        <div className="col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", module.iconBg)}>
                            {module.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{module.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{module.desc || `Manage ${module.label.toLowerCase()}`}</p>
                          </div>
                        </div>

                        {/* 4 Actions checkboxes */}
                        <div className="col-span-6 grid grid-cols-4">
                          {PERMISSION_ACTIONS.map((action) => {
                            const checked = modPerms.includes(action);
                            return (
                              <div key={action} className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => togglePermission(module.key, action)}
                                  className={cn(
                                    "size-5 rounded-md border flex items-center justify-center transition-all cursor-pointer",
                                    checked
                                      ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                                      : "border-slate-300 dark:border-slate-700 bg-card hover:bg-muted/50"
                                  )}
                                  title={`${action} ${module.label}`}
                                >
                                  {checked && <Check className="size-3.5 stroke-[3]" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MOBILE ACCORDION MATRIX (Shown on small screens) */}
              <div 
                data-lenis-prevent
                className="block sm:hidden space-y-2 pr-0.5"
              >
                {PERMISSION_MODULES.map((module) => {
                  const modPerms = permissions[module.key] || [];
                  const isExpanded = expandedMobileModule === module.key;
                  return (
                    <div 
                      key={module.key}
                      className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedMobileModule(isExpanded ? null : module.key)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", module.iconBg)}>
                            {module.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{module.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {modPerms.length > 0 ? `${modPerms.length} allowed` : "No access"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={cn("size-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                      </button>

                      {/* Collapsible Actions */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-border/60 bg-muted/20 grid grid-cols-2 gap-2 mt-2">
                          {PERMISSION_ACTIONS.map((action) => {
                            const checked = modPerms.includes(action);
                            return (
                              <button
                                key={action}
                                type="button"
                                onClick={() => togglePermission(module.key, action)}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                                  checked 
                                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                    : "bg-card border-border text-foreground hover:bg-muted/50"
                                )}
                              >
                                <span className="capitalize">{action}</span>
                                <div className={cn(
                                  "size-4 rounded flex items-center justify-center border",
                                  checked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700"
                                )}
                                >
                                  {checked && <Check className="size-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Tip & Action Buttons */}
        <div className="p-3.5 sm:p-5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          {/* Left Tip */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="size-6 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Lightbulb className="size-3.5" />
            </div>
            <p className="text-[11px] sm:text-xs">
              <strong className="text-foreground font-semibold">Tip: </strong> 
              Start with view permissions and add create/edit/delete as needed for staff roles.
            </p>
          </div>

          {/* Right Buttons */}
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto shrink-0">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={saving} 
              className="rounded-xl px-4 h-9 text-xs font-semibold border-border cursor-pointer flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              onClick={onSave} 
              disabled={saving} 
              className="rounded-xl px-5 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer flex-1 sm:flex-none"
            >
              {saving ? (
                <Fragment>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving…
                </Fragment>
              ) : editingRole ? (
                "Save Changes"
              ) : (
                "Create Role"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
