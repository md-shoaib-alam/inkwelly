export type RunStatus = "draft" | "pending" | "executing" | "completed" | "reversed";

export type RunScope =
  | "one-class"
  | "multiple-classes"
  | "whole-school"
  | "custom-list"
  | "single-student";

export interface PromotionRun {
  id: string;
  status: RunStatus;
  fromSession: string;
  toSession: string | null;
  effectiveDate: string | null;
  scope: RunScope;
  studentIds: string[];
  studentCount: number;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunsResponse {
  items: PromotionRun[];
  counts: Record<RunStatus, number>;
}

export const RUN_STATUSES: RunStatus[] = ["draft", "pending", "executing", "completed", "reversed"];

export const STATUS_LABELS: Record<RunStatus, string> = {
  draft: "Drafts",
  pending: "Pending",
  executing: "Executing",
  completed: "Completed",
  reversed: "Reversed",
};

export const STATUS_TONES: Record<RunStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  executing: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  reversed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export const SCOPE_LABELS: Record<RunScope, string> = {
  "one-class": "One class",
  "multiple-classes": "Multiple classes",
  "whole-school": "Whole school",
  "custom-list": "Custom list",
  "single-student": "Single student",
};

// The rail. Steps 3-7 carry their reference sub-labels; their screens land in the
// next slice, so the wizard renders a plain placeholder for them until then.
export const WIZARD_STEPS = [
  { n: 1, key: "scope", title: "Scope", sub: "Sessions + scope" },
  { n: 2, key: "selection", title: "Selection", sub: "Pick students" },
  { n: 3, key: "eligibility", title: "Eligibility", sub: "Rule check + override" },
  { n: 4, key: "placement", title: "Placement", sub: "Target class + roll" },
  { n: 5, key: "carry-forward", title: "Carry-forward", sub: "Transport · fees · scholarship" },
  { n: 6, key: "review", title: "Review", sub: "What will change" },
  { n: 7, key: "execute", title: "Execute", sub: "Submit and commit" },
] as const;
