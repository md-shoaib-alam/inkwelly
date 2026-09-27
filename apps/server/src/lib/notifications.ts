import { redis } from './redis';
import { chunked } from './batch';

const transientKey = (userId: string) => `notifications:transient:${userId}`;
const dismissedKey = (userId: string) => `notifications:dismissed:${userId}`;
const countKey = (userId: string) => `notifications:count:${userId}`;

// Longer than BOTH client poll intervals (60s with unreads, 5min at zero) so
// repeat polls hit the cache instead of the DB. Safe because every writer path
// DELs this key, so a new notification (or a read/dismiss) shows on the next
// poll regardless of this TTL.
export const COUNT_TTL_SECONDS = 600;
const DISMISSED_TTL_SECONDS = 86400; // matches the transient list lifetime

// Bounds for fan-out writes: big enough to collapse thousands of round-trips
// into a handful, small enough that no single Redis command or pipeline gets
// oversized.
const TRANSIENT_PIPELINE_CHUNK = 200;
const COUNT_INVALIDATION_CHUNK = 500;

export async function invalidateUnreadCount(userId: string): Promise<void> {
  await redis.del(countKey(userId)).catch(() => {});
}

/**
 * Write a transient notification to a user's capped list and drop their cached
 * unread count in one round-trip.
 * No `redis.status` guard: the client is lazyConnect, so an early return here
 * would silently drop notifications on a freshly started server (e.g. the
 * morning queue drain) instead of connecting and writing.
 */
export async function pushTransientNotification(userId: string, notif: unknown): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.lpush(transientKey(userId), JSON.stringify(notif));
  pipeline.ltrim(transientKey(userId), 0, 49); // Keep only latest 50
  pipeline.expire(transientKey(userId), 86400); // Expire in 24 hours
  pipeline.del(countKey(userId));
  await pipeline.exec().catch((err) => console.error('[NOTIFICATIONS] transient notification write failed:', err));
}

/**
 * Write many users' transient notifications in as few round-trips as possible.
 * A school-wide alert is one bulk call instead of one per parent — the command
 * count is the same but the connection churn and latency are not, and that is
 * what matters when 50k of these land during the morning peak.
 * Chunked internally so a huge fan-out never builds one oversized pipeline.
 */
export async function pushTransientNotificationsBulk(
  entries: { userId: string; notif: unknown }[]
): Promise<void> {
  for (const group of chunked(entries, TRANSIENT_PIPELINE_CHUNK)) {
    const pipeline = redis.pipeline();
    for (const { userId, notif } of group) {
      pipeline.lpush(transientKey(userId), JSON.stringify(notif));
      pipeline.ltrim(transientKey(userId), 0, 49); // Keep only latest 50
      pipeline.expire(transientKey(userId), 86400); // Expire in 24 hours
      pipeline.del(countKey(userId));
    }
    await pipeline.exec().catch((err) => console.error('[NOTIFICATIONS] bulk transient write failed:', err));
  }
}

export async function invalidateUnreadCountBulk(userIds: string[]): Promise<void> {
  for (const group of chunked([...new Set(userIds)], COUNT_INVALIDATION_CHUNK)) {
    await redis.del(...group.map(countKey)).catch(() => {});
  }
}

export async function getDismissedIds(userId: string): Promise<Set<string>> {
  if (redis.status !== 'ready') return new Set();
  try {
    const members = await redis.smembers(dismissedKey(userId));
    return new Set(members);
  } catch {
    return new Set();
  }
}

export async function dismissTransientNotification(userId: string, id: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.sadd(dismissedKey(userId), id);
  pipeline.expire(dismissedKey(userId), DISMISSED_TTL_SECONDS);
  pipeline.del(countKey(userId));
  await pipeline.exec().catch((err) => console.error('[NOTIFICATIONS] transient dismiss failed:', err));
}
