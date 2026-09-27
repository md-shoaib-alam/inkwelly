import { test, expect } from 'bun:test';
import { Elysia } from 'elysia';
import { performanceRoutes, healthRoutes } from './routes/performance';
import { transportRoutes } from './routes/transport';

// Mirrors the post-edit mount structure of src/index.ts:
// /api/v1 group (with healthRoutes + performanceRoutes + transportRoutes), legacy /api
// group (performanceRoutes, transportRoutes, no healthRoutes), then top-level
// /api/ping + /api/health.
const app = new Elysia()
  .group('/api/v1', (a) =>
    a.use(performanceRoutes).use(healthRoutes).use(transportRoutes)
  )
  .group('/api', (a) => a.use(performanceRoutes).use(transportRoutes))
  .get('/api/ping', () => ({ status: 'pong', timestamp: new Date().toISOString() }))
  .get('/api/health', async () => ({
    status: 'healthy',
    database: 'connected',
    redis: 'connected',
    timestamp: new Date().toISOString(),
  }))
  .compile();

async function probe(path: string) {
  const res = await app.handle(new Request(`http://localhost${path}`));
  const body = await res.json().catch(() => ({}));
  return { status: res.status, hasServices: 'services' in body, body };
}

test('route resolution after duplicate mount removal', async () => {
  const v1Health = await probe('/api/v1/health');
  expect(v1Health.status).toBe(200);
  expect(v1Health.hasServices).toBe(true); // rich healthRoutes handler

  const apiHealth = await probe('/api/health');
  expect(apiHealth.status).toBe(200);
  expect(apiHealth.body.status).toBe('healthy'); // lightweight top-level handler
  expect(apiHealth.hasServices).toBe(false);

  const apiPing = await probe('/api/ping');
  expect(apiPing.status).toBe(200);
  expect(apiPing.body.status).toBe('pong');

  // /performance is super-admin gated (routes/performance.ts:12): 401 means the mount
  // was reached, 404 would mean the route vanished — which is the bug this test exists for.
  const perf = await probe('/api/performance');
  expect(perf.status).toBe(401);
  expect(perf.body.error).toBe('Unauthorized');

  const v1Perf = await probe('/api/v1/performance');
  expect(v1Perf.status).toBe(401);
  expect(v1Perf.body.error).toBe('Unauthorized');
});

// transportRoutes was mounted under /api/v1 only, so every client on the legacy /api
// base (web's NEXT_PUBLIC_API_URL, and Expo's api.ts, which hard-appends /api) got
// 404 {"error":"Route not found"} and the caller did res.json() on it as an array.
test('transport resolves under both mounts', async () => {
  for (const path of ['/transport-routes', '/vehicles', '/transport-assignments']) {
    for (const prefix of ['/api', '/api/v1']) {
      const res = await probe(`${prefix}${path}`);
      // requireAuth is local to transportRoutes, so 401 proves the route matched;
      // an unmounted prefix falls through to the app-level 404.
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    }
  }
});
