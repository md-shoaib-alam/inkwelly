import { test, expect, beforeEach } from 'bun:test';
import {
  authCacheKey, getAuthCache, setAuthCache,
  invalidateForUser, clearAuthCache, authCacheStats,
} from './authCache';

const entry = (id: string) => ({
  user: { id, exp: Math.floor(Date.now() / 1000) + 600 },
  tenantId: 't1',
  dbUser: { name: 'n', tenantId: 't1' },
});

beforeEach(() => clearAuthCache());

test('miss returns null, hit returns the entry', () => {
  const k = authCacheKey('tok1');
  expect(getAuthCache(k)).toBeNull();
  setAuthCache(k, entry('u1'));
  expect(getAuthCache(k)?.user.id).toBe('u1');
});

test('entries expire after the TTL', async () => {
  process.env.AUTH_CACHE_TTL_MS = '50';
  const k = authCacheKey('tok2');
  setAuthCache(k, entry('u2'));
  await Bun.sleep(80);
  expect(getAuthCache(k)).toBeNull();
  delete process.env.AUTH_CACHE_TTL_MS;
});

test('an entry whose token exp has passed is a miss even inside the TTL', () => {
  const k = authCacheKey('tok3');
  setAuthCache(k, { ...entry('u3'), user: { id: 'u3', exp: Math.floor(Date.now() / 1000) - 1 } });
  expect(getAuthCache(k)).toBeNull();
});

test('invalidateForUser removes every cached token for that user', () => {
  setAuthCache(authCacheKey('a'), entry('u4'));
  setAuthCache(authCacheKey('b'), entry('u4'));
  setAuthCache(authCacheKey('c'), entry('other'));
  invalidateForUser('u4');
  expect(getAuthCache(authCacheKey('a'))).toBeNull();
  expect(getAuthCache(authCacheKey('c'))?.user.id).toBe('other');
});

test('TTL 0 disables caching entirely (rollback knob)', () => {
  process.env.AUTH_CACHE_TTL_MS = '0';
  setAuthCache(authCacheKey('d'), entry('u5'));
  expect(getAuthCache(authCacheKey('d'))).toBeNull();
  expect(authCacheStats().ttlMs).toBe(0);
  delete process.env.AUTH_CACHE_TTL_MS;
});
