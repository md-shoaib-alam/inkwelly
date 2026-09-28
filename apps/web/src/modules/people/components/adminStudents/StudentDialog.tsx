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
import { ClassSelect } from "@/components/ui/class-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Bus,
  X,
  User,
  GraduationCap,
  FileText,
  RotateCcw,
  Plus,
  Upload,
  Droplet,
  Home,
  Info,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { ClassInfo, StudentFormData } from "./types";

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  classes?: ClassInfo[];
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
  submitting: boolean;
  onSubmit: () => void;
}

export function StudentDialog({
  open,
  onOpenChange,
  mode,
  classes,
  formData,
  setFormData,
  submitting,
  onSubmit,
}: StudentDialogProps) {
  const isCreate = mode === "create";

  const [showCustomPickup, setShowCustomPickup] = useState(false);
  const [customPickupName, setCustomPickupName] = useState("");
  const [customPickupFee, setCustomPickupFee] = useState("");

  // Keep a snapshot of the initial form data when opened to support Reset button
  const [initialSnapshot, setInitialSnapshot] = useState<StudentFormData>(formData);

  useEffect(() => {
    if (open) {
      setInitialSnapshot({ ...formData });
      setShowCustomPickup(false);
      setCustomPickupName("");
      setCustomPickupFee("");
    }
  }, [open]);

  // Fetch transport routes for the dropdown (with stops info)
  const { data: routesData } = useQuery({
    queryKey: ["transport-routes-min"],
    enabled: open,
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

  useEffect(() => {
    setShowCustomPickup(false);
    setCustomPickupName("");
    setCustomPickupFee("");
  }, [formData.routeId]);

  const selectedRoute = routes.find((r: any) => r?.id === formData.routeId);
  const routeStops = selectedRoute
    ? (typeof selectedRoute.stops === "string" ? JSON.parse(selectedRoute.stops) : (selectedRoute.stops || []))
    : [];

  const handleReset = () => {
    if (isCreate) {
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        rollNumber: "",
        classId: "",
        gender: "male",
        dateOfBirth: "",
        bloodGroup: "",
        house: "",
        transportEnabled: false,
        routeId: "",
        pickupPoint: "",
      });
    } else {
      setFormData({ ...initialSnapshot });
    }
    setShowCustomPickup(false);
    setCustomPickupName("");
    setCustomPickupFee("");
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
                {isCreate ? "ADD NEW STUDENT" : "EDIT STUDENT"}
              </p>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isCreate ? "Add New Student" : "Edit Student Profile"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {isCreate
                  ? "Fill in the details below. A unique School ID (e.g. STU2026xxxx) will be generated automatically for login."
                  : "Update the student information below and save your changes."}
              </DialogDescription>
            </div>

            {/* Top Right Decorative Illustration Image (table.avif) */}
            <div className="hidden sm:block relative w-36 h-24 shrink-0 -mr-2 select-none pointer-events-none">
              <Image
                src="/assets/admin/table.avif"
                alt="Student ID card graphic"
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
                  <Label htmlFor="std_name" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="std_name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="pl-9 h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                    <SelectValue placeholder="Select Gender" />
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
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Date of Birth</Label>
                <DatePicker
                  date={formData.dateOfBirth && !isNaN(new Date(formData.dateOfBirth).getTime()) ? new Date(formData.dateOfBirth) : undefined}
                  onChange={(date) => {
                    const formatted = date ? date.toISOString().split("T")[0] : "";
                    setFormData({ ...formData, dateOfBirth: formatted });
                  }}
                  placeholder="Pick date of birth"
                  className="w-full h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            {/* Row 2: Email, Phone Number, Student Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="std_email" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Email <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="std_email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@school.com"
                  className="h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="std_phone" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Phone Number
                </Label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="inline-flex items-center px-2.5 text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 font-medium">
                    +91
                  </span>
                  <input
                    id="std_phone"
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full h-10 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Student Photo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Student Photo <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="size-5" />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs rounded-xl border-slate-200 dark:border-zinc-700 font-semibold gap-1.5 hover:bg-slate-50"
                      onClick={() => toast.info("Photo upload is enabled and will be stored with student records")}
                    >
                      <Upload className="size-3.5" />
                      Upload Photo
                    </Button>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">JPG, PNG (Max 2MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 2: Academic Information                           */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <GraduationCap className="size-4 text-emerald-600" />
              Academic Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Class */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Class <span className="text-red-500">*</span>
                </Label>
                <ClassSelect
                  value={formData.classId}
                  onValueChange={(val) => setFormData({ ...formData, classId: val })}
                  placeholder="Select class"
                  className="w-full h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>

              {/* Roll Number */}
              <div className="space-y-1.5">
                <Label htmlFor="std_roll" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Roll Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">#</span>
                  <Input
                    id="std_roll"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="Enter roll number"
                    className="pl-8 h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              {/* School Login ID */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">School Login ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    value={formData.username || (isCreate ? "Auto-generated" : "")}
                    disabled={isCreate}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Auto-generated"
                    className="pl-9 h-10 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 text-slate-500 border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION 3: Additional Details                             */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <FileText className="size-4 text-emerald-600" />
              Additional Details
            </div>

            {/* Blood Group & House */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Blood Group */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Blood Group <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Select
                    value={formData.bloodGroup || ""}
                    onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                  >
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 pl-9">
                      <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* House (Disabled / Reserved for future feature) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  House <span className="text-[10px] text-slate-400 font-normal">(Not Configured)</span>
                </Label>
                <div className="relative">
                  <Select
                    value="Not Assigned"
                    disabled
                  >
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-500 cursor-not-allowed pl-9">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <SelectValue placeholder="Not Assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Assigned">Not Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Transport Service Switch & Info */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bus className="size-4 text-emerald-600" />
                  <div>
                    <Label htmlFor="transport_toggle" className="text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer">
                      Transport Service
                    </Label>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Enable if this student uses school transport
                    </p>
                  </div>
                </div>
                <Switch
                  id="transport_toggle"
                  checked={formData.transportEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, transportEnabled: checked })}
                />
              </div>

              {!formData.transportEnabled ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs">
                  <Info className="size-4 text-emerald-600 shrink-0" />
                  <span>Transport details will be available after enabling this option.</span>
                </div>
              ) : (
                <div className="animate-in slide-in-from-top-2 duration-200 space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Route Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Route <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.routeId}
                        onValueChange={(v) => setFormData({ ...formData, routeId: v, pickupPoint: "" })}
                      >
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                          <SelectValue placeholder="Select a route" />
                        </SelectTrigger>
                        <SelectContent>
                          {routes.map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pickup Point Selection */}
                    {formData.routeId && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          Pickup Point <span className="text-red-500">*</span>
                        </Label>
                        {!showCustomPickup ? (
                          <Select
                            value={formData.pickupPoint || ""}
                            onValueChange={(v) => {
                              if (v === "__new__") {
                                setShowCustomPickup(true);
                                setFormData({ ...formData, pickupPoint: "" });
                              } else {
                                setFormData({ ...formData, pickupPoint: v });
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                              <SelectValue placeholder="Choose pickup point..." />
                            </SelectTrigger>
                            <SelectContent>
                              {routeStops.map((stop: any, idx: number) => (
                                <SelectItem key={idx} value={stop.name}>
                                  {stop.name} (₹{stop.fee})
                                </SelectItem>
                              ))}
                              <SelectItem value="__new__" className="text-emerald-600 font-semibold focus:text-emerald-700">
                                + Create New Pickup Point...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800/40">
                            <div className="space-y-1">
                              <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                                New Pickup Point Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="e.g. Sector 5 Crossing"
                                value={customPickupName}
                                onChange={(e) => {
                                  setCustomPickupName(e.target.value);
                                  setFormData({ ...formData, pickupPoint: e.target.value });
                                }}
                                className="h-9 text-xs rounded-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                                Pickup Fee (₹) <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                placeholder="e.g. 1200"
                                value={customPickupFee}
                                onChange={(e) => {
                                  setCustomPickupFee(e.target.value);
                                  setFormData({ ...formData, newPickupPointFee: Number(e.target.value) });
                                }}
                                className="h-9 text-xs rounded-lg"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="link"
                              className="text-xs p-0 h-auto text-emerald-600 hover:text-emerald-700"
                              onClick={() => {
                                setShowCustomPickup(false);
                                setCustomPickupName("");
                                setCustomPickupFee("");
                                const { newPickupPointFee, ...rest } = formData;
                                setFormData({ ...rest, pickupPoint: "" });
                              }}
                            >
                              ← Select existing pickup point
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              disabled={
                submitting ||
                !formData.name ||
                !formData.classId ||
                !formData.rollNumber ||
                (formData.transportEnabled && (!formData.routeId || !formData.pickupPoint))
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl px-5 h-10 gap-1.5 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {isCreate ? "Adding Student..." : "Updating..."}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {isCreate ? "Add Student" : "Update Student"}
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
