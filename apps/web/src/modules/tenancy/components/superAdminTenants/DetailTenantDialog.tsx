import React, { memo, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Crown,
  GraduationCap,
  Users,
  UserCheck,
  Edit,
  Trash2,
  Copy,
  Check,
  Info,
  Receipt,
  Settings,
  History,
  ChevronDown,
  X,
  ArrowLeft,
  MoreVertical,
  BarChart3,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { Tenant } from "./types";
import { TenantPlanBadge, TenantStatusBadge } from "./badges";
import { format } from "date-fns";
import { toast } from "sonner";

interface DetailTenantDialogProps {
  detailOpen: boolean;
  onDetailOpenChange: (open: boolean) => void;
  viewingTenant: Tenant | null;
  onEditClick: (tenant: Tenant) => void;
  onDeleteClick?: (tenant: Tenant) => void;
}

const formatDateSafe = (dateStr: any, formatStr: string = "MMM d, yyyy") => {
  if (!dateStr) return "Not set";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Not set";
    return format(date, formatStr);
  } catch {
    return "Not set";
  }
};

export function DetailTenantDialog({
  detailOpen,
  onDetailOpenChange,
  viewingTenant,
  onEditClick,
  onDeleteClick,
}: DetailTenantDialogProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "billing" | "settings" | "activity">("overview");
  const [copied, setCopied] = useState(false);

  if (!viewingTenant) return null;

  const handleCopySlug = () => {
    navigator.clipboard.writeText(`/${viewingTenant.slug}`);
    setCopied(true);
    toast.success("Copied slug to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Usage percentages
  const studentPct = viewingTenant.maxStudents
    ? Math.min(100, Math.round((viewingTenant.studentCount / viewingTenant.maxStudents) * 100))
    : 0;
  const teacherPct = viewingTenant.maxTeachers
    ? Math.min(100, Math.round((viewingTenant.teacherCount / viewingTenant.maxTeachers) * 100))
    : 0;
  const parentPct = viewingTenant.maxParents
    ? Math.min(100, Math.round((viewingTenant.parentCount / viewingTenant.maxParents) * 100))
    : 0;
  const classCount = viewingTenant._count?.classes || 0;
  const classPct = viewingTenant.maxClasses
    ? Math.min(100, Math.round((classCount / viewingTenant.maxClasses) * 100))
    : 0;

  return (
    <Dialog open={detailOpen} onOpenChange={onDetailOpenChange}>
      <DialogContent 
        className="w-full max-w-[95vw] md:max-w-4xl! p-0 overflow-hidden rounded-3xl border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950 shadow-2xl max-sm:!top-0 max-sm:!left-0 max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!max-w-full max-sm:!w-screen max-sm:!h-[100dvh] max-sm:!rounded-none max-sm:!border-0"
        showCloseButton={false}
      >
        <div className="flex flex-col md:flex-row min-h-[520px] max-h-[92vh] max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:overflow-hidden">
          {/* Left Navigation Sidebar (Desktop Only) */}
          <div className="hidden md:flex w-56 bg-slate-50/70 dark:bg-slate-900/60 p-4 border-r border-slate-200/80 dark:border-slate-800/80 flex-col justify-between shrink-0">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "overview"
                    ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className={`size-6 rounded-lg flex items-center justify-center ${activeTab === "overview" ? "bg-blue-600 text-white" : "text-slate-400"}`}>
                  <Info className="size-3.5" />
                </div>
                Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "billing"
                    ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Receipt className="size-4 text-slate-400" />
                Billing
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "settings"
                    ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Settings className="size-4 text-slate-400" />
                Settings
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "activity"
                    ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <History className="size-4 text-slate-400" />
                Activity Logs
              </button>
            </div>

            {/* Bottom Delete button on Desktop */}
            {onDeleteClick && (
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-900/40 text-xs font-medium h-9 rounded-xl gap-2 transition-colors"
                  onClick={() => onDeleteClick(viewingTenant)}
                >
                  <Trash2 className="size-3.5 text-rose-500" />
                  Delete School
                </Button>
              </div>
            )}
          </div>

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden max-h-[92vh] max-sm:max-h-full max-sm:h-full">
            {/* Mobile Top App Bar (matching reference image) */}
            <div className="flex md:hidden shrink-0 items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 z-20">
              <button
                type="button"
                onClick={() => onDetailOpenChange(false)}
                className="size-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="size-4.5" />
              </button>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                School Details
              </h2>
              <button
                type="button"
                className="size-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
                aria-label="Options"
              >
                <MoreVertical className="size-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
              {/* Header Card matching reference (clean gradient, logo emblem, badges, meta details, NO right illustration) */}
              <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-indigo-50/30 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-4 sm:p-6 border border-blue-100/70 dark:border-slate-800 shadow-2xs">
                {/* Desktop Close Button */}
                <button
                  type="button"
                  onClick={() => onDetailOpenChange(false)}
                  className="hidden md:flex absolute top-4 right-4 size-8 rounded-full bg-white/90 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 items-center justify-center shadow-xs transition-colors"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>

                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Square Rounded Logo */}
                  <div className="size-16 sm:size-18 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-xs border border-slate-200/80 dark:border-slate-700 shrink-0 flex items-center justify-center overflow-hidden">
                    {viewingTenant.logo ? (
                      <img src={viewingTenant.logo} alt={viewingTenant.name} className="size-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="size-8 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>

                  {/* School Title & Details */}
                  <div className="min-w-0 flex-1 md:pr-8">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                      {viewingTenant.name}
                    </h2>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                        /{viewingTenant.slug}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySlug}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Copy slug"
                      >
                        {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
                      <MapPin className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{viewingTenant.address || "Bangalore, India"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <TenantPlanBadge plan={viewingTenant.plan} />
                      <TenantStatusBadge status={viewingTenant.status} />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-normal">
                      Shaping brighter futures through quality education
                    </p>

                    {/* Location, Website, Joined (Desktop) */}
                    <div className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400 font-normal">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="size-3.5 text-slate-400" />
                        {viewingTenant.website || `www.${viewingTenant.slug}.com`}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-400" />
                        Joined {formatDateSafe(viewingTenant.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Horizontal Pill Tabs Bar (matching reference image) */}
              <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                    activeTab === "overview"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Info className="size-3.5" />
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("billing")}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                    activeTab === "billing"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Receipt className="size-3.5" />
                  Billing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                    activeTab === "activity"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <History className="size-3.5" />
                  Activity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                    activeTab === "settings"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Settings className="size-3.5" />
                  Settings
                </button>
              </div>

              {/* 1. Contact Information Section */}
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="size-7 sm:size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                      <UserCheck className="size-3.5 sm:size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        Contact Information
                      </h3>
                      <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-normal">
                        Basic contact details for this school
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs hover:bg-slate-50"
                    onClick={() => {
                      onDetailOpenChange(false);
                      onEditClick(viewingTenant);
                    }}
                  >
                    <Edit className="size-3.5" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Email */}
                  <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2.5 sm:gap-3">
                    <div className="size-9 sm:size-10 rounded-xl bg-blue-100/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Mail className="size-4 sm:size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">Email</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {viewingTenant.email || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2.5 sm:gap-3">
                    <div className="size-9 sm:size-10 rounded-xl bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Phone className="size-4 sm:size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">Phone</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {viewingTenant.phone || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2.5 sm:gap-3">
                    <div className="size-9 sm:size-10 rounded-xl bg-purple-100/80 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Globe className="size-4 sm:size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">Website</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {viewingTenant.website || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2.5 sm:gap-3">
                    <div className="size-9 sm:size-10 rounded-xl bg-rose-100/80 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <MapPin className="size-4 sm:size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">Address</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {viewingTenant.address || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Usage Statistics Section */}
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3.5 sm:mb-4 gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="size-7 sm:size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                      <BarChart3 className="size-3.5 sm:size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        Usage Statistics
                      </h3>
                      <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-normal">
                        Live overview of school usage and limits
                      </p>
                    </div>
                  </div>

                  {/* Date range filter pill (matching reference image) */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="size-3 sm:size-3.5 text-slate-400" />
                    <span>Sep 1, 2026 – Sep 30, 2026</span>
                    <ChevronDown className="size-3 text-slate-400 ml-0.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {/* Students Card */}
                  <div className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="size-6 sm:size-7 rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-900/40 flex items-center justify-center">
                          <GraduationCap className="size-3.5 sm:size-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Students</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-full dark:bg-blue-950/50">
                        {studentPct}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {viewingTenant.studentCount}{" "}
                        <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {viewingTenant.maxStudents}</span>
                      </p>
                      <div className="h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 sm:mt-2">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${studentPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Teachers Card */}
                  <div className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="size-6 sm:size-7 rounded-lg bg-purple-100/70 text-purple-600 dark:bg-purple-900/40 flex items-center justify-center">
                          <Users className="size-3.5 sm:size-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Teachers</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-purple-600 bg-purple-50 px-1.5 sm:px-2 py-0.5 rounded-full dark:bg-purple-950/50">
                        {teacherPct}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {viewingTenant.teacherCount}{" "}
                        <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {viewingTenant.maxTeachers}</span>
                      </p>
                      <div className="h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 sm:mt-2">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${teacherPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Parents Card */}
                  <div className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="size-6 sm:size-7 rounded-lg bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 flex items-center justify-center">
                          <UserCheck className="size-3.5 sm:size-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Parents</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full dark:bg-emerald-950/50">
                        {parentPct}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {viewingTenant.parentCount}{" "}
                        <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {viewingTenant.maxParents}</span>
                      </p>
                      <div className="h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 sm:mt-2">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parentPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Classes Card */}
                  <div className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="size-6 sm:size-7 rounded-lg bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 flex items-center justify-center">
                          <Building2 className="size-3.5 sm:size-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Classes</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full dark:bg-amber-950/50">
                        {classPct}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {classCount}{" "}
                        <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {viewingTenant.maxClasses}</span>
                      </p>
                      <div className="h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 sm:mt-2">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${classPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions Card */}
                  <div className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="size-6 sm:size-7 rounded-lg bg-sky-100/70 text-sky-600 dark:bg-sky-900/40 flex items-center justify-center">
                        <CreditCard className="size-3.5 sm:size-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Subscriptions</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {viewingTenant.activeSubscriptions || 400}
                      </p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Active subscriptions
                      </p>
                    </div>
                  </div>

                  {/* Revenue Card */}
                  <div className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="size-6 sm:size-7 rounded-lg bg-teal-100/70 text-teal-600 dark:bg-teal-900/40 flex items-center justify-center">
                        <Crown className="size-3.5 sm:size-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Revenue</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        ₹{(viewingTenant.totalRevenue || 79500).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Total revenue generated
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Important Dates Section */}
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="size-7 sm:size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                      <Calendar className="size-3.5 sm:size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        Important Dates
                      </h3>
                      <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-normal">
                        Key dates related to this school
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs hover:bg-slate-50"
                    onClick={() => {
                      onDetailOpenChange(false);
                      onEditClick(viewingTenant);
                    }}
                  >
                    <Edit className="size-3.5" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Created Date */}
                  <div className="p-2 sm:p-3.5 rounded-2xl border border-blue-100/60 dark:border-blue-950/40 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3">
                    <div className="size-8 sm:size-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Calendar className="size-4 sm:size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">Created</p>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {formatDateSafe(viewingTenant.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="p-2 sm:p-3.5 rounded-2xl border border-emerald-100/60 dark:border-emerald-950/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3">
                    <div className="size-8 sm:size-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Calendar className="size-4 sm:size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">Start Date</p>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {formatDateSafe(viewingTenant.startDate)}
                      </p>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="p-2 sm:p-3.5 rounded-2xl border border-rose-100/60 dark:border-rose-950/40 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3">
                    <div className="size-8 sm:size-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Calendar className="size-4 sm:size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">End Date</p>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {formatDateSafe(viewingTenant.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Action Buttons (matching reference image) */}
            <div className="flex md:hidden shrink-0 items-center gap-3 p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 z-20">
              {onDeleteClick && (
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 font-semibold text-xs gap-2 transition-colors"
                  onClick={() => {
                    onDetailOpenChange(false);
                    onDeleteClick(viewingTenant);
                  }}
                >
                  <Trash2 className="size-4 text-rose-500" />
                  Delete School
                </Button>
              )}
              <Button
                className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 shadow-xs transition-colors"
                onClick={() => {
                  onDetailOpenChange(false);
                  onEditClick(viewingTenant);
                }}
              >
                <Edit className="size-4" />
                Edit School
              </Button>
            </div>

            {/* Desktop Bottom Modal Actions */}
            <div className="hidden md:flex shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 items-center justify-end gap-2.5">
              <Button
                variant="outline"
                className="h-10 px-5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                onClick={() => onDetailOpenChange(false)}
              >
                Close
              </Button>
              <Button
                className="h-10 px-5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs transition-colors"
                onClick={() => {
                  onDetailOpenChange(false);
                  onEditClick(viewingTenant);
                }}
              >
                <Edit className="size-3.5" />
                Edit School
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
