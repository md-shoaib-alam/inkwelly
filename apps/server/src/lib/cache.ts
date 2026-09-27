import { redis } from './redis';
import { v4 as uuidv4 } from 'uuid';

/**
 * Adds a random jitter (up to 15% of the TTL) to avoid Cache Stampede /
 * Thundering Herd — where all keys expire at the exact same moment and
 * thousands of requests hit the database simultaneously.
 */
function withJitter(ttlMs: number): number {
  const jitter = Math.floor(Math.random() * ttlMs * 0.15);
  return ttlMs + jitter;
}

/**
 * Sleep helper for the distributed lock retry loop.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class RedisCache {
  // Hybrid L1 local memory cache to keep server blazing-fast and resilient when Redis is down/slow
  private l1Cache = new Map<string, { value: string; expiry: number }>();
  private readonly maxL1Size = 1000;

  // In-process stampede guard
  private inFlight = new Map<string, Promise<string | null>>();

  // Cache generations to prevent stale in-flight writes from resurrecting deleted/overwritten caches
  private generations = new Map<string, number>();

  /**
   * Namespaces cache keys to isolate application caches from other Redis uses (e.g. BullMQ queues, rate limits).
   */
  private getRedisKey(key: string): string {
    return `appcache:${key}`;
  }

  private setL1(key: string, value: string, ttlMs: number) {
    this.l1Cache.set(key, { value, expiry: Date.now() + ttlMs });
    if (this.l1Cache.size > this.maxL1Size) {
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey !== undefined) {
        this.l1Cache.delete(firstKey);
      }
    }
  }

  async set<T>(key: string, data: T, ttlMs: number) {
    try {
      const value = JSON.stringify(data);
      const jitteredTtl = withJitter(ttlMs);

      // Increment generation when set() overwrites a key to invalidate running in-flight fetches
      this.generations.set(key, (this.generations.get(key) ?? 0) + 1);

      // Store in L1 cache
      this.setL1(key, value, jitteredTtl);

      if (redis.status === 'ready') {
        const redisKey = this.getRedisKey(key);
        await redis.set(redisKey, value, 'PX', jitteredTtl);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[CACHE SET ERROR] for key ${key}:`, err);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check L1 cache first
      const local = this.l1Cache.get(key);
      if (local && local.expiry > Date.now()) {
        return JSON.parse(local.value) as T;
      } else if (local) {
        this.l1Cache.delete(key);
      }

      if (redis.status !== 'ready') {
        return null;
      }

      const redisKey = this.getRedisKey(key);
      const value = await redis.get(redisKey);
      if (!value) return null;

      // Populate L1 cache for subsequent fast reads
      this.setL1(key, value, 30000);

      return JSON.parse(value) as T;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[CACHE GET ERROR] for key ${key}:`, err);
      }
      return null;
    }
  }

  /**
   * getOrSet — Cache Stampede / Thundering Herd prevention.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
    options?: {
      /** Max ms to wait for another instance to populate the cache. Default 4000ms */
      lockTimeoutMs?: number;
      /** How often to poll while waiting for the lock. Default 100ms */
      lockPollMs?: number;
    }
  ): Promise<T> {
    // 1. Try the cache first (L1 → Redis)
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const lockTimeoutMs = options?.lockTimeoutMs ?? 4000;
    const lockPollMs = options?.lockPollMs ?? 100;
    const lockKey = `lock:${key}`;
    const lockToken = uuidv4(); // Unique token to verify lock ownership

    // 2. In-process deduplication
    const existing = this.inFlight.get(key);
    if (existing) {
      const raw = await existing;
      if (raw) return JSON.parse(raw) as T;
    }

    // Capture the generation before initiating the fetch
    const startGen = this.generations.get(key) ?? 0;

    // 3. Distributed lock
    let acquiredLock = false;
    if (redis.status === 'ready') {
      const result = await redis.set(lockKey, lockToken, 'PX', lockTimeoutMs, 'NX');
      acquiredLock = result === 'OK';
    } else {
      acquiredLock = true;
    }

    if (acquiredLock) {
      // We hold the lock — run the fetcher and populate the cache.
      const fetchPromise = (async (): Promise<string | null> => {
        try {
          const data = await fetcher();

          // Prevent stale writes: Only write to cache if the key hasn't been invalidated since we started
          const currentGen = this.generations.get(key) ?? 0;
          if (currentGen === startGen) {
            await this.set(key, data, ttlMs);
          }
          return JSON.stringify(data);
        } finally {
          this.inFlight.delete(key);
          if (redis.status === 'ready') {
            // Safe release: only delete the lock if we still own it (prevents deleting successor locks)
            const script = `
              if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
              else
                return 0
              end
            `;
            await redis.eval(script, 1, lockKey, lockToken).catch(() => {});
          }
        }
      })();

      this.inFlight.set(key, fetchPromise);
      const raw = await fetchPromise;
      if (raw) return JSON.parse(raw) as T;
    } else {
      // Another instance holds the lock — wait for it to populate the cache.
      const deadline = Date.now() + lockTimeoutMs;
      while (Date.now() < deadline) {
        await sleep(lockPollMs);
        const freshlyCached = await this.get<T>(key);
        if (freshlyCached !== null) return freshlyCached;
      }
    }

    // Fallback: fetch directly and cache the result to prevent stampedes on next requests
    const fallbackData = await fetcher();
    const currentGen = this.generations.get(key) ?? 0;
    if (currentGen === startGen) {
      await this.set(key, fallbackData, ttlMs);
    }
    return fallbackData;
  }

  async deleteMatch(pattern: string | string[]) {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    // Clear matching keys in L1 cache
    const regexes = patterns.map(p => {
      const regexString = '^' + p
        .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') // escape regex chars
        .replace(/\\\*/g, '.*'); // convert escaped * back to .*
      return new RegExp(`${regexString}$`); // Anchor to end to match exact Redis MATCH behavior
    });

    for (const key of this.l1Cache.keys()) {
      if (regexes.some(rx => rx.test(key))) {
        this.l1Cache.delete(key);
      }
    }

    // Bump generations for affected in-flight keys to prevent stale writes
    for (const key of this.inFlight.keys()) {
      if (regexes.some(rx => rx.test(key))) {
        this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
      }
    }

    if (redis.status === 'ready') {
      await Promise.all(
        patterns.map(async (p) => {
          const redisPattern = this.getRedisKey(p);
          let cursor = '0';
          let matchedCount = 0;
          do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', redisPattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
              matchedCount += keys.length;
              await redis.del(...keys);
            }
          } while (cursor !== '0');

          if (matchedCount > 0 && process.env.NODE_ENV !== 'production') {
            console.log(`🧹 Cache Clearing: Pattern [${redisPattern}] matched and cleared ${matchedCount} keys in Redis.`);
          }
        })
      );
    }
  }

  async clear() {
    this.l1Cache.clear();
    
    // Advance generations for all active in-flight fetches so they don't resurrect cleared cache
    for (const key of this.inFlight.keys()) {
      this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
    }

    // Clean up generations for keys that are not active in flight
    for (const key of Array.from(this.generations.keys())) {
      if (!this.inFlight.has(key)) {
        this.generations.delete(key);
      }
    }

    this.inFlight.clear();

    if (redis.status === 'ready') {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'appcache:*', 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    }
  }
}

export const dataCache = new RedisCache();
