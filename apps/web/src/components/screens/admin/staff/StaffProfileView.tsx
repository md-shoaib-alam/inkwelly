"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  ChevronLeft, Printer, Pencil, MoreVertical,
  User, Users, Phone, Mail, Briefcase,
  Copy, Check, Calendar, MapPin, Building2,
  FileText, StickyNote, MoreHorizontal,
  ChevronUp, ChevronDown, Lock, Loader2, Upload, Shield, Clock, Key
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import { useGraphQLMutation, useAssignRoleToUser } from "@/lib/graphql/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/graphql/keys";
import { useAppStore } from "@/store/use-app-store";
import type { StaffMember, CustomRole } from "./types";
import { getInitials } from "./utils";

const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      id
      name
    }
  }
`;

interface StaffProfileViewProps {
  member: StaffMember;
  roles?: CustomRole[];
  onBack: () => void;
  canEdit?: boolean;
  onEditModal?: (member: StaffMember) => void;
}

export function StaffProfileView({
  member,
  roles = [],
  onBack,
  canEdit = true,
  onEditModal,
}: StaffProfileViewProps) {
  const { currentTenantId } = useAppStore();
  const queryClient = useQueryClient();

  const { mutateAsync: updateUser } = useGraphQLMutation<{ updateUser: { id: string; name: string } }, { id: string; data: any }>(UPDATE_USER);
  const { mutateAsync: assignRole } = useAssignRoleToUser();

  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "documents" | "notes">("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState({ personal: false, role: false, security: false });

  // Local live state of the staff member
  const [currentMember, setCurrentMember] = useState<StaffMember>(member);

  useEffect(() => {
    setCurrentMember(member);
  }, [member]);

  // Track which section is in independent edit mode
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Form Data for inline editing
  const [formData, setFormData] = useState({
    name: member.name || "",
    email: member.email || "",
    phone: member.phone || "",
    address: member.address || "",
    customRoleId: member.customRole?.id || "none",
    isActive: member.isActive,
  });

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleCollapse = (key: keyof typeof collapsed) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const startEdit = (section: string) => {
    setFormData({
      name: currentMember.name || "",
      email: currentMember.email || "",
      phone: currentMember.phone || "",
      address: currentMember.address || "",
      customRoleId: currentMember.customRole?.id || "none",
      isActive: currentMember.isActive,
    });
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setEditingSection(null);
  };

  const saveSection = async (sectionName: string, title: string) => {
    if (sectionName === "personal") {
      if (!formData.name.trim()) {
        toast.error("Full Name is required");
        return;
      }
    }

    setSavingSection(sectionName);
    try {
      // 1. Update user details
      await updateUser({
        id: currentMember.id,
        data: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          isActive: formData.isActive,
        },
      });

      // 2. If role was changed in role section
      if (sectionName === "role") {
        await assignRole({
          userId: currentMember.id,
          roleId: formData.customRoleId === "none" ? "" : formData.customRoleId,
          tenantId: currentTenantId!,
        });
      }

      // Update local state
      const matchingRole = roles.find((r) => r.id === formData.customRoleId);
      const updated: StaffMember = {
        ...currentMember,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        isActive: formData.isActive,
        customRole: matchingRole ? { id: matchingRole.id, name: matchingRole.name, color: matchingRole.color } : (formData.customRoleId === "none" ? null : currentMember.customRole),
      };

      setCurrentMember(updated);
      setEditingSection(null);
      toast.success(`${title} updated successfully`);

      queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSavingSection(null);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      if (/^\d+$/.test(dateStr)) {
        const num = Number(dateStr);
        const d = new Date(num > 1e11 ? num : num * 1000);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        }
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const displayStaffId = currentMember.id ? `STF${currentMember.id.slice(-4).toUpperCase()}` : "STF001";
  const displayRole = currentMember.customRole?.name || "Standard Staff";
  const initials = getInitials(currentMember.name);

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "notes", label: "Notes", icon: StickyNote },
  ] as const;

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-6">

      {/* Breadcrumb Navigation Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-full bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-emerald-100 dark:border-zinc-700 transition-all shadow-xs"
          >
            <ChevronLeft className="size-4 text-slate-700 dark:text-zinc-300 stroke-[2.5]" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight">Back to Staff</span>
          </button>
          <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-zinc-500 font-medium">
            Staff <span className="mx-1.5 text-slate-300 dark:text-zinc-700">›</span> Staff Profile
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              onClick={() => startEdit("personal")}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              <Pencil className="size-3.5" /> Edit Profile
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <Printer className="size-3.5" /> Print
          </Button>
          <button
            className="p-2.5 sm:p-2 rounded-xl border border-slate-200/90 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            aria-label="More options"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <div className="size-16 sm:size-[72px] rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-200/60 dark:border-zinc-700 flex items-center justify-center text-emerald-800 dark:text-emerald-300 text-xl sm:text-2xl font-bold shadow-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {currentMember.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                    {displayRole}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                    <span className={`size-1.5 rounded-full ${currentMember.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    {currentMember.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Horizontal info row */}
            <div className="flex flex-wrap items-start gap-x-6 gap-y-3 pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800">
                  <User className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium leading-none mb-0.5">Staff ID</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">{displayStaffId}</p>
                    <button onClick={() => handleCopy(displayStaffId, "Staff ID")} className="text-slate-400 hover:text-emerald-600 transition-colors">
                      {copiedField === "Staff ID" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800">
                  <Mail className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium leading-none mb-0.5">Email Address</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 break-all">{currentMember.email}</p>
                    <button onClick={() => handleCopy(currentMember.email, "Email")} className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0">
                      {copiedField === "Email" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {currentMember.phone && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800">
                    <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium leading-none mb-0.5">Phone Number</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{currentMember.phone}</p>
                      <button onClick={() => handleCopy(currentMember.phone!, "Phone")} className="text-slate-400 hover:text-emerald-600 transition-colors">
                        {copiedField === "Phone" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Illustration with Quote */}
          <div className="hidden lg:flex flex-col items-end justify-end gap-2 shrink-0 self-end">
            <p className="text-right text-xs text-slate-400 dark:text-zinc-500 italic font-medium leading-snug max-w-[150px]">
              Dedicated service, driving institutional excellence.
            </p>
            <div className="relative w-36 h-26 shrink-0">
              <Image src="/assets/admin/table.avif" alt="Staff Illustration" fill className="object-contain object-bottom-right opacity-90" priority />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800/70 px-2 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-white stroke-[2.2]" : "text-slate-400 stroke-[1.8]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">

          {/* Card 1: Personal & Contact Information */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <User className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Personal &amp; Contact Information</h2>
              </div>

              <div className="flex items-center gap-2">
                {editingSection === "personal" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={savingSection === "personal"}
                      className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSection("personal", "Personal & Contact Information")}
                      disabled={savingSection === "personal"}
                      className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                    >
                      {savingSection === "personal" ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  canEdit && (
                    <button
                      onClick={() => startEdit("personal")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="size-3" /> Edit
                    </button>
                  )
                )}

                <button
                  onClick={() => toggleCollapse("personal")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-400 ml-1"
                  aria-label="Toggle collapse"
                >
                  {collapsed.personal ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </button>
              </div>
            </div>

            {!collapsed.personal && (
              editingSection === "personal" ? (
                /* INLINE EDIT FORM - Matches Teacher & Parent Forms */
                <div className="px-5 sm:px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Staff Name"
                        className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    {/* Email Address (Read-only on edit) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        disabled
                        className="h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Phone Number
                      </Label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500">
                        <span className="inline-flex items-center px-2.5 text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="w-full h-9 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Residential Address
                      </Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="City, State / Full Address"
                        className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Staff Photo</Label>
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(formData.name)}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-xs rounded-xl border-slate-200 dark:border-zinc-700 font-medium gap-1.5 hover:bg-slate-50"
                          onClick={() => toast.info("Photo upload will be saved with profile")}
                        >
                          <Upload className="size-3.5" />
                          Upload Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentMember.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Email Address</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentMember.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentMember.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Staff ID</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayStaffId}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Residential Address</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentMember.address || "No address registered"}</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Card 2: Role & System Information */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Role &amp; Permissions</h2>
              </div>

              <div className="flex items-center gap-2">
                {editingSection === "role" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={savingSection === "role"}
                      className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSection("role", "Role & Permissions")}
                      disabled={savingSection === "role"}
                      className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                    >
                      {savingSection === "role" ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  canEdit && (
                    <button
                      onClick={() => startEdit("role")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="size-3" /> Edit
                    </button>
                  )
                )}

                <button
                  onClick={() => toggleCollapse("role")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-400 ml-1"
                  aria-label="Toggle collapse"
                >
                  {collapsed.role ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </button>
              </div>
            </div>

            {!collapsed.role && (
              editingSection === "role" ? (
                /* INLINE EDIT FOR ROLE */
                <div className="px-5 sm:px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Assigned Role
                      </Label>
                      <Select
                        value={formData.customRoleId}
                        onValueChange={(val) => setFormData({ ...formData, customRoleId: val })}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Standard Staff</SelectItem>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
                                {r.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Account Status
                      </Label>
                      <Select
                        value={formData.isActive ? "active" : "inactive"}
                        onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">System Role</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayRole}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Registered On</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(currentMember.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Account Status</p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                      <span className={`size-1.5 rounded-full ${currentMember.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      {currentMember.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Access Level</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {currentMember.role === "admin" ? "Administrator" : "Staff Portal"}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Row 2: Additional Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 3: Security & Activity */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                  <Clock className="size-4 text-emerald-600" />
                  Activity &amp; Security
                </div>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400 dark:text-zinc-500 font-medium">Last Active</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Recent</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400 dark:text-zinc-500 font-medium">Password Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Configured</span>
                </div>
              </div>
            </div>

            {/* Card 4: Department Notes */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                  <StickyNote className="size-4 text-emerald-600" />
                  Department Notes
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Active staff member registered within the school management system. Access permissions and assigned roles can be updated inline or via the edit action.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="py-20 text-center text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
          <Calendar className="size-10 mx-auto mb-2 opacity-30 text-emerald-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">Attendance records for {currentMember.name}</p>
          <p className="text-xs text-slate-400 mt-1">Check staff attendance overview from the main attendance module.</p>
        </div>
      )}

      {/* Documents & Notes Tabs */}
      {(activeTab === "documents" || activeTab === "notes") && (
        <div className="py-20 text-center text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
          <Building2 className="size-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Coming soon</p>
        </div>
      )}

      {/* Mobile Sticky Edit Button */}
      {canEdit && (
        <div className="sm:hidden sticky bottom-4 z-10 pt-2">
          <Button
            onClick={() => startEdit("personal")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-3 gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Pencil className="size-4" /> Edit Profile
          </Button>
        </div>
      )}
    </div>
  );
}
