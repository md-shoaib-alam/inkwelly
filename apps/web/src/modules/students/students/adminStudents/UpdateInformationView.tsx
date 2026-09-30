"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Camera, ChevronLeft, Loader2, Phone, Save, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { PROFILE_QUERY_KEY } from "./profile/tabs";
import { studentRefOf } from "../student-ref";

/**
 * The full-page correction form for everything admission captured. The roster's edit
 * dialog only ever wrote nine columns, so a school that typed a corrected Aadhaar or
 * mother tongue into it watched the value disappear on save; this screen writes every
 * column it shows.
 */

const labelCls = "text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400";
const fieldCls =
  "h-10 text-[13px] rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-none focus-visible:ring-1 focus-visible:ring-teal-500";
const required = <span className="text-red-500 ml-0.5">*</span>;

function Field({
  id,
  title,
  req,
  note,
  className = "",
  children,
}: {
  id?: string;
  title: string;
  req?: boolean;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={id} className={labelCls}>
        {title} {req && required}
        {note && (
          <span className="ml-1 normal-case font-medium tracking-normal text-slate-400 dark:text-zinc-500">
            {note}
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

function Section({
  icon,
  tint,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
      <header className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/40 px-6 py-4">
        <span className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
          {icon}
        </span>
        <div>
          <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
      </header>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </section>
  );
}

type EditForm = {
  admissionNo: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  admissionDate: string;
  gender: string;
  bloodGroup: string;
  aadhaarNo: string;
  peNumber: string;
  abcId: string;
  apaarId: string;
  religion: string;
  casteCategory: string;
  nationality: string;
  motherTongue: string;
  email: string;
  phone: string;
  isActive: boolean;
  isRte: boolean;
};

type RosterRow = Record<string, any>;

const formOf = (row: RosterRow): EditForm => ({
  admissionNo: row.admissionNo ?? "",
  title: row.title ?? "",
  firstName: row.firstName ?? "",
  middleName: row.middleName ?? "",
  lastName: row.lastName ?? "",
  dateOfBirth: row.dateOfBirth ?? "",
  admissionDate: row.admissionDate ?? "",
  gender: row.gender ?? "",
  bloodGroup: row.bloodGroup ?? "",
  aadhaarNo: row.aadhaarNo ?? "",
  peNumber: row.peNumber ?? "",
  abcId: row.abcId ?? "",
  apaarId: row.apaarId ?? "",
  religion: row.religion ?? "",
  casteCategory: row.casteCategory ?? "",
  nationality: row.nationality ?? "",
  motherTongue: row.motherTongue ?? "",
  email: row.email ?? "",
  phone: row.phone ?? "",
  isActive: (row.status ?? "active") === "active",
  isRte: Boolean(row.isRte),
});

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "—";

export function UpdateInformationView({
  studentRef,
  canEdit,
  onDone,
  onCancel,
}: {
  studentRef: string;
  canEdit: boolean;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const queryClient = useQueryClient();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onDone();
    }
  };

  const [phase, setPhase] = useState<"loading" | "missing" | "ready">("loading");
  const [row, setRow] = useState<RosterRow | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof EditForm) => (value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  // `phase` starts at "loading" and the screen is keyed by ref at the call site, so a
  // different child remounts this form rather than leaving the previous child's values
  // on screen while the new fetch is in flight.
  useEffect(() => {
    const controller = new AbortController();
    apiFetch(`/api/student-roster?limit=1&search=${encodeURIComponent(studentRef)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load student"))))
      .then((data) => {
        const match = (data.items ?? []).find(
          (r: RosterRow) => studentRefOf(r) === studentRef || r.id === studentRef,
        );
        if (!match) {
          setPhase("missing");
          return;
        }
        setRow(match);
        setForm(formOf(match));
        setPhase("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setPhase("missing");
      });
    return () => controller.abort();
  }, [studentRef]);

  const handleSubmit = async () => {
    if (!row || !form) return;
    if (!form.firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!form.admissionNo.trim()) {
      toast.error("Admission no. is required");
      return;
    }
    if (!form.dateOfBirth.trim()) {
      toast.error("Date of birth is required");
      return;
    }
    if (!form.gender) {
      toast.error("Gender is required");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    toast.promise(
      (async () => {
        setSubmitting(true);
        try {
          const payload: Record<string, unknown> = {
            id: row.id,
            admissionNo: form.admissionNo.trim(),
            title: form.title,
            firstName: form.firstName.trim(),
            middleName: form.middleName,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth,
            admissionDate: form.admissionDate,
            gender: form.gender,
            bloodGroup: form.bloodGroup,
            aadhaarNo: form.aadhaarNo,
            peNumber: form.peNumber,
            abcId: form.abcId,
            apaarId: form.apaarId,
            religion: form.religion,
            casteCategory: form.casteCategory,
            nationality: form.nationality,
            motherTongue: form.motherTongue,
            email: form.email,
            phone: form.phone,
            status: form.isActive ? "active" : "inactive",
            isRte: form.isRte,
          };
          const res = await apiFetch("/api/students", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.success === false) {
            throw new Error(data.error || "Failed to save student details");
          }
          queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard", currentTenantId] });
          onDone();
          return "Student details updated";
        } finally {
          setSubmitting(false);
        }
      })(),
      {
        loading: "Saving student details...",
        success: (msg) => msg,
        error: (err: any) => err.message,
      },
    );
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 dark:text-zinc-400">
        <Loader2 className="size-5 animate-spin mr-2" />
        <span className="text-[13px]">Loading student...</span>
      </div>
    );
  }

  if (phase === "missing" || !row || !form) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
            Edit student information
          </h1>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-10 text-center">
          <p className="text-[13px] text-slate-600 dark:text-zinc-300">
            No student matches <span className="font-semibold">{studentRef}</span> in this school.
          </p>
          <Button type="button" variant="outline" onClick={handleCancel} className="mt-4 h-9 rounded-xl text-[12px] cursor-pointer">
            Back to profile
          </Button>
        </div>
      </div>
    );
  }

  const name: string = row.name ?? "";
  const classLine: string = row.className ? `${row.className.replace("-", " - ")}` : "Unassigned";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-emerald-50/70 px-3.5 py-1.5 text-slate-800 shadow-xs transition-all hover:bg-emerald-100/70 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
        >
          <ChevronLeft className="size-4 stroke-[2.5] text-slate-700 dark:text-zinc-300" />
          <span className="text-[13px] font-semibold tracking-tight">Back to profile</span>
        </button>
      </div>

      <div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Edit student information
        </h1>
        <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500 dark:text-zinc-400">
          Update profile details, IDs, contact, and other personal information.
        </p>
      </div>

      {/* Who is being edited, so a correction can never be saved onto the wrong child. */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 px-6 py-4">
        {row.avatar ? (
          <img src={row.avatar} alt="" className="size-11 rounded-full object-cover shrink-0" />
        ) : (
          <span className="size-11 rounded-full bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-200 text-[13px] font-bold flex items-center justify-center shrink-0">
            {initialsOf(name)}
          </span>
        )}
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-slate-900 dark:text-white truncate">{name}</div>
          <div className="text-[12px] text-slate-500 dark:text-zinc-400 truncate">
            {classLine}
            {row.admissionNo ? ` · ${row.admissionNo}` : ""}
          </div>
        </div>
        <span
          className={`ml-auto shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ${
            form.isActive
              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
          }`}
        >
          {form.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <Section
        icon={<User className="size-4.5" />}
        tint="bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400"
        title="Personal"
        subtitle="Name, date of birth, gender, and related details"
      >
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-4 items-start">
          <Field title="PHOTO">
            <button
              type="button"
              onClick={() => toast.info("Photo upload is coming soon")}
              className="relative size-[100px] shrink-0 cursor-pointer flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-gradient-to-br from-zinc-50 to-zinc-100/60 dark:from-zinc-800/40 dark:to-zinc-800/20 hover:border-slate-300 transition-colors"
            >
              {row.avatar ? (
                <img src={row.avatar} alt="Student photo" className="size-full rounded-2xl object-cover" />
              ) : (
                <>
                  <Camera className="size-5 text-slate-400 dark:text-zinc-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    UPLOAD
                  </span>
                </>
              )}
            </button>
          </Field>
          <Field id="upd_adm_no" title="ADMISSION NO." req>
            <Input
              id="upd_adm_no"
              value={form.admissionNo}
              onChange={(e) => set("admissionNo")(e.target.value)}
              placeholder="ADM2025001"
              className={fieldCls}
            />
          </Field>
          <Field id="upd_student_id" title="STUDENT ID" note="(read-only)">
            <Input id="upd_student_id" value={row.username ?? row.id} readOnly className={`${fieldCls} bg-slate-50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500`} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field title="TITLE">
            <Select value={form.title} onValueChange={set("title")}>
              <SelectTrigger className={`${fieldCls} w-full`}>
                <SelectValue placeholder="Select a title" />
              </SelectTrigger>
              <SelectContent>
                {["Master", "Miss", "Mr", "Mrs", "Ms"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="upd_first" title="FIRST NAME" req>
            <Input id="upd_first" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} placeholder="Aadhya" className={fieldCls} />
          </Field>
          <Field id="upd_middle" title="MIDDLE NAME" note="(optional)">
            <Input id="upd_middle" value={form.middleName} onChange={(e) => set("middleName")(e.target.value)} placeholder="Kumar" className={fieldCls} />
          </Field>
          <Field id="upd_last" title="LAST NAME">
            <Input id="upd_last" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} placeholder="Khan" className={fieldCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field id="upd_dob" title="DATE OF BIRTH" req>
            <Input id="upd_dob" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth")(e.target.value)} className={fieldCls} />
          </Field>
          <Field id="upd_adm_date" title="ADMISSION DATE">
            <Input id="upd_adm_date" type="date" value={form.admissionDate} onChange={(e) => set("admissionDate")(e.target.value)} className={fieldCls} />
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
        </div>
      </Section>

      <Section
        icon={<BookOpen className="size-4.5" />}
        tint="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        title="Identification"
        subtitle="Aadhaar, PE number, ABC ID, and APAAR ID"
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field id="upd_aadhaar" title="AADHAAR">
            <Input id="upd_aadhaar" value={form.aadhaarNo} onChange={(e) => set("aadhaarNo")(e.target.value)} placeholder="123456789012" className={fieldCls} />
          </Field>
          <Field id="upd_pen" title="PEN">
            <Input id="upd_pen" value={form.peNumber} onChange={(e) => set("peNumber")(e.target.value)} placeholder="PE123456" className={fieldCls} />
          </Field>
          <Field id="upd_abc" title="ABC ID">
            <Input id="upd_abc" value={form.abcId} onChange={(e) => set("abcId")(e.target.value)} placeholder="ABC123456" className={fieldCls} />
          </Field>
          <Field id="upd_apaar" title="APAAR ID">
            <Input id="upd_apaar" value={form.apaarId} onChange={(e) => set("apaarId")(e.target.value)} placeholder="APAAR123456" className={fieldCls} />
          </Field>
        </div>
      </Section>

      <Section
        icon={<Shield className="size-4.5" />}
        tint="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        title="Background"
        subtitle="Religion, nationality, caste category, and RTE status"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Field title="CATEGORY">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="upd_nationality" title="NATIONALITY">
            <Input id="upd_nationality" value={form.nationality} onChange={(e) => set("nationality")(e.target.value)} placeholder="Indian" className={fieldCls} />
          </Field>
          <Field id="upd_tongue" title="MOTHER TONGUE">
            <Input id="upd_tongue" value={form.motherTongue} onChange={(e) => set("motherTongue")(e.target.value)} placeholder="Hindi" className={fieldCls} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl bg-slate-100/80 dark:bg-zinc-800/40 px-4 py-3.5 cursor-pointer">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => (f ? { ...f, isActive: v === true } : f))}
              className="mt-0.5 size-4.5 border-slate-400 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100"
            />
            <span>
              <span className="block text-[13px] font-bold text-slate-900 dark:text-white">Active Student</span>
              <span className="block text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Currently enrolled and active
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-slate-100/80 dark:bg-zinc-800/40 px-4 py-3.5 cursor-pointer">
            <Checkbox
              checked={form.isRte}
              onCheckedChange={(v) => setForm((f) => (f ? { ...f, isRte: v === true } : f))}
              className="mt-0.5 size-4.5 border-slate-400 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100"
            />
            <span>
              <span className="block text-[13px] font-bold text-slate-900 dark:text-white">RTE Student</span>
              <span className="block text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Right to Education category
              </span>
            </span>
          </label>
        </div>
      </Section>

      <Section
        icon={<Phone className="size-4.5" />}
        tint="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        title="Contact"
        subtitle="Email address and mobile number"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="upd_email" title="EMAIL">
            <Input id="upd_email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="student@example.com" className={fieldCls} />
          </Field>
          <Field id="upd_phone" title="MOBILE">
            <Input id="upd_phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+919876543210" className={fieldCls} />
          </Field>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="h-10 rounded-xl px-5 text-[12.5px] font-semibold border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canEdit || submitting}
          onClick={handleSubmit}
          className="h-10 rounded-xl gap-1.5 bg-[#0F172A] hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white text-[12.5px] font-semibold shadow-2xs px-5"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
