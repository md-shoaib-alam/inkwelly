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

  if (input.yearSlug !== null || YEAR_FREE_SCREENS.has(input.screen)) return { kind: 'render' };
  // Without a usable slug there is nothing to canonicalise to; emitting the
  // year-free URL would land on this same branch again and spin forever.
  if (!input.activeYearSlug) return { kind: 'render' };
  return { kind: 'canonicalise', toYearSlug: input.activeYearSlug };
}
