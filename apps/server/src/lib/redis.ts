import Redis from 'ioredis';

import { env } from './env';

const REDIS_URL = env.REDIS_URL.replace(/^["']|["']$/g, '');

/**
 * General-purpose Redis client (cache, rate-limiting, etc.)
 * Uses timeouts so a missing Redis server doesn't hang requests.
 */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 3000,
  commandTimeout: 2000,
  lazyConnect: true, // Don't block startup; connect on first use
  retryStrategy(times) {
    // Phase 1: Rapid retries (200ms → 2000ms) for the first 5 attempts
    if (times <= 5) return Math.min(times * 200, 2000);
    // Phase 2: Retry every 1 minute indefinitely so it auto-reconnects
    console.warn(`⏳ [REDIS] Retry attempt #${times} — reconnecting every 1 min...`);
    return 60 * 1000; // 1 minute
  },
  reconnectOnError(err) {
    return err.message.includes('READONLY');
  },
});

// Asynchronously trigger lazy connection on boot without blocking startup
redis.connect().catch(() => {
  // Gracefully ignored; standard error event listeners handles console logs
});

/**
 * BullMQ-dedicated Redis client.
 * BullMQ REQUIRES maxRetriesPerRequest: null — do NOT change this.
 * Kept separate so BullMQ's blocking commands don't affect general requests.
 */
export const bullmqRedis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy(times) {
    // Phase 1: Exponential backoff (500ms → 5000ms) for first 5 attempts
    if (times <= 5) return Math.min(times * 500, 5000);
    // Phase 2: Retry every 1 minute indefinitely so workers auto-reconnect
    console.warn(`⏳ [BULLMQ REDIS] Retry attempt #${times} — reconnecting every 1 min...`);
    return 60 * 1000; // 1 minute
  },
});

// NOTE: This Redis instance is shared between the app cache and BullMQ.
// BullMQ REQUIRES maxmemory-policy=noeviction — an LRU/LFU policy would evict
// queue/job keys under memory pressure and silently lose jobs. The policy is set
// in infrastructure config (docker-compose.yml for local, the provider dashboard
// for managed Redis such as Upstash), NOT at runtime: CONFIG SET is blocked on
// most managed services and would fail silently here.

export let isRedisConnected = false;
export let isBullmqRedisConnected = false;

let lastGeneralErrorTime = 0;
let lastBullmqErrorTime = 0;
const ERROR_THROTTLE_MS = 30000; // Log at most once every 30 seconds to prevent console spam

redis.on('error', (err) => {
  isRedisConnected = false;
  const now = Date.now();
  if (now - lastGeneralErrorTime > ERROR_THROTTLE_MS) {
    console.error('⚠️ [REDIS OFFLINE]: Redis is offline or connection refused. Reconnecting in background...');
    lastGeneralErrorTime = now;
  }
});

redis.on('ready', () => {
  if (!isRedisConnected) {
    isRedisConnected = true;
    console.log('✅ Redis Connected (general)');
  }
});

redis.on('close', () => {
  isRedisConnected = false;
});

redis.on('end', () => {
  isRedisConnected = false;
});

bullmqRedis.on('error', (err) => {
  isBullmqRedisConnected = false;
  const now = Date.now();
  if (now - lastBullmqErrorTime > ERROR_THROTTLE_MS) {
    console.error('⚠️ [BULLMQ OFFLINE]: Redis is offline. Background workers are waiting for Redis...');
    lastBullmqErrorTime = now;
  }
});

bullmqRedis.on('ready', () => {
  if (!isBullmqRedisConnected) {
    isBullmqRedisConnected = true;
    console.log('✅ Redis Connected (bullmq)');
  }
});

bullmqRedis.on('close', () => {
  isBullmqRedisConnected = false;
});

bullmqRedis.on('end', () => {
  isBullmqRedisConnected = false;
});

/**
 * Helper to check if redis is actually usable
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const ping = await Promise.race([
      redis.ping(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2000)
      ),
    ]);
    return ping === 'PONG';
  } catch {
    return false;
  }
}
