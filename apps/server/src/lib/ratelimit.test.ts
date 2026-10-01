import { test, expect, describe } from 'bun:test';
import {
  getLoginAttempts,
  getAccountLoginAttempts,
  registerFailedLogin,
  clearLoginAttempts,
  hitLimit,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_IP_MAX_ATTEMPTS,
} from './ratelimit';

// 192.0.2.0/24 is reserved for documentation, so these addresses can never
// collide with a real client's bucket. Both the Redis and the in-process path
// implement the same semantics, so the assertions hold either way.
let seq = 0;
const ip = () => `192.0.2.${1 + (seq++ % 250)}`;
const acct = (tag: string) => `ratelimit-test-${tag}-${seq}@example.invalid`;

describe('login failure budgets', () => {
  test('an account is blocked after LOGIN_MAX_ATTEMPTS and its neighbours are not', async () => {
    const addr = ip();
    const victim = acct('victim');
    const bystander = acct('bystander');

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) await registerFailedLogin(addr, victim);

    const blocked = await getAccountLoginAttempts(victim);
    expect(blocked.count).toBeGreaterThanOrEqual(LOGIN_MAX_ATTEMPTS);
    expect(blocked.retryMinutes).toBeGreaterThan(0);

    expect((await getAccountLoginAttempts(bystander)).count).toBe(0);
    // Five failures on one account is not five failures on the address; a school
    // behind one NAT address must not be locked out by unrelated typos.
    expect((await getLoginAttempts(addr)).count).toBeLessThan(LOGIN_IP_MAX_ATTEMPTS);

    await clearLoginAttempts(addr, victim);
    expect((await getAccountLoginAttempts(victim)).count).toBe(0);
  });

  test('an address is only blocked once it reaches the much higher IP budget', async () => {
    const addr = ip();
    const tag = acct('flood');

    for (let i = 0; i < LOGIN_IP_MAX_ATTEMPTS; i++) await registerFailedLogin(addr, tag);

    const blocked = await getLoginAttempts(addr);
    expect(blocked.count).toBeGreaterThanOrEqual(LOGIN_IP_MAX_ATTEMPTS);
    expect(blocked.retryMinutes).toBeGreaterThan(0);
    // A different address is untouched — the point of keying by peer IP at all.
    expect((await getLoginAttempts(ip())).count).toBe(0);

    await clearLoginAttempts(addr, tag);
    expect((await getLoginAttempts(addr)).count).toBe(0);
  });

  test('an empty account identifier records against the address only', async () => {
    // login.ts checks the account budget only when an identifier was submitted,
    // so a blank one must never become a bucket every anonymous caller shares.
    const a = ip();
    const b = ip();
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) await registerFailedLogin(a, '');

    expect((await getLoginAttempts(a)).count).toBe(LOGIN_MAX_ATTEMPTS);
    expect((await getLoginAttempts(b)).count).toBe(0);
    expect((await getAccountLoginAttempts('')).count).toBe(0);
    await clearLoginAttempts(a, '');
  });
});

test('hitLimit counts up inside its window', async () => {
  const key = `test:hitlimit:${crypto.randomUUID()}`;
  expect(await hitLimit(key, 60)).toBe(1);
  expect(await hitLimit(key, 60)).toBe(2);
});
