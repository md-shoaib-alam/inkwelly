/**
 * Whether the screen the caller is standing on belongs to a session other than
 * the tenant's current one.
 *
 * Pure and separate for the same reason `year-gate.ts` is: the answer is a
 * comparison between two slugs the app already holds, and the only hard part is
 * knowing when there is nothing to compare — a school with no session flagged
 * current, or a URL with no year in it, cannot be "the wrong one".
 *
 * This changes no behaviour. Browsing a past session is legitimate, and the
 * screens keep working; the flag exists so the difference is impossible to miss.
 */

/** Roles that may open a past session, and so are told they have. */
export const SESSION_FLAGGED_ROLES = new Set(['admin', 'staff', 'teacher']);

export type OffSessionInput = {
  role: string;
  status: 'loading' | 'empty' | 'ready';
  /** The year in the URL, or null when the URL carries none. */
  urlYearSlug: string | null;
  /** The tenant's own current year, or null when nothing is flagged. */
  currentYearSlug: string | null;
};

export function shouldFlagOffSession(input: OffSessionInput): boolean {
  if (input.status !== 'ready') return false;
  if (!SESSION_FLAGGED_ROLES.has(input.role)) return false;
  const { urlYearSlug, currentYearSlug } = input;
  if (!urlYearSlug || !currentYearSlug) return false;
  return urlYearSlug !== currentYearSlug;
}
