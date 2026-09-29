"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassSelect } from "@/components/ui/class-select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Camera,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/graphql/keys";
import { useAppStore } from "@/store/use-app-store";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";

const labelCls = "text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400";
const fieldCls = "h-10 text-[13px] rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-none focus-visible:ring-1 focus-visible:ring-teal-500";
const required = <span className="text-red-500 ml-0.5">*</span>;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-3 pb-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">
        {children}
      </span>
      <span className="h-px flex-1 bg-slate-100 dark:bg-zinc-800" />
    </div>
  );
}

function Field({ id, title, req, children, className = "" }: { id?: string; title: string; req?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={id} className={labelCls}>
        {title} {req && required}
      </Label>
      {children}
    </div>
  );
}

const emptyForm = {
  studentId: "",
  admissionNo: "",
  admissionDate: "",
  peNumber: "",
  abcId: "",
  apaarId: "",
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  religion: "",
  nationality: "Indian",
  motherTongue: "Hindi",
  aadhaarNo: "",
  casteCategory: "",
  email: "",
  phone: "",
  classId: "",
  rollNumber: "",
  registrationNo: "",
  joiningDate: "",
  remarks: "",
};

type AdmissionForm = typeof emptyForm;

function AdminAdmissionsContent() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { year } = useActiveAcademicYear();
  const { canCreate } = useModulePermissions("students");
  const queryClient = useQueryClient();

  const [form, setForm] = useState<AdmissionForm>(emptyForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof AdmissionForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Arriving from one class page carries that class in the URL, so the form opens
  // with it already chosen instead of making the user name it again.
  useEffect(() => {
    const classId = new URLSearchParams(window.location.search).get("classId");
    if (classId) setForm((f) => (f.classId ? f : { ...f, classId }));
  }, []);

  const sessionName = year?.name ?? "this session";

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.firstName.trim() &&
          form.classId &&
          form.dateOfBirth &&
          form.gender &&
          form.joiningDate,
      ),
    [form],
  );

  const handlePhoto = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be under 2MB");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("First name, Class, Date of Birth, Gender and Joining Date are required");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(form)) {
      if (value.trim()) payload[key] = value.trim();
    }
    if (year?.name) payload.academicYear = year.name;

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to admit student");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard", currentTenantId] });
      toast.success(`Admitted! ${data.name} — Student ID: ${data.username}, Admission No.: ${data.admissionNo}`);
      setForm(emptyForm);
      setPhotoPreview(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to admit student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
            New admission
          </h1>
          <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500 dark:text-zinc-400">
            Admit a new student to {sessionName}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.info("AI auto-fill is coming soon")}
            className="h-9 rounded-xl gap-1.5 text-[12px] font-semibold border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-2xs hover:bg-slate-50"
          >
            <Sparkles className="size-3.5 text-teal-600 dark:text-teal-400" />
            AI auto-fill
          </Button>
          <Button
            type="button"
            disabled={!canCreate || submitting || !canSubmit}
            onClick={handleSubmit}
            className="h-9 rounded-xl gap-1.5 bg-[#0F172A] hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white text-[12px] font-semibold shadow-2xs px-4"
          >
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            {submitting ? "Admitting..." : "Admit student"}
          </Button>
        </div>
      </div>

      {!canCreate && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Read-only mode: you need create permission on Students to admit a student.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ── Step 1: Student profile ─────────────────────────────── */}
        <div
          style={{
            borderRadius: "20px",
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--c-shadow)",
          }}
          className="p-6 space-y-6"
        >
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
              <User className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Student profile</h2>
                <span className="rounded-md bg-blue-100/70 dark:bg-blue-950/50 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Step 1
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Personal details, identification and contact information
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Top row: Photo upload + Student ID, Admission No, Admission Date */}
            <div className="flex flex-col sm:flex-row gap-5 mb-6">
              <Field title="PHOTO">
                <label className="relative size-[100px] shrink-0 cursor-pointer flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-gradient-to-br from-zinc-50 to-zinc-100/60 dark:from-zinc-800/40 dark:to-zinc-850 hover:border-slate-300 transition-colors">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Student photo preview" className="size-full rounded-2xl object-cover" />
                  ) : (
                    <>
                      <div className="size-8 rounded-full flex items-center justify-center text-slate-400 dark:text-zinc-500">
                        <Camera className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">UPLOAD</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhoto(e.target.files?.[0])}
                  />
                </label>
              </Field>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <Field id="adm_student_id" title="STUDENT ID" req>
                  <Input
                    id="adm_student_id"
                    value={form.studentId}
                    onChange={(e) => set("studentId")(e.target.value)}
                    placeholder="STU2025001"
                    className={fieldCls}
                  />
                </Field>
                <Field id="adm_no" title="ADMISSION NO." req>
                  <Input
                    id="adm_no"
                    value={form.admissionNo}
                    onChange={(e) => set("admissionNo")(e.target.value)}
                    placeholder="ADM2025001"
                    className={fieldCls}
                  />
                </Field>
                <Field id="adm_date" title="ADMISSION DATE">
                  <Input
                    id="adm_date"
                    type="date"
                    value={form.admissionDate}
                    onChange={(e) => set("admissionDate")(e.target.value)}
                    className={fieldCls}
                  />
                </Field>
              </div>
            </div>

            <SectionLabel>GOVERNMENT IDS</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="adm_pe" title="PE NUMBER">
                <Input id="adm_pe" value={form.peNumber} onChange={(e) => set("peNumber")(e.target.value)} placeholder="PE123456" className={fieldCls} />
              </Field>
              <Field id="adm_abc" title="ABC ID">
                <Input id="adm_abc" value={form.abcId} onChange={(e) => set("abcId")(e.target.value)} placeholder="ABC123456" className={fieldCls} />
              </Field>
              <Field id="adm_apaar" title="APAAR ID">
                <Input id="adm_apaar" value={form.apaarId} onChange={(e) => set("apaarId")(e.target.value)} placeholder="APAAR123456" className={fieldCls} />
              </Field>
            </div>

            <SectionLabel>PERSONAL DETAILS</SectionLabel>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field title="TITLE">
                <Select value={form.title} onValueChange={set("title")}>
                  <SelectTrigger className={`${fieldCls} w-full`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Master">Master</SelectItem>
                    <SelectItem value="Miss">Miss</SelectItem>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="adm_first" title="FIRST NAME" req>
                <Input id="adm_first" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} placeholder="Rahul" className={fieldCls} />
              </Field>
              <Field id="adm_middle" title="MIDDLE NAME">
                <Input id="adm_middle" value={form.middleName} onChange={(e) => set("middleName")(e.target.value)} placeholder="Kumar" className={fieldCls} />
              </Field>
              <Field id="adm_last" title="LAST NAME">
                <Input id="adm_last" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} placeholder="Sharma" className={fieldCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field id="adm_dob" title="DATE OF BIRTH" req>
                <Input id="adm_dob" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth")(e.target.value)} className={fieldCls} />
              </Field>
              <Field title="GENDER" req>
                <Select value={form.gender} onValueChange={set("gender")}>
                  <SelectTrigger className={`${fieldCls} w-full`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field title="BLOOD GROUP">
                <Select value={form.bloodGroup} onValueChange={set("bloodGroup")}>
                  <SelectTrigger className={`${fieldCls} w-full`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field title="RELIGION">
                <Select value={form.religion} onValueChange={set("religion")}>
                  <SelectTrigger className={`${fieldCls} w-full`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <SectionLabel>ADDITIONAL INFO</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="adm_nationality" title="NATIONALITY">
                <Input id="adm_nationality" value={form.nationality} onChange={(e) => set("nationality")(e.target.value)} placeholder="Indian" className={fieldCls} />
              </Field>
              <Field id="adm_tongue" title="MOTHER TONGUE">
                <Input id="adm_tongue" value={form.motherTongue} onChange={(e) => set("motherTongue")(e.target.value)} placeholder="Hindi" className={fieldCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="adm_aadhaar" title="AADHAAR NO.">
                <Input id="adm_aadhaar" value={form.aadhaarNo} onChange={(e) => set("aadhaarNo")(e.target.value)} placeholder="123456789012" className={fieldCls} />
              </Field>
              <Field title="CASTE CATEGORY">
                <Select value={form.casteCategory} onValueChange={set("casteCategory")}>
                  <SelectTrigger className={`${fieldCls} w-full`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["General", "OBC", "SC", "ST", "EWS"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <SectionLabel>CONTACT</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="adm_email" title="EMAIL ADDRESS">
                <Input id="adm_email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="student@example.com" className={fieldCls} />
              </Field>
              <Field id="adm_phone" title="MOBILE NUMBER">
                <Input id="adm_phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+919876543210" className={fieldCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Step 2: Academic enrollment ─────────────────────────── */}
        <div
          style={{
            borderRadius: "20px",
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--c-shadow)",
          }}
          className="xl:sticky xl:top-4 p-6 space-y-6"
        >
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
            <div className="size-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center shrink-0 text-teal-600 dark:text-teal-400">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Academic enrollment</h2>
                <span className="rounded-md bg-teal-100/70 dark:bg-teal-950/50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                  Step 2
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Class assignment and session details
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <Field title="ACADEMIC SESSION">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/40 px-3 text-[13px] font-medium text-slate-700 dark:text-zinc-200">
                <BookOpen className="size-4 text-emerald-600 shrink-0" />
                {sessionName}
              </div>
            </Field>

            <Field title="CLASS" req>
              <ClassSelect
                value={form.classId}
                onValueChange={set("classId")}
                placeholder="Select class"
                className={`w-full ${fieldCls}`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field id="adm_roll" title="ROLL NO.">
                <Input id="adm_roll" value={form.rollNumber} onChange={(e) => set("rollNumber")(e.target.value)} placeholder="1" className={fieldCls} />
              </Field>
              <Field id="adm_reg" title="REGISTRATION NO.">
                <Input id="adm_reg" value={form.registrationNo} onChange={(e) => set("registrationNo")(e.target.value)} placeholder="REG2025001" className={fieldCls} />
              </Field>
            </div>

            <Field id="adm_joining" title="JOINING DATE" req>
              <Input id="adm_joining" type="date" value={form.joiningDate} onChange={(e) => set("joiningDate")(e.target.value)} className={fieldCls} />
            </Field>

            <Field id="adm_remarks" title="REMARKS">
              <Textarea
                id="adm_remarks"
                value={form.remarks}
                onChange={(e) => set("remarks")(e.target.value)}
                placeholder="Additional notes about the admission..."
                rows={5}
                className="text-[13px] rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-none focus-visible:ring-1 focus-visible:ring-teal-500"
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminAdmissions() {
  return (
    <Suspense fallback={null}>
      <AdminAdmissionsContent />
    </Suspense>
  );
}
