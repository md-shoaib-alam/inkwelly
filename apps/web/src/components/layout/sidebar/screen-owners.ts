/**
 * Which module owns a bare admin screen key.
 *
 * The single source is `parent` on a catalogue card, so the dashboard grid and the
 * address bar cannot disagree: a card leaves the grid because its screen is its
 * parent module's panel row, and the same fact is what makes that screen's URL
 * module-qualified. Adding a `parent` later extends both at once.
 *
 * This lives next to `module-nav-config.tsx` rather than in `lib/routing/` because
 * both files there import nothing from the app on purpose, and this map is built
 * from app data.
 *
 * NOT a role-blind helper. `timetable`, `calendar` and `certificates` are also bare
 * keys in the teacher, student and parent dispatcher blocks, so only the admin,
 * super_admin and staff branch may consult what this file returns — a teacher at
 * `/slug/timetable` must stay on Teacher Timetable, not be sent to Academics.
 */

import { buildAdminRail } from "./module-nav-config";
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
 * Skipped on purpose: `parent: "shared"` (Reports is a row of six panels, so naming
 * one owner would pick arbitrarily) and a card with `screen: null` (nothing routes,
 * so there is nothing to canonicalise).
 */
export const adminScreenOwners: Record<string, string> = {};
for (const card of moduleCatalogue) {
  if (!card.parent || card.parent === "shared" || card.screen === null) continue;
  adminScreenOwners[card.screen] = card.parent;
}

/**
 * The module-qualified tail for a bare admin URL, or null when the URL is already
 * canonical and must be left alone. Returning null for a qualified route is what
 * makes a redirect on this value safe: it cannot loop, because the target it produces
 * parses back with a module set.
 */
export function canonicalAdminTail(module: string | null, screen: string): string | null {
  if (module) return null;
  const owner = canonicalOwner(screen, adminScreenOwners, adminModuleIds);
  return owner ? qualifiedKey(owner, screen) : null;
}
