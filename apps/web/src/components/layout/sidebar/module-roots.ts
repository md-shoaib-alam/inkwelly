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
 * hand, so a card that changes its `screen` moves the URL with it. One module opts
 * out of the collapse with `qualifiedRoot` (see `adminRailTail`), because its landing
 * is a screen the bare root has always served under a name other branches route by.
 *
 * Kept separate from `screen-owners.ts` on purpose: that file answers "which module
 * owns this screen" for every row, while this one answers "which screen is this
 * module's front door". The cross-check in `lib/__tests__/module-roots.test.ts` is
 * what stops the two from disagreeing about a landing screen.
 *
 * NOT role-blind-safe. `timetable`, `calendar`, `leaves` and `certificates` are bare
 * keys in the teacher, student and parent blocks too, so only the admin, staff and
 * super_admin branch may call this.
 */

import { buildAdminRail, getDefaultScreen, type ModuleNavItem } from "./module-nav-config";
import { adminScreenOwners } from "./screen-owners";
import { qualifiedKey } from "@/lib/routing/module-routes";

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
 * The modules whose front door is spelled with its row name in the address bar.
 *
 * Two of the three root rules do not apply to them. Their bare root stays its own
 * screen key rather than becoming the landing's name, because `students` is also a
 * live screen in the staff dispatcher and the staff grant map is built from the staff
 * nav tree — rewriting the root would move that grant off its key. And their landing
 * does not collapse to the root, because the long spelling is the one on screen.
 */
export const adminQualifiedRoots = new Set(
  buildAdminRail()
    .filter((item) => item.qualifiedRoot)
    .map((item) => item.key),
);

/** The reverse, which the tests pin as collision-free. */
export const adminLandingRoots: Record<string, string> = {};
for (const [module, landing] of Object.entries(adminModuleLandings)) {
  if (adminQualifiedRoots.has(module)) continue;
  adminLandingRoots[landing] = module;
}

function root(module: string, landing: string, canonicalTail: string | null): ResolvedAdminRoute {
  return { module, screen: landing, canonicalTail };
}

/**
 * The tail the rail emits for a module.
 *
 * Normally its own key, because the root renders the landing either way. A
 * `qualifiedRoot` module names its front door instead, so the address bar says
 * `students/list` on the click that made it there rather than trading a hop for the
 * short form.
 */
export function adminRailTail(item: ModuleNavItem): string {
  if (!item.qualifiedRoot) return item.key;
  const landing = getDefaultScreen(item);
  return landing === item.key ? item.key : qualifiedKey(item.key, landing);
}

export function resolveAdminRoute(
  module: string | null,
  screen: string,
): ResolvedAdminRoute {
  if (module) {
    // A qualified URL is canonical unless it spells out the module's own front door.
    return adminModuleLandings[module] === screen && !adminQualifiedRoots.has(module)
      ? root(module, screen, module)
      : { module, screen, canonicalTail: null };
  }

  // A qualified root's bare name is its own screen key, not the landing's: `students`
  // must keep routing to the case the staff grant map is registered under.
  if (!adminQualifiedRoots.has(screen)) {
    const landing = adminModuleLandings[screen];
    if (landing) return root(screen, landing, null);
  }

  const bareLandingRoot = adminLandingRoots[screen];
  if (bareLandingRoot) return root(bareLandingRoot, screen, bareLandingRoot);

  const owner = adminScreenOwners[screen];
  if (owner) return { module: owner, screen, canonicalTail: null };

  // `dashboard`, an identity root like `/students`, and anything unowned.
  return { module: null, screen, canonicalTail: null };
}
