"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  Briefcase,
  Shield,
  User,
  School,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  MoreVertical,
  Calendar,
  MapPin,
  Pencil,
  Building2,
  FileText,
  StickyNote,
  Clock,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import type { StaffMember } from "./types";
import { getInitials } from "./utils";

interface StaffDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
  canEdit?: boolean;
  onEdit?: (member: StaffMember) => void;
  isLoading?: boolean;
}

export function StaffDetailDialog({
  open,
  onOpenChange,
  member,
  canEdit = true,
  onEdit,
  isLoading = false,
}: StaffDetailDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "documents" | "notes">("overview");

  if (!member && !isLoading) return null;

  const currentMember = member || {
    id: "",
    name: "Staff Member",
    email: "staff@school.com",
    role: "staff",
    phone: null,
    address: null,
    isActive: true,
    customRole: null,
    createdAt: new Date().toISOString(),
  };

  const handleCopy = (text: string, fieldName: string) => {
    copyToClipboard(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${fieldName} copied to clipboard`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      // Check if it's numeric timestamp in ms or seconds
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

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "notes", label: "Notes", icon: StickyNote },
  ] as const;

  const displayStaffId = currentMember.id ? `STF${currentMember.id.slice(-4).toUpperCase()}` : "STF001";
  const displayRole = currentMember.customRole?.name || "Standard Staff";
  const initials = getInitials(currentMember.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-t-3xl sm:rounded-2xl max-h-[95vh] sm:max-h-[92vh] flex flex-col focus:outline-none"
        data-lenis-prevent
        showCloseButton={false}
      >
        {/* Top Header Section with mint gradient aura */}
        <div className="relative px-4 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 shrink-0">
          
          {/* Top navigation row with Back button and action buttons */}
          <div className="flex items-center justify-between pb-3 sm:pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 transition-all shadow-xs"
              >
                <ChevronLeft className="size-4" />
                <span>Back to Staff</span>
              </button>

              <span className="hidden sm:inline-flex items-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Staff <span className="mx-1.5 text-slate-300 dark:text-zinc-700">›</span> Staff Profile
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop Edit Profile Button */}
              {canEdit && (
                <Button
                  onClick={() => onEdit && onEdit(currentMember)}
                  className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  <Pencil className="size-3.5" />
                  Edit Profile
                </Button>
              )}

              {/* Desktop Print Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <Printer className="size-3.5" />
                Print
              </Button>

              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="size-5" />
              </button>
            </div>
          </div>

          {/* Staff Profile Summary Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-6 mt-1">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left w-full sm:w-auto">
              {/* Avatar circle */}
              <div className="size-20 sm:size-22 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-[2.5px] border-emerald-500/25 flex items-center justify-center text-emerald-800 dark:text-emerald-300 text-2xl sm:text-3xl font-bold shadow-sm shrink-0 overflow-hidden">
                {initials}
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col items-center sm:items-start w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {currentMember.name}
                  </DialogTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                    {displayRole}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                    <span className={`size-1.5 rounded-full ${currentMember.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    {currentMember.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <DialogDescription className="sr-only">
                  Detailed profile information for {currentMember.name}
                </DialogDescription>

                {/* Email line */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  <Mail className="size-3.5 text-slate-400 shrink-0" />
                  <span>{currentMember.email}</span>
                </div>

                {/* Staff ID with Copy Button */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
                  <span>Staff ID:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{displayStaffId}</span>
                  <button
                    onClick={() => handleCopy(displayStaffId, "Staff ID")}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors rounded"
                    aria-label="Copy Staff ID"
                  >
                    {copiedField === "Staff ID" ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Right Side Inspirational Quote Banner with graphic */}
            <div className="hidden lg:flex items-end justify-end gap-4 pr-2 self-end shrink-0">
              <div className="text-right italic text-xs text-slate-400 dark:text-zinc-500 max-w-[200px] pb-1 leading-relaxed">
                &ldquo;Dedicated service, driving institutional excellence.&rdquo;
              </div>
              <div className="relative w-32 h-24 shrink-0 overflow-hidden">
                <Image
                  src="/assets/admin/table.avif"
                  alt="Staff illustration"
                  fill
                  className="object-contain object-bottom-right opacity-90"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-3 sm:px-8 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-around sm:justify-start gap-1 sm:gap-6 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 sm:px-1 text-[11px] sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-emerald-600 dark:text-emerald-400 stroke-[2.2]" : "text-slate-400 stroke-[1.8]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Scrollable Content Body */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-5 overscroll-contain touch-pan-y"
          data-lenis-prevent
        >
          {activeTab === "overview" ? (
            <div className="space-y-5">
              {/* Row 1: Personal & Contact Information & Professional Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Card 1: Personal & Contact Information */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                      <User className="size-4 text-emerald-600" />
                      Personal & Contact Information
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => onEdit && onEdit(currentMember)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="space-y-3.5 text-xs sm:text-sm">
                    {/* Full Name */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <User className="size-4 text-slate-400" />
                        Full Name
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right">
                        {currentMember.name}
                      </span>
                    </div>

                    {/* Email Address */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <Mail className="size-4 text-slate-400" />
                        Email Address
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right truncate max-w-[180px] sm:max-w-xs">
                          {currentMember.email}
                        </span>
                        <button
                          onClick={() => handleCopy(currentMember.email, "Email")}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition-colors rounded"
                          aria-label="Copy Email"
                        >
                          {copiedField === "Email" ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <Phone className="size-4 text-slate-400" />
                        Phone Number
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right">
                        {currentMember.phone || "—"}
                      </span>
                    </div>

                    {/* Staff ID */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <Building2 className="size-4 text-slate-400" />
                        Staff ID
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right">
                        {displayStaffId}
                      </span>
                    </div>

                    {/* Residential Address */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <MapPin className="size-4 text-slate-400" />
                        Address
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right max-w-[180px] sm:max-w-xs truncate">
                        {currentMember.address || "No address registered"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Role & System Information */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                      <Briefcase className="size-4 text-emerald-600" />
                      Role & Permissions
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => onEdit && onEdit(currentMember)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="space-y-3.5 text-xs sm:text-sm">
                    {/* System Role */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <Shield className="size-4 text-slate-400" />
                        Assigned Role
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right">
                        {displayRole}
                      </span>
                    </div>

                    {/* Registration Date */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <Calendar className="size-4 text-slate-400" />
                        Registered On
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right">
                        {formatDate(currentMember.createdAt)}
                      </span>
                    </div>

                    {/* Account Status */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <Check className="size-4 text-slate-400" />
                        Account Status
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                        <span className={`size-1.5 rounded-full ${currentMember.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        {currentMember.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Access Tier */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-medium">
                        <Key className="size-4 text-slate-400" />
                        Access Level
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-100 text-right">
                        {currentMember.role === "admin" ? "Administrator" : "Staff Portal"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Additional Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Security & Access Card */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                      <Clock className="size-4 text-emerald-600" />
                      Activity & Security
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

                {/* Quick Info / Department Note Card */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                      <StickyNote className="size-4 text-emerald-600" />
                      Department Notes
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Active staff member registered within the school management system. Access permissions and assigned roles can be updated via the Edit Profile action.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 dark:text-zinc-500">
              <Building2 className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No records found for {activeTab}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/60 dark:bg-zinc-900/80 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs rounded-xl font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            Close
          </Button>

          {canEdit && (
            <Button
              size="sm"
              onClick={() => onEdit && onEdit(currentMember)}
              className="h-9 px-5 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Pencil className="size-3.5" />
              Edit Profile
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
