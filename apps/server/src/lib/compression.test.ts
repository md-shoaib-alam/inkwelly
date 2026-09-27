import { describe, it, expect } from 'bun:test';
import { Elysia } from 'elysia';
import { bunCompression } from './compression';
import { serverMetrics } from './server-metrics';

describe('Server Optimizations Suite', () => {
  describe('bunCompression', () => {
    it('compresses JSON responses larger than threshold with gzip', async () => {
      const app = new Elysia()
        .use(bunCompression({ threshold: 500 }))
        .get('/large', () => ({
          items: Array(100).fill({ id: 1, name: 'Sample Item', description: 'Testing native Bun compression' })
        }));

      const res = await app.handle(
        new Request('http://localhost/large', {
          headers: { 'accept-encoding': 'gzip, deflate' }
        })
      );

      expect(res.status).toBe(200);
      expect(res.headers.get('content-encoding')).toBe('gzip');
      expect(res.headers.get('content-type')).toContain('application/json');

      const arrayBuf = await res.arrayBuffer();
      // Compressed size should be well under 500 bytes (original is ~6KB)
      expect(arrayBuf.byteLength).toBeLessThan(500);
    });

    it('does not compress responses smaller than threshold', async () => {
      const app = new Elysia()
        .use(bunCompression({ threshold: 1024 }))
        .get('/small', () => ({ ok: true }));

      const res = await app.handle(
        new Request('http://localhost/small', {
          headers: { 'accept-encoding': 'gzip' }
        })
      );

      expect(res.status).toBe(200);
      expect(res.headers.get('content-encoding')).toBeNull();
    });

    it('serves uncompressed response if client does not send accept-encoding', async () => {
      const app = new Elysia()
        .use(bunCompression())
        .get('/large', () => ({
          data: 'x'.repeat(2000)
        }));

      const res = await app.handle(new Request('http://localhost/large'));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-encoding')).toBeNull();
    });

    it('leaves binary bodies alone instead of JSON-stringifying them', async () => {
      // Regression guard: routes like GET /tenants/logo return a raw Buffer.
      const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(4000, 7)]);

      const app = new Elysia()
        .use(bunCompression({ threshold: 100 }))
        .get('/logo', ({ set }) => {
          set.headers['content-type'] = 'image/png';
          return png;
        });

      const res = await app.handle(
        new Request('http://localhost/logo', { headers: { 'accept-encoding': 'gzip' } })
      );

      expect(res.status).toBe(200);
      expect(res.headers.get('content-encoding')).toBeNull();
      const body = Buffer.from(await res.arrayBuffer());
      expect(body.subarray(0, 4).toString('hex')).toBe('89504e47');
    });
  });

  describe('serverMetrics Tracker', () => {
    it('accurately tracks requests, latency, and errors', () => {
      const before = serverMetrics.getMetrics();
      serverMetrics.recordRequestStart();
      serverMetrics.recordRequestEnd(15, false);

      serverMetrics.recordRequestStart();
      serverMetrics.recordRequestEnd(25, true);

      const after = serverMetrics.getMetrics();
      expect(after.totalRequests).toBeGreaterThanOrEqual(before.totalRequests + 2);
      expect(after.totalErrors).toBeGreaterThanOrEqual(before.totalErrors + 1);
      expect(typeof after.uptimeSeconds).toBe('number');
    });
  });
});
