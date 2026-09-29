import { initSentry, captureException, addBreadcrumb } from './lib/monitoring/sentry';
import { captureError } from './lib/monitoring/posthog';

initSentry();
process.env.TZ = 'Asia/Kolkata';

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { logger } from './lib/logger';
import { redis } from './lib/redis';
import { incrWithWindow, localHit } from './lib/ratelimit';
import { getClientIp } from './lib/ip';

// Fallback local memory store for rate limiting if Redis is offline
const localRateLimitStore = new Map<string, { count: number; resetTime: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of localRateLimitStore.entries()) {
    if (now > val.resetTime) {
      localRateLimitStore.delete(key);
    }
  }
}, 60000);

// Start times for the latency tracker; WeakMap so a request that never completes can't leak
const requestStartTimes = new WeakMap<Request, number>();

import { swagger } from '@elysiajs/swagger';
import { helmet } from 'elysia-helmet';
import { bunCompression } from './lib/compression';
import { serverMetrics } from './lib/server-metrics';

// Route modules
import { authRoutes } from './modules/auth/index';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { studentsRoutes } from './modules/students/students.routes';
import { admissionsRoutes } from './modules/students/admissions.routes';
import { teachersRoutes } from './modules/employees/teachers.routes';
import { classesRoutes } from './modules/academics/classes.routes';
import { attendanceRoutes } from './modules/student-attendance/attendance.routes';
import { homeworkRoutes } from './modules/homework/homework.routes';
import { gradesRoutes } from './modules/examinations/grades.routes';
import { feesRoutes } from './modules/student-fees/fees.routes';
import { reportsRoutes } from './modules/data-io/reports.routes';
import { transportRoutes } from './modules/transport/transport.routes';
import { eventsRoutes } from './modules/communication/events.routes';
import { noticesRoutes } from './modules/communication/notices.routes';
import { parentsRoutes } from './modules/employees/parents.routes';
import { subjectsRoutes } from './modules/academics/subjects.routes';
import { submissionsRoutes } from './modules/examinations/submissions.routes';
import { timetableRoutes } from './modules/timetable/timetable.routes';
import { staffRoutes } from './modules/employees/staff.routes';
import { rolesRoutes } from './modules/iam/roles.routes';
import { subscriptionsRoutes } from './modules/tenancy/subscriptions.routes';
import { ticketsRoutes } from './modules/support/tickets.routes';
import { tenantsRoutes } from './modules/tenancy/tenants.routes';
import { superAdminsRoutes } from './modules/platform/superAdmins.routes';
import { platformRoutes } from './modules/platform/platform.routes';
import { tenantSettingsRoutes } from './modules/tenancy/tenantSettings.routes';
import { promotionsRoutes } from './modules/students/promotions.routes';
import { certificatesRoutes } from './modules/certificates/certificates.routes';
import { leavesRoutes } from './modules/leaves/leaves.routes';
import { staffAttendanceRoutes } from './modules/employee-attendance/staffAttendance.routes';
import { examsRoutes } from './modules/examinations/exams.routes';
import { admitCardsRoutes } from './modules/examinations/admitCards.routes';
import { platformSettingsRoutes } from './modules/platform/platformSettings.routes';
import { integrationsRoutes } from './modules/platform/integrations.routes';
import { notificationsRoutes } from './modules/communication/notifications.routes';
import { assessmentsRoutes } from './modules/examinations/assessments.routes';


import { exportsRoutes, importsRoutes, importRoute } from './modules/data-io/exports.routes';
import { performanceRoutes, healthRoutes } from './modules/platform/performance.routes';
import { graphqlRoutes } from './graphql/route';

import { env } from './lib/env';

// ─── Health Check Cache (throttle DB+Redis pings to once per 10s) ───────────
let _healthCache = {
  healthy: false,
  dbOk: false,
  redisOk: false,
  timestamp: 0,
};
// Single-flight lock: if a refresh is already in progress, all concurrent
// requests await the same promise instead of each spawning their own DB+Redis pings.
let _healthRefreshInFlight: Promise<typeof _healthCache> | null = null;

