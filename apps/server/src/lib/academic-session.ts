/**
 * The academic session a command center should frame itself against.
 *
 * Both the Academics and the Students command center need the same answer — which
 * `AcademicYear` row is "the session" for this school — and a school's header reading
 * one year on one screen and another on the next is a bug no user forgives. It lives
 * here rather than in either service so there is exactly one definition of it.
 *
 * The order is the one the Academics screen has always used: an explicitly requested
 * name wins, then the row flagged `isCurrent`, then any row still `active`, then the
 * row whose dates span today. A school with no usable row gets null, and the caller
 * says so instead of defaulting to a year.
 */

export type SessionRow = {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: string;
};

/** Midnight UTC, so a whole-month difference is exactly 30 or 31 days, never 30.96. */
function dayEpoch(iso: string): number | null {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

export function pickCurrentSession(
  years: SessionRow[],
  requested: string | null | undefined,
  today: string,
): SessionRow | null {
  if (requested) {
    const named = years.find((y) => y.name === requested);
    if (named) return named;
  }
  const flagged = years.find((y) => y.isCurrent);
  if (flagged) return flagged;
  const active = years.find((y) => y.status === 'active');
  if (active) return active;
  const now = dayEpoch(today);
  const spanning = years
    .filter((y) => {
      const s = dayEpoch(y.startDate);
      const e = dayEpoch(y.endDate);
      return s !== null && e !== null && now !== null && now >= s && now <= e;
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  return spanning[0] ?? null;
}

/** Inclusive calendar days, so "Day 106 of 304 · 35%" reads the way it counts. */
export function sessionProgress(startDate: string, endDate: string, today: string) {
  const start = dayEpoch(startDate);
  const end = dayEpoch(endDate);
  const now = dayEpoch(today);
  if (start === null || end === null || now === null || end < start) return null;
  const totalDays = Math.floor((end - start) / 86400000) + 1;
  const dayNumber = Math.min(Math.max(Math.floor((now - start) / 86400000) + 1, 0), totalDays);
  return { totalDays, dayNumber, percentComplete: Math.round((dayNumber / totalDays) * 100) };
}
