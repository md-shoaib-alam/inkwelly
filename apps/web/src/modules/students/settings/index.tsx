"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  Info,
  ListChecks,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import {
  FORMAT_PARTS,
  FORMAT_SEPARATORS,
  parseStudentsSettings,
  previewId,
  shortSchoolYear,
  type IdRuleSettings,
  type StudentsSettings,
} from "./settings-format";

const CARD =
  "rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden";
const CARD_HEAD =
  "flex items-center gap-3 px-5 py-3.5 bg-slate-50/80 dark:bg-zinc-900/60 border-b border-slate-200/70 dark:border-zinc-800";
const LABEL =
  "block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400";
const HELPER = "mt-1.5 text-[12px] text-slate-500 dark:text-zinc-400";
const FIELD =
  "h-10 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm placeholder:text-slate-400";

function TintedIcon({ icon: Icon, tint }: { icon: typeof Hash; tint: string }) {
  return (
    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
      <Icon className="size-4" />
    </div>
  );
}

function Field({
  label,
  required,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-2">{children}</div>
      {helper && <p className={HELPER}>{helper}</p>}
    </div>
  );
}

/**
 * One auto-generation rule. The same component serves Student ID and Admission Number
 * because the reference gives them identical bodies — only the icon, title and default
 * prefix differ — and a rule the admin reads one way must behave the same way in both.
 */
