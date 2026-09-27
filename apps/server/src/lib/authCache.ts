// In-process auth result cache. Approved trade-off (spec §2): a logout,
// deactivation or password change takes up to AUTH_CACHE_TTL_MS (default 5000)
// to bite instead of instantly. TTL=0 disables the cache entirely.
import { createHash } from 'node:crypto';

const DEFAULT_TTL_MS = 5000;
const MAX_ENTRIES = 5000;

export interface AuthCacheEntry {
  user: { id: string; exp?: number; [k: string]: any };
  tenantId: string | null;
  dbUser: { name: string; tenantId: string | null };
  expiresAt: number;
}

const cache = new Map<string, AuthCacheEntry>();

function ttlMs(): number {
  const raw = process.env.AUTH_CACHE_TTL_MS;
  const n = raw === undefined ? DEFAULT_TTL_MS : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_MS;
}

export function authCacheKey(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getAuthCache(key: string): AuthCacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const now = Date.now();
  // Belt to the TTL's braces: never outlive the token itself.
  if (now >= entry.expiresAt || (entry.user.exp ?? Infinity) * 1000 <= now) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setAuthCache(key: string, entry: Omit<AuthCacheEntry, 'expiresAt'>): void {
  const ttl = ttlMs();
  if (ttl <= 0) return;
  cache.set(key, { ...entry, expiresAt: Date.now() + ttl });
  if (cache.size > MAX_ENTRIES) {
    // Map iterates insertion-order: dropping from the front evicts oldest-first.
    const now = Date.now();
    for (const [k, e] of cache) {
      if (now >= e.expiresAt || cache.size > MAX_ENTRIES) cache.delete(k);
      else break;
    }
  }
}

export function invalidateForUser(userId: string): void {
  for (const [k, e] of cache) {
    if (e.user?.id === userId) cache.delete(k);
  }
}

export function clearAuthCache(): void {
  cache.clear();
}

export function authCacheStats(): { size: number; ttlMs: number } {
  return { size: cache.size, ttlMs: ttlMs() };
}
