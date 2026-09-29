/**
 * Year identity as it appears in a URL, and the only writers of tenant paths.
 *
 * A year's routing identity is derived from its name, because the four tables
 * that partition by year (`students`, `feeStructures`, `promotions`, `exams`)
 * store the name as text, not the id. Names are free text — `2026-2027`,
 * `2026-27`, `FY 2026` all occur — so the slug is a normalisation, and the
 * authoritative check is membership in the tenant's own list (see
 * `module-routes.parseRoute`). Two names that slug identically resolve to the
 * newer one: `academicYears` is ordered `desc(startDate)` server-side.
 *
 * This file imports nothing from the app, like `module-routes.ts`, so the
 * dispatcher, the sidebar and the header cannot drift on what a path means.
 */

export function yearSlugOf(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function academicYearUrl(
  slug: string,
  yearSlug: string | null,
  tail: string,
): string {
  if (!slug) return `/${tail}`;
  if (!yearSlug) return `/${slug}/${tail}`;
  return `/${slug}/${yearSlug}/${tail}`;
}

/** The same path the browser is on, with the year forced to `yearSlug`. */
export function canonicalTenantUrl(opts: {
  slug: string;
  segments: string[];
  yearSlug: string;
  search?: string;
}): string {
  const tail = `${opts.segments.join("/")}${opts.search ?? ""}`;
  return academicYearUrl(opts.slug, opts.yearSlug, tail || "dashboard");
}

/**
 * `segments` is the catch-all: it may or may not start with the current year.
 * The tail is whatever is left after removing it, so switching years never
 * changes which screen is open.
 */
export function swapYearUrl(opts: {
  slug: string;
  segments: string[];
  fromYearSlug: string | null;
  toYearSlug: string;
  search?: string;
}): string {
  const rest =
    opts.fromYearSlug && opts.segments[0] === opts.fromYearSlug
      ? opts.segments.slice(1)
      : opts.segments;
  const tail = `${rest.join("/")}${opts.search ?? ""}` || "dashboard";
  return academicYearUrl(opts.slug, opts.toYearSlug, tail);
}
