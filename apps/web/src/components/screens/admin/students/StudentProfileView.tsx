"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  GraduationCap,
  Printer,
  Pencil,
  MoreVertical,
  BookOpen,
  CalendarDays,
  CreditCard,
  MoreHorizontal,
  User,
  Copy,
  Check,
  Building2,
  Phone,
  Mail,
  Calendar,
  Bus,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import type { StudentInfo } from "./types";
import { StudentOverviewTab } from "./StudentOverviewTab";

interface StudentProfileViewProps {
  student: StudentInfo;
  onBack: () => void;
  canEdit?: boolean;
  onEdit?: (student: StudentInfo) => void;
  isLoading?: boolean;
}

function getInitials(name: string): string {
  if (!name) return "ST";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function StudentProfileView({
  student,
  onBack,
  canEdit = true,
  onEdit,
  isLoading = false,
}: StudentProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "academics" | "attendance" | "fees" | "more">("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Fetch full student details via REST API
  const { data: studentDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["student-detail", student?.id],
    enabled: !!student?.id,
    queryFn: async () => {
      const res = await apiFetch(`/api/students/${student.id}`);
      if (!res.ok) throw new Error("Failed to load student details");
      return res.json();
    },
  });

  // Fetch transport routes to show the route name
  const { data: routesData } = useQuery({
    queryKey: ["transport-routes-min"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/transport-routes?mode=min");
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error("Failed to fetch transport routes:", err);
        return [];
      }
    },
  });

  const routes = Array.isArray(routesData) ? routesData : [];

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "–";
    try {
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

  const calculateAge = (dateStr: string | null | undefined) => {
    if (!dateStr) return "–";
    try {
      const birthDate = new Date(dateStr);
      if (isNaN(birthDate.getTime())) return "–";
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? `${age} years` : "–";
    } catch {
      return "–";
    }
  };

  const currentStudent = studentDetails || student;
  const transportRoute = studentDetails?.transport
    ? routes.find((r: any) => r?.id === studentDetails.transport.routeId)
    : null;

  const displayStudentId = currentStudent.username || currentStudent.rollNumber || "–";
  const displayRollNo = currentStudent.rollNumber || "–";

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "academics", label: "Academics", icon: BookOpen },
    { id: "attendance", label: "Attendance", icon: CalendarDays },
    { id: "fees", label: "Fees", icon: CreditCard },
    { id: "more", label: "More", icon: MoreHorizontal },
  ] as const;

  if (isLoading || isDetailsLoading) {
    return (
      <div className="min-h-[460px] flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-800/90 border border-slate-100 dark:border-zinc-700/80 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-40 h-28 mb-5 flex items-center justify-center">
            <Image
              src="/assets/admin/table.avif"
              alt="Loading student details"
              width={160}
              height={112}
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>
          <div className="relative size-12 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3.5px] border-slate-100 dark:border-zinc-700" />
            <div className="absolute inset-0 rounded-full border-[3.5px] border-emerald-600 dark:border-emerald-400 border-t-transparent border-r-transparent animate-spin" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Loading Student Profile...
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-zinc-400 mt-1">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-6">
      {/* Top Breadcrumbs & Action Row matching TeacherProfileView */}
      <div className="flex items-center justify-between gap-3">
        {/* Back Button Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-full bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-emerald-100 dark:border-zinc-700 transition-all shadow-xs"
          >
            <ChevronLeft className="size-4 text-slate-700 dark:text-zinc-300 stroke-[2.5]" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight">Back to Students</span>
          </button>

          <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-zinc-500 font-medium">
            Students <span className="mx-1.5 text-slate-300 dark:text-zinc-700">›</span> Student Profile
          </span>
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button
              onClick={() => onEdit(currentStudent)}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              <Pencil className="size-3.5" />
              Edit Profile
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <Printer className="size-3.5" />
            Print
          </Button>

          {/* More actions menu button */}
          <button
            className="p-2.5 sm:p-2 rounded-xl border border-slate-200/90 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            aria-label="More options"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Header Box with Teachertop/Table Graphic */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-4 sm:gap-5 w-full">
            {/* Avatar Circle */}
            <div className="size-20 sm:size-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-slate-100 dark:border-zinc-700 flex items-center justify-center text-emerald-800 dark:text-emerald-300 text-2xl sm:text-3xl font-bold shadow-xs shrink-0 overflow-hidden">
              {getInitials(currentStudent.name)}
            </div>

            {/* Profile Info Details */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {currentStudent.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {currentStudent.status
                    ? currentStudent.status.charAt(0).toUpperCase() + currentStudent.status.slice(1)
                    : "Active"}
                </span>
              </div>

              {/* Class & Section Badge */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                  <GraduationCap className="size-3.5 text-emerald-600" />
                  {currentStudent.className || "Unassigned"}
                </span>
              </div>

              {/* ID and Roll No with Copy */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span>Student ID:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">{displayStudentId}</span>
                  <button
                    onClick={() => handleCopy(displayStudentId, "Student ID")}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors rounded"
                    aria-label="Copy Student ID"
                  >
                    {copiedField === "Student ID" ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>

                <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">|</span>

                <div className="flex items-center gap-1.5">
                  <span>Roll No:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">{displayRollNo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Right Side Decorative Graphic Banner */}
          <div className="hidden lg:flex items-end justify-end gap-5 pr-2 self-end shrink-0">
            <div className="text-right italic text-xs text-slate-400 dark:text-zinc-500 max-w-[210px] pb-2 leading-relaxed">
              &ldquo;Learning today, leading tomorrow.&rdquo;
            </div>
            <div className="relative w-36 h-28 shrink-0 overflow-hidden">
              <Image
                src="/assets/admin/teachertop.avif"
                alt="Student Illustration"
                fill
                className="object-contain object-bottom-right"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Bar — horizontally scrollable pill row */}
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
                <Icon className={`size-4 shrink-0 ${
                  isActive ? "text-white stroke-[2.2]" : "text-slate-400 stroke-[1.8]"
                }`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Section */}
      {activeTab === "overview" ? (
        <StudentOverviewTab
          currentStudent={currentStudent}
          studentDetails={studentDetails}
          transportRoute={transportRoute}
          canEdit={canEdit}
          formatDate={formatDate}
          calculateAge={calculateAge}
        />
      ) : (
        <div className="py-20 text-center text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
          <Building2 className="size-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No records found for {activeTab}</p>
        </div>
      )}
    </div>
  );
}
