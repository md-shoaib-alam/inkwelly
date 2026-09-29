/**
 * The ID-generation preferences the Students settings screen edits, and the one
 * function that renders them.
 *
 * The preview card and its test both call `previewId`, so the string an admin sees
 * before saving is produced by the same code that will produce it after. Keeping the
 * rules here rather than in the component is also what lets the screen hold the whole
 * form in one object and PUT it in one go.
 */

export interface IdRuleSettings {
  enabled: boolean;
  prefix: string;
  numberLength: string;
  format: string;
  resetEveryYear: boolean;
  /** Blank means "continue the current series"; the preview cannot know the series, so it starts at 1. */
  startFrom: string;
}

export interface StudentsSettings {
  schoolCode: string;
  studentId: IdRuleSettings;
  admissionNo: IdRuleSettings;
  rollNumber: { enabled: boolean; startingNumber: string };
}

export const DEFAULT_ID_RULE: IdRuleSettings = {
  enabled: false,
  prefix: "",
  numberLength: "4",
  format: "{PREFIX}{YEAR}{SEQ}",
  resetEveryYear: true,
  startFrom: "",
};

export const DEFAULT_SETTINGS: StudentsSettings = {
  schoolCode: "",
  studentId: { ...DEFAULT_ID_RULE, prefix: "STU" },
  admissionNo: { ...DEFAULT_ID_RULE, prefix: "ADM" },
  rollNumber: { enabled: false, startingNumber: "1" },
};

/** A tap appends the token to the format string, so the order here is the reference's chip order. */
export const FORMAT_PARTS: { token: string; label: string; tint: string }[] = [
  { token: "{PREFIX}", label: "Prefix", tint: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800" },
  { token: "{SCHOOL_CODE}", label: "School code", tint: "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-900/25 dark:text-indigo-300 dark:border-indigo-800" },
  { token: "{YEAR}", label: "Year", tint: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800" },
  { token: "{SCHOOL_YEAR}", label: "School year", tint: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800" },
  { token: "{SEQ}", label: "Number", tint: "bg-green-50 text-green-700 border-green-200/70 dark:bg-green-900/25 dark:text-green-300 dark:border-green-800" },
];

export const FORMAT_SEPARATORS = ["-", "/"];

const MAX_LENGTH = 10;

function sequenceOf(rule: IdRuleSettings): string {
  const digits = rule.startFrom.replace(/\D/g, "");
  const width = Math.min(MAX_LENGTH, Math.max(1, Number(rule.numberLength.replace(/\D/g, "")) || 1));
  // A start past the configured width still has to render in full — truncating it
  // would preview an ID that collides with an earlier one in the same series.
  return digits ? digits.padStart(width, "0") : "1".padStart(width, "0");
}

export interface PreviewContext {
  schoolCode: string;
  calendarYear: string;
  schoolYear: string;
}

/** The ID the next admission would receive, or null when auto-generation is off. */
export function previewId(rule: IdRuleSettings, ctx: PreviewContext): string | null {
  if (!rule.enabled) return null;
  // `resetEveryYear` changes which series the server draws the next number from, not
  // what the pattern looks like, so it deliberately plays no part here.
  return rule.format
    .split("{PREFIX}")
    .join(rule.prefix)
    .split("{SCHOOL_CODE}")
    .join(ctx.schoolCode)
    .split("{YEAR}")
    .join(ctx.calendarYear)
    .split("{SCHOOL_YEAR}")
    .join(ctx.schoolYear)
    .split("{SEQ}")
    .join(sequenceOf(rule));
}

/** Read one stored rule back, keeping the default for any part an older tenant never saved. */
function mergeRule(stored: unknown, fallback: IdRuleSettings): IdRuleSettings {
  const s = (stored ?? {}) as Partial<IdRuleSettings>;
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : fallback.enabled,
    prefix: typeof s.prefix === "string" ? s.prefix : fallback.prefix,
    numberLength: typeof s.numberLength === "string" ? s.numberLength : fallback.numberLength,
    format: typeof s.format === "string" && s.format ? s.format : fallback.format,
    resetEveryYear: typeof s.resetEveryYear === "boolean" ? s.resetEveryYear : fallback.resetEveryYear,
    startFrom: typeof s.startFrom === "string" ? s.startFrom : fallback.startFrom,
  };
}

/**
 * A tenant that never saved has no row, and a tenant whose row predates a added rule
 * has holes in it, so this accepts a partial or absent payload rather than assuming.
 */
export function parseStudentsSettings(raw: unknown): StudentsSettings {
  const s = (raw ?? {}) as Partial<StudentsSettings> & Record<string, unknown>;
  const roll = (s.rollNumber ?? {}) as Partial<StudentsSettings["rollNumber"]>;
  return {
    schoolCode: typeof s.schoolCode === "string" ? s.schoolCode : DEFAULT_SETTINGS.schoolCode,
    studentId: mergeRule(s.studentId, DEFAULT_SETTINGS.studentId),
    admissionNo: mergeRule(s.admissionNo, DEFAULT_SETTINGS.admissionNo),
    rollNumber: {
      enabled: typeof roll.enabled === "boolean" ? roll.enabled : DEFAULT_SETTINGS.rollNumber.enabled,
      startingNumber:
        typeof roll.startingNumber === "string" ? roll.startingNumber : DEFAULT_SETTINGS.rollNumber.startingNumber,
    },
  };
}

/** `2026-2027` reads as `2026-27` in an ID; a year already short is left alone. */
export function shortSchoolYear(name: string | null | undefined): string {
  const m = /^(\d{4})-(\d{4})$/.exec(name ?? "");
  if (!m) return name ?? "";
  return `${m[1]}-${m[2].slice(2)}`;
}
