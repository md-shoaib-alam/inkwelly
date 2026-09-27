import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Search, 
  Loader2, 
  UserPlus, 
  UserMinus, 
  Users, 
  CheckCircle2, 
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
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  PlatformRoleRecord, 
  AssignedUser, 
  AvailableUser, 
  PLATFORM_MODULES, 
  PERMISSION_ACTIONS, 
  ACTION_LABELS, 
  COLOR_PRESETS,
  getInitials 
} from "./types";

interface RoleDialogsProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingRole: PlatformRoleRecord | null;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  permissions: Record<string, string[]>;
  togglePermission: (mod: string, action: string) => void;
  onSave: () => void;
  saving: boolean;

  // Assign Dialog
  assignDialogOpen: boolean;
  setAssignDialogOpen: (open: boolean) => void;
  assigningRole: PlatformRoleRecord | null;
  assignedUsers: AssignedUser[];
  availableUsers: AvailableUser[];
  assignLoading: boolean;
  assignSaving: boolean;
  userSearch: string;
  setUserSearch: (v: string) => void;
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
}

export function RoleDialogs({
  dialogOpen,
  setDialogOpen,
  editingRole,
  name,
  setName,
  description,
  setDescription,
  color,
  setColor,
  permissions,
  togglePermission,
  onSave,
  saving,

  assignDialogOpen,
  setAssignDialogOpen,
  assigningRole,
  assignedUsers,
  availableUsers,
  assignLoading,
  assignSaving,
  userSearch,
  setUserSearch,
  onAssign,
  onUnassign,
}: RoleDialogsProps) {
  const [expandedMobileModule, setExpandedMobileModule] = useState<string | null>(null);

  const filteredAvailable = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <Fragment>
      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  {editingRole ? `Edit "${editingRole.name}"` : "Create New Platform Role"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
                  Define a new role with platform-level permissions for staff members.
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDialogOpen(false)}
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
                      placeholder="e.g. Billing Manager"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 rounded-xl h-10 text-xs sm:text-sm bg-card border-border font-medium placeholder:text-muted-foreground focus-visible:ring-blue-500"
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
                    placeholder="Manage billing, invoices, and subscription plans across all schools."
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                    rows={3}
                    className="rounded-xl text-xs sm:text-sm bg-card border-border resize-none placeholder:text-muted-foreground focus-visible:ring-blue-500"
                  />
                </div>

                {/* Accent Color Palette */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Accent Color</Label>
                  <p className="text-[11px] text-muted-foreground">Choose a color to identify this role across the platform.</p>
                  <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto py-1.5">
                    {COLOR_PRESETS.map((c) => {
                      const isSelected = color.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            "size-8 sm:size-8.5 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0",
                            isSelected
                              ? "ring-2 ring-offset-2 ring-blue-600 scale-105 shadow-xs"
                              : "hover:scale-105 opacity-90 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => setColor(c)}
                          title={c}
                        >
                          {isSelected && (
                            <Check className="size-4 text-white stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Role Preview Card */}
                <div className="rounded-2xl border border-blue-100/80 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 p-3 sm:p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Eye className="size-4 text-blue-600 dark:text-blue-400" />
                    <span>Live Role Preview</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">See how this role will appear in the system</p>

                  <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-center gap-3">
                    <div
                      className="size-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors"
                      style={{ 
                        backgroundColor: `${color}18`,
                        color: color 
                      }}
                    >
                      <Users className="size-5.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {name.trim() || "Billing Manager"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {description.trim() || "Manage billing, invoices, and subscription plans"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/70 text-muted-foreground border border-border">
                          <Users className="size-2.5" /> Platform Role
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/70 text-muted-foreground border border-border">
                          <Shield className="size-2.5" /> Custom Role
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
                      <p className="text-[11px] text-muted-foreground">Set module-wise permissions for this role</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                    {PLATFORM_MODULES.length} modules
                  </span>
                </div>

                {/* DESKTOP MATRIX TABLE (hidden on small mobile screens) */}
                <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                  {/* Table Column Headers */}
                  <div className="grid grid-cols-12 bg-muted/40 px-3.5 py-2.5 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider items-center sticky top-0 z-10">
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
                    {PLATFORM_MODULES.map((module: any) => {
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
                  {PLATFORM_MODULES.map((module: any) => {
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
                                  )}>
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
                Start with view permissions and add more as needed. You can always modify these permissions later.
              </p>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-2 justify-end w-full sm:w-auto shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)} 
                disabled={saving} 
                className="rounded-xl px-4 h-9 text-xs font-semibold border-border cursor-pointer flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={saving}
                className="rounded-xl px-5 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5 cursor-pointer flex-1 sm:flex-none"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-3.5 stroke-[2.5]" />
                    <span>{editingRole ? "Update Role" : "Create Role"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 border border-border bg-card shadow-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground">
              <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                <Users className="size-4" />
              </div>
              <span>Assign Users to &quot;{assigningRole?.name}&quot;</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Select platform administrators or staff to assign or unassign this role.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4.5 min-h-[380px]">
            {/* Left: Available Users */}
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">Available Users</Label>
                <Badge variant="secondary" className="text-[10px] font-semibold">{filteredAvailable.length} candidates</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 rounded-xl h-8.5 text-xs bg-card border-border"
                />
              </div>

              <div className="flex-1 rounded-xl border border-border overflow-hidden bg-muted/20">
                <div className="h-[280px] overflow-y-auto p-2 space-y-1.5">
                  {assignLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="size-5 animate-spin text-blue-600" />
                    </div>
                  ) : filteredAvailable.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Search className="size-7 text-muted-foreground/40 mb-1.5" />
                      <p className="text-xs font-medium text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    filteredAvailable.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border hover:border-blue-200 dark:hover:border-blue-800 shadow-2xs transition-all group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-7 border border-border">
                            <AvatarFallback className="text-[10px] font-semibold bg-blue-50 text-blue-600">{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate leading-tight">{user.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                          disabled={assignSaving}
                          onClick={() => onAssign(user.id)}
                        >
                          <UserPlus className="size-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Assigned Users */}
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">Currently Assigned</Label>
                <Badge className="text-[10px] font-semibold bg-blue-600 text-white">{assignedUsers.length} Users</Badge>
              </div>

              <div className="flex-1 rounded-xl border border-blue-100 dark:border-blue-900/50 overflow-hidden bg-blue-50/20 dark:bg-blue-950/10">
                <div className="h-[320px] overflow-y-auto p-2 space-y-1.5">
                  {assignLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="size-5 animate-spin text-blue-600" />
                    </div>
                  ) : assignedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Users className="size-7 text-blue-200 dark:text-blue-900 mb-1.5" />
                      <p className="text-xs font-medium text-muted-foreground">No users assigned yet</p>
                    </div>
                  ) : (
                    assignedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border shadow-2xs group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-7 border border-border">
                            <AvatarFallback className="text-[10px] font-semibold bg-blue-600 text-white">{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate leading-tight">{user.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          disabled={assignSaving}
                          onClick={() => onUnassign(user.id)}
                        >
                          <UserMinus className="size-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t border-border flex justify-end">
            <Button 
              onClick={() => setAssignDialogOpen(false)} 
              className="rounded-xl px-4 h-8.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              Done Managing Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