function RuleCard({
  icon,
  iconTint,
  title,
  description,
  rule,
  schoolCode,
  academicYear,
  onChange,
}: {
  icon: typeof Hash;
  iconTint: string;
  title: string;
  description: string;
  rule: IdRuleSettings;
  schoolCode?: string;
  academicYear?: string;
  onChange: (patch: Partial<IdRuleSettings>) => void;
}) {
  const [open, setOpen] = useState(true);
  const live = rule.enabled;

  // Breakdown of tokens in format:
  const breakdownSegments = useMemo(() => {
    const rawFormat = rule.format || "{PREFIX}{YEAR}{SEQ}";
    const tokens = [
      {
        token: "{PREFIX}",
        label: "Prefix",
        value: rule.prefix || (title.includes("Student") ? "STU" : "ADM"),
        bg: "bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      },
      {
        token: "{SCHOOL_CODE}",
        label: "School Code",
        value: schoolCode || "DPS",
        bg: "bg-indigo-100/70 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
      },
      {
        token: "{YEAR}",
        label: "Year",
        value: String(new Date().getFullYear()),
        bg: "bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      },
      {
        token: "{SCHOOL_YEAR}",
        label: "School Year",
        value: shortSchoolYear(academicYear) || `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)}`,
        bg: "bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      },
      {
        token: "{SEQ}",
        label: "Number",
        value: (rule.startFrom ? rule.startFrom.replace(/\D/g, "") : "1").padStart(
          Math.min(10, Math.max(1, Number(rule.numberLength.replace(/\D/g, "")) || 4)),
          "0"
        ),
        bg: "bg-teal-100/70 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
      },
    ];

    // Split format into parts
    const regex = /(\{PREFIX\}|\{SCHOOL_CODE\}|\{YEAR\}|\{SCHOOL_YEAR\}|\{SEQ\}|[-/])/g;
    const parts: { label?: string; value: string; bg?: string; isToken: boolean }[] = [];
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(rawFormat)) !== null) {
      if (match.index > lastIndex) {
        const text = rawFormat.slice(lastIndex, match.index);
        if (text) parts.push({ value: text, isToken: false });
      }
      const tokenStr = match[0];
      const found = tokens.find((t) => t.token === tokenStr);
      if (found) {
        parts.push({ label: found.label, value: found.value, bg: found.bg, isToken: true });
      } else {
        parts.push({ value: tokenStr, isToken: false });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < rawFormat.length) {
      parts.push({ value: rawFormat.slice(lastIndex), isToken: false });
    }
    return parts;
  }, [rule.format, rule.prefix, rule.startFrom, rule.numberLength, schoolCode, academicYear, title]);

  return (
    <section className={CARD}>
      <div className={CARD_HEAD}>
        <TintedIcon icon={icon} tint={iconTint} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] sm:text-[15px] font-semibold text-slate-800 dark:text-zinc-100">
            {title}
          </div>
          <div className="text-[12px] text-slate-500 dark:text-zinc-400">{description}</div>
        </div>
        <Switch
          checked={rule.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
          aria-label={`${title} enabled`}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="-mr-1 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
        >
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {open && (
        <div className={`px-5 py-4 space-y-4 transition-opacity ${live ? "" : "opacity-60"}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prefix">
              <Input
                value={rule.prefix}
                disabled={!live}
                onChange={(e) => onChange({ prefix: e.target.value })}
                placeholder="STU"
                className={FIELD}
              />
            </Field>
            <Field label="Number length" helper="Number of digits for sequence (e.g., 4 = 0001)">
              <Input
                value={rule.numberLength}
                disabled={!live}
                inputMode="numeric"
                onChange={(e) => onChange({ numberLength: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                placeholder="4"
                className={FIELD}
              />
            </Field>
          </div>

          <Field label="Format">
            <Input
              value={rule.format}
              disabled={!live}
              onChange={(e) => onChange({ format: e.target.value })}
              placeholder="{PREFIX}{YEAR}{SEQ}"
              className={FIELD}
            />
            <div className="mt-3">
              <div className="text-[12px] text-slate-500 dark:text-zinc-400">Tap a part to add it</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FORMAT_PARTS.map((part) => (
                  <button
                    key={part.token}
                    type="button"
                    disabled={!live}
                    onClick={() => onChange({ format: `${rule.format}${part.token}` })}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium disabled:opacity-50 ${part.tint}`}
                  >
                    + {part.label}
                  </button>
                ))}
                {FORMAT_SEPARATORS.map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    disabled={!live}
                    onClick={() => onChange({ format: `${rule.format}${sep}` })}
                    className="inline-flex items-center rounded-full border border-slate-200/70 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400 disabled:opacity-50"
                  >
                    {sep}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 px-3.5 py-3 flex items-center gap-3">
                <div className="flex-1 text-[13px] font-medium text-slate-600 dark:text-zinc-300">
                  Reset numbering every year
                </div>
                <Switch
                  checked={rule.resetEveryYear}
                  disabled={!live}
                  onCheckedChange={(checked) => onChange({ resetEveryYear: checked })}
                  aria-label="Reset numbering every year"
                />
              </div>
              <p className={HELPER}>
                When on, the sequence restarts at 1 each new year. Turn off to keep numbering
                continuously across years.
              </p>
            </div>
            <Field
              label="Start next number from"
              helper="Optional — leave blank to continue the current sequence. Set this to continue an existing series, e.g. when switching from another system."
            >
              <Input
                value={rule.startFrom}
                disabled={!live}
                inputMode="numeric"
                onChange={(e) => onChange({ startFrom: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                placeholder="e.g. 450"
                className={FIELD}
              />
            </Field>
          </div>

          {/* WHAT EACH ID IS MADE OF */}
          <div className="rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/80 p-4 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              WHAT EACH ID IS MADE OF
            </div>
            <div className="flex flex-wrap items-end gap-2.5">
              {breakdownSegments.map((seg, idx) =>
                seg.isToken ? (
                  <div key={idx} className="flex flex-col items-center">
                    <span
                      className={`inline-flex items-center justify-center font-mono font-semibold px-3 py-1.5 rounded-lg text-sm ${seg.bg}`}
                    >
                      {seg.value}
                    </span>
                    <span className="mt-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                      {seg.label}
                    </span>
                  </div>
                ) : (
                  <div key={idx} className="flex flex-col items-center pb-5">
                    <span className="font-mono text-sm font-semibold text-slate-500 dark:text-zinc-400 px-0.5">
                      {seg.value}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PreviewPanel({
  icon,
  label,
  value,
  loading,
}: {
  icon: typeof Hash;
  label: string;
  value: string | null;
  loading: boolean;
}) {
  const Icon = icon;
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        <Icon className="size-3.5" />
        {label}
      </div>
      {loading ? (
        <div className="mt-2 h-[22px] w-32 rounded-md bg-slate-200/70 dark:bg-zinc-800 animate-pulse" />
      ) : value ? (
        <div className="mt-2 text-[15px] font-semibold tracking-tight text-slate-800 dark:text-zinc-100 font-mono">
          {value}
        </div>
      ) : (
        <div className="mt-2 text-[13px] text-slate-500 dark:text-zinc-400">
          Auto-generation is off — entered manually during admission.
        </div>
      )}
    </div>
  );
}

function AdminStudentsSettingsContent() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { year } = useActiveAcademicYear();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Record<string, unknown>>({
    queryKey: ["student-settings", currentTenantId],
    queryFn: async () => {
      const res = await apiFetch("/api/student-settings");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    enabled: Boolean(currentTenantId),
  });

  const saved = useMemo(() => parseStudentsSettings(data), [data]);

  // A draft that is null until the admin actually edits something, so the form follows
  // the query without an effect copying one into the other.
  const [draft, setDraft] = useState<StudentsSettings | null>(null);
  const settings = draft ?? saved;

  const patch = (next: Partial<StudentsSettings>) =>
    setDraft((prev) => ({ ...(prev ?? saved), ...next }));
  const patchRule = (key: "studentId" | "admissionNo") => (next: Partial<IdRuleSettings>) =>
    setDraft((prev) => {
      const base = prev ?? saved;
      return { ...base, [key]: { ...base[key], ...next } };
    });

  const preview = useMemo(
    () => ({
      studentId: previewId(settings.studentId, {
        schoolCode: settings.schoolCode,
        calendarYear: String(new Date().getFullYear()),
        schoolYear: shortSchoolYear(year?.name),
      }),
      admissionNo: previewId(settings.admissionNo, {
        schoolCode: settings.schoolCode,
        calendarYear: String(new Date().getFullYear()),
        schoolYear: shortSchoolYear(year?.name),
      }),
    }),
    [settings, year?.name],
  );

  const handleSave = async () => {
    if (!currentTenantId) return;
    if (!settings.schoolCode.trim()) {
      toast.error("School code is required — it is part of the IDs you generate.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/student-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save settings");
      }
      toast.success("Student settings saved.");
      // The draft is cleared rather than kept, so the card re-reads the row it just
      // wrote and the preview proves the save landed.
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["student-settings", currentTenantId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500 dark:text-zinc-400">
          Configure how admissions, student IDs, and defaults work in this school.
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200">
          Could not load your saved settings, so the defaults are shown. Saving now would
          overwrite what is stored — reload the page before trying again.
        </div>
      )}

      <section className={CARD}>
        <div className={CARD_HEAD}>
          <TintedIcon
            icon={Sparkles}
            tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] sm:text-[15px] font-semibold text-slate-800 dark:text-zinc-100">
              Next to be allocated
            </div>
            <div className="text-[12px] text-slate-500 dark:text-zinc-400">
              The exact IDs the next admitted student will receive, based on your saved settings.
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewPanel
              icon={Hash}
              label="Next student ID"
              value={preview.studentId}
              loading={isLoading}
            />
            <PreviewPanel
              icon={FileText}
              label="Next admission number"
              value={preview.admissionNo}
              loading={isLoading}
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-zinc-400">
            <Info className="size-3.5 shrink-0" />
            Reflects saved settings — save your changes to update this.
          </div>
        </div>
      </section>

      <section className={CARD}>
        <div className={CARD_HEAD}>
          <TintedIcon
            icon={Building2}
            tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] sm:text-[15px] font-semibold text-slate-800 dark:text-zinc-100">
              School Code
            </div>
            <div className="text-[12px] text-slate-500 dark:text-zinc-400">
              A short code that identifies your school (e.g., DPS, KV01)
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <Field label="School code" required helper="Used as the School code part of your IDs">
            <Input
              value={settings.schoolCode}
              onChange={(e) => patch({ schoolCode: e.target.value.toUpperCase().slice(0, 12) })}
              placeholder="DEL"
              className={`${FIELD} max-w-md`}
            />
          </Field>
        </div>
      </section>

      <RuleCard
        icon={Hash}
        iconTint="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400"
        title="Student ID Auto-Generation"
        description="Automatically generate unique student IDs during admission"
        rule={settings.studentId}
        schoolCode={settings.schoolCode}
        academicYear={year?.name}
        onChange={patchRule("studentId")}
      />

      <RuleCard
        icon={FileText}
        iconTint="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400"
        title="Admission Number Auto-Generation"
        description="Automatically generate unique admission numbers during admission"
        rule={settings.admissionNo}
        schoolCode={settings.schoolCode}
        academicYear={year?.name}
        onChange={patchRule("admissionNo")}
      />

      <section className={CARD}>
        <div className={CARD_HEAD}>
          <TintedIcon
            icon={ListChecks}
            tint="bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] sm:text-[15px] font-semibold text-slate-800 dark:text-zinc-100">
              Roll Number Auto-Assignment
            </div>
            <div className="text-[12px] text-slate-500 dark:text-zinc-400">
              Automatically assign roll numbers during admission
            </div>
          </div>
          <Switch
            checked={settings.rollNumber.enabled}
            onCheckedChange={(checked) =>
              patch({ rollNumber: { ...settings.rollNumber, enabled: checked } })
            }
            aria-label="Roll Number Auto-Assignment enabled"
          />
          <div className="w-6" />
        </div>
        <div
          className={`p-4 sm:p-5 transition-opacity ${settings.rollNumber.enabled ? "" : "opacity-60"}`}
        >
          <Field label="Starting number" helper="The first roll number to assign (usually 1)">
            <Input
              value={settings.rollNumber.startingNumber}
              disabled={!settings.rollNumber.enabled}
              inputMode="numeric"
              onChange={(e) =>
                patch({
                  rollNumber: {
                    ...settings.rollNumber,
                    startingNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                  },
                })
              }
              placeholder="1"
              className={`${FIELD} max-w-md`}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="min-w-[150px] bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white rounded-xl h-10"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="size-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function AdminStudentsSettings() {
  return <AdminStudentsSettingsContent />;
}

export default AdminStudentsSettings;
