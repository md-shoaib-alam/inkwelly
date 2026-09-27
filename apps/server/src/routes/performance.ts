import { Elysia } from 'elysia';
import { db, getPoolStats, getMemoryStats } from '../lib/db';
import * as schema from '../db/schema';
import { sql, count } from 'drizzle-orm';
import { requireSuperAdmin } from '../lib/auth';
import { redis } from '../lib/redis';
import { getFCMStatus } from '../lib/firebase-admin';
import { checkR2Connection } from '../lib/s3';
import { dataCache } from '../lib/cache';

export const performanceRoutes = new Elysia({ prefix: '/performance' })
  .use(requireSuperAdmin)
  .get('/', async ({ set }) => {
    try {
      const startTime = performance.now();
      
      // 1. Measure DB Latency using lightweight SELECT 1
      const dbStart = performance.now();
      const dbStatus = await db.execute(sql`SELECT 1`).then(() => 'connected').catch(() => 'disconnected');
      const dbLatency = Math.round(performance.now() - dbStart);

      // Cache DB record counts for 5 minutes to prevent expensive queries on every refresh
      let counts = await dataCache.get<{ users: number; classes: number; attendance: number; fees: number }>("platform_performance_counts");
      if (!counts) {
        try {
          const [userCountRes, classCountRes, attendanceCountRes, feeCountRes] = await Promise.all([
            db.select({ count: count() }).from(schema.users),
            db.select({ count: count() }).from(schema.classes),
            db.select({ count: count() }).from(schema.attendance),
            db.select({ count: count() }).from(schema.fees)
          ]);
          counts = {
            users: Number(userCountRes[0]?.count || 0),
            classes: Number(classCountRes[0]?.count || 0),
            attendance: Number(attendanceCountRes[0]?.count || 0),
            fees: Number(feeCountRes[0]?.count || 0)
          };
          await dataCache.set("platform_performance_counts", counts, 300000);
        } catch (err) {
          counts = { users: 0, classes: 0, attendance: 0, fees: 0 };
        }
      }

      const userCount = counts.users;
      const classCount = counts.classes;
      const attendanceCount = counts.attendance;
      const feeCount = counts.fees;
      
      // 2. Check Redis
      let redisHealthy = false;
      try {
        const ping = await redis.ping();
        redisHealthy = ping === 'PONG';
      } catch {
        redisHealthy = false;
      }

      const memory = getMemoryStats();
      const pool = await getPoolStats();

      // 3. Construct PerformanceData response
      const result = {
        status: dbStatus === 'connected' && redisHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
          totalQueries: pool.totalQueries,
          records: {
            users: userCount,
            classes: classCount,
            attendance: attendanceCount,
            fees: feeCount
          }
        },
        server: {
          totalLatency: `${Math.round(performance.now() - startTime)}ms`,
          memory: {
            rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
            external: `${Math.round(process.memoryUsage().external / 1024 / 1024)} MB`
          },
          nodeVersion: process.version,
          platform: process.platform
        },
        concurrency: {
          connectionPool: pool.available ? `${pool.active}/${pool.max} active` : 'unmeasured',
          cacheLayer: redisHealthy ? 'Redis L2 Active' : 'In-memory L1 Only'
        },
        storage: await checkR2Connection()
      };

      return result;
    } catch (error) {
      set.status = 500;
      return { 
        status: 'error', 
        message: 'Performance check failed',
        error: String(error) 
      };
    }
  });

let lastHealthCheckTime = 0;
let cachedHealthServices: any = null;
let cachedHealthStatus = 'healthy';
const HEALTH_CACHE_TTL_MS = 5000; // Cache connectivity checks for 5 seconds

