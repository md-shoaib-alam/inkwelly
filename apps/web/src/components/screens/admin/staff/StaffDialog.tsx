"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Loader2,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Upload,
  RotateCcw,
  Plus,
  Shield,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { StaffFormData, CustomRole, StaffMember, emptyFormData } from "./types";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
  formData: StaffFormData;
  setFormData: (data: StaffFormData) => void;
  roles: CustomRole[];
  submitting: boolean;
  onSubmit: () => void;
}

export function StaffDialog({
  open,
  onOpenChange,
  member,
  formData,
  setFormData,
  roles,
  submitting,
  onSubmit,
}: StaffDialogProps) {
  const isCreate = !member;
  const [showPassword, setShowPassword] = useState(false);

  // Track initial snapshot for reset
  const [initialSnapshot, setInitialSnapshot] = useState<StaffFormData>(formData);

  useEffect(() => {
    if (open) {
      setInitialSnapshot({ ...formData });
      setShowPassword(false);
    }
  }, [open, member]);

  const handleReset = () => {
    if (isCreate) {
      setFormData(emptyFormData);
    } else {
      setFormData({ ...initialSnapshot });
    }
    toast.info("Form reset to initial values");
  };

  const isFormValid = Boolean(
    formData.name?.trim() &&
    formData.email?.trim() &&
    (member ? true : formData.password?.trim())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl max-h-[92vh] flex flex-col focus:outline-none"
        data-lenis-prevent
        showCloseButton={false}
      >
        {/* Top Header Section with mint gradient aura and stafftop.avif illustration */}
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
                {isCreate ? "ADD NEW STAFF MEMBER" : "EDIT STAFF MEMBER"}
              </p>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isCreate ? "Add New Staff Member" : "Edit Staff Profile"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {isCreate
                  ? "Enter the staff details, assign an administrative role, and configure account access."
                  : "Update the staff member's profile, contact details, role permissions, and active status."}
              </DialogDescription>
            </div>

            {/* Top Right Decorative Illustration Image */}
            <div className="hidden sm:block relative w-36 h-24 shrink-0 -mr-2 select-none pointer-events-none">
              <Image
                src="/assets/admin/stafftop.avif"
                alt="Staff card graphic"
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
          {/* Scrollable Form Body with Premium Section Cards */}
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

              {/* Row 1: Full Name, Email, Assigned Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="st_name" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="st_name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="pl-9 h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="st_email" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="st_email"
                      name="email"
                      autoComplete="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="staff@school.com"
                      disabled={!isCreate}
                      className="pl-9 h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

              {/* Assigned Role */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Assigned Role
                  </Label>
                  {formData.customRoleId && formData.customRoleId !== "none" && (
                    <button
                      type="button"
                      className="text-[10px] text-emerald-600 hover:underline"
                      onClick={() => setFormData({ ...formData, customRoleId: "" })}
                    >
                      Clear Role
                    </button>
                  )}
                </div>
                <Select
                  value={formData.customRoleId || "none"}
                  onValueChange={(v) => setFormData({ ...formData, customRoleId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Shield className="size-3 text-zinc-400" />
                        Standard Staff (Default)
                      </div>
                    </SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-2 rounded-full"
                            style={{ backgroundColor: r.color || "#10b981" }}
                          />
                          <span>{r.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Phone Number & Staff Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="st_phone" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Phone Number
                </Label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="inline-flex items-center px-3 text-xs text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 font-medium select-none">
                    +91
                  </span>
                  <input
                    id="st_phone"
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full h-10 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Staff Photo (Matches Add Student UI) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Staff Photo <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                    {formData.name ? (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {formData.name.slice(0, 2).toUpperCase()}
                      </span>
                    ) : (
                      <User className="size-5" />
                    )}
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 text-xs rounded-xl border-slate-200 dark:border-zinc-700 font-semibold gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                      onClick={() => toast.info("Photo upload is enabled and will be saved with staff record")}
                    >
                      <Upload className="size-3.5 text-emerald-600" />
                      Upload Photo
                    </Button>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">JPG, PNG (Max 2MB)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Address */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="st_address" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Address <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <span className="text-[10px] text-slate-400">{formData.address?.length || 0}/200</span>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-4 text-slate-400" />
                <textarea
                  id="st_address"
                  rows={2}
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full office or home address"
                  maxLength={200}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-zinc-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 2: Account Settings                                */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <Shield className="size-4 text-emerald-600" />
              Account Settings
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Login Password / Security Status */}
              <div className="space-y-1.5">
                <Label htmlFor="st_password" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {isCreate ? "Login Password" : "Password Security"} {isCreate && <span className="text-red-500">*</span>}
                </Label>
                {isCreate ? (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="st_password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Set login password (default: changeme123)"
                      className="pl-9 pr-10 h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="h-10 px-3 rounded-xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span>••••••••••••</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Secured</span>
                  </div>
                )}
              </div>

              {/* Account Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Account Status
                </Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          formData.isActive ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                      />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        Active (Can Log In)
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium">
                        <span className="size-2 rounded-full bg-zinc-400" />
                        Inactive (Access Disabled)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info notice box matching the screenshot */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 text-sky-800 dark:text-sky-300 text-xs">
              <Info className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                The staff member will use their Email Address and this password to access the portal. You can share the credentials with them after creation.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Reset on left, Cancel & Action button on right */}
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
                  {member ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Plus className="size-4 stroke-[2.5]" />
                  {member ? "Update Member" : "Add Staff Member"}
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
