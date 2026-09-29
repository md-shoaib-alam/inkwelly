"use client";

import { useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useActiveAcademicYear } from './use-active-academic-year';
import { academicYearUrl } from '@/lib/routing/academic-year-url';
import { qualifyAdminTail } from '@/components/layout/sidebar/screen-owners';

/**
 * Turns a screen tail (`'manage-plan'`, `'academics/classes'`,
 * `'students/list/STU2026120'`) into an absolute tenant URL that carries the year,
 * and for an admin also the module (`'timetable'` becomes
 * `'academics/timetable'`). One adapter so the hand-written `push()` sites can
 * each change to a single call and never re-derive slug, year or module
 * themselves.
 *
 * The qualification is admin-only on purpose: `timetable`, `calendar` and
 * `fees` are bare keys in the teacher, student and parent screens too, and
 * those roles have no module rail to be sent into.
 *
 * Stable identity while the slug, year and module hold still, so callers can keep
 * it in a `useCallback` dependency list without re-creating their handler per render.
 */
export function useTenantHref(): (tail: string) => string {
  const { currentUser, currentTenantSlug, currentTenantId } = useAppStore();
  const { yearSlug, routeModule } = useActiveAcademicYear();

  const slug = currentTenantSlug || currentTenantId ||
    currentUser?.tenantSlug || currentUser?.tenantId || '';
  const qualify =
    currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  return useCallback(
    (tail: string) =>
      academicYearUrl(slug, yearSlug, qualify ? qualifyAdminTail(tail, routeModule) : tail),
    [slug, yearSlug, routeModule, qualify],
  );
}
