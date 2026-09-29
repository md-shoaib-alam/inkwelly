/**
 * The Students > Operations > Class Change screen moves a student by writing the
 * same `PUT /students` the roster edit uses, so this file holds only the rules for
 * turning a selection plus a dialog form into those requests. Keeping them out of
 * the component is what makes them testable without a browser.
 */

export type ChangeClassTarget = {
  id: string;
  name: string;
  classId?: string;
  className: string;
  rollNumber: string;
};

export type ChangeClassForm = {
  targetClassId: string;
  newRollNumber: string;
  effectiveDate: string;
  reason: string;
  remarks: string;
};

export type ChangeClassRequest = {
  id: string;
  classId: string;
  rollNumber?: string;
  effectiveDate: string;
  reason: string;
  remarks: string;
};

export const CLASS_CHANGE_REASONS = [
  "Family relocation",
  "Academic performance",
  "Class size balancing",
  "Section change",
  "Peer or social reasons",
  "Health or medical",
  "Administrative correction",
  "Other",
] as const;

export const REASON_OTHER = "Other";

export function validateChangeClassForm(
  targets: ChangeClassTarget[],
  form: ChangeClassForm,
): string | null {
  if (targets.length === 0) return "Select at least one student to change their class.";
  if (!form.targetClassId) return "Choose the class to move to.";

  const alreadyThere = targets.filter((t) => t.classId === form.targetClassId).length;
  if (alreadyThere > 0) {
    return `${alreadyThere} selected student${alreadyThere === 1 ? " is" : "s are"} already in that class — pick a different one.`;
  }

  if (!form.effectiveDate) return "Pick the date the change takes effect.";
  if (!form.reason) return "Give a reason for the change.";
  if (form.reason === REASON_OTHER && !form.remarks.trim()) {
    return "Describe the reason in the remarks when you choose Other.";
  }
  if (targets.length > 1 && form.newRollNumber.trim()) {
    return "A new roll number can only be set for one student at a time.";
  }
  return null;
}

export function buildChangeClassRequests(
  targets: ChangeClassTarget[],
  form: ChangeClassForm,
): ChangeClassRequest[] {
  const rollNumber = targets.length === 1 ? form.newRollNumber.trim() : "";
  return targets.map((target) => ({
    id: target.id,
    classId: form.targetClassId,
    ...(rollNumber ? { rollNumber } : {}),
    effectiveDate: form.effectiveDate,
    reason: form.reason,
    remarks: form.remarks.trim(),
  }));
}
