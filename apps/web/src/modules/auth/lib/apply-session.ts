import { setCookie } from '@/lib/cookies';
import { SESSION_EXPIRY_DAYS, STORAGE_KEYS } from '@/store/app-store/utils';
import { setRefreshToken, setToken, type SessionPayload } from '@/lib/api';
import { useAppStore, type CustomRoleInfo, type UserRole } from '@/store/use-app-store';

/**
 * The keys `store.login()` writes to disk (store.ts:97-105). A shared computer keeps none of
 * them: the checkbox promises "leaves nothing on this machine", and the persisted profile is
 * the previous user's name and email sitting in the next visitor's address-bar history. Only
 * the disk copies go — the in-memory store state login() just built is untouched.
 */
const LOGIN_PERSISTED_KEYS = [
  STORAGE_KEYS.USER,
  'schoolsaas_tenant_id',
  'schoolsaas_tenant_slug',
  'schoolsaas_tenant_name',
  'schoolsaas_tenant_logo',
  'schoolsaas_profile_cache_time',
];

/**
 * The single post-login path. Password login and scan login both land here, so the
 * tenant launcher, sidebar gating and refresh loop cannot behave differently between the
 * two. `shared` is the one deliberate difference: a shared computer keeps the session in
 * memory and in a session cookie, and writes nothing to disk.
 */
export function applySession(data: SessionPayload, opts: { shared?: boolean } = {}): void {
  const shared = opts.shared ?? false;

  setToken(data.token, !shared);
  if (data.refreshToken) setRefreshToken(data.refreshToken, !shared);

  if (shared) {
    // setCookie(name, value, 0) would DELETE the cookie (it computes expires=now), so
    // shared mode writes the attribute-free form directly.
    document.cookie = `school_token=${data.token}; path=/; SameSite=Lax`;
  } else {
    setCookie('school_token', data.token, SESSION_EXPIRY_DAYS);
  }

  const u = data.user;
  useAppStore.getState().login({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    avatar: u.avatar ?? undefined,
    tenantId: u.tenantId ?? undefined,
    tenantSlug: u.tenantSlug ?? undefined,
    tenantName: u.tenantName ?? undefined,
    tenantLogo: u.tenantLogo || null,
    // The session body types customRole loosely (`color: string | null`, permissions as
    // decoded JSON) because that is what the server sends; `AppUser` carries the same
    // object unchecked today, so it is handed through rather than re-mapped.
    customRole: (u.customRole as CustomRoleInfo | null) ?? null,
  });

  if (shared && typeof window !== 'undefined') {
    for (const key of LOGIN_PERSISTED_KEYS) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
  }

  const tenantId = u.tenantSlug || u.tenantId;
  // The tenant root, not `/modules`: only the root dispatcher knows how to find this
  // school's active year (the same reason Login.tsx sends it there).
  window.location.href = tenantId ? `/${tenantId}` : '/modules';
}
