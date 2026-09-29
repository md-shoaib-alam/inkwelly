"use client";

import { useAppStore } from '@/store/use-app-store';
import { useActiveAcademicYear } from './use-active-academic-year';
import { academicYearUrl } from '@/lib/routing/academic-year-url';

/**
 * Turns a screen tail (`'manage-plan'`, `'academics/classes'`,
 * `'students?student=S-1'`) into an absolute tenant URL that carries the year.
 * One adapter so the 40-odd inline `push(`/${slug}/…`)` sites can each change
 * to a single call and never re-derive slug or year themselves.
 */
export function useTenantHref(): (tail: string) => string {
  const { currentUser, currentTenantSlug, currentTenantId } = useAppStore();
  const { yearSlug } = useActiveAcademicYear();

  return (tail: string) => {
    const slug = currentTenantSlug || currentTenantId ||
      currentUser?.tenantSlug || currentUser?.tenantId || '';
    return academicYearUrl(slug, yearSlug, tail);
  };
}