export const healthRoutes = new Elysia()
  .get('/ping', () => ({ status: 'pong' }))
  .get('/health', async ({ set }) => {
    const startTime = performance.now();
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: { status: 'unknown', latency: 0 },
        redis: { status: 'unknown', latency: 0 },
        firebase: { status: 'unknown' },
        storage: { status: 'unknown' },
        server: { status: 'ok' }
      },
      memory: {},
      pool: {}
    };

    try {
      const now = Date.now();
      const useCache = false; // Disable caching to ensure live real-time latency measurement on every request

      if (useCache) {
        health.services = cachedHealthServices;
        health.status = cachedHealthStatus;
      } else {
        // Check Database, Redis, Firebase, and Storage concurrently
        const [dbCheck, redisCheck, firebaseCheck, storageCheck] = await Promise.all([
          // 1. Check Database
          (async () => {
            const dbStart = performance.now();
            try {
              await db.execute(sql`SELECT 1`);
              
              // Cache DB record counts for 5 minutes for health check as well
              let records = await dataCache.get<{ users: number; schools: number }>("platform_health_counts");
              if (!records) {
                const [userRes, tenantRes] = await Promise.all([
                  db.select({ count: count() }).from(schema.users),
                  db.select({ count: count() }).from(schema.tenants)
                ]);
                records = {
                  users: Number(userRes[0]?.count || 0),
                  schools: Number(tenantRes[0]?.count || 0)
                };
                await dataCache.set("platform_health_counts", records, 300000);
              }

              return { status: 'connected', latency: `${Math.round(performance.now() - dbStart)}ms`, records };
            } catch (dbError) {
              return { 
                status: 'disconnected', 
                latency: `${Math.round(performance.now() - dbStart)}ms`, 
                error: dbError instanceof Error ? dbError.message : 'Unknown error' 
              };
            }
          })(),

          // 2. Check Redis & BullMQ
          (async () => {
            const redisStart = performance.now();
            try {
              const ping = await redis.ping();
              return { 
                status: ping === 'PONG' ? 'connected' : 'unhealthy', 
                latency: `${Math.round(performance.now() - redisStart)}ms`,
                bullmqStatus: ping === 'PONG' ? 'connected' : 'disconnected'
              };
            } catch (redisError) {
              return { 
                status: 'disconnected', 
                latency: `${Math.round(performance.now() - redisStart)}ms`, 
                error: redisError instanceof Error ? redisError.message : 'Unknown error',
                bullmqStatus: 'disconnected'
              };
            }
          })(),

          // 3. Check Firebase (FCM)
          (async () => {
            try {
              return getFCMStatus();
            } catch (fcmError) {
              return { status: 'error', error: String(fcmError) };
            }
          })(),

          // 4. Check R2 Storage
          (async () => {
            try {
              return await checkR2Connection();
            } catch (r2Error) {
              return { status: 'error', error: String(r2Error) };
            }
          })()
        ]);

        // Map results back to health structure
        health.services.database = {
          status: dbCheck.status,
          latency: dbCheck.latency,
          records: dbCheck.records,
          error: dbCheck.error
        };
        if (dbCheck.status !== 'connected') health.status = 'degraded';

        health.services.redis = {
          status: redisCheck.status,
          latency: redisCheck.latency,
          error: redisCheck.error
        };
        health.services.bullmq = { status: redisCheck.bullmqStatus };
        if (redisCheck.status !== 'connected') health.status = 'degraded';

        health.services.firebase = firebaseCheck;
        if (firebaseCheck.status !== 'connected' && firebaseCheck.status !== 'disabled') {
          health.status = 'degraded';
        }

        health.services.storage = storageCheck;
        if (storageCheck.status !== 'connected' && storageCheck.status !== 'not_configured') {
          health.status = 'degraded';
        }

        // Check Razorpay (Local check, runs instantly)
        health.services.razorpay = {
          status: (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ? 'connected' : 'not_configured'
        };

        // Cache the connectivity result
        cachedHealthServices = health.services;
        cachedHealthStatus = health.status;
        lastHealthCheckTime = now;
      }

      // Memory Stats (Always Fresh)
      const mem = process.memoryUsage();
      health.memory = {
        rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(mem.external / 1024 / 1024)} MB`
      };

      // Connection Pool Stats (Always Fresh)
      const poolStats = await getPoolStats();
      health.pool = {
        available: poolStats.available,
        max: poolStats.max,
        active: poolStats.active,
        idle: poolStats.idle,
        idleInTransaction: poolStats.idleInTransaction,
        blocked: poolStats.blocked,
        total: poolStats.total,
        totalQueries: poolStats.totalQueries,
      };

      // Server Info (Always Fresh)
      health.server = {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
        totalLatency: `${Math.round(performance.now() - startTime)}ms`
      };

      // Set status code
      if (health.status === 'degraded') { set.status = 503; } else if (health.services.database.status !== 'connected') { set.status = 503; } else {
        set.status = 200;
      }

      return health;
    } catch (error) {
      set.status = 500;
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: error instanceof Error ? error.message : 'Unknown error',
        totalLatency: `${Math.round(performance.now() - startTime)}ms`
      };
    }
  });


