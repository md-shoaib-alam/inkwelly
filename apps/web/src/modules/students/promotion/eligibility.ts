/**
 * Promotion eligibility, evaluated in the browser over the roster the user already
 * selected — no server round trip, because the checks are the same four profile
 * completeness facts the wizard is holding in memory.
 *
 * A rule set lives here, not in the step component, so the verdict a user sees and
 * the verdict a test asserts are the same function.
 */

export type EligibilityStatus = "eligible" | "warning" | "blocked";

export interface EligibilityInput {
  classId: string;
  className: string;
  admissionNo: string;
  rollNumber: string;
  status: string;
}

export interface EligibilityVerdict {
  status: EligibilityStatus;
  failedRules: string[];
}

/** Blocked outranks warning; a student who fails both is not promotable at all. */
export function evaluateEligibility(s: EligibilityInput): EligibilityVerdict {
  const blocked: string[] = [];
  const warning: string[] = [];

  if (!s.classId && !s.className) blocked.push("No class assigned");
  if (s.status && s.status !== "active") blocked.push(`Not active (${s.status})`);
  if (!s.admissionNo) warning.push("Missing admission number");
  if (!s.rollNumber) warning.push("Missing roll number");

  if (blocked.length > 0) return { status: "blocked", failedRules: blocked };
  if (warning.length > 0) return { status: "warning", failedRules: warning };
  return { status: "eligible", failedRules: [] };
}

export const ELIGIBILITY_TONES: Record<EligibilityStatus, string> = {
  eligible: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
