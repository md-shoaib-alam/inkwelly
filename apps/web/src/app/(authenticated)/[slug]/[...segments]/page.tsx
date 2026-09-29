export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import TenantScreenDispatcherClient from './tenant-screen-dispatcher';

type Props = {
  params: Promise<{ slug: string; segments: string[] }>;
};

const titleCase = (value: string) =>
  value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * The tab title comes from the URL segment, so the renamed launcher would read
 * "Module | School" — true of the address, useless to someone looking for their
 * dashboard. Everything else on screen already takes its wording from the nav
 * label, so this one entry is the whole exception.
 */
const SCREEN_DISPLAY_NAMES: Record<string, string> = { module: "Dashboard" };

/**
 * Cosmetic only. Routing decides what segment 1 means by membership in the
 * tenant's own year list (module-routes.parseRoute), never by shape, so a
 * free-text name like "FY 2026" is allowed to appear in a document title.
 */
const YEAR_SHAPED = /^20\d{2}-\d{2,4}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, segments } = await params;
  const tail = YEAR_SHAPED.test(segments[0] ?? '') ? segments.slice(1) : segments;

  // The old tree served `<Screen>` for `[screen]` and `<Detail> - <Screen>` for
  // `[screen]/[detail]`; one catch-all carries both, and the detail is whichever
  // segment sits last.
  const hasDetail = tail.length > 1;
  const displaySlug = titleCase(slug);
  const displayScreen =
    SCREEN_DISPLAY_NAMES[tail[0] ?? 'module'] ?? titleCase(tail[0] ?? 'module');
  const displayDetail = hasDetail ? decodeURIComponent(tail[tail.length - 1]) : null;

  const screenLabel = displayDetail ? `${displayDetail} - ${displayScreen}` : displayScreen;
  const description = displayDetail
    ? `Manage details of ${displayDetail} on ${displayScreen} for ${displaySlug}.`
    : `Manage ${displayScreen} for ${displaySlug}. Access all your school management tools on SchoolSaaS.`;

  return {
    title: `${screenLabel} | ${displaySlug} | SchoolSaaS`,
    description,
  };
}

export default function TenantScreenDispatcher() {
  return <TenantScreenDispatcherClient />;
}
