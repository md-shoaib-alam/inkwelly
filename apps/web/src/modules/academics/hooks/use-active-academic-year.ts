"use client";

import { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAcademicYears } from './use-academic-years';
import { parseRoute, type RouteParts } from '@/lib/routing/module-routes';
import { yearSlugOf, swapYearUrl } from '@/lib/routing/academic-year-url';
import { isAdminModuleScreen } from '@/components/layout/sidebar/module-nav-config';

/**
 * The single reader of "which academic year is this screen in".
 *
 * The URL is the authority. The tenant's own year list decides whether a
 * segment is a year at all, so this cannot report `ready` before that list
 * arrives — callers must hold a skeleton through `loading`.
 */
export function useActiveAcademicYear() {
  const { academicYears, isLoading } = useAcademicYears();
  const params = useParams();
  const search = useSearchParams();
  const { replace } = useRouter();

  const slug = (params?.slug ?? '') as string;
  const segments = (params?.segments ?? []) as string[];

  const yearSlugs = useMemo(
    () => academicYears.map((y: any) => yearSlugOf(y.name)),
    [academicYears],
  );

  const route: RouteParts = useMemo(
    () =>
      parseRoute(`/${slug}/${segments.join('/')}`, {
        isModuleScreen: isAdminModuleScreen,
        isTenantRoot: (first) => first === slug,
        yearSlugs,
      }),
    [slug, segments, yearSlugs],
  );

  const year = useMemo(
    () =>
      route.year
        ? academicYears.find((y: any) => yearSlugOf(y.name) === route.year) ?? null
        : null,
    [academicYears, route.year],
  );

  const status: 'loading' | 'empty' | 'ready' = isLoading
    ? 'loading'
    : academicYears.length === 0
      ? 'empty'
      : 'ready';

  const setActiveYear = (nextSlug: string) => {
    replace(
      swapYearUrl({
        slug,
        segments,
        fromYearSlug: route.year,
        toYearSlug: nextSlug,
        search: search?.toString() ? `?${search.toString()}` : '',
      }),
    );
  };

  return {
    status,
    years: academicYears,
    year,
    yearSlug: route.year,
    yearSlugs,
    setActiveYear,
  };
}
