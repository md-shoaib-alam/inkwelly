/**
 * The academic-year gate: what a tenant screen may render for a given URL.
 *
 * Kept pure and separate for the same reason `module-routes.ts` is: the answer
 * depends on the caller's role, whether the tenant's years have loaded, and
 * which screen the URL names, and a wrong answer here is either a locked-out
 * user or a redirect loop. The dispatcher maps each outcome to its own
 * skeleton, notice or `redirect()`; it decides nothing itself.
 *
 * A platform admin is exempt throughout. `academicYears` resolves the tenant
 * from the caller's own session, and a platform account has none, so their year
 * list is always empty — gating them would eject them from every school they
 * open. Giving them a year list needs a `tenantId` argument on the query, which
 * the SDL does not declare.
 */

import { SESSION_FLAGGED_ROLES } from './off-session';

export type YearGateStatus = 'loading' | 'empty' | 'ready';

export type YearGateInput = {
  role: string;
  status: YearGateStatus;
  /** The year already in the URL, or null when the URL carries none. */
  yearSlug: string | null;
  /** The bare screen name the URL resolves to. */
  screen: string;
  /** True when this caller is allowed to create academic years. */
  maySetUp: boolean;
  /** Non-empty when a year can actually be written into the URL. */
  activeYearSlug: string;
  /**
   * The tenant's own current year, independent of the URL, or null when no year
   * is flagged. `activeYearSlug` falls back to the URL's year, so it cannot
   * answer "is this the current one?" -- this can.
   */
  currentYearSlug: string | null;
};

export type YearGate =
  | { kind: 'render' }
  | { kind: 'skeleton' }
  | { kind: 'to-setup' }
  | { kind: 'notice' }
  /** The tail is re-emitted under `toYearSlug`; the screen never changes. */
  | { kind: 'canonicalise'; toYearSlug: string };

/**
 * The setup screen is the one URL a tenant can be at with no year — it is how a
 * school gets its first one. Everything else must carry a year.
 */
export const YEAR_FREE_SCREENS = new Set(['academic-years']);

/**
 * A learner's fees, results and attendance are read as "this session", so an
 * address that names another one is always a mistake rather than a choice. They
 * are moved back instead of flagged; staff and teachers, who do compare sessions,
 * keep the flag (see `off-session.ts`).
 */
export const SESSION_PINNED_ROLES = new Set(['student', 'parent']);

/**
 * Whether the chrome may offer this caller a session switcher. The permission is
 * "may look at a session other than the current one", which `off-session.ts`
 * already names for the roles it flags, so it is reused rather than restated. A
 * platform admin has no tenant session (see this file's header) and a learner is
 * pinned to the current one, so for both a switcher would be an offer they cannot
 * take up.
 */
export function mayChooseSession(role: string): boolean {
  return SESSION_FLAGGED_ROLES.has(role);
}

export function decideYearGate(input: YearGateInput): YearGate {
  if (input.role === 'super_admin') return { kind: 'render' };
  if (input.status === 'loading') return { kind: 'skeleton' };

  if (input.status === 'empty') {
    // A non-admin must NOT be sent to the setup screen, or they bounce off a
    // screen they cannot open and the gate loops.
    if (!input.maySetUp) return { kind: 'notice' };
    return input.screen === 'academic-years'
      ? { kind: 'render' }
      : { kind: 'to-setup' };
  }

  // A learner is pinned before anything else renders, but never off the setup
  // screen: that one is reached with no year at all. An empty `currentYearSlug`
  // stands the rule down rather than emitting a year-less URL it would re-hit.
  if (
    SESSION_PINNED_ROLES.has(input.role) &&
    input.currentYearSlug &&
    !YEAR_FREE_SCREENS.has(input.screen) &&
    input.yearSlug !== input.currentYearSlug
  ) {
    return { kind: 'canonicalise', toYearSlug: input.currentYearSlug };
  }

  if (input.yearSlug !== null || YEAR_FREE_SCREENS.has(input.screen)) return { kind: 'render' };
  // Without a usable slug there is nothing to canonicalise to; emitting the
  // year-free URL would land on this same branch again and spin forever.
  if (!input.activeYearSlug) return { kind: 'render' };
  return { kind: 'canonicalise', toYearSlug: input.activeYearSlug };
}
