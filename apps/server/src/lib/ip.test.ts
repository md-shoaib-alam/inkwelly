import { test, expect } from 'bun:test';
import { Elysia } from 'elysia';
import { getClientIp, ipInCidr } from './ip';

process.env.TRUSTED_PROXY_IPS = '172.18.0.0/16, 127.0.0.1';

const req = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/auth/login', { method: 'POST', headers });

const peerServer = (address: string) => ({ requestIP: () => ({ address, port: 5000, family: 'IPv4' }) }) as any;

test('XFF is honored only when the peer is a listed proxy', () => {
  expect(getClientIp(req({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }), peerServer('172.18.0.5')))
    .toBe('203.0.113.9');
});

test('a non-proxy peer cannot spoof its IP via XFF (the old bypass)', () => {
  expect(getClientIp(req({ 'x-forwarded-for': '1.2.3.4' }), peerServer('203.0.113.9')))
    .toBe('203.0.113.9');
});

test('trusted proxy with no XFF falls back to the peer', () => {
  expect(getClientIp(req(), peerServer('127.0.0.1'))).toBe('127.0.0.1');
});

test('ipInCidr matches correctly', () => {
  expect(ipInCidr('172.18.0.5', '172.18.0.0/16')).toBe(true);
  expect(ipInCidr('172.19.0.5', '172.18.0.0/16')).toBe(false);
  expect(ipInCidr('garbage', '172.18.0.0/16')).toBe(false);
});

// The shape of the bug this guards: a handler that omits the `server` argument
// gets the literal 'anonymous', and every such caller shares that one key — so
// LOGIN_MAX_ATTEMPTS failures from a single client lock out the whole deployment.
test('omitting server collapses every caller onto one shared key', () => {
  expect(getClientIp(req())).toBe('anonymous');
  expect(getClientIp(req(), undefined)).toBe('anonymous');
});

// `server` has to be populated inside a real route handler or the fix in
// src/auth/login.ts is a no-op. app.handle() leaves it null, so listen on an
// ephemeral port and send a genuine request.
test('Elysia hands a route handler a server that resolves the peer address', async () => {
  let seen = '';
  const app = new Elysia()
    .post('/probe', ({ request, server }) => {
      seen = getClientIp(request, server);
      return { ok: true };
    })
    .listen({ port: 0, hostname: '127.0.0.1' });

  try {
    await fetch(`http://127.0.0.1:${(app.server as any).port}/probe`, { method: 'POST' });
  } finally {
    await app.stop();
  }

  expect(seen).not.toBe('anonymous');
  expect(['127.0.0.1', '::1', '::ffff:127.0.0.1']).toContain(seen);
});
