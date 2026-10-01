"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Layers,
  Lock,
  School,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { apiFetch, fetchAllStudents } from "@/lib/api";
import { useAcademicYears } from "@/modules/academics/hooks/use-academic-years";
import { PromotionRun, RunScope, WIZARD_STEPS, SCOPE_LABELS } from "../promotion-types";
import { ELIGIBILITY_TONES, EligibilityStatus, evaluateEligibility } from "../eligibility";

interface SelectedStudent {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  admissionNo: string;
  classId: string;
  status: string;
}

interface RunSaveBody {
  scope: RunScope;
  fromSession: string;
  toSession: string;
  effectiveDate: string;
  studentIds: string[];
}

type PlacementDecision = "promote" | "detail" | "tc-out" | "skip";

interface PlacementRow {
  decision: PlacementDecision;
  classId: string;
  roll: string;
  regNo: string;
}

const DECISIONS: { key: PlacementDecision; label: string }[] = [
  { key: "promote", label: "Promote" },
  { key: "detail", label: "Detail" },
  { key: "tc-out", label: "TC out" },
  { key: "skip", label: "Skip" },
];

const DECISION_TONES: Record<PlacementDecision, string> = {
  promote: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  detail: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "tc-out": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  skip: "bg-muted text-muted-foreground",
};

const defaultPlacement = (): PlacementRow => ({ decision: "promote", classId: "", roll: "", regNo: "" });

const SCOPE_CARDS: { key: RunScope; title: string; sub: string; icon: React.ReactNode }[] = [
  { key: "one-class", title: "One class", sub: "All sections of one class", icon: <User className="size-4" /> },
  { key: "multiple-classes", title: "Multiple classes", sub: "Selected classes", icon: <Layers className="size-4" /> },
  { key: "whole-school", title: "Whole school", sub: "Every active student", icon: <School className="size-4" /> },
  { key: "custom-list", title: "Custom list", sub: "Paste an explicit list of IDs", icon: <Users className="size-4" /> },
  { key: "single-student", title: "Single student", sub: "Promote one student at a time", icon: <User className="size-4" /> },
];

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const toSelected = (s: any): SelectedStudent => ({
  id: s.id,
  name: s.name,
  rollNumber: s.rollNumber ?? "",
  className: s.className ?? "",
  admissionNo: s.admissionNo ?? "",
  classId: s.classId ?? "",
  status: s.status ?? "active",
});

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium">{children}</label>;
}

/* ---- Step 1: Scope ---- */

