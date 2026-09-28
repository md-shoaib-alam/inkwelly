"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Mail,
  User,
  GraduationCap,
  School,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  MoreVertical,
  Calendar,
  Pencil,
  Building2,
  FileText,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/graphql/keys";
import type { TeacherInfo } from "./types";

import { TeacherPersonalCard } from "./TeacherPersonalCard";
import { TeacherProfessionalCard } from "./TeacherProfessionalCard";
import { TeacherSubjectsCard } from "./TeacherSubjectsCard";
import { TeacherClassesCard } from "./TeacherClassesCard";

interface TeacherProfileViewProps {
  teacher: TeacherInfo;
  onBack: () => void;
  canEdit?: boolean;
  onEdit?: (teacher: TeacherInfo) => void;
  isLoading?: boolean;
}

function getInitials(name: string): string {
  if (!name) return "TC";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeacherProfileView({
  teacher,
  onBack,
  canEdit = true,
  onEdit,
  isLoading = false,
}: TeacherProfileViewProps) {
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "academics" | "attendance" | "classes" | "documents" | "notes">("overview");

  // Local live state of the teacher profile
  const [currentTeacher, setCurrentTeacher] = useState<TeacherInfo>(teacher);

  // Track which section is in independent edit mode
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Track collapsed status for sections
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    personal: false,
    professional: false,
    subjects: false,
    classes: false,
  });

  const toggleCollapse = (sec: string) => {
    setCollapsed((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Section Form Data
  const [formData, setFormData] = useState({
    name: currentTeacher.name || "",
    email: currentTeacher.email || "",
    phone: currentTeacher.phone || "",
    address: currentTeacher.address || "Bangalore, Karnataka",
    role: currentTeacher.role || "Faculty Member",
    qualification: currentTeacher.qualification || "B.Ed",
    experience: currentTeacher.experience || "2 years",
    joiningDate: currentTeacher.joiningDate || "2024-08-12",
    status: currentTeacher.status || "active",
    subjects: currentTeacher.subjects || [],
    classes: currentTeacher.classes || [],
    newSubjectInput: "",
    newClassInput: "",
  });

  const handleCopy = (text: string, fieldName: string) => {
    copyToClipboard(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${fieldName} copied to clipboard`);
  };

  const handlePrint = () => {
    window.print();
  };

  const startEdit = (section: string) => {
    setFormData({
      name: currentTeacher.name || "",
      email: currentTeacher.email || "",
      phone: currentTeacher.phone || "",
      address: currentTeacher.address || "Bangalore, Karnataka",
      role: currentTeacher.role || "Faculty Member",
      qualification: currentTeacher.qualification || "B.Ed",
      experience: currentTeacher.experience || "2 years",
      joiningDate: currentTeacher.joiningDate || "2024-08-12",
      status: currentTeacher.status || "active",
      subjects: [...(currentTeacher.subjects || [])],
      classes: [...(currentTeacher.classes || [])],
      newSubjectInput: "",
      newClassInput: "",
    });
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setEditingSection(null);
  };

  const saveSection = async (sectionName: string, title: string) => {
    if (sectionName === "personal") {
      if (!formData.name.trim() || !formData.email.trim()) {
        toast.error("Name and Email are required");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setSavingSection(sectionName);
    try {
      const payload: any = {
        id: currentTeacher.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        qualification: formData.qualification,
        experience: formData.experience,
      };

      const res = await apiFetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update ${title}`);
      }

      // Update local state smoothly
      const updated: TeacherInfo = {
        ...currentTeacher,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        qualification: formData.qualification,
        experience: formData.experience,
        joiningDate: formData.joiningDate,
        status: formData.status,
        subjects: formData.subjects,
        classes: formData.classes,
      };

      setCurrentTeacher(updated);
      setEditingSection(null);
      toast.success(`${title} updated successfully`);

      // Refresh teachers in cache
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSavingSection(null);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "academics", label: "Academics", icon: GraduationCap },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "classes", label: "Classes", icon: School },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "notes", label: "Notes", icon: StickyNote },
  ] as const;

  const displayTeacherId = currentTeacher.teacherId || (currentTeacher.id ? `TCH${currentTeacher.id.slice(-3).toUpperCase()}` : "TCH002");
  const displayAddress = currentTeacher.address || "Bangalore, Karnataka";
  const displayRole = currentTeacher.role || "Faculty Member";
  const displayJoiningDate = currentTeacher.joiningDate || "12 Aug 2024";

  if (isLoading) {
    return (
      <div className="min-h-[460px] flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-800/90 border border-slate-100 dark:border-zinc-700/80 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-40 h-28 mb-5 flex items-center justify-center">
            <Image
              src="/assets/admin/table.avif"
              alt="Loading teacher details"
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
            Loading Teacher Profile...
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
      {/* Top Breadcrumbs & Action Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Back Button Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-full bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-emerald-100 dark:border-zinc-700 transition-all shadow-xs"
          >
            <ChevronLeft className="size-4 text-slate-700 dark:text-zinc-300 stroke-[2.5]" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight">Back to Teachers</span>
          </button>

          <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-zinc-500 font-medium">
            Teachers <span className="mx-1.5 text-slate-300 dark:text-zinc-700">›</span> Teacher Profile
          </span>
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              onClick={() => startEdit("personal")}
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

      {/* Main Profile Header Box */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-4 sm:gap-5 w-full">
            {/* Avatar Circle */}
            <div className="size-20 sm:size-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-slate-100 dark:border-zinc-700 flex items-center justify-center text-emerald-800 dark:text-emerald-300 text-2xl sm:text-3xl font-bold shadow-xs shrink-0 overflow-hidden">
              {getInitials(currentTeacher.name)}
            </div>

            {/* Profile Info details */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {currentTeacher.name}
              </h1>

              {/* Status and Role badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                  {displayRole}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {currentTeacher.status ? currentTeacher.status.charAt(0).toUpperCase() + currentTeacher.status.slice(1) : "Active"}
                </span>
              </div>

              {/* Email line */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium truncate pt-0.5">
                <Mail className="size-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{currentTeacher.email}</span>
              </div>

              {/* Teacher ID with Copy Button */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
                <span>Teacher ID:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{displayTeacherId}</span>
                <button
                  onClick={() => handleCopy(displayTeacherId, "Teacher ID")}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors rounded"
                  aria-label="Copy Teacher ID"
                >
                  {copiedField === "Teacher ID" ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Right Side Quote Banner with teachertop illustration */}
          <div className="hidden lg:flex items-end justify-end gap-5 pr-2 self-end shrink-0">
            <div className="text-right italic text-xs text-slate-400 dark:text-zinc-500 max-w-[210px] pb-2 leading-relaxed">
              &ldquo;Educating minds, building brighter futures.&rdquo;
            </div>
            <div className="relative w-36 h-28 shrink-0 overflow-hidden">
              <Image
                src="/assets/admin/teachertop.avif"
                alt="Teacher Illustration"
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
        <div className="space-y-5">
          {/* Card 1: Personal & Contact Information */}
          <TeacherPersonalCard
            currentTeacher={currentTeacher}
            formData={formData}
            setFormData={setFormData}
            displayTeacherId={displayTeacherId}
            displayAddress={displayAddress}
            canEdit={canEdit}
            isEditing={editingSection === "personal"}
            isSaving={savingSection === "personal"}
            isCollapsed={collapsed.personal}
            onToggleCollapse={() => toggleCollapse("personal")}
            onStartEdit={() => startEdit("personal")}
            onCancelEdit={cancelEdit}
            onSave={() => saveSection("personal", "Personal Information")}
            getInitials={getInitials}
          />

          {/* Card 2: Professional Information */}
          <TeacherProfessionalCard
            currentTeacher={currentTeacher}
            formData={formData}
            setFormData={setFormData}
            displayRole={displayRole}
            displayJoiningDate={displayJoiningDate}
            canEdit={canEdit}
            isEditing={editingSection === "professional"}
            isSaving={savingSection === "professional"}
            isCollapsed={collapsed.professional}
            onToggleCollapse={() => toggleCollapse("professional")}
            onStartEdit={() => startEdit("professional")}
            onCancelEdit={cancelEdit}
            onSave={() => saveSection("professional", "Professional Information")}
          />

          {/* Row 2: Assigned Subjects and Classes Taught Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 3: Assigned Subjects */}
            <TeacherSubjectsCard
              currentTeacher={currentTeacher}
              formData={formData}
              setFormData={setFormData}
              canEdit={canEdit}
              isEditing={editingSection === "subjects"}
              isSaving={savingSection === "subjects"}
              isCollapsed={collapsed.subjects}
              onToggleCollapse={() => toggleCollapse("subjects")}
              onStartEdit={() => startEdit("subjects")}
              onCancelEdit={cancelEdit}
              onSave={() => saveSection("subjects", "Assigned Subjects")}
            />

            {/* Card 4: Classes Taught */}
            <TeacherClassesCard
              currentTeacher={currentTeacher}
              formData={formData}
              setFormData={setFormData}
              canEdit={canEdit}
              isEditing={editingSection === "classes"}
              isSaving={savingSection === "classes"}
              isCollapsed={collapsed.classes}
              onToggleCollapse={() => toggleCollapse("classes")}
              onStartEdit={() => startEdit("classes")}
              onCancelEdit={cancelEdit}
              onSave={() => saveSection("classes", "Classes Taught")}
            />
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
          <Building2 className="size-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No records found for {activeTab}</p>
        </div>
      )}

      {/* Mobile Sticky Edit Profile Button */}
      {canEdit && editingSection === null && (
        <div className="sm:hidden sticky bottom-4 z-10 pt-2">
          <Button
            onClick={() => startEdit("personal")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-3 gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  );
}
