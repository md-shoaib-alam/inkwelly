import { test, expect } from 'bun:test';
import { authCacheStats, clearAuthCache } from './authCache';
import { signAccessToken } from './jwt';

// Integration-flavored: boots a real Elysia app (the ip.test.ts pattern —
// app.handle() leaves `server` null and skips lifecycle truth). Skips without
// local DB/Redis; the positive-path proof (hit skips IO, deactivation ≤5.5 s)
// is k6 gate G6 in the verification runbook.
const hasInfra = !process.env.SKIP_INTEGRATION;

test.skipIf(!hasInfra)('a token for a nonexistent user 401s and is never cached', async () => {
  const { requireAuth } = await import('./auth');
  const { Elysia } = await import('elysia');
  clearAuthCache();

  const token = await signAccessToken({ id: 'no-such-user', email: 'x@y.z', role: 'staff', tenantId: 't1' });
  const app = new Elysia().use(requireAuth).get('/probe', () => ({ ok: true })).listen({ port: 0, hostname: '127.0.0.1' });
  try {
    const r = await fetch(`http://127.0.0.1:${(app.server as any).port}/probe`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(401);
    expect(authCacheStats().size).toBe(0); // failures are never cached
  } finally {
    await app.stop();
  }
});
