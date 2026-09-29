/**
 * A class change is a move a school will want to reconstruct later — "when did
 * this child leave Grade 5, and why". `PUT /students` already records the old and
 * new classId in its audit row, so the effective date, reason and remarks are
 * folded into that same row instead of needing a table of their own.
 */

export const REASON_MAX_LENGTH = 120;
export const REMARKS_MAX_LENGTH = 500;

export type StudentUpdateAuditErrorCode =
  | "INVALID_EFFECTIVE_DATE"
  | "REASON_TOO_LONG"
  | "REMARKS_TOO_LONG";

export class StudentUpdateAuditError extends Error {
  constructor(
    public readonly code: StudentUpdateAuditErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StudentUpdateAuditError";
  }
}

export type StudentUpdateAuditDetails = {
  effectiveDate?: string;
  reason?: string;
  remarks?: string;
};

const asTrimmed = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const isCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // A regex alone accepts 2026-13-45, so compare the parsed parts against the
  // text: Date silently rolls an impossible day over, and a rolled date in the
  // audit trail would be worse than no date at all.
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};

export function studentUpdateAuditDetails(
  // The whole update body is passed; only these three keys belong in the audit trail.
  input: { [key: string]: unknown } | undefined,
): StudentUpdateAuditDetails {
  const details: StudentUpdateAuditDetails = {};
  if (!input) return details;

  const effectiveDate = asTrimmed(input.effectiveDate);
  if (effectiveDate !== undefined) {
    if (!isCalendarDate(effectiveDate)) {
      throw new StudentUpdateAuditError(
        "INVALID_EFFECTIVE_DATE",
        "Effective date must be a real date in YYYY-MM-DD form",
      );
    }
    details.effectiveDate = effectiveDate;
  }

  const reason = asTrimmed(input.reason);
  if (reason !== undefined) {
    if (reason.length > REASON_MAX_LENGTH) {
      throw new StudentUpdateAuditError(
        "REASON_TOO_LONG",
        `Reason must be ${REASON_MAX_LENGTH} characters or fewer`,
      );
    }
    details.reason = reason;
  }

  const remarks = asTrimmed(input.remarks);
  if (remarks !== undefined) {
    if (remarks.length > REMARKS_MAX_LENGTH) {
      throw new StudentUpdateAuditError(
        "REMARKS_TOO_LONG",
        `Remarks must be ${REMARKS_MAX_LENGTH} characters or fewer`,
      );
    }
    details.remarks = remarks;
  }

  return details;
}
