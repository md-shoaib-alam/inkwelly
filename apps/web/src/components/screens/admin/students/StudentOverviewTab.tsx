"use client";

import { useState, useEffect } from "react";
import {
  User,
  Calendar,
  Baby,
  Droplet,
  Phone,
  Pencil,
  GraduationCap,
  BookOpen,
  Users,
  Key,
  CheckCircle2,
  Home,
  Heart,
  Mail,
  MapPin,
  Bus,
  Plus,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  Upload,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { ClassSelect } from "@/components/ui/class-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { StudentInfo } from "./types";

interface StudentOverviewTabProps {
  currentStudent: StudentInfo;
  studentDetails: any;
  transportRoute: any;
  canEdit?: boolean;
  onEdit?: (student: StudentInfo) => void;
  onSelectStudent?: (studentId: string) => void;
  formatDate: (dateStr: string | null | undefined) => string;
  calculateAge: (dateStr: string | null | undefined) => string;
}

export function StudentOverviewTab({
  currentStudent,
  studentDetails,
  transportRoute,
  canEdit,
  onSelectStudent,
  formatDate,
  calculateAge,
}: StudentOverviewTabProps) {
  const queryClient = useQueryClient();

  // Track which section is in edit mode: null | 'personal' | 'academic' | 'parent' | 'transport'
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Track collapsed state for sections
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    personal: false,
    academic: false,
    parent: false,
    transport: false,
  });

  const toggleCollapse = (sec: string) => {
    setCollapsed((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const sourceStudent = studentDetails || currentStudent;

  // Editable Form State initialized directly from source
  const [formData, setFormData] = useState(() => ({
    name: sourceStudent?.name || "",
    gender: sourceStudent?.gender || "male",
    dateOfBirth: sourceStudent?.dateOfBirth ? sourceStudent.dateOfBirth.split("T")[0] : "",
    bloodGroup: sourceStudent?.bloodGroup || "Not Added",
    phone: sourceStudent?.phone || "",
    email: sourceStudent?.email || "",
    classId: sourceStudent?.classId || "",
    className: sourceStudent?.className || "",
    rollNumber: sourceStudent?.rollNumber || "",
    username: sourceStudent?.username || "",
    admissionDate: sourceStudent?.admissionDate ? sourceStudent.admissionDate.split("T")[0] : (sourceStudent?.createdAt ? sourceStudent.createdAt.split("T")[0] : ""),
    academicStatus: sourceStudent?.status || "enrolled",
    house: sourceStudent?.house || "Not Assigned",
    parentName: sourceStudent?.parentName || "",
    parentRelationship: "Parent",
    parentEmail: sourceStudent?.parentEmail || "",
    parentPhone: sourceStudent?.parentPhone || "",
    address: sourceStudent?.address || "",
    transportEnabled: !!sourceStudent?.transport,
    routeId: sourceStudent?.transport?.routeId || "",
    pickupPoint: sourceStudent?.transport?.pickupPoint || "",
    newPickupPointFee: 0,
  }));

  // Fetch transport routes for transport section
  const { data: routesData } = useQuery({
    queryKey: ["transport-routes-min"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/transport-routes?mode=min");
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      } catch {
        return [];
      }
    },
  });
  const routes = Array.isArray(routesData) ? routesData : [];

  const startEditSection = (section: string) => {
    const s = studentDetails || currentStudent;
    setFormData({
      name: s?.name || "",
      gender: s?.gender || "male",
      dateOfBirth: s?.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
      bloodGroup: s?.bloodGroup || "Not Added",
      phone: s?.phone || "",
      email: s?.email || "",
      classId: s?.classId || "",
      className: s?.className || "",
      rollNumber: s?.rollNumber || "",
      username: s?.username || "",
      admissionDate: s?.admissionDate ? s.admissionDate.split("T")[0] : (s?.createdAt ? s.createdAt.split("T")[0] : ""),
      academicStatus: s?.status || "enrolled",
      house: s?.house || "Not Assigned",
      parentName: s?.parentName || "",
      parentRelationship: "Parent",
      parentEmail: s?.parentEmail || "",
      parentPhone: s?.parentPhone || "",
      address: s?.address || "",
      transportEnabled: !!s?.transport,
      routeId: s?.transport?.routeId || "",
      pickupPoint: s?.transport?.pickupPoint || "",
      newPickupPointFee: 0,
    });
    setEditingSection(section);
  };

  const [saving, setSaving] = useState(false);

  // Save changes for a section or whole student
  const handleSave = async (sectionName?: string) => {
    setSaving(true);
    try {
      const s = studentDetails || currentStudent;
      const payload: any = {
        id: s.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        rollNumber: formData.rollNumber,
        classId: formData.classId,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        status: formData.academicStatus,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentEmail: formData.parentEmail,
        address: formData.address,
        transportEnabled: formData.transportEnabled,
        routeId: formData.routeId,
        pickupPoint: formData.pickupPoint,
      };

      const res = await apiFetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update student details");
      }

      toast.success(sectionName ? `${sectionName} updated successfully` : "Student details updated successfully");
      
      // Invalidate queries to refresh view data
      queryClient.invalidateQueries({ queryKey: ["student-detail", s.id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      
      setEditingSection(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  const cancelSection = () => {
    // Reset to current values
    const s = studentDetails || currentStudent;
    setFormData((prev) => ({
      ...prev,
      name: s?.name || "",
      gender: s?.gender || "male",
      dateOfBirth: s?.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
      phone: s?.phone || "",
      email: s?.email || "",
      classId: s?.classId || "",
      rollNumber: s?.rollNumber || "",
      username: s?.username || "",
      academicStatus: s?.status || "enrolled",
      parentName: s?.parentName || "",
      parentRelationship: "Parent",
      parentEmail: s?.parentEmail || "",
      parentPhone: s?.parentPhone || "",
      address: s?.address || "",
      transportEnabled: !!s?.transport,
      routeId: s?.transport?.routeId || "",
      pickupPoint: s?.transport?.pickupPoint || "",
    }));
    setEditingSection(null);
  };

  const selectedRoute = routes.find((r: any) => r?.id === formData.routeId);
  const routeStops = selectedRoute
    ? (typeof selectedRoute.stops === "string" ? JSON.parse(selectedRoute.stops) : (selectedRoute.stops || []))
    : [];

  return (
    <div className="space-y-4">
      {/* ────────────────────────────────────────────────────────── */}
      {/* CARD 1: Personal Information                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
            <User className="size-4 text-emerald-600" />
            Personal Information
          </div>

          <div className="flex items-center gap-2">
            {editingSection === "personal" ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelSection}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave("Personal Information")}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </Button>
              </div>
            ) : (
              canEdit && (
                <button
                  onClick={() => startEditSection("personal")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )
            )}
            <button
              onClick={() => toggleCollapse("personal")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Toggle section"
            >
              {collapsed.personal ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
        </div>

        {!collapsed.personal && (
          editingSection === "personal" ? (
            /* EDIT FORM */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Student Name"
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => setFormData({ ...formData, gender: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Date of Birth <span className="text-red-500">*</span>
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

                {/* Age (Readonly calculated) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Age</Label>
                  <Input
                    value={calculateAge(formData.dateOfBirth)}
                    disabled
                    readOnly
                    className="h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 text-slate-500 border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Blood Group */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Blood Group</Label>
                  <Select
                    value={formData.bloodGroup}
                    onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                      <SelectValue placeholder="Not Added" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Added">Not Added</SelectItem>
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

                {/* Phone Number with +91 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Phone Number</Label>
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

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@school.com"
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Student Photo */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Student Photo</Label>
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {formData.name ? formData.name.slice(0, 2).toUpperCase() : "ST"}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 text-xs sm:text-sm">
              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Full Name</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{formData.name || currentStudent.name}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Gender</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 capitalize mt-0.5">
                  {formData.gender || currentStudent.gender || "–"}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">DOB</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {formatDate(formData.dateOfBirth || currentStudent.dateOfBirth)}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Age</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {calculateAge(formData.dateOfBirth || currentStudent.dateOfBirth)}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Blood Group</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{formData.bloodGroup || "Not Added"}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Phone</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {formData.phone || currentStudent.phone || "—"}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* CARD 2: Academic Information                               */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
            <GraduationCap className="size-4 text-emerald-600" />
            Academic Information
          </div>

          <div className="flex items-center gap-2">
            {editingSection === "academic" ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelSection}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave("Academic Information")}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </Button>
              </div>
            ) : (
              canEdit && (
                <button
                  onClick={() => startEditSection("academic")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )
            )}
            <button
              onClick={() => toggleCollapse("academic")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Toggle section"
            >
              {collapsed.academic ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
        </div>

        {!collapsed.academic && (
          editingSection === "academic" ? (
            /* EDIT FORM */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Class & Section */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Class & Section <span className="text-red-500">*</span>
                  </Label>
                  <ClassSelect
                    value={formData.classId}
                    onValueChange={(val) => setFormData({ ...formData, classId: val })}
                    placeholder="Select class"
                    className="w-full h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Roll Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Roll Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. 9B138"
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Student ID (Login ID) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Student ID (Login ID) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.username || currentStudent.username || currentStudent.rollNumber}
                    disabled
                    readOnly
                    className="h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 text-slate-500 border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Admission Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Admission Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    date={formData.admissionDate && !isNaN(new Date(formData.admissionDate).getTime()) ? new Date(formData.admissionDate) : undefined}
                    onChange={(d) => {
                      const formatted = d ? d.toISOString().split("T")[0] : "";
                      setFormData({ ...formData, admissionDate: formatted });
                    }}
                    placeholder="Pick admission date"
                    className="w-full h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Academic Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Academic Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.academicStatus}
                    onValueChange={(val) => setFormData({ ...formData, academicStatus: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Enrolled / Active
                        </span>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          Inactive
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* House (Disabled / Reserved for future feature) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    House <span className="text-[10px] text-slate-400 font-normal">(Not Configured)</span>
                  </Label>
                  <Select
                    value="Not Assigned"
                    disabled
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-100/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-500 cursor-not-allowed">
                      <SelectValue placeholder="Not Assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Assigned">Not Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 text-xs sm:text-sm">
              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Class & Section</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {currentStudent.className || "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Roll No</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {formData.rollNumber || currentStudent.rollNumber || "–"}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Student ID</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {formData.username || currentStudent.username || currentStudent.rollNumber || "–"}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Admission Date</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {formatDate(formData.admissionDate || currentStudent.admissionDate || currentStudent.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Status</p>
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Enrolled
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">House</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{formData.house || "Not Assigned"}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* CARD 3: Parent & Contact Details                           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
            <Users className="size-4 text-emerald-600" />
            Parent & Contact Details
          </div>

          <div className="flex items-center gap-2">
            {editingSection === "parent" ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelSection}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave("Parent & Contact Details")}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </Button>
              </div>
            ) : (
              canEdit && (
                <button
                  onClick={() => startEditSection("parent")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )
            )}
            <button
              onClick={() => toggleCollapse("parent")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Toggle section"
            >
              {collapsed.parent ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
        </div>

        {!collapsed.parent && (
          editingSection === "parent" ? (
            /* EDIT FORM */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Parent / Guardian */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Parent / Guardian <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Parent Name"
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Relationship (Fixed to Parent on server) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Relationship <span className="text-[10px] text-slate-400 font-normal">(Parent)</span>
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

                {/* Phone Number with +91 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Parent Phone</Label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500">
                    <span className="inline-flex items-center px-2.5 text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full h-9 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200"
                    />
                  </div>
                </div>

                {/* Parent Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Parent Email</Label>
                  <Input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    placeholder="parent@email.com"
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Student Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Student Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@school.com"
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 text-xs sm:text-sm">
              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Parent Name</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {formData.parentName || currentStudent.parentName || "–"}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Parent Phone</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">
                  {formData.parentPhone || currentStudent.parentPhone || "—"}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Relationship</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{formData.parentRelationship || "Parent"}</p>
              </div>

              <div className="col-span-2 sm:col-span-1 min-w-0">
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Parent Email</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 break-all mt-0.5">
                  {formData.parentEmail || currentStudent.parentEmail || "—"}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 min-w-0">
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Student Email</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 break-all mt-0.5">
                  {formData.email || currentStudent.email || "—"}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Address</p>
                <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{formData.address || "Not Added"}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* CARD 4: Siblings (View Only - No Edit Button)             */}
      {/* ────────────────────────────────────────────────────────── */}
      {studentDetails?.siblings && studentDetails.siblings.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
              <Users className="size-4 text-emerald-600" />
              Siblings
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              {studentDetails.siblings.length} {studentDetails.siblings.length === 1 ? "Sibling" : "Siblings"}
            </span>
          </div>

          <div className="space-y-2.5">
            {studentDetails.siblings.map((sib: any) => {
              const sibInitials = sib.name
                ? sib.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "ST";
              return (
                <div
                  key={sib.id}
                  onClick={() => onSelectStudent && onSelectStudent(sib.id)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 hover:border-emerald-200/80 dark:hover:border-emerald-800/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {sibInitials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        {sib.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {sib.gender === "female" ? "Sister" : "Brother"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                        {sib.className || "Unassigned"}
                      </p>
                      {sib.rollNumber && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Roll No: {sib.rollNumber}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* CARD 5: Transport Details                                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
            <Bus className="size-4 text-emerald-600" />
            Transport Details
          </div>

          <div className="flex items-center gap-2">
            {editingSection === "transport" ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelSection}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave("Transport Details")}
                  disabled={saving}
                  className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </Button>
              </div>
            ) : (
              canEdit && (
                <button
                  onClick={() => startEditSection("transport")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )
            )}
            <button
              onClick={() => toggleCollapse("transport")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Toggle section"
            >
              {collapsed.transport ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
        </div>

        {!collapsed.transport && (
          editingSection === "transport" ? (
            /* EDIT FORM */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.transportEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, transportEnabled: checked })}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Use Transport Service</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">Enable if this student uses school transport</p>
                  </div>
                </div>

                {!formData.transportEnabled && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200/60 dark:border-emerald-900/60">
                    <Info className="size-4 text-emerald-600 shrink-0" />
                    Transport details will be available after enabling this option.
                  </div>
                )}
              </div>

              {formData.transportEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-in fade-in-50 duration-200">
                  {/* Select Route */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Assigned Route <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.routeId}
                      onValueChange={(val) => setFormData({ ...formData, routeId: val, pickupPoint: "" })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                        <SelectValue placeholder="Select Route" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} (₹{r.fee || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pickup Point */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Pickup Point <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.pickupPoint}
                      onValueChange={(val) => setFormData({ ...formData, pickupPoint: val })}
                      disabled={!formData.routeId}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                        <SelectValue placeholder={formData.routeId ? "Choose pickup point" : "Select a route first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {routeStops.map((stop: any, idx: number) => (
                          <SelectItem key={idx} value={stop.name}>
                            {stop.name} {stop.fee ? `(₹${stop.fee})` : ""}
                          </SelectItem>
                        ))}
                        {routeStops.length === 0 && (
                          <SelectItem value="Main Gate">Main Gate</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE */
            studentDetails?.transport ? (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Bus className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Service Status</p>
                    <p className="text-sm font-bold capitalize">Active Subscription</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                  <div>
                    <p className="text-slate-400 dark:text-zinc-500 font-medium uppercase text-[10px] tracking-wide">Assigned Route</p>
                    <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-0.5">
                      {transportRoute ? transportRoute.name : "Assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 dark:text-zinc-500 font-medium uppercase text-[10px] tracking-wide">Pickup Point</p>
                    <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                      <MapPin className="size-3 text-emerald-600" />
                      {studentDetails.transport.pickupPoint || "–"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800">
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                    <Bus className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">No transport details added</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">This student is not assigned to any transport route.</p>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSection("transport");
                      setFormData((prev) => ({ ...prev, transportEnabled: true }));
                    }}
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-800 dark:text-emerald-400 font-semibold gap-1.5 rounded-lg shrink-0"
                  >
                    <Plus className="size-4" />
                    Add Transport
                  </Button>
                )}
              </div>
            )
          )
        )}
      </div>

      {/* Global Bottom Save Action Bar if any section is in edit mode */}
      {editingSection && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
            You have unsaved changes in <span className="font-bold capitalize">{editingSection}</span> section.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={cancelSection}
              disabled={saving}
              className="text-xs h-8 rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave()}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl font-semibold gap-1.5"
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
              Update Student
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
