/**
 * Module roots: what `/slug/academics` means, and which URL is canonical.
 *
 * The rail names a module and the catalogue names the screen it opens on, and for most
 * modules those are different strings (`academics` opens `academics-dashboard`). That
 * leaves two holes this file closes:
 *
 *   1. `/slug/academics` parses as the bare screen `academics`, which no dispatcher
 *      case serves, so it bounces to the dashboard.
 *   2. `/slug/academics/academics-dashboard` names the same screen twice.
 *
 * So a root resolves to its landing screen for rendering, and a landing collapses
 * to its root for the address bar. Both are derived from the rail, never listed by
 * hand, so a card that changes its `screen` moves the URL with it.
 *
 * One thing is not derived: a module whose bare root is also a live screen key for
 * the non-admin roles (see `adminSharedRoots`). That word cannot move, so the answer
 * to "what does `/slug/students` render" depends on who is asking — which is why
 * `resolveAdminRoute` takes a role.
 *
 * Kept separate from `screen-owners.ts` on purpose: that file answers "which module
 * owns this screen" for every row, while this one answers "which screen is this
 * module's front door". The cross-check in `lib/__tests__/module-roots.test.ts` is
 * what stops the two from disagreeing about a landing screen.
 *
 * NOT role-blind-safe beyond the one `role` argument: `timetable`, `calendar`,
 * `leaves` and `certificates` are bare keys in the teacher, student and parent blocks
 * too, so only the admin, staff and super_admin branch may call this.
 */

import { buildAdminRail, getDefaultScreen } from "./module-nav-config";
import { adminScreenOwners } from "./screen-owners";

export type ResolvedAdminRoute = {
  /** The module to render under, or null for a screen no module owns. */
  module: string | null;
  /** The screen to render: a module root becomes its landing screen. */
  screen: string;
  /**
   * The tail the address bar should carry, or null when the current URL is already
   * canonical. Only the two root shapes live here: `/academics/academics-dashboard`
   * collapses to `academics`, and a bare `academics-dashboard` goes straight to the
   * root instead of via the doubled form. Qualifying an ordinary row
   * (`timetable` -> `academics/timetable`) is `canonicalAdminTail`'s job in
   * `screen-owners.ts`. The two overlap on a bare landing screen, where that file
   * would say `academics/academics-dashboard`; this one is consulted first, so a
   * landing reaches its root in a single hop.
   */
  canonicalTail: string | null;
};

/**
 * `module -> landing`, only where the two differ. What a root renders, and the row it
 * lights in the panel.
 */
export const adminModuleLandings: Record<string, string> = {};
for (const item of buildAdminRail()) {
  const landing = getDefaultScreen(item);
  if (landing && landing !== item.key) adminModuleLandings[item.key] = landing;
}

/**
 * The modules whose bare root is also a live screen key for the roles that have no
 * module rail of their own.
 *
 * `students` is the roster's key in the staff, teacher, student and parent nav trees,
 * and each of those grant maps is derived from its own tree, so the word cannot move
 * without moving a grant with it. An admin's root is the module's landing; every other
 * role keeps getting the screen that bare word has always served.
 */
export const adminSharedRoots = new Set(
  buildAdminRail()
    .filter((item) => item.rootServesOwnScreen)
    .map((item) => item.key),
);

/** Whose module root is its landing screen. Everyone else's is its own screen key. */
export function servesLandingAtRoot(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

/** The reverse, which the tests pin as collision-free. */
export const adminLandingRoots: Record<string, string> = {};
for (const [module, landing] of Object.entries(adminModuleLandings)) {
  adminLandingRoots[landing] = module;
}

function root(module: string, landing: string, canonicalTail: string | null): ResolvedAdminRoute {
  return { module, screen: landing, canonicalTail };
}

export function resolveAdminRoute(
  module: string | null,
  screen: string,
  role?: string | null,
): ResolvedAdminRoute {
  if (module) {
    // A qualified URL is canonical unless it spells out the module's own front door.
    // A shared root collapses too: the long spelling is only what the *bare* word
    // means for another role, and this URL already carries the module.
    return adminModuleLandings[module] === screen
      ? root(module, screen, module)
      : { module, screen, canonicalTail: null };
  }

  const landing = adminModuleLandings[screen];
  if (landing && !(adminSharedRoots.has(screen) && !servesLandingAtRoot(role))) {
    return root(screen, landing, null);
  }

  const bareLandingRoot = adminLandingRoots[screen];
  if (bareLandingRoot) return root(bareLandingRoot, screen, bareLandingRoot);

  const owner = adminScreenOwners[screen];
  if (owner) return { module: owner, screen, canonicalTail: null };

  // `dashboard`, an identity root like `/students` for a staff account, and anything
  // unowned.
  return { module: null, screen, canonicalTail: null };
}