const app = new Elysia()
  // ─── Global Middleware ──────────────────────────────────
  .use(helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        "style-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
        "img-src": ["'self'", "data:", "cdn.jsdelivr.net", "fastly.jsdelivr.net"],
        "font-src": ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
        "connect-src": ["'self'", "cdn.jsdelivr.net"]
      }
    }
  }))
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'School SaaS API Documentation',
        version: '2.0.0',
        description: 'Advanced Multi-tenant School Management System API'
      },
      tags: [
        { name: 'Auth', description: 'Authentication & Session Management' },
        { name: 'Dashboard', description: 'Analytics & Overview Statistics' },
        { name: 'Students', description: 'Student Information Management' },
        { name: 'Teachers', description: 'Staff & Faculty Management' },
      ]
    }
  }))

  .use(cors({
    origin: env.CORS_ORIGIN === '*' 
      ? true 
      : env.CORS_ORIGIN.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    maxAge: 86400,
  }))
  // ─── Response Compression (Bun-native gzip/deflate; JSON/text bodies only) ───
  .use(bunCompression({ threshold: 1024 }))
  // ─── Request Metrics — onAfterResponse fires even for 429 and thrown errors ───
  .onRequest(({ request }) => {
    requestStartTimes.set(request, performance.now());
    serverMetrics.recordRequestStart();
  })
  .onAfterResponse(({ request, set }) => {
    const startedAt = requestStartTimes.get(request);
    if (startedAt === undefined) return;
    requestStartTimes.delete(request);
    const status = Number(set.status);
    serverMetrics.recordRequestEnd(
      Math.round(performance.now() - startedAt),
      Number.isFinite(status) && status >= 500,
    );
  })
  // ─── Rate Limiting (Hybrid Strategy: Local-First for general, Redis for Security) ───
  .onBeforeHandle(async ({ request, set, server }) => {
    const ip = getClientIp(request, server);
    const path = new URL(request.url).pathname;
    // Per-IP budgets have to assume a whole school shares one NAT address:
    // 5,000 users polling at ~0.05 req/s each is ~250 req/s from a single IP.
    // These counters are flood containment, not fairness — brute force is
    // handled per account in src/lib/ratelimit.ts.
    const limit = process.env.RATE_LIMIT_MAX
      ? parseInt(process.env.RATE_LIMIT_MAX, 10)
      : 30000;
    const windowSeconds = 60;

    // Optimization: Use Local RAM for all general traffic to save Redis commands.
    // Use Redis ONLY for critical security routes like /login or /register.
    const isSecurityRoute = path.includes('/auth/login') || path.includes('/auth/register');

    if (isSecurityRoute) {
      // Security routes stay rate-limited even when Redis is down (fail closed to
      // an in-process counter) so a Redis outage can't disable brute-force
      // protection on /auth/login and /auth/register.
      const key = `ratelimit:security:${ip}`;
      let current: number | null = null;
      if (redis.status === 'ready') {
        try {
          current = await incrWithWindow(key, windowSeconds);
        } catch (err) {
          logger.error(`Redis security rate limit error: ${err}`);
        }
      }
      if (current === null) {
        current = localHit(`security:${ip}`, windowSeconds * 1000);
      }

      // 20 sign-ins/s from one address. The old cap of 50/min (0.83/s) rejected
      // legitimate parents during an 08:00 peak before any attacker was involved;
      // counted successes, not failures, so it could not tell the two apart.
      const floodCap = process.env.LOGIN_FLOOD_MAX ? parseInt(process.env.LOGIN_FLOOD_MAX, 10) : 1200;
      if (current > floodCap) {
        set.status = 429;
        return { error: 'Too many login attempts. Please try again later.' };
      }
    } else {
      // Fast Local RAM rate limiting for everything else
      const now = Date.now();
      const record = localRateLimitStore.get(ip);
      if (!record || now > record.resetTime) {
        localRateLimitStore.set(ip, { count: 1, resetTime: now + 60000 });
      } else {
        record.count++;
        if (record.count > limit) {
          set.status = 429;
          return { error: 'Too many requests, please try again later.' };
        }
      }
    }
  })
  // ─── Request Context (ID & Logger & Performance) ──────────
  .derive(({ request }) => {
    const reqId = crypto.randomUUID();
    const startTime = performance.now();
    return { reqId, log: logger, startTime };
  })
  // ─── Request Logging Middleware ─────────────────────────
  .onBeforeHandle(({ request, reqId, log }) => {
    const { method, url } = request;
    const pathname = new URL(url).pathname;

    if (process.env.LOG_LEVEL !== 'silent') {
      log.info({ reqId, method, url: pathname }, `Incoming ${method} request`);
    }

    addBreadcrumb({
      category: "http",
      message: `${method} ${pathname}`,
      level: "info",
      data: {
        url,
        method,
      }
    });
  })
  .onAfterHandle(({ request, set, reqId, log, startTime }) => {
    const { method, url } = request;
    const duration = Math.round(performance.now() - startTime);

    if (process.env.LOG_LEVEL !== 'silent') {
      log.info({ 
        reqId,
        method, 
        url: new URL(url).pathname, 
        status: set.status,
        durationMs: duration
      }, `Completed ${method} request in ${duration}ms`);
    }
  })

  // ─── Global Error Handler ──────────────────────────────
  .onError(({ code, error, set, request }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Route not found' };
    }

    const { method, url } = request;
    const path = new URL(url).pathname;
    const reqId = crypto.randomUUID(); 

    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error({ 
      reqId,
      code, 
      error: errorMessage, 
      method, 
      path,
      stack: error instanceof Error && process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }, `Server Error: ${errorMessage}`);

    // 🚀 Capture error in Sentry & PostHog
    captureException(error, { method, path, reqId, tenantId: request.headers.get('x-tenant-id') });

    captureError(error, { 
      method, 
      path, 
      reqId,
      // @ts-ignore - tenantId might be in context if available
      tenantId: request.headers.get('x-tenant-id') || undefined 
    });


    if (code === 'VALIDATION') {
      set.status = 400;
      const details = (error as any)?.all
        ? (error as any).all.map((e: any) => `${e.path || 'body'}: ${e.message || 'invalid'}`).join('; ')
        : errorMessage;
      logger.error({ reqId, details }, 'Validation error details');
      return { error: 'Validation error', details };
    }
    // @ts-ignore - Handle rate limit error code
    if (code === 'RATE_LIMIT' || set.status === 429) {
      set.status = 429;
      return { error: 'Too many requests, please try again later.' };
    }
    set.status = 500;
    return { error: 'Internal server error' };
  })

  // ─── API Version 1 ────────────────────────────────────
  .group('/api/v1', (app) =>
    app
      .use(authRoutes)
      .use(dashboardRoutes)
      .use(studentsRoutes)
      .use(admissionsRoutes)
      .use(teachersRoutes)
      .use(classesRoutes)
      .use(attendanceRoutes)
      .use(homeworkRoutes)
      .use(gradesRoutes)
      .use(feesRoutes)
      .use(reportsRoutes)
      .use(transportRoutes)
      .use(eventsRoutes)
      .use(noticesRoutes)
      .use(parentsRoutes)
      .use(subjectsRoutes)
      .use(submissionsRoutes)
      .use(timetableRoutes)
      .use(staffRoutes)
      .use(rolesRoutes)
      .use(subscriptionsRoutes)
      .use(ticketsRoutes)
      .use(tenantsRoutes)
      .use(superAdminsRoutes)
      .use(platformRoutes)
      .use(tenantSettingsRoutes)
      .use(promotionsRoutes)
      .use(certificatesRoutes)
      .use(leavesRoutes)
      .use(staffAttendanceRoutes)
      .use(examsRoutes)
      .use(admitCardsRoutes)
      .use(platformSettingsRoutes)
      .use(notificationsRoutes)
      .use(integrationsRoutes)

      .use(exportsRoutes)
      .use(importsRoutes)
      .use(importRoute)
      .use(performanceRoutes)
      .use(healthRoutes)
  )
  
  // ─── Legacy/Compatibility Fallback (Optional but recommended during transitions) ───
  .group('/api', (app) =>
    app
      .use(authRoutes)
      .use(dashboardRoutes)
      .use(studentsRoutes)
      .use(admissionsRoutes)
      .use(teachersRoutes)
      .use(classesRoutes)
      .use(attendanceRoutes)
      .use(homeworkRoutes)
      .use(gradesRoutes)
      .use(feesRoutes)
      .use(reportsRoutes)
      .use(transportRoutes)
      .use(eventsRoutes)
      .use(noticesRoutes)
      .use(parentsRoutes)
      .use(subjectsRoutes)
      .use(submissionsRoutes)
      .use(timetableRoutes)
      .use(staffRoutes)
      .use(rolesRoutes)
      .use(subscriptionsRoutes)
      .use(ticketsRoutes)
      .use(tenantsRoutes)
      .use(superAdminsRoutes)
      .use(platformRoutes)
      .use(tenantSettingsRoutes)
      .use(promotionsRoutes)
      .use(certificatesRoutes)
      .use(leavesRoutes)
      .use(staffAttendanceRoutes)
      .use(examsRoutes)
      .use(admitCardsRoutes)
      .use(platformSettingsRoutes)
      .use(notificationsRoutes)
      .use(integrationsRoutes)
      .use(assessmentsRoutes)


      .use(exportsRoutes)
      .use(importsRoutes)
      .use(importRoute)
      .use(performanceRoutes)
  )
  .use(graphqlRoutes)
  // ─── Public Ping (no auth, no DB — pure liveness check) ─────────────────────
  .get('/api/ping', () => ({ status: 'pong', timestamp: new Date().toISOString() }))
  // ─── Lightweight Health Check (Throttled — DB+Redis pinged max once per 10s) ───
  .get('/api/health', async ({ set }) => {
    const CACHE_TTL = 10_000; // 10 seconds

    // ── Cache hit: TTL still valid, return stored component results instantly ──
    if (
      _healthCache.timestamp > 0 &&
      Date.now() - _healthCache.timestamp < CACHE_TTL
    ) {
      if (!_healthCache.healthy) set.status = 503;
      return {
        status: _healthCache.healthy ? 'ok' : 'degraded',
        database: _healthCache.dbOk ? 'connected' : 'disconnected',
        redis: _healthCache.redisOk ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        cached: true,
      };
    }

    // ── Single-flight: if a refresh is already running, await it instead of
    //    spawning a duplicate DB+Redis ping. All concurrent callers share one result. ──
    if (!_healthRefreshInFlight) {
      _healthRefreshInFlight = (async () => {
        let dbOk = false;
        let redisOk = false;

        try {
          const { db } = await import('./lib/db');
          const { sql } = await import('drizzle-orm');
          await db.execute(sql`SELECT 1`);
          dbOk = true;
        } catch (err) {
          logger.error('Health check DB ping failed:', err);
        }

        try {
          const pong = await redis.ping();
          redisOk = pong === 'PONG';
        } catch (err) {
          logger.error('Health check Redis ping failed:', err);
        }

        // Timestamp after evaluation completes so the TTL reflects real freshness
        _healthCache = { healthy: dbOk && redisOk, dbOk, redisOk, timestamp: Date.now() };
        return _healthCache;
      })().finally(() => {
        _healthRefreshInFlight = null;
      });
    }

    const result = await _healthRefreshInFlight!;

    if (!result.healthy) set.status = 503;
    return {
      status: result.healthy ? 'ok' : 'degraded',
      database: result.dbOk ? 'connected' : 'disconnected',
      redis: result.redisOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      cached: false,
    };
  })
  .get('/favicon.ico', ({ set }) => {
    set.status = 204;
    return;
  })


  // ─── Start Server ──────────────────────────────────────
  .listen({
    port: env.PORT,
    hostname: '0.0.0.0',
    maxRequestBodySize: 50 * 1024 * 1024, // 50MB — support large Excel imports
    idleTimeout: 30, // Bun kills idle connections after 10s by default; the QR kiosk long-polls for up to 20s
  });

