/**
 * The statuses a student register writes, named once.
 *
 * `Attendance.status` is a plain text column with no check constraint, so the only thing
 * between this table and rows no report can count is the set the write path accepts. Every
 * reader normalises against the same set because the values have never been uniform: the
 * marking screen writes `halfDay`, the bulk import has been seen writing `Half Day`, and the
 * eligibility report matches on `includes('half')`. One matcher ends the argument.
 */
export const ATTENDANCE_STATUSES = ['present', 'late', 'halfDay', 'leave', 'absent'] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/**
 * The canonical status a stored value means, or null when it means none of the five. Spacing,
 * case and separators are ignored, and a value containing "half" is a half day even if it
 * spells it unusually, because that is what the shipped reports already treat it as.
 */
export function normalizeAttendanceStatus(raw: string | null | undefined): AttendanceStatus | null {
  const key = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  switch (key) {
    case 'present':
      return 'present';
    case 'late':
      return 'late';
    case 'halfday':
      return 'halfDay';
    case 'leave':
      return 'leave';
    case 'absent':
      return 'absent';
    default:
      return key.includes('half') ? 'halfDay' : null;
  }
}
