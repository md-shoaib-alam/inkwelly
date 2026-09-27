import { dataCache } from './cache';

/**
 * Invalidates all fee-related caches for a given tenant in a single
 * parallel operation.  Replaces the repeated three-call pattern:
 *
 *   await dataCache.deleteMatch(`fees:${tenantId}:*`);
 *   await dataCache.deleteMatch(`*fees*${tenantId}*`);
 *   await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
 *
 * Note: `deleteMatch` already accepts an array of patterns and fires them
 * concurrently (see cache.ts line 200).
 */
export const invalidateFeeCaches = (tenantId: string): Promise<void> =>
  dataCache.deleteMatch([
    `fees:${tenantId}:*`,
    `fee-receipts:${tenantId}:*`,
    `dashboard:${tenantId}:*`,
    `reports:${tenantId}:*`,
  ]);

/**
 * Same as invalidateFeeCaches but also clears the students cache key,
 * used when fee assignments are changed (which affects student list counts).
 */
export const invalidateFeeAndStudentCaches = (tenantId: string): Promise<void> =>
  dataCache.deleteMatch([
    `fees:${tenantId}:*`,
    `fee-receipts:${tenantId}:*`,
    `dashboard:${tenantId}:*`,
    `*students*${tenantId}*`,
  ]);
