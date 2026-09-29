"use client";

import { useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useActiveAcademicYear } from '@/modules/academics/hooks/use-active-academic-year';
import { academicYearUrl } from '@/lib/routing/academic-year-url';
import { qualifyAdminTail } from '@/components/layout/sidebar/screen-owners';

/**
 * Turns a screen tail (`'classes'`, `'students?student=S-1'`) into an absolute tenant
 * URL that carries the year, and for an admin the module too.
 *
 * This is the Students copy. The Academics screen of the same name builds links to
 * rows it edits; this one builds links to rows it reports on, and the two are allowed
 * to drift. `useActiveAcademicYear` stays shared because the year is a property of the
 * URL, not of either module.
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
