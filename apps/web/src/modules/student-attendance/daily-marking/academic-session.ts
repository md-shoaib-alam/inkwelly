// Short month names mirror the reports convention (session-months.ts): Indian
// schools render September as "Sept", which date-fns' "MMM" ("Sep") does not.
const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
];

/** "2026-06-15" -> "15 Jun 2026". Non-matching input is returned as-is. */
export function formatSessionDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${Number(d)} ${SHORT_MONTH_NAMES[Number(mo) - 1]} ${y}`;
}

/**
 * True when a "yyyy-MM-dd" date falls outside [start, end]. Both bounds are
 * sliced to the date part because AcademicYear stores them as free text.
 * A missing bound means "no session configured" -> never outside.
 */
export function isDateOutsideSession(
  dateStr: string,
  start?: string | null,
  end?: string | null,
): boolean {
  if (!start || !end) return false;
  return dateStr < start.slice(0, 10) || dateStr > end.slice(0, 10);
}
