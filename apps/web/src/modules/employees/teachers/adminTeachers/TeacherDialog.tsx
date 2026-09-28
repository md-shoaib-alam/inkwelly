"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Loader2,
  X,
  User,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Upload,
  RotateCcw,
  Plus,
  Check,
  Building2,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { TeacherInfo } from "./types";

interface TeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeacher: TeacherInfo | null;
  formData: any;
  setFormData: (data: any) => void;
  submitting: boolean;
  onSubmit: () => void;
  isFormValid: boolean;
}

export function TeacherDialog({
  open,
  onOpenChange,
  editingTeacher,
  formData,
  setFormData,
  submitting,
  onSubmit,
  isFormValid,
}: TeacherDialogProps) {
  const isCreate = !editingTeacher;

  // Track initial snapshot for reset
  const [initialSnapshot, setInitialSnapshot] = useState<any>(formData);

  useEffect(() => {
    if (open) {
      setInitialSnapshot({ ...formData });
    }
  }, [open]);

  const handleReset = () => {
    if (isCreate) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        qualification: "",
        experience: "",
        password: "",
        gender: "male",
        dateOfBirth: "",
        teacherId: "",
        alternatePhone: "",
        address: "",
        role: "Faculty Member",
        subjects: "",
        joiningDate: "",
        status: "active",
      });
    } else {
      setFormData({ ...initialSnapshot });
    }
    toast.info("Form reset to initial values");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl max-h-[92vh] flex flex-col focus:outline-none"
        data-lenis-prevent
        showCloseButton={false}
      >
        {/* Top Header Section with mint gradient aura and table.avif illustration */}
        <div className="relative px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 shrink-0 overflow-hidden">
          {/* Close button at top right */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors z-20"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center justify-between gap-6 pr-8">
            <div className="space-y-1 z-10 max-w-lg">
              <p className="text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                {isCreate ? "ADD NEW TEACHER" : "EDIT TEACHER"}
              </p>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isCreate ? "Add New Teacher" : "Edit Teacher Profile"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {isCreate
                  ? "Fill in the teacher details below. A unique Teacher ID will be generated automatically for login."
                  : "Update the teacher information below and save your changes."}
              </DialogDescription>
            </div>

            {/* Top Right Decorative Illustration Image (teacheraddtop.avif / table.avif) */}
            <div className="hidden sm:block relative w-36 h-24 shrink-0 -mr-2 select-none pointer-events-none">
              <Image
                src="/assets/admin/teacheraddtop.avif"
                alt="Teacher card graphic"
                fill
                className="object-contain drop-shadow-sm opacity-95"
                priority
              />
            </div>
          </div>
        </div>

        {/* Form Boundary: Isolates browser autofill strictly within this dialog */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          autoComplete="on"
        >
          {/* Scrollable Form Body with Section Cards */}
          <div
            className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5 overscroll-contain touch-pan-y"
            data-lenis-prevent
          >
            {/* ────────────────────────────────────────────────────────── */}
            {/* SECTION 0: Profile Photo                                   */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                <Camera className="size-4 text-emerald-600" />
                <div>
                  <span>Profile Photo</span>
                  <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">
                    Upload a clear photo of the teacher (Optional)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xl flex items-center justify-center shrink-0">
                  {formData.name ? formData.name.slice(0, 2).toUpperCase() : <User className="size-7 text-emerald-600/70" />}
                </div>
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 gap-2"
                    onClick={() => toast.info("Photo upload will be saved with profile")}
                  >
                    <Upload className="size-3.5 text-emerald-600" />
                    Upload Photo
                  </Button>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* SECTION 1: Personal Information                           */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                <User className="size-4 text-emerald-600" />
                Personal Information
              </div>

              {/* Row 1: Full Name, Gender, Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="t_name" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="t_name"
                      name="name"
                      autoComplete="name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="pl-9 h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Gender
                </Label>
                <Select
                  value={formData.gender || "male"}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Date of Birth
                </Label>
                <DatePicker
                  date={formData.dateOfBirth && !isNaN(new Date(formData.dateOfBirth).getTime()) ? new Date(formData.dateOfBirth) : undefined}
                  onChange={(d) => {
                    const formatted = d ? d.toISOString().split("T")[0] : "";
                    setFormData({ ...formData, dateOfBirth: formatted });
                  }}
                  placeholder="Pick date of birth"
                  className="w-full h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            {/* Row 2: Teacher ID, Qualification, Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Teacher ID (auto-generated placeholder) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Teacher ID</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">#</span>
                  <Input
                    value={formData.teacherId || ""}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    placeholder="Auto-generate"
                    className="pl-7 h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 text-slate-600 border-slate-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              {/* Qualification */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Qualification <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.qualification || "B.Ed"}
                  onValueChange={(val) => setFormData({ ...formData, qualification: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B.Ed">B.Ed</SelectItem>
                    <SelectItem value="M.Ed">M.Ed</SelectItem>
                    <SelectItem value="B.Sc, B.Ed">B.Sc, B.Ed</SelectItem>
                    <SelectItem value="M.Sc, B.Ed">M.Sc, B.Ed</SelectItem>
                    <SelectItem value="B.A, B.Ed">B.A, B.Ed</SelectItem>
                    <SelectItem value="M.A, B.Ed">M.A, B.Ed</SelectItem>
                    <SelectItem value="Ph.D.">Ph.D.</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Experience
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    value={formData.experience || ""}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g., 5 years"
                    className="pl-9 h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 2: Contact Information                            */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <Phone className="size-4 text-emerald-600" />
              Contact Information
            </div>

            {/* Row 1: Email, Phone, Alternate Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="t_email" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="t_email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="teacher@school.com"
                    className="pl-9 h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                  />
                </div>
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
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full h-9 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Alternate Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Alternate Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="inline-flex items-center px-2.5 text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.alternatePhone || ""}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="Enter alternate number"
                    className="w-full h-9 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Address
                </Label>
                <span className="text-[10px] text-slate-400">0/200</span>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-4 text-slate-400" />
                <textarea
                  rows={2}
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  maxLength={200}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-zinc-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 3: Professional Information                       */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <Briefcase className="size-4 text-emerald-600" />
              Professional Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Role (Fixed to Teacher / Faculty Member on server) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Role <span className="text-[10px] text-slate-400 font-normal">(Teacher)</span>
                </Label>
                <Select
                  value="Faculty Member"
                  disabled
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 cursor-not-allowed">
                    <SelectValue placeholder="Faculty Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Faculty Member">Faculty Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject(s) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Subject(s) <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Select
                  value={formData.subjects || "Mathematics"}
                  onValueChange={(val) => setFormData({ ...formData, subjects: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                    <SelectValue placeholder="Select subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Social Studies">Social Studies</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Joining */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Date of Joining <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={formData.joiningDate && !isNaN(new Date(formData.joiningDate).getTime()) ? new Date(formData.joiningDate) : undefined}
                  onChange={(d) => {
                    const formatted = d ? d.toISOString().split("T")[0] : "";
                    setFormData({ ...formData, joiningDate: formatted });
                  }}
                  placeholder="Pick date of joining"
                  className="w-full h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 4: Account Settings                               */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Account Settings
            </div>

            <div className="space-y-1.5 max-w-xs">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Status</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={formData.status || "active"}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 font-semibold w-40">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <SelectValue placeholder="Active" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-snug">
                  Inactive teachers will not be able to log in to the system.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Reset on left, Cancel & Add Teacher on right */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/80 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={submitting}
            className="h-9 px-3 text-xs rounded-xl font-medium text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-9 px-4 text-xs rounded-xl font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !isFormValid}
              className="h-9 px-5 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {editingTeacher ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <Plus className="size-4 stroke-[2.5]" />
                  {editingTeacher ? "Update Teacher" : "Add Teacher"}
                </>
              )}
            </Button>
          </div>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