function ScopeStep({
  body,
  setBody,
  currentYearName,
}: {
  body: RunSaveBody;
  setBody: (patch: Partial<RunSaveBody>) => void;
  currentYearName: string;
}) {
  const { academicYears } = useAcademicYears();
  const [effective, setEffective] = useState<Date | undefined>(
    body.effectiveDate ? new Date(body.effectiveDate) : undefined,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Sessions + scope</h2>
        <p className="text-sm text-muted-foreground">
          Choose the session the students move out of, the one they move into, and who is in scope.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel>From session</FieldLabel>
          <div className="relative">
            <Select value={body.fromSession} onValueChange={(v) => setBody({ fromSession: v })} disabled>
              <SelectTrigger className="w-full bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y: any) => (
                  <SelectItem key={y.name} value={y.name}>
                    {y.name}
                    {y.isCurrent ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Lock className="absolute right-9 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel>To session</FieldLabel>
          <Select
            value={body.toSession || "none"}
            onValueChange={(v) => setBody({ toSession: v === "none" ? "" : v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a session..." />
            </SelectTrigger>
            <SelectContent>
              {academicYears
                .filter((y: any) => y.name !== body.fromSession)
                .map((y: any) => (
                  <SelectItem key={y.name} value={y.name}>{y.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <FieldLabel>Effective date</FieldLabel>
        <DatePicker
          date={effective}
          onChange={(d) => {
            setEffective(d);
            setBody({ effectiveDate: d ? d.toISOString().slice(0, 10) : "" });
          }}
          placeholder="Select a date..."
        />
        <p className="text-xs text-muted-foreground">
          Old academic ends one day before this. New academic starts on this date.
        </p>
      </div>

      <div className="space-y-2">
        <FieldLabel>Scope</FieldLabel>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCOPE_CARDS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setBody({ scope: c.key })}
              className={`text-left rounded-xl border p-4 transition-colors hover:bg-muted/40 ${
                body.scope === c.key ? "border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/20" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{c.icon}</span>
                  <span className="text-sm font-medium">{c.title}</span>
                </div>
                {body.scope === c.key && <Check className="size-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
            </button>
          ))}
        </div>
        {currentYearName && body.fromSession !== currentYearName && (
          <p className="text-xs text-muted-foreground">
            Heads up: the source session is not the tenant's current one.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- Step 2: Selection ---- */

function StudentRow({
  student,
  onRemove,
}: {
  student: SelectedStudent;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="size-8">
        <AvatarFallback className="text-xs bg-muted">{initials(student.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{student.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[
            student.className && student.className.replace("-", " - "),
            student.rollNumber && `Roll ${student.rollNumber}`,
            student.admissionNo,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={onRemove} aria-label={`Remove ${student.name}`}>
        <X className="size-4" />
      </Button>
    </div>
  );
}

function SelectionStep({
  body,
  selected,
  setSelected,
}: {
  body: RunSaveBody;
  selected: SelectedStudent[];
  setSelected: React.Dispatch<React.SetStateAction<SelectedStudent[]>>;
}) {
  const [studentSearch, setStudentSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [customIds, setCustomIds] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(studentSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const { data: classes = [] } = useQuery<{ id: string; name: string; section: string; classLevel: string }[]>({
    queryKey: ["classes", "min", "promotion-wizard"],
    queryFn: async () => {
      const res = await apiFetch("/api/classes?mode=min");
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.items ?? [];
    },
    enabled: body.scope === "one-class" || body.scope === "multiple-classes",
  });

  const { data: roster = [], isFetching: rosterLoading } = useQuery<{ id: string; name: string; className: string }[]>({
    queryKey: ["students", "min", "promotion-wizard", body.scope, body.fromSession],
    queryFn: () => fetchAllStudents({ search: debounced || undefined, status: "active" }),
    enabled: body.scope === "whole-school" || body.scope === "custom-list" || (body.scope === "single-student" && debounced.length > 1),
    placeholderData: (prev) => prev,
  });

  // Opened from one class page, that class is the roster the run will move. The chip
  // lights up on its own, because a chip is on exactly when its students are listed.
  useEffect(() => {
    const classId = new URLSearchParams(window.location.search).get("classId");
    if (!classId || body.scope !== "one-class") return;
    fetchAllStudents({ classId, status: "active" })
      .then((items) => setSelected(items.map(toSelected)))
      .catch(() => toast.error("Failed to load that class' roster"));
  }, [body.scope]);

  // A chip is on exactly when its students are in the list, so a reopened draft
  // shows its classes picked without keeping a second copy of that state.
  const classPicked = (id: string) => selected.some((s) => s.classId === id);

  const toggleSingle = (id: string) => {
    if (classPicked(id)) {
      setSelected([]);
      return;
    }
    fetchAllStudents({ classId: id, status: "active" })
      .then((items) => setSelected(items.map(toSelected)))
      .catch(() => toast.error("Failed to load that class' roster"));
  };

  const toggleClass = (id: string) => {
    if (classPicked(id)) {
      setSelected((prev) => prev.filter((s) => s.classId !== id));
      return;
    }
    if (!classes.some((c) => c.id === id)) return;
    // Pull that class' roster into the selection.
    fetchAllStudents({ classId: id, status: "active" })
      .then((items) =>
        setSelected((prev) => {
          const seen = new Set(prev.map((s) => s.id));
          return [...prev, ...items.filter((i) => !seen.has(i.id)).map(toSelected)];
        })
      )
      .catch(() => toast.error("Failed to load that class' roster"));
  };

  const applyCustomList = () => {
    const wanted = new Set(
      customIds
        .split(/[\s,;]+/)
        .map((tok) => tok.trim().toUpperCase())
        .filter(Boolean),
    );
    if (wanted.size === 0) {
      toast.error("Paste at least one admission number or ID");
      return;
    }
    fetchAllStudents({ status: "active" })
      .then((items) => {
        const matched = items
          .filter(
            (s: any) =>
              wanted.has((s.admissionNo ?? "").toUpperCase()) ||
              wanted.has(s.id.toUpperCase()) ||
              wanted.has((s.rollNumber ?? "").toUpperCase()),
          )
          .map(toSelected);
        setSelected(Array.from(new Map(matched.map((s) => [s.id, s])).values()));
        if (matched.length < wanted.size) {
          toast.warning(`${wanted.size - matched.length} of ${wanted.size} ids matched no active student`);
        }
      })
      .catch(() => toast.error("Failed to look up those ids"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Pick students</h2>
        <p className="text-sm text-muted-foreground">
          {SCOPE_LABELS[body.scope]} — the roster you build here is what the run will promote.
        </p>
      </div>

      {body.scope === "single-student" && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-900/20 p-4 space-y-3">
          <p className="text-sm font-medium">Single-student promotion — find and pick exactly one student.</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Type a name or admission number..."
              className="pl-8 bg-background"
            />
          </div>
          {debounced.length > 1 && (
            <div className="max-h-56 overflow-y-auto rounded-lg border bg-background divide-y">
              {roster
                .filter((s) => !selected.some((s2) => s2.id === s.id))
                .slice(0, 20)
                .map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                    onClick={() => setSelected([toSelected(s)])}
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] bg-muted">{initials(s.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.className} · Roll {s.rollNumber}
                    </span>
                  </button>
                ))}
              {rosterLoading && <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>}
            </div>
          )}
        </div>
      )}

      {(body.scope === "one-class" || body.scope === "multiple-classes") && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Classes</h3>
            <p className="text-xs text-muted-foreground">
              {body.scope === "one-class"
                ? "Pick the class from the source session. Its active roster gets added."
                : "Pick one or more classes from the source session. Their active rosters get added."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const label = `${c.name} - ${c.section}`;
              const on = classPicked(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    body.scope === "one-class" ? toggleSingle(c.id) : toggleClass(c.id)
                  }
                  className={`text-sm rounded-full border px-3 py-1.5 transition-colors ${
                    on
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {classes.length === 0 && (
              <p className="text-sm text-muted-foreground">No classes found for this school.</p>
            )}
          </div>
        </div>
      )}

      {body.scope === "custom-list" && (
        <div className="space-y-2">
          <FieldLabel>Paste an explicit list of IDs</FieldLabel>
          <textarea
            value={customIds}
            onChange={(e) => setCustomIds(e.target.value)}
            rows={4}
            placeholder="One admission number, roll number or student ID per line or comma-separated"
            className="w-full rounded-md border bg-transparent p-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button variant="outline" size="sm" onClick={applyCustomList}>
            Match against active students
          </Button>
        </div>
      )}

      {body.scope === "whole-school" && (
        <div className="space-y-2">
          <FieldLabel>Every active student</FieldLabel>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Type a name or admission number..."
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={roster.length === 0}
            onClick={() =>
              setSelected(
                Array.from(
                  new Map(
                    [...selected, ...roster.map(toSelected)].map((s) => [s.id, s]),
                  ).values(),
                ),
              )
            }
          >
            {rosterLoading ? "Loading roster…" : `Add all ${roster.length} searched students`}
          </Button>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          SELECTED · {selected.length}
        </p>
        <div className="rounded-xl border divide-y">
          {selected.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-6 text-center">
              Nothing selected yet — pick a class, search a name, or paste a list.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto px-4">
              {selected.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  onRemove={() => setSelected(selected.filter((x) => x.id !== s.id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Step 3: Eligibility ---- */

function EligibilityStep({
  selected,
  ran,
  onRun,
  overrides,
  onToggleOverride,
}: {
  selected: SelectedStudent[];
  ran: boolean;
  onRun: () => void;
  overrides: Record<string, boolean>;
  onToggleOverride: (id: string) => void;
}) {
  const verdicts = useMemo(
    () => new Map(selected.map((s) => [s.id, evaluateEligibility(s)])),
    [selected],
  );

  const statusOf = (s: SelectedStudent): EligibilityStatus | "not-checked" => {
    if (!ran) return "not-checked";
    if (overrides[s.id]) return "eligible";
    return verdicts.get(s.id)?.status ?? "eligible";
  };

  const counts = selected.reduce(
    (acc, s) => {
      const st = statusOf(s);
      if (st === "not-checked") acc.pending += 1;
      else acc[st] += 1;
      return acc;
    },
    { eligible: 0, warning: 0, blocked: 0, pending: 0 },
  );

  const pill = (st: EligibilityStatus | "not-checked") =>
    st === "not-checked"
      ? "bg-muted text-muted-foreground"
      : ELIGIBILITY_TONES[st];
  const pillLabel = (st: EligibilityStatus | "not-checked") =>
    st === "not-checked" ? "Not checked" : st[0].toUpperCase() + st.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Review eligibility</h2>
        <p className="text-sm text-muted-foreground">
          Eligibility runs every applicable rule for {selected.length} students.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Eligible", value: counts.eligible, tone: "text-emerald-600" },
          { label: "Warning", value: counts.warning, tone: "text-amber-600" },
          { label: "Blocked", value: counts.blocked, tone: "text-red-600" },
          { label: "Not checked", value: counts.pending, tone: "text-muted-foreground" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.label}
              </p>
              <p className={`text-2xl font-semibold ${c.tone}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        onClick={onRun}
        disabled={selected.length === 0}
      >
        <ShieldCheck className="size-4" />
        {ran ? "Re-run eligibility check" : "Run eligibility check"}
      </Button>

      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2">Student</th>
              <th className="text-left font-medium px-4 py-2">From class</th>
              <th className="text-left font-medium px-4 py-2">Eligibility</th>
              <th className="text-left font-medium px-4 py-2">Failed rules</th>
              <th className="text-left font-medium px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {selected.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Select students in the previous step first.
                </td>
              </tr>
            ) : (
              selected.map((s) => {
                const st = statusOf(s);
                const v = verdicts.get(s.id);
                const overridden = Boolean(overrides[s.id]);
                const failedText = !ran
                  ? "Not checked yet"
                  : overridden
                    ? "Overridden by you"
                    : v && v.failedRules.length > 0
                      ? v.failedRules.join(", ")
                      : "All rules passed";
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.admissionNo ? `ADM ${s.admissionNo}` : "No admission no."}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {s.className ? s.className.replace("-", " - ") : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${pill(st)}`}>
                        {pillLabel(st)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{failedText}</td>
                    <td className="px-4 py-2">
                      {ran && (st === "warning" || st === "blocked") ? (
                        <Button variant="outline" size="sm" onClick={() => onToggleOverride(s.id)}>
                          {overridden ? "Revert override" : "Override"}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- Step 4: Placement ---- */

function PlacementStep({
  selected,
  placements,
  setPlacement,
  applyClassToAll,
}: {
  selected: SelectedStudent[];
  placements: Record<string, PlacementRow>;
  setPlacement: (id: string, patch: Partial<PlacementRow>) => void;
  applyClassToAll: (classId: string) => void;
}) {
  const { data: classes = [], isLoading } = useQuery<{ id: string; name: string; section: string }[]>({
    queryKey: ["classes", "min", "promotion-wizard"],
    queryFn: async () => {
      const res = await apiFetch("/api/classes?mode=min");
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.items ?? [];
    },
  });

  const labelFor = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? `${c.name} - ${c.section}` : "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Place students</h2>
        <p className="text-sm text-muted-foreground">
          Pick the target class and roll number for each promoted student. Detail / TC out / Skip rows don't need a target.
        </p>
      </div>

      {isLoading ? null : classes.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
          No classes loaded yet for the target session.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Apply class to all promotes:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 min-w-40 justify-between">
                Pick…
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {classes.map((c) => (
                <DropdownMenuItem key={c.id} onSelect={() => applyClassToAll(c.id)}>
                  {`${c.name} - ${c.section}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2">Student</th>
              <th className="text-left font-medium px-4 py-2">From</th>
              <th className="text-left font-medium px-4 py-2">Decision</th>
              <th className="text-left font-medium px-4 py-2">To class</th>
              <th className="text-left font-medium px-4 py-2">Roll</th>
              <th className="text-left font-medium px-4 py-2">Reg. no.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {selected.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Select students in the previous step first.
                </td>
              </tr>
            ) : (
              selected.map((s) => {
                const p = placements[s.id] ?? defaultPlacement();
                const isPromote = p.decision === "promote";
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.admissionNo ? `ADM ${s.admissionNo}` : "No admission no."}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {[s.className.replace("-", " - "), s.rollNumber].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${DECISION_TONES[p.decision]}`}
                          >
                            {DECISIONS.find((d) => d.key === p.decision)?.label}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {DECISIONS.map((d) => (
                            <DropdownMenuItem key={d.key} onSelect={() => setPlacement(s.id, { decision: d.key })}>
                              {d.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-4 py-2">
                      {isPromote ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 min-w-36 justify-between font-normal">
                              <span className={p.classId ? "" : "text-muted-foreground"}>
                                {p.classId ? labelFor(p.classId) : "Select target class"}
                              </span>
                              <ChevronDown className="size-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                            {classes.length === 0 ? (
                              <DropdownMenuItem disabled>No classes available</DropdownMenuItem>
                            ) : (
                              classes.map((c) => (
                                <DropdownMenuItem key={c.id} onSelect={() => setPlacement(s.id, { classId: c.id })}>
                                  {`${c.name} - ${c.section}`}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-muted-foreground">Not required</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={p.roll}
                        disabled={!isPromote}
                        onChange={(e) => setPlacement(s.id, { roll: e.target.value })}
                        placeholder="Roll"
                        className="h-8 w-20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={p.regNo}
                        disabled={!isPromote}
                        onChange={(e) => setPlacement(s.id, { regNo: e.target.value })}
                        placeholder="Reg. no."
                        className="h-8 w-24"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- Wizard shell ---- */
interface PromotionWizardProps {
  run: PromotionRun | null;
  onExit: () => void;
}

export function PromotionWizard({ run, onExit }: PromotionWizardProps) {
  const queryClient = useQueryClient();
  const { academicYears } = useAcademicYears();
  const currentYearName: string =
    academicYears.find((y: any) => y.isCurrent)?.name ?? academicYears[0]?.name ?? "";

  const [step, setStep] = useState(1);
  const [body, setBodyState] = useState<RunSaveBody>(() =>
    run
      ? {
          scope: run.scope,
          fromSession: run.fromSession,
          toSession: run.toSession ?? "",
          effectiveDate: run.effectiveDate ?? "",
          studentIds: [],
        }
      : { scope: "multiple-classes", fromSession: "", toSession: "", effectiveDate: "", studentIds: [] },
  );
  const [selected, setSelected] = useState<SelectedStudent[]>([]);

  // A class page's Promote button names the class it was standing on, so the run
  // opens scoped to that class instead of to the whole school.
  useEffect(() => {
    if (run) return;
    const classId = new URLSearchParams(window.location.search).get("classId");
    if (classId) setBodyState((b) => (b.scope === "one-class" ? b : { ...b, scope: "one-class" }));
  }, [run]);
  const [runId, setRunId] = useState<string | null>(run?.id ?? null);
  const [savedAt, setSavedAt] = useState<string | null>(
    run ? new Date(run.updatedAt).toLocaleTimeString("en-US") : null,
  );
  const [saving, setSaving] = useState(false);

  // Eligibility and placement live here, not in the step, so moving back and forth
  // along the rail keeps what the user ran and set. They are wizard state, not saved.
  const [eligRan, setEligRan] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [placements, setPlacements] = useState<Record<string, PlacementRow>>({});

  const toggleOverride = (id: string) =>
    setOverrides((prev) => ({ ...prev, [id]: !prev[id] }));

  const setPlacement = (id: string, patch: Partial<PlacementRow>) =>
    setPlacements((prev) => ({
      ...prev,
      [id]: { ...defaultPlacement(), ...prev[id], ...patch },
    }));

  const applyClassToAll = (classId: string) =>
    setPlacements((prev) => {
      const next = { ...prev };
      selected.forEach((s) => {
        const row = next[s.id] ?? defaultPlacement();
        if (row.decision === "promote") next[s.id] = { ...row, classId };
      });
      return next;
    });

  // The source session is the tenant's current one unless a draft names another,
  // so it is derived rather than copied into state while the sessions query lands.
  const form: RunSaveBody =
    body.fromSession || run || !currentYearName
      ? body
      : { ...body, fromSession: currentYearName };

  // Continue-a-draft: load the saved list so the SELECTED region reflects the row.
  useEffect(() => {
    if (!run || run.studentIds.length === 0) return;
    let active = true;
    fetchAllStudents({ status: "active" })
      .then((items) => {
        if (!active) return;
        setSelected(items.filter((s: any) => run.studentIds.includes(s.id)).map(toSelected));
      })
      .catch(() => toast.error("Failed to load the draft's saved students"));
    return () => {
      active = false;
    };
  }, [run]);

  const setBody = useCallback((patch: Partial<RunSaveBody>) => {
    setBodyState((b) => ({ ...b, ...patch }));
  }, []);

  const saveDraft = async () => {
    if (!form.fromSession.trim()) {
      toast.error("Pick the source session first");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        studentIds: selected.map((s) => s.id),
      };
      const res = await apiFetch("/api/promotions/runs", {
        method: runId ? "PUT" : "POST",
        body: JSON.stringify(runId ? { id: runId, ...payload } : payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save draft");
      const json = await res.json();
      if (!runId) setRunId(json.id);
      setSavedAt(new Date(json.updatedAt ?? Date.now()).toLocaleTimeString("en-US"));
      queryClient.invalidateQueries({ queryKey: ["promotion-runs"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const canAdvance =
    step === 1
      ? Boolean(form.scope && form.fromSession.trim())
      : step === 2
        ? selected.length > 0
        : true;

  const active = WIZARD_STEPS[step - 1];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onExit}
          className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to promotion hub
        </button>
        <h1 className="text-xl font-semibold tracking-tight">New promotion</h1>
        <p className="text-sm text-muted-foreground">
          Pick scope, select students, review eligibility, place them in target classes, and execute.
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Step rail */}
        <aside className="space-y-1 lg:border-r lg:pr-4">
          <ol className="space-y-1">
            {WIZARD_STEPS.map((s) => {
              const done = s.n < step;
              const live = s.n <= 4;
              return (
                <li key={s.n}>
                  <button
                    type="button"
                    disabled={!live}
                    onClick={() => live && setStep(s.n)}
                    className={`w-full text-left rounded-lg px-3 py-2 flex items-start gap-3 transition-colors ${
                      s.n === step
                        ? "bg-emerald-50 dark:bg-emerald-900/25"
                        : "hover:bg-muted/50"
                    } ${!live ? "opacity-60" : ""} ${s.n === step ? "" : ""}`}
                  >
                    <span
                      className={`size-6 rounded-full text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                        done
                          ? "bg-emerald-600 text-white"
                          : s.n === step
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="size-3.5" /> : s.n}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-medium ${s.n === step ? "text-emerald-700 dark:text-emerald-300" : ""}`}>
                        {s.title}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">{s.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {savedAt && <p className="pt-2 pl-3 text-xs text-muted-foreground">Saved at {savedAt}</p>}
        </aside>

      {/* Step body */}
      <div className="space-y-6 min-w-0">
        {step === 1 && <ScopeStep body={form} setBody={setBody} currentYearName={currentYearName} />}
        {step === 2 && <SelectionStep body={form} selected={selected} setSelected={setSelected} />}
        {step === 3 && (
          <EligibilityStep
            selected={selected}
            ran={eligRan}
            onRun={() => setEligRan(true)}
            overrides={overrides}
            onToggleOverride={toggleOverride}
          />
        )}
        {step === 4 && (
          <PlacementStep
            selected={selected}
            placements={placements}
            setPlacement={setPlacement}
            applyClassToAll={applyClassToAll}
          />
        )}
        {step > 4 && (
          <Card>
            <CardContent className="p-8 text-center space-y-1">
              <h2 className="text-base font-semibold">
                {active.n}. {active.title} — {active.sub}
              </h2>
              <p className="text-sm text-muted-foreground">
                This step's design is the next slice. Save the draft and it will be here when you return.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save as draft"}
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 7 && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                disabled={!canAdvance}
                onClick={() => setStep(step + 1)}
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