// ─── Asynchronously Start BullMQ Workers if requested ─────
if (process.env.START_WORKERS === 'true') {
  import('./lib/worker')
    .then(() => console.log('🟢 Background BullMQ Workers active in this process.'))
    .catch((err) => console.error('❌ Failed to start background workers:', err));
}

console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🚀 ElysiaJS Server Running on Bun!               ║
╠═══════════════════════════════════════════════════════════╣
║  URL:      http://localhost:${env.PORT}                        ║
║  Health:   http://localhost:${env.PORT}/api/health             ║
║  API:      http://localhost:${env.PORT}/api/*                  ║
║  GraphQL:  http://localhost:${env.PORT}/api/graphql             ║
║  Runtime:  Bun ${Bun.version}                             ║
║  Mode:     ${env.NODE_ENV}                          ║
╚═══════════════════════════════════════════════════════════╝
`);

console.log(`⏱️ [STARTUP] Total process boot time: ${process.uptime().toFixed(3)}s`);

// ─── Graceful Shutdown ─────────────────────────────────────
const handleShutdown = async () => {
  console.log('\n🛑 Shutdown signal received. Closing connections...');
  
  try {
    const { rawDb } = await import('./lib/db');
    await Promise.all([
      rawDb.end(),
      redis.quit()
    ]);
    console.log('✅ Connections closed. Exiting process.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// ─── Global Uncaught Error Handlers (Prevents Crash on Redis/Worker disconnects) ───
process.on('uncaughtException', (err) => {
  console.error('💥 [CRITICAL] Uncaught Exception:', err);
  logger.error(err, 'Uncaught Exception detected! Keeping process alive.');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error({ reason }, 'Unhandled Rejection at Promise! Keeping process alive.');
});

export type App = typeof app;
