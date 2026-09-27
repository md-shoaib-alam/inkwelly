import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  X,
  UserRound,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Shield,
  Power,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Heart,
  Loader2,
  Clock3,
  Users2,
  Settings,
  ArrowRightLeft,
  UserMinus,
  Plus,
  Search,
} from "lucide-react";
import { PlatformUser, ROLE_CONFIG, TenantInfo } from "./types";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUpdateUser, useTenants } from "@/lib/graphql/hooks";

interface UserDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PlatformUser | null;
  onToggleStatus: (userId: string) => void;
  onUserUpdated?: (updatedUser: PlatformUser) => void;
  toggling: boolean;
  formatDateTime: (val: string) => string;
  tenants?: TenantInfo[];
}

export function UserDetailSheet({
  open,
  onOpenChange,
  user,
  onToggleStatus,
  onUserUpdated,
  toggling,
  formatDateTime,
  tenants,
}: UserDetailSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "relations" | "settings">("overview");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<PlatformUser | null>(user);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("admin");
  const [editTenantId, setEditTenantId] = useState<string>("none");

  // Quick school assignment popover state
  const [isSchoolPopoverOpen, setIsSchoolPopoverOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [pendingSchoolChange, setPendingSchoolChange] = useState<{
    tenantId: string | null;
    schoolName: string;
  } | null>(null);
  const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false);

  const updateUserMutation = useUpdateUser();
  const { data: tenantsData } = useTenants({ limit: 1000 });

  const allTenants: TenantInfo[] = useMemo(() => {
    if (tenantsData?.tenants && tenantsData.tenants.length > 0) {
      return tenantsData.tenants.map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug || "",
        plan: t.plan,
        status: t.status,
      }));
    }
    return tenants || [];
  }, [tenantsData, tenants]);

  const filteredTenants = useMemo(() => {
    if (!schoolSearchQuery.trim()) return allTenants;
    const q = schoolSearchQuery.toLowerCase();
    return allTenants.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.slug && t.slug.toLowerCase().includes(q))
    );
  }, [allTenants, schoolSearchQuery]);

  useEffect(() => {
    if (user) {
      setCurrentUserData(user);
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phone || "");
      setEditRole(user.role || "admin");
      setEditTenantId(user.tenant?.id || "none");
      setIsEditing(false);
      setIsSchoolPopoverOpen(false);
      setSchoolSearchQuery("");
    }
  }, [user]);

  if (!user || !currentUserData) return null;

  const roleConf = ROLE_CONFIG[currentUserData.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.student;
  const initials = (currentUserData.name || "U")
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleCopyEmail = () => {
    copyToClipboard(currentUserData.email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Email Address is required");
      return;
    }

    try {
      const currentTenantId = currentUserData.tenant?.id || null;
      const res = await updateUserMutation.mutateAsync({
        id: currentUserData.id,
        data: {
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim() || undefined,
          role: editRole,
          tenantId: currentTenantId,
        },
      });

      const updatedUser: PlatformUser = {
        ...currentUserData,
        name: res?.name || editName.trim(),
        email: res?.email || editEmail.trim(),
        phone: res?.phone !== undefined ? res.phone : editPhone.trim(),
        role: res?.role || editRole,
        tenant: res?.tenant !== undefined 
          ? res.tenant 
          : (editTenantId === "none" ? null : allTenants.find((t) => t.id === editTenantId) || null),
      };

      setCurrentUserData(updatedUser);
      onUserUpdated?.(updatedUser);
      setIsEditing(false);
    } catch {
      // Handled in platform.hooks.ts onError
    }
  };

  const handleQuickSchoolChange = async (newTenantId: string | null) => {
    try {
      const res = await updateUserMutation.mutateAsync({
        id: currentUserData.id,
        data: {
          tenantId: newTenantId === "none" || !newTenantId ? null : newTenantId,
        },
      });

      const updatedUser: PlatformUser = {
        ...currentUserData,
        tenant: res?.tenant !== undefined 
          ? res.tenant 
          : (newTenantId === "none" || !newTenantId ? null : allTenants.find((t) => t.id === newTenantId) || null),
      };

      setCurrentUserData(updatedUser);
      onUserUpdated?.(updatedUser);
      setEditTenantId(updatedUser.tenant?.id || "none");
      setIsSchoolPopoverOpen(false);
      setPendingSchoolChange(null);
      
      if (!newTenantId || newTenantId === "none") {
        toast.success("User unassigned from school successfully");
      } else {
        const assignedSchool = allTenants.find((t) => t.id === newTenantId);
        toast.success(`User assigned to ${assignedSchool?.name || "school"} successfully`);
      }
    } catch {
      // Handled in platform.hooks.ts onError
    }
  };

  const requestSchoolChange = (newTenantId: string | null) => {
    const schoolName = newTenantId 
      ? allTenants.find((t) => t.id === newTenantId)?.name || "the selected school"
      : "Platform Level (No School)";
    setPendingSchoolChange({ tenantId: newTenantId, schoolName });
    setIsSchoolPopoverOpen(false);
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return "–";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "–";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const roleRelationsLabel =
    currentUserData.role === "parent" ? "Children" :
    currentUserData.role === "teacher" ? "Students" :
    currentUserData.role === "student" ? "Classes" : "Team";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="w-full sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border-l border-slate-200/90 dark:border-zinc-800 shadow-2xl flex flex-col focus:outline-none h-full max-h-screen"
      >
        {/* Top Header Controls (Close & Options) */}
        <div className="flex items-center justify-between p-6 pb-2 shrink-0">
          {/* Large Avatar & Name Header */}
          <div className="flex items-start gap-4">
            <div className="size-20 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 text-white font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
              {initials}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {currentUserData.name}
              </h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <UserRound className="size-3.5 text-slate-400" />
                <span>{roleConf.label} Account</span>
              </div>

              {/* Status and Role Badges */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {currentUserData.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Active Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                    <Clock className="size-3 text-amber-500" />
                    Inactive
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold border ${roleConf.bg} ${roleConf.color}`}
                >
                  {roleConf.icon}
                  {roleConf.label}
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 transition-colors shrink-0 self-start cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 dark:border-zinc-800/80 text-xs sm:text-sm font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <UserRound className="size-4" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "activity"
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Clock3 className="size-4" />
            <span>Activity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("relations")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "relations"
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Users2 className="size-4" />
            <span>{roleRelationsLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "settings"
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Settings className="size-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* Scrollable Content Body - with Lenis smooth scrolling */}
        <div 
          data-lenis-scroll-container
          className="flex-1 overflow-y-auto min-h-0 overscroll-contain px-6 py-5 space-y-6 touch-pan-y"
        >
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  Basic Information
                </h3>
              </div>

                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditName(currentUserData.name || "");
                      setEditEmail(currentUserData.email || "");
                      setEditPhone(currentUserData.phone || "");
                      setEditRole(currentUserData.role || "admin");
                      setEditTenantId(currentUserData.tenant?.id || "none");
                      setIsEditing(true);
                    }}
                    className="h-8 px-3 rounded-xl border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Edit</span>
                  </Button>
                ) : (
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-200/80 dark:border-blue-800/60">
                    Editing Mode
                  </span>
                )}
              </div>

              {isEditing ? (
                /* Editable Form */
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-blue-200/80 dark:border-blue-900/50 space-y-3.5 animate-in fade-in-50 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        System Role <span className="text-red-500">*</span>
                      </Label>
                      <Select value={editRole} onValueChange={setEditRole}>
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800">
                          <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                          <SelectItem value="teacher" className="text-xs">Teacher</SelectItem>
                          <SelectItem value="student" className="text-xs">Student</SelectItem>
                          <SelectItem value="parent" className="text-xs">Parent</SelectItem>
                          <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                          <SelectItem value="super_admin" className="text-xs">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="e.g. user@school.com"
                        className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Phone Number
                      </Label>
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="e.g. +1 234 567 8900"
                        className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditName(currentUserData.name || "");
                        setEditEmail(currentUserData.email || "");
                        setEditPhone(currentUserData.phone || "");
                        setEditRole(currentUserData.role || "admin");
                        setEditTenantId(currentUserData.tenant?.id || "none");
                        setIsEditing(false);
                      }}
                      disabled={updateUserMutation.isPending}
                      className="h-8 px-3 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateUserMutation.isPending}
                      className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Cards */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <UserRound className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Full Name</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate mt-0.5">
                        {currentUserData.name}
                      </p>
                    </div>
                  </div>

                  {/* System Role Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <UserRound className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">System Role</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate mt-0.5">
                        {roleConf.label}
                      </p>
                    </div>
                  </div>

                  {/* Email Address Card - FULL WIDTH (sm:col-span-2) so full email is always visible on desktop */}
                  <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Mail className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Email Address</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 break-all select-all mt-0.5 leading-snug">
                          {currentUserData.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      title="Copy Email"
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 shrink-0 transition-colors cursor-pointer border border-transparent hover:border-slate-200/80 dark:hover:border-zinc-700 shadow-2xs"
                    >
                      {copiedEmail ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  {/* Phone Number Card - FULL WIDTH (sm:col-span-2) */}
                  <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Phone className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Phone Number</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate mt-0.5">
                        {currentUserData.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: School Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    School Information
                  </h3>
                </div>

                {/* Quick Assign / Change School Popover */}
                <Popover open={isSchoolPopoverOpen} onOpenChange={setIsSchoolPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateUserMutation.isPending}
                      className="h-8 px-3 rounded-xl border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 hover:bg-blue-100/70 text-blue-600 dark:text-blue-400 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ArrowRightLeft className="size-3.5" />
                      <span>{currentUserData.tenant ? "Change School" : "Assign to School"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0 rounded-2xl border-slate-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950">
                    <div className="p-3 border-b border-slate-100 dark:border-zinc-800 space-y-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {currentUserData.tenant ? "Change User's School" : "Assign User to School"}
                      </p>
                        <div className="relative">
                          <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <Input
                            value={schoolSearchQuery}
                            onChange={(e) => setSchoolSearchQuery(e.target.value)}
                            placeholder="Search school name..."
                            className="h-8 pl-8 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                        {/* Option: Platform Level / Unassigned (No School) */}
                        <button
                          type="button"
                          onClick={() => requestSchoolChange(null)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            !currentUserData.tenant
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <Building2 className="size-3 text-slate-500" />
                            </div>
                            <div className="truncate">
                              <p className="truncate font-medium">Platform Level (No School)</p>
                              <p className="text-[10px] text-slate-400">Global Admin / Unassigned</p>
                            </div>
                          </div>
                          {!currentUserData.tenant && <Check className="size-3.5 text-blue-600 shrink-0" />}
                        </button>

                        {filteredTenants.length === 0 ? (
                          <p className="p-4 text-center text-xs text-slate-400">No schools found</p>
                        ) : (
                          filteredTenants.map((t) => {
                            const isCurrent = currentUserData.tenant?.id === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => requestSchoolChange(t.id)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                  isCurrent
                                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                                    : "hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                                    <Building2 className="size-3" />
                                  </div>
                                  <div className="truncate">
                                    <p className="truncate font-medium">{t.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{t.slug ? `/${t.slug}` : t.id}</p>
                                  </div>
                                </div>
                                {isCurrent && <Check className="size-3.5 text-blue-600 shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    currentUserData.tenant 
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" 
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-500"
                  }`}>
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUserData.tenant?.name || "Platform Level (No Tenant)"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {currentUserData.tenant?.slug ? `/${currentUserData.tenant.slug}` : "Global Admin • No School Assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {currentUserData.tenant ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          router.push(`/${currentUserData.tenant?.slug || currentUserData.tenant?.id}`);
                        }}
                        className="h-8 px-3 rounded-xl border-blue-200 dark:border-blue-900/60 bg-blue-50/50 hover:bg-blue-100/70 text-blue-600 dark:text-blue-400 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <span>View School</span>
                        <ExternalLink className="size-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updateUserMutation.isPending}
                        onClick={() => requestSchoolChange(null)}
                        className="h-8 px-3 rounded-xl border-rose-200 dark:border-rose-900/60 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 dark:text-rose-400 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                        title="Deassign / remove this school"
                      >
                        <UserMinus className="size-3" />
                        <span>Deassign</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSchoolPopoverOpen(true)}
                      className="h-8 px-3 rounded-xl border-blue-200 dark:border-blue-900/60 bg-blue-50/50 hover:bg-blue-100/70 text-blue-600 dark:text-blue-400 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="size-3" />
                      <span>Assign to School</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Account Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Account Status
                </h3>
              </div>

              {/* Status Toggle Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {currentUserData.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 shrink-0">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active Account
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 shrink-0">
                      <Clock className="size-3 text-amber-500" />
                      Inactive Account
                    </span>
                  )}
                  <p className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    {currentUserData.isActive
                      ? "This account is active and can access the platform."
                      : "This account is currently suspended and cannot log in."}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={toggling}
                  onClick={() => setConfirmStatusDialogOpen(true)}
                  className={`h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs transition-colors shrink-0 ${
                    currentUserData.isActive
                      ? "border-red-200 dark:border-red-900/50 bg-red-50/60 hover:bg-red-100/80 text-red-600 dark:text-red-400 dark:bg-red-950/30"
                      : "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30"
                  }`}
                >
                  {toggling ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Power className="size-3.5" />
                  )}
                  <span>{currentUserData.isActive ? "Deactivate" : "Activate"}</span>
                </Button>
              </div>

              {/* 2-Col Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Joined Date Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Joined Date</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatDateShort(currentUserData.createdAt)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Account creation date</p>
                  </div>
                </div>

                {/* Last Login Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Last Login</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatDateTime(currentUserData.createdAt)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Last active on platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-zinc-950 shrink-0">
          {!isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-6 rounded-xl border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 font-semibold text-xs sm:text-sm shadow-2xs cursor-pointer"
              >
                Close
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setEditName(currentUserData.name || "");
                  setEditEmail(currentUserData.email || "");
                  setEditPhone(currentUserData.phone || "");
                  setEditRole(currentUserData.role || "admin");
                  setEditTenantId(currentUserData.tenant?.id || "none");
                  setIsEditing(true);
                }}
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Edit2 className="size-3.5" />
                <span>Edit User</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditName(currentUserData.name || "");
                  setEditEmail(currentUserData.email || "");
                  setEditPhone(currentUserData.phone || "");
                  setEditRole(currentUserData.role || "admin");
                  setEditTenantId(currentUserData.tenant?.id || "none");
                  setIsEditing(false);
                }}
                disabled={updateUserMutation.isPending}
                className="h-10 px-6 rounded-xl border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 font-semibold text-xs sm:text-sm shadow-2xs cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateUserMutation.isPending}
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>

      {/* Confirmation Alert Dialog for School Change / Deassign */}
      <AlertDialog
        open={!!pendingSchoolChange}
        onOpenChange={(open) => {
          if (!open && !updateUserMutation.isPending) {
            setPendingSchoolChange(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl w-[calc(100%-2.5rem)] max-w-sm p-4 sm:p-6">
          <AlertDialogHeader className="text-center sm:text-left">
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {!pendingSchoolChange?.tenantId ? "Deassign School?" : "Assign School?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {!pendingSchoolChange?.tenantId ? (
                <>
                  Remove <strong className="text-slate-800 dark:text-slate-200">{currentUserData.name || "user"}</strong> from <strong className="text-slate-800 dark:text-slate-200">{currentUserData.tenant?.name || "school"}</strong>?
                </>
              ) : (
                <>
                  Assign <strong className="text-slate-800 dark:text-slate-200">{currentUserData.name || "user"}</strong> to <strong className="text-slate-800 dark:text-slate-200">{pendingSchoolChange?.schoolName}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 flex flex-row items-center justify-end gap-2.5">
            <AlertDialogCancel
              disabled={updateUserMutation.isPending}
              onClick={() => setPendingSchoolChange(null)}
              className="flex-1 sm:flex-none h-9 rounded-xl text-xs font-semibold cursor-pointer m-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={updateUserMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingSchoolChange) {
                  handleQuickSchoolChange(pendingSchoolChange.tenantId);
                }
              }}
              className={`flex-1 sm:flex-none h-9 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                !pendingSchoolChange?.tenantId
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : !pendingSchoolChange?.tenantId ? (
                "Yes, Deassign"
              ) : (
                "Yes, Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Alert Dialog for Account Deactivation / Activation */}
      <AlertDialog
        open={confirmStatusDialogOpen}
        onOpenChange={(open) => {
          if (!open && !toggling) {
            setConfirmStatusDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl w-[calc(100%-2.5rem)] max-w-sm p-4 sm:p-6">
          <AlertDialogHeader className="text-center sm:text-left">
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {currentUserData.isActive ? "Deactivate Account?" : "Activate Account?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {currentUserData.isActive ? (
                <>
                  Deactivate <strong className="text-slate-800 dark:text-slate-200">{currentUserData.name || "this user"}</strong>? They will be suspended from logging into the platform.
                </>
              ) : (
                <>
                  Activate <strong className="text-slate-800 dark:text-slate-200">{currentUserData.name || "this user"}</strong>? They will be able to log in and access the platform.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 flex flex-row items-center justify-end gap-2.5">
            <AlertDialogCancel
              disabled={toggling}
              onClick={() => setConfirmStatusDialogOpen(false)}
              className="flex-1 sm:flex-none h-9 rounded-xl text-xs font-semibold cursor-pointer m-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={toggling}
              onClick={async (e) => {
                e.preventDefault();
                await onToggleStatus(currentUserData.id);
                setConfirmStatusDialogOpen(false);
              }}
              className={`flex-1 sm:flex-none h-9 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                currentUserData.isActive
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {toggling ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : currentUserData.isActive ? (
                "Yes, Deactivate"
              ) : (
                "Yes, Activate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
