// Tenant hot-path cache. The attendance command center re-read and re-parsed
// the tenant settings blob and the full academic-year list on every page load;
// both change only through a handful of admin screens, so those mutations call
// invalidateTenantDashboardCache() and readers get a bounded-stale result.
// Staleness window: DASHBOARD_CACHE_TTL_MS on paths that bypass invalidation.
import { db } from './db';
import { dataCache } from './cache';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { pickCurrentSession } from './academic-session';
import { formatDate } from './date-utils';

const DASHBOARD_CACHE_TTL_MS = 60_000;

export function loadCachedYearRows(tenantId: string) {
  return dataCache.getOrSet(
    `attdash:years:${tenantId}`,
    () =>
      db
        .select({
          name: schema.academicYears.name,
          startDate: schema.academicYears.startDate,
          endDate: schema.academicYears.endDate,
          isCurrent: schema.academicYears.isCurrent,
          status: schema.academicYears.status,
        })
        .from(schema.academicYears)
        .where(eq(schema.academicYears.tenantId, tenantId)),
    DASHBOARD_CACHE_TTL_MS
  );
}

export function loadCachedWorkingDays(tenantId: string) {
  return dataCache.getOrSet(
    `attdash:workingdays:${tenantId}`,
    async () => {
      const row = await db
        .select({ settings: schema.tenants.settings })
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);
      const blob = row[0]?.settings;
      if (!blob || !blob.trim() || blob === '{}') return [] as string[];
      try {
        const parsed = JSON.parse(blob) as { workingDays?: unknown };
        return Array.isArray(parsed.workingDays)
          ? parsed.workingDays.filter((d): d is string => typeof d === 'string')
          : [];
      } catch {
        // A blob that will not parse is the default working week, not an error screen.
        return [];
      }
    },
    DASHBOARD_CACHE_TTL_MS
  );
}

export function loadCachedAttendanceSettings(tenantId: string) {
  return dataCache.getOrSet(
    `attdash:attsettings:${tenantId}`,
    () =>
      db
        .select({
          cutoffTime: schema.attendanceSettings.cutoffTime,
          targetRate: schema.attendanceSettings.targetRate,
        })
        .from(schema.attendanceSettings)
        .where(eq(schema.attendanceSettings.tenantId, tenantId))
        .limit(1),
    DASHBOARD_CACHE_TTL_MS
  );
}

/**
 * The academicYear to stamp on a new row. A school is required to create its
 * first academic session before any data is written, so there is no invented
 * fallback: `null` means the tenant has no current session and the caller must
 * refuse the write (400) instead of orphaning the row under a fake year.
 */
export async function academicYearForNewRow(tenantId: string): Promise<string | null> {
  const years = await loadCachedYearRows(tenantId);
  return pickCurrentSession(years, null, formatDate())?.name ?? null;
}

export function invalidateTenantDashboardCache(tenantId: string) {
  return Promise.all([
    dataCache.deleteMatch(`attdash:years:${tenantId}`),
    dataCache.deleteMatch(`attdash:workingdays:${tenantId}`),
    dataCache.deleteMatch(`attdash:attsettings:${tenantId}`),
  ]);
}
