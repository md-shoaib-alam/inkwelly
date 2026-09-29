/**
 * The whole routing contract for admin module screens.
 *
 * A screen key is either bare (`module`) or module-qualified
 * (`academics/classes`). Qualified keys are how admin module screens are
 * addressed; bare keys keep working for every other role and for existing
 * bookmarks.
 *
 * This file deliberately imports nothing from the app. The sidebar and the
 * dispatcher both consult it, so keeping it pure is what stops the two from
 * disagreeing about which screen is open — `adminPanelSections` is passed in as
 * a predicate rather than imported, which is also what avoids a cycle through
 * `module-nav-config`.
 */

export type RouteParts = {
  year: string | null;
  module: string | null;
  screen: string;
};

export type RouteContext = {
  /** True when `screen` is a declared sub-link of module `module`. */
  isModuleScreen: (module: string, screen: string) => boolean;
  /** True when a single leading path segment names the tenant rather than a screen. */
  isTenantRoot: (first: string) => boolean;
  /**
   * The tenant's own year slugs. Membership, not shape, decides what segment 1
   * means: year names are free text, so `2024-2025` may be a year or a screen
   * depending on who owns it. Omit it and nothing is treated as a year.
   */
  yearSlugs?: string[];
};

export function qualifiedKey(module: string, screen: string): string {
  return `${module}/${screen}`;
}

export function splitKey(key: string): { module: string | null; screen: string } {
  const slash = key.indexOf("/");
  if (slash === -1) return { module: null, screen: key };
  return { module: key.slice(0, slash), screen: key.slice(slash + 1) };
}

/**
 * `/demo-academy/academics/classes` and `/demo-academy/students/STU-123` are both
 * three segments. `isModuleScreen` is what tells a module-scoped screen apart from
 * the legacy screen-with-detail shape, so an unknown second segment keeps the
 * behaviour it has always had.
 *
 * A `year: null` result is not an error; it means the caller must canonicalise the
 * URL (spec §3), except for the screen the gate itself renders.
 */
export function parseRoute(pathname: string, ctx: RouteContext): RouteParts {
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return { year: null, module: null, screen: "module" };
  if (parts.length === 1) {
    return ctx.isTenantRoot(parts[0])
      ? { year: null, module: null, screen: "module" }
      : { year: null, module: null, screen: parts[0] };
  }

  const rest = parts.slice(1);
  let year: string | null = null;
  if (rest[0] && ctx.yearSlugs?.includes(rest[0])) {
    year = rest[0];
    rest.shift();
  }

  if (rest.length === 0) return { year, module: null, screen: "module" };

  const [first, second] = rest;
  if (second && ctx.isModuleScreen(first, second)) {
    return { year, module: first, screen: second };
  }
  return { year, module: null, screen: first };
}

/**
 * Most qualified keys share a body with their bare form, so the dispatcher keeps
 * switching on the same bare keys it always has and only genuinely different
 * screens get a new one. Retargeting all ~50 admin cases to qualified strings
 * would be a large, risky diff for no behavioural gain.
 */
export const COMPONENT_OVERRIDES: Record<string, string> = {
  "students/classes": "class-roster",
};

export function componentKey(module: string | null, screen: string): string {
  if (!module) return screen;
  return COMPONENT_OVERRIDES[qualifiedKey(module, screen)] ?? screen;
}

/**
 * A bookmarked bare key is rewritten to its canonical module so the address bar
 * converges. A key that is also a module id is never rewritten: `/demo-academy/students`
 * means the All Students screen, and silently sending it to a module root would
 * make an existing URL mean something else.
 */
export function canonicalOwner(
  screen: string,
  owners: Record<string, string>,
  moduleIds: Set<string>,
): string | null {
  if (moduleIds.has(screen)) return null;
  return owners[screen] ?? null;
}

/**
 * Retired keys that still arrive from bookmarks, and the live screen each one means.
 *
 * The parser deliberately does not apply this — a stale key has to stay
 * distinguishable from the screen it redirects to, or the dispatcher could never
 * tell "you are on the launcher" from "you asked for the old name". Values must
 * never themselves be keys here, so one redirect always lands.
 */
export const LEGACY_SCREEN_KEYS: Record<string, string> = {
  dashboard: "module",
};
