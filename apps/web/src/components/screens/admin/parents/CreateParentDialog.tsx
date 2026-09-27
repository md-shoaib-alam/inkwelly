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
  Phone,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Plus,
  Shield,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface CreateParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createForm: any;
  setCreateForm: (form: any) => void;
  onCreate: () => void;
  creating: boolean;
}

export function CreateParentDialog({
  open,
  onOpenChange,
  createForm,
  setCreateForm,
  onCreate,
  creating,
}: CreateParentDialogProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Local state for initial snapshot to allow resetting
  const [initialSnapshot, setInitialSnapshot] = useState<any>(createForm);

  useEffect(() => {
    if (open) {
      setInitialSnapshot({ ...createForm });
    }
  }, [open]);

  const handleReset = () => {
    setCreateForm({
      name: "",
      email: "",
      phone: "",
      alternatePhone: "",
      occupation: "",
      password: "",
      username: "",
      gender: "male",
      dateOfBirth: "",
      relationship: "Parent",
      address: "",
    });
    toast.info("Form reset to initial values");
  };

  const isFormValid = Boolean(createForm.name?.trim() && createForm.phone?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl max-h-[92vh] flex flex-col focus:outline-none"
        data-lenis-prevent
        showCloseButton={false}
      >
        {/* Top Header Section with mint gradient aura and parentaddtop.avif illustration */}
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
                ADD NEW PARENT
              </p>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Add New Parent
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Create a new parent account in the system. A unique Parent ID (e.g. PRN2026xxxx) will be automatically generated for login.
              </DialogDescription>
            </div>

            {/* Top Right Decorative Illustration Image (parentaddtop.avif) */}
            <div className="hidden sm:block relative w-36 h-24 shrink-0 -mr-2 select-none pointer-events-none">
              <Image
                src="/assets/admin/parentaddtop.avif"
                alt="Parent card graphic"
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
            onCreate();
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
            {/* SECTION 1: Personal Information                           */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
                <User className="size-4 text-emerald-600" />
                Personal Information
              </div>

              {/* Row 1: Full Name, Gender, Relationship */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="p_name" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="p_name"
                      name="name"
                      autoComplete="name"
                      value={createForm.name || ""}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
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
                  value={createForm.gender || "male"}
                  onValueChange={(val) => setCreateForm({ ...createForm, gender: val })}
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

              {/* Relationship with Student(s) (Fixed to Parent on server) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Relationship with Student(s) <span className="text-[10px] text-slate-400 font-normal">(Parent)</span>
                </Label>
                <Select
                  value="Parent"
                  disabled
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 cursor-not-allowed">
                    <SelectValue placeholder="Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Date of Birth & Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date of Birth */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Date of Birth <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <DatePicker
                  date={createForm.dateOfBirth && !isNaN(new Date(createForm.dateOfBirth).getTime()) ? new Date(createForm.dateOfBirth) : undefined}
                  onChange={(d) => {
                    const formatted = d ? d.toISOString().split("T")[0] : "";
                    setCreateForm({ ...createForm, dateOfBirth: formatted });
                  }}
                  placeholder="Pick date of birth"
                  className="w-full h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>

              {/* Occupation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Occupation <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  value={createForm.occupation || ""}
                  onChange={(e) => setCreateForm({ ...createForm, occupation: e.target.value })}
                  placeholder="e.g. Engineer, Business"
                  className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                />
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

            {/* Row 1: Email Address, Phone Number, Alternate Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="p_email" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="p_email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    value={createForm.email || ""}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="parent@example.com"
                    className="pl-9 h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="inline-flex items-center px-2.5 text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 font-medium">
                    +91
                  </span>
                  <input
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    value={createForm.phone || ""}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
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
                    value={createForm.alternatePhone || ""}
                    onChange={(e) => setCreateForm({ ...createForm, alternatePhone: e.target.value })}
                    placeholder="Enter alternate number"
                    className="w-full h-9 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 3: Address Information                            */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <MapPin className="size-4 text-emerald-600" />
              Address Information
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Address <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <span className="text-[10px] text-slate-400">
                  {(createForm.address || "").length}/200
                </span>
              </div>
              <div className="relative">
                <textarea
                  rows={2}
                  value={createForm.address || ""}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Enter full address"
                  maxLength={200}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-zinc-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 4: Account Settings                                */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <Shield className="size-4 text-emerald-600" />
              Account Settings
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Parent Login ID */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Parent Login ID
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">#</span>
                  <Input
                    value={createForm.username || ""}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="Auto-generate"
                    className="pl-7 h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 text-slate-600 border-slate-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Login Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Login Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={createForm.password || ""}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Set login password (default: changeme123)"
                    className="pl-9 pr-9 h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Info notice box */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 text-sky-800 dark:text-sky-300 text-xs">
              <Info className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                The parent will use this Login ID and password to access the parent portal. You can share the credentials with them after creation.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer matching the screenshot */}
        <div className="px-6 sm:px-8 py-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl px-4 h-10"
          >
            <RotateCcw className="size-3.5 text-slate-500" />
            Reset
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl px-5 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !isFormValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl px-5 h-10 gap-1.5 shadow-sm"
            >
              {creating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Create Parent
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
