/**
 * Which module owns a bare admin screen key.
 *
 * The single source is the catalogue card, so the dashboard grid and the address bar
 * cannot disagree: a card leaves the grid because its screen is its parent module's
 * panel row, and the same fact is what makes that screen's URL module-qualified. A
 * rail card's own landing screen is owned by the card itself. Adding a `parent` or
 * an `inRail` screen later extends both at once.
 *
 * This lives next to `module-nav-config.tsx` rather than in `lib/routing/` because
 * both files there import nothing from the app on purpose, and this map is built
 * from app data.
 *
 * NOT a role-blind helper. `timetable` and `calendar` are also bare
 * keys in the teacher, student and parent dispatcher blocks, and staff keeps the
 * legacy accordion with bare keys, so only the admin and super_admin branches may
 * consult what this file returns — a teacher at `/slug/timetable` must stay on
 * Teacher Timetable, not be sent to Academics.
 */

import { buildAdminRail, isAdminModuleScreen } from "./module-nav-config";
import { moduleCatalogue } from "@/modules/dashboard/components/adminDashboard/moduleCatalogue";
import { canonicalOwner, qualifiedKey } from "@/lib/routing/module-routes";

/**
 * Rail module ids — the ids a URL can address as a module root. Deliberately not
 * every catalogue card id: `timetable` is a card id and also the screen that
 * belongs to Academics, so a card-id set would refuse to canonicalise exactly the
 * screens this map exists for.
 */
export const adminModuleIds = new Set(buildAdminRail().map((item) => item.key));

/**
 * `screen -> module`, for the cards that name exactly one owning module.
 *
 * Skipped on purpose: `parent: "shared"` (Reports is a row of five panels, so naming
 * one owner would pick arbitrarily) and a card with `screen: null` (nothing routes,
 * so there is nothing to canonicalise).
 */
export const adminScreenOwners: Record<string, string> = {};
for (const card of moduleCatalogue) {
  if (!card.parent || card.parent === "shared" || card.screen === null) continue;
  adminScreenOwners[card.screen] = card.parent;
}

/**
 * `screen -> module` for the screens a rail module lands on (`academics-dashboard`
 * is where the Academics card and the Academics rail row both go).
 *
 * A rail card's own `screen` names no parent — it is the module — so the map above
 * cannot see it, and the dashboard grid would otherwise keep emitting bare URLs for
 * the twelve most-visited screens in the product. `isAdminModuleScreen` is the gate
 * because a qualified URL the routing contract cannot read back would render the
 * wrong screen: the predicate is the same one `parseRoute` uses.
 */
export const adminLandingOwners: Record<string, string> = {};
for (const card of moduleCatalogue) {
  if (!card.inRail || card.parent || card.screen === null || card.screen === card.id) continue;
  if (isAdminModuleScreen(card.id, card.screen)) adminLandingOwners[card.screen] = card.id;
}

const adminOwners = { ...adminScreenOwners, ...adminLandingOwners };

/**
 * The module a bare admin screen belongs to, or null when it belongs to none —
 * because it is a module root, because no single module owns it, or because no
 * panel declares it.
 *
 * `currentModule` is the module the admin is standing in, and it wins: `reports` is
 * a row of five panels, so from Money Book the answer is Money Book's Reports.
 */
function adminOwnerOf(screen: string, currentModule: string | null): string | null {
  // A module root keeps the URL it has always had: `/slug/students` is the Students
  // module's own key, and the roster hangs off it as `students/list`, so qualifying the
  // root would name one screen twice.
  if (currentModule && currentModule !== screen && isAdminModuleScreen(currentModule, screen)) {
    return currentModule;
  }
  return canonicalOwner(screen, adminOwners, adminModuleIds);
}

/**
 * The module-qualified tail for a bare admin URL, or null when the URL is already
 * canonical and must be left alone. Returning null for a qualified route is what
 * makes a redirect on this value safe: it cannot loop, because the target it produces
 * parses back with a module set.
 */
export function canonicalAdminTail(module: string | null, screen: string): string | null {
  if (module) return null;
  const owner = adminOwnerOf(screen, null);
  return owner ? qualifiedKey(owner, screen) : null;
}

/**
 * Every link an admin clicks is built here: the tail keeps its query string and its
 * detail segment (`transport-fee/Route%20A`) and gains the module it belongs to, so
 * a screen URL reads `/slug/session/academics/timetable`.
 *
 * Idempotent — a tail that already reads `module/row` is returned untouched — which
 * is what lets one builder serve the rail, the panel, the grid and the 32 in-screen
 * links without any of them having to know whether it was already qualified.
 */
export function qualifyAdminTail(tail: string, currentModule: string | null): string {
  const queryAt = tail.indexOf("?");
  const query = queryAt === -1 ? "" : tail.slice(queryAt);
  const path = queryAt === -1 ? tail : tail.slice(0, queryAt);
  const [screen, ...rest] = path.split("/");
  if (!screen) return tail;
  if (rest.length > 0 && isAdminModuleScreen(screen, rest[0])) return tail;
  const owner = adminOwnerOf(screen, currentModule);
  if (!owner) return tail;
  return `${qualifiedKey(owner, screen)}${rest.length ? `/${rest.join("/")}` : ""}${query}`;
}
