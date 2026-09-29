"use client";

import { useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useActiveAcademicYear } from './use-active-academic-year';
import { academicYearUrl } from '@/lib/routing/academic-year-url';

/**
 * Turns a screen tail (`'manage-plan'`, `'academics/classes'`,
 * `'students?student=S-1'`) into an absolute tenant URL that carries the year.
 * One adapter so the hand-written `push()` sites can each change to a single
 * call and never re-derive slug or year themselves.
 *
 * Stable identity while the slug and year hold still, so callers can keep it in
 * a `useCallback` dependency list without re-creating their handler per render.
 */
export function useTenantHref(): (tail: string) => string {
  const { currentUser, currentTenantSlug, currentTenantId } = useAppStore();
  const { yearSlug } = useActiveAcademicYear();

  const slug = currentTenantSlug || currentTenantId ||
    currentUser?.tenantSlug || currentUser?.tenantId || '';

  return useCallback(
    (tail: string) => academicYearUrl(slug, yearSlug, tail),
    [slug, yearSlug],
  );
}
