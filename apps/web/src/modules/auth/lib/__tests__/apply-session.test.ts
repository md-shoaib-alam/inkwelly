// apps/web/src/modules/auth/lib/__tests__/apply-session.test.ts
import { beforeEach, describe, expect, it } from 'bun:test';

const store = new Map<string, string>();
const cookieWrites: string[] = [];

(globalThis as any).window = {
  // `pathname` is not part of what these tests assert: the store evaluates
  // parseScreenFromPath(window.location.pathname) at module scope, outside any guard, so
  // importing it against a bare `href` throws before a single test runs.
  location: { href: '', pathname: '/' },
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: {
    setItem: (k: string, v: string) => store.set(k, v),
    getItem: (k: string) => store.get(k) ?? null,
    removeItem: (k: string) => store.delete(k),
  },
};
(globalThis as any).localStorage = (globalThis as any).window.localStorage;
(globalThis as any).document = {};
Object.defineProperty((globalThis as any).document, 'cookie', {
  get: () => cookieWrites.join('; '),
  set: (v: string) => { cookieWrites.push(v); },
});

const { applySession } = await import('../apply-session');
const { useAppStore } = await import('@/store/use-app-store');

const payload = {
  token: 'access.jwt',
  refreshToken: 'refresh.jwt',
  user: {
    id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'admin', avatar: null,
    tenantId: 't1', tenantSlug: 'demo-academy', tenantName: 'Demo', tenantLogo: null,
    phone: null, address: null, customRole: null,
  },
};

beforeEach(() => {
  store.clear();
  cookieWrites.length = 0;
  (globalThis as any).window.location.href = '';
});

describe('applySession', () => {
  it('persists the tokens and seeds the store for a normal computer', () => {
    applySession(payload as any, { shared: false });
    expect(store.get('school_token')).toBe('access.jwt');
    expect(store.get('school_refresh_token')).toBe('refresh.jwt');
    expect(cookieWrites.some((c) => c.startsWith('school_token=access.jwt') && /expires=/i.test(c))).toBe(true);
    expect(useAppStore.getState().currentUser?.id).toBe('u1');
    expect((globalThis as any).window.location.href).toBe('/demo-academy');
  });

  it('writes nothing to disk for a shared computer', () => {
    applySession(payload as any, { shared: true });
    expect(store.size).toBe(0);
    expect(cookieWrites.some((c) => c.startsWith('school_token=access.jwt'))).toBe(true);
    expect(cookieWrites.some((c) => /expires=|max-age=/i.test(c))).toBe(false);
    expect(useAppStore.getState().currentUser?.tenantSlug).toBe('demo-academy');
  });
});
