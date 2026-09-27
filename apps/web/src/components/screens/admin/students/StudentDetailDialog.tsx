"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  Printer,
  X,
  ChevronLeft,
  MoreVertical,
  BookOpen,
  CalendarDays,
  CreditCard,
  FileText,
  StickyNote,
  GraduationCap,
  Building2,
  User,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { StudentInfo } from "./types";
import { StudentOverviewTab } from "./StudentOverviewTab";

interface StudentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentInfo;
  canEdit?: boolean;
  onEdit?: (student: StudentInfo) => void;
}

export function StudentDetailDialog({
  open,
  onOpenChange,
  student,
  canEdit = false,
  onEdit,
}: StudentDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "academics" | "attendance" | "fees" | "documents" | "notes">("overview");
  const [selectedSiblingId, setSelectedSiblingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // If dialog is closed, or when student prop changes, selectedSiblingId resets cleanly
  const targetId = selectedSiblingId || student?.id;

  // Invalidate cache when dialog opens or target student changes
  useEffect(() => {
    if (open && targetId) {
      queryClient.invalidateQueries({ queryKey: ['student-detail', targetId] });
    }
  }, [open, targetId, queryClient]);

  // Fetch full student details (including transport info and siblings) via REST API
  const { data: studentDetails, isLoading } = useQuery({
    queryKey: ['student-detail', targetId],
    enabled: open && !!targetId,
    staleTime: 0,
    queryFn: async () => {
      const res = await apiFetch(`/api/students/${targetId}?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to load student details");
      return res.json();
    }
  });

  // Fetch transport routes to show the route name rather than just routeId
  const { data: routesData } = useQuery({
    queryKey: ['transport-routes-min'],
    enabled: open,
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/transport-routes?mode=min');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error("Failed to fetch transport routes:", err);
        return [];
      }
    }
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

  // Map routeId to actual Route Info
  const transportRoute = studentDetails?.transport
    ? routes.find((r: any) => r?.id === studentDetails.transport.routeId)
    : null;

  // Use either freshly loaded details or fallback to table row details
  const currentStudent = studentDetails || student;
  
  // Get initials for Avatar
  const initials = currentStudent.name
    ? currentStudent.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "academics", label: "Academics", icon: BookOpen },
    { id: "attendance", label: "Attendance", icon: CalendarDays },
    { id: "fees", label: "Fees", icon: CreditCard },
    { id: "notes", label: "More", icon: MoreHorizontal },
  ] as const;

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedSiblingId(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent 
        className="w-full sm:w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-t-3xl sm:rounded-2xl max-h-[95vh] sm:max-h-[92vh] flex flex-col focus:outline-none"
        data-lenis-prevent
        showCloseButton={false}
      >
        {/* Top Header Section with mint gradient aura */}
        <div className="relative px-4 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20 dark:from-emerald-950/15 dark:via-zinc-900 dark:to-zinc-900 shrink-0">
          
          {/* Top navigation header row for mobile */}
          <div className="flex items-center justify-between pb-3 sm:pb-4">
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 -ml-1.5 rounded-full text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="size-5" />
            </button>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Student Profile
            </h2>

            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 -mr-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="size-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-5 mt-1">
            {/* Student Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left w-full sm:w-auto">
              {/* Avatar circle */}
              <div className="size-20 sm:size-18 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-[2px] border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-2xl sm:text-xl font-bold shadow-xs shrink-0">
                {initials}
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col items-center sm:items-start w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {currentStudent.name}
                  </DialogTitle>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {currentStudent.status
                      ? currentStudent.status.charAt(0).toUpperCase() + currentStudent.status.slice(1)
                      : "Active"}
                  </span>
                </div>
                <DialogDescription className="sr-only">
                  Detailed profile information for {currentStudent.name}
                </DialogDescription>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
                  ID: <span className="font-semibold text-slate-700 dark:text-zinc-300">{currentStudent.username || currentStudent.rollNumber || "–"}</span>
                  <span className="mx-2.5 text-slate-300 dark:text-zinc-700">|</span>
                  Roll No: <span className="font-semibold text-slate-700 dark:text-zinc-300">{currentStudent.rollNumber || "–"}</span>
                </p>

                {/* Mobile Class Pill Bar */}
                <div className="flex sm:hidden items-center justify-center gap-2.5 w-full max-w-xs mt-1 py-2 px-5 rounded-xl bg-white dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 shadow-xs text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  <GraduationCap className="size-4 text-emerald-600" />
                  <span>{currentStudent.className || "Unassigned"}</span>
                </div>
              </div>
            </div>

            {/* Desktop Right Side Illustration & Class Card */}
            <div className="hidden sm:flex flex-col items-center justify-center pr-4">
              <div className="relative mb-2">
                <div className="size-12 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white">
                  <GraduationCap className="size-7" />
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 shadow-sm text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200">
                <BookOpen className="size-3.5 text-emerald-600" />
                {currentStudent.className || "Unassigned"}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-2 sm:px-8 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-6 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2.5 sm:px-1 text-[11px] sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`size-4 sm:size-4 ${isActive ? "text-emerald-600 dark:text-emerald-400 stroke-[2.2]" : "text-slate-400 stroke-[1.8]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Details Body Scrollable */}
        <div 
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-5 space-y-4 overscroll-contain touch-pan-y"
          data-lenis-prevent
        >
          {isLoading ? (
            <div className="min-h-[360px] flex flex-col items-center justify-center py-10 px-4">
              <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-800/90 border border-slate-100 dark:border-zinc-700/80 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                {/* Visual Image / ID Card Asset */}
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

                {/* Animated Circular Ring Loader */}
                <div className="relative size-12 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[3.5px] border-slate-100 dark:border-zinc-700" />
                  <div className="absolute inset-0 rounded-full border-[3.5px] border-emerald-600 dark:border-emerald-400 border-t-transparent border-r-transparent animate-spin" />
                </div>

                {/* Title and subtitle */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedSiblingId ? "Opening Sibling Profile..." : "Loading Student Profile..."}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 dark:text-zinc-400 mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          ) : activeTab === "overview" ? (
            <StudentOverviewTab
              currentStudent={currentStudent}
              studentDetails={studentDetails}
              transportRoute={transportRoute}
              canEdit={canEdit}
              onEdit={onEdit}
              onSelectStudent={(newId) => setSelectedSiblingId(newId)}
              formatDate={formatDate}
              calculateAge={calculateAge}
            />
          ) : (
            /* Other Tabs Placeholder with clean state */
            <div className="py-16 text-center text-slate-400 dark:text-zinc-500">
              <Building2 className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No records found for {activeTab}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium rounded-xl"
          >
            <Printer className="size-4" />
            Print Profile
          </Button>

          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 gap-1.5 shadow-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
