import { redis } from './redis';

/**
 * Atomic fixed-window counter. INCR and EXPIRE run inside one Lua script, so a
 * key can never be left without a TTL (which would ban an IP forever if the
 * process died between two separate calls) and the window can't be slid open by
 * repeated attempts — the TTL is set only on the first increment.
 */
const INCR_WINDOW_SCRIPT = `
  local c = redis.call('INCR', KEYS[1])
  if c == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return c
`;

export async function incrWithWindow(key: string, windowSeconds: number): Promise<number> {
  const result = await redis.eval(INCR_WINDOW_SCRIPT, 1, key, windowSeconds);
  return Number(result);
}

/**
 * In-process fallback used only when Redis is unavailable, so a Redis outage
 * can't silently disable brute-force protection on security routes. Cleaned up
 * periodically to keep the map from growing unbounded.
 */
const localStore = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of localStore.entries()) {
    if (now > val.resetTime) localStore.delete(key);
  }
}, 60000);

/** Register a hit in local RAM and return the running count for the window. */
export function localHit(key: string, windowMs: number): number {
  const now = Date.now();
  const rec = localStore.get(key);
  if (!rec || now > rec.resetTime) {
    localStore.set(key, { count: 1, resetTime: now + windowMs });
    return 1;
  }
  rec.count += 1;
  return rec.count;
}

export function localPeek(key: string): { count: number; resetTime: number } | null {
  const rec = localStore.get(key);
  if (!rec || Date.now() > rec.resetTime) return null;
  return rec;
}

export function localClear(key: string): void {
  localStore.delete(key);
}

/**
 * One fixed-window hit against Redis, or against process RAM when Redis is down, so an
 * endpoint's limiter cannot silently become "no limiter" during an outage. Returns the
 * running count for the window, including this call.
 */
export async function hitLimit(key: string, windowSeconds: number): Promise<number> {
  if (redis.status === 'ready') {
    try {
      return await incrWithWindow(`ratelimit:${key}`, windowSeconds);
    } catch {
      // Fall through to the local counter.
    }
  }
  return localHit(key, windowSeconds * 1000);
}

// ─── Login attempt limiter (Redis primary, local fallback) ────────────────
// Two independent budgets. A school's users all leave through one NAT address,
// so an IP-only budget of LOGIN_MAX_ATTEMPTS would be spent by five unrelated
// typos; the account budget is what actually stops password stuffing.
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_IP_MAX_ATTEMPTS = 50;
export const LOGIN_WINDOW_SEC = 15 * 60; // 15 minutes

const loginRedisKey = (ip: string) => `ratelimit:login:ip:${ip}`;
const loginLocalKey = (ip: string) => `login:ip:${ip}`;
const loginAccountRedisKey = (account: string) => `ratelimit:login:acct:${account}`;
const loginAccountLocalKey = (account: string) => `login:acct:${account}`;

/** Current failed-attempt state for an IP. */
export async function getLoginAttempts(ip: string): Promise<{ count: number; retryMinutes: number }> {
  return peekAttempts(loginRedisKey(ip), loginLocalKey(ip), LOGIN_IP_MAX_ATTEMPTS);
}

/** Current failed-attempt state for one account identifier (email/phone/username). */
export async function getAccountLoginAttempts(account: string): Promise<{ count: number; retryMinutes: number }> {
  return peekAttempts(loginAccountRedisKey(account), loginAccountLocalKey(account), LOGIN_MAX_ATTEMPTS);
}

async function peekAttempts(redisKey: string, localKey: string, max: number): Promise<{ count: number; retryMinutes: number }> {
  if (redis.status === 'ready') {
    try {
      const raw = await redis.get(redisKey);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= max) {
        const ttl = await redis.ttl(redisKey);
        return { count, retryMinutes: ttl > 0 ? Math.max(1, Math.ceil(ttl / 60)) : 0 };
      }
      return { count, retryMinutes: 0 };
    } catch {
      // Fall through to the local counter.
    }
  }
  const rec = localPeek(localKey);
  const count = rec?.count ?? 0;
  return {
    count,
    retryMinutes: count >= max && rec ? Math.max(1, Math.ceil((rec.resetTime - Date.now()) / 60000)) : 0,
  };
}

/** Record a failed login attempt against both budgets. */
export async function registerFailedLogin(ip: string, account?: string): Promise<void> {
  await Promise.all([
    bump(loginRedisKey(ip), loginLocalKey(ip)),
    account ? bump(loginAccountRedisKey(account), loginAccountLocalKey(account)) : Promise.resolve(),
  ]);
}

async function bump(redisKey: string, localKey: string): Promise<void> {
  if (redis.status === 'ready') {
    try {
      await incrWithWindow(redisKey, LOGIN_WINDOW_SEC);
      return;
    } catch {
      // Fall through to the local counter.
    }
  }
  localHit(localKey, LOGIN_WINDOW_SEC * 1000);
}

/** Clear the failed-attempt counters after a successful login. */
export async function clearLoginAttempts(ip: string, account?: string): Promise<void> {
  const keys = [[loginRedisKey(ip), loginLocalKey(ip)] as const];
  if (account) keys.push([loginAccountRedisKey(account), loginAccountLocalKey(account)] as const);
  for (const [redisKey, localKey] of keys) {
    localClear(localKey);
    if (redis.status === 'ready') {
      try {
        await redis.del(redisKey);
      } catch {
        // Non-fatal.
      }
    }
  }
}
