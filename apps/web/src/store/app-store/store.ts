import { create } from 'zustand';
import { AppState, AppUser, UserRole } from './types';
import { 
  STORAGE_KEYS, invalidateCache, parseScreenFromPath, parseTenantFromPath, 
  isValidScreen, CACHE_TTL
} from './utils';
import { getCookie } from '@/lib/cookies';
import { API_BASE, api, logoutWithElysia } from '@/lib/api';
import { env } from '@/lib/env';

function getInitialUser(): { isLoggedIn: boolean; currentUser: AppUser | null } {
  if (typeof window === 'undefined') return { isLoggedIn: false, currentUser: null };
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    const token = getCookie('school_token');
    
    // Security: Only consider logged in if BOTH localStorage user and cookie token exist
    if (stored && token) {
      const parsed = JSON.parse(stored);
      const userData = parsed.state ? parsed.state.currentUser : parsed;
      if (userData && userData.id) return { isLoggedIn: true, currentUser: userData };
    }
  } catch { /* ignore */ }
  return { isLoggedIn: false, currentUser: null };
}

function getInitialScreen(currentUser: AppUser | null): string {
  if (typeof window === 'undefined') return 'dashboard';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_SCREEN);
    if (saved && currentUser && isValidScreen(currentUser.role, saved)) return saved;
  } catch { /* ignore */ }
  return parseScreenFromPath(window.location.pathname) || 'dashboard';
}

function getInitialSidebar(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // If on mobile/tablet, ALWAYS start closed by default
    if (window.innerWidth < 1024) return false;

    // For staff users, default sidebar to closed (collapsed) on desktop unless preferred open
    const userStored = localStorage.getItem(STORAGE_KEYS.USER);
    if (userStored) {
      const parsed = JSON.parse(userStored);
      const userData = parsed.state ? parsed.state.currentUser : parsed;
      if (userData && userData.role === 'staff') {
        const preference = localStorage.getItem('schoolsaas_staff_sidebar_preference');
        if (preference === 'enabled') {
          const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
          if (stored !== null) return stored === 'true';
          return true; // Desktop default is open if preference is explicitly enabled
        }
        return false; // Default to collapsed for staff if disabled or not set
      }
    }

    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (stored !== null) return stored === 'true';
    return true; // Desktop default is open for other roles
  } catch {
    return false;
  }
}

function getInitialTenantInfo(): { id: string | null; slug: string | null; name: string | null; logo: string | null } {
  if (typeof window === 'undefined') return { id: null, slug: null, name: null, logo: null };
  try {
    return {
      id: localStorage.getItem('schoolsaas_tenant_id'),
      slug: localStorage.getItem('schoolsaas_tenant_slug'),
      name: localStorage.getItem('schoolsaas_tenant_name'),
      logo: localStorage.getItem('schoolsaas_tenant_logo'),
    };
  } catch { return { id: null, slug: null, name: null, logo: null }; }
}

// In-flight guard — prevents concurrent refreshPermissions() calls from
// each firing their own /auth/me network request.
let isRefreshingPermissions = false;

const initialUser = getInitialUser();

export const useAppStore = create<AppState>((set, get) => ({
  ...initialUser,
  currentScreen: getInitialScreen(initialUser.currentUser),
  currentSubScreen: null,
  sidebarOpen: getInitialSidebar(),
  currentTenantId: (typeof window !== 'undefined' ? parseTenantFromPath(window.location.pathname) : null) || getInitialTenantInfo().id || initialUser.currentUser?.tenantId || null,
  currentTenantSlug: getInitialTenantInfo().slug || initialUser.currentUser?.tenantSlug || null,
  currentTenantName: getInitialTenantInfo().name || initialUser.currentUser?.tenantName || null,
  currentTenantLogo: getInitialTenantInfo().logo || null,

  login: (user) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        // Persist tenant info so getInitialTenantInfo() restores correctly on fresh page load
        localStorage.setItem('schoolsaas_tenant_id', user.tenantId || '');
        localStorage.setItem('schoolsaas_tenant_slug', user.tenantSlug || '');
        localStorage.setItem('schoolsaas_tenant_name', user.tenantName || '');
        localStorage.setItem('schoolsaas_tenant_logo', user.tenantLogo || '');
        // Pre-populate the profile cache timestamp so refreshPermissions() skips
        // the /auth/me call on the next page load (we JUST got this data from login)
        localStorage.setItem('schoolsaas_profile_cache_time', String(Date.now()));
      } catch { /* ignore */ }
    }
    invalidateCache();
    set({
      isLoggedIn: true,
      currentUser: user,
      currentScreen: 'dashboard',
      currentTenantId: user.tenantId || null,
      currentTenantSlug: user.tenantSlug || null,
      currentTenantName: user.tenantName || null,
      currentTenantLogo: user.tenantLogo || null,
    });
    // DO NOT call refreshPermissions() here — we already have fresh data from the
    // login response. Calling it immediately races with the logout denylist write
    // in Redis and can cause a 401 → logout() → 404 loop.
  },

  logout: () => {
    // Fire-and-forget server-side token revocation
    logoutWithElysia().catch(() => {});

    if (typeof window !== 'undefined') {
      try {
        localStorage.clear(); // COMPLETE wipe of all local data
        sessionStorage.clear(); // COMPLETE wipe of current session memory
      } catch { /* ignore */ }
    }
    invalidateCache();
    if (typeof window !== 'undefined') {
      try {
        // Clear all cookies
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const [name] = cookie.split("=");
          document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      } catch { /* ignore */ }
    }
    set({
      isLoggedIn: false,
      currentUser: null,
      currentScreen: 'dashboard',
      sidebarOpen: false,
      currentTenantId: null,
      currentTenantSlug: null,
      currentTenantName: null,
      currentTenantLogo: null,
    });
  },

  refreshPermissions: async () => {
    const state = get();
    if (!state.isLoggedIn || !state.currentUser) return;

    // Bug fix: prevent concurrent calls from each firing a separate /auth/me request.
    // If a refresh is already in progress, silently skip — the first caller will
    // update state when it finishes.
    if (isRefreshingPermissions) return;

    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    // Grace period: never refresh within 30 seconds of login to avoid
    // racing with the Redis denylist write from the previous logout
    const GRACE_PERIOD = 30 * 1000;

    // Check if we have valid cached profile permissions under 2 hours old
    if (typeof window !== 'undefined') {
      try {
        const cacheTimeStr = localStorage.getItem('schoolsaas_profile_cache_time');
        const cachedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
        if (cacheTimeStr && cachedUserStr) {
          const cacheTime = parseInt(cacheTimeStr);
          // Skip if within grace period OR within normal 2-hour cache window
          if (now - cacheTime < GRACE_PERIOD || now - cacheTime < TWO_HOURS) {
            const parsed = JSON.parse(cachedUserStr);
            const userData = parsed.state ? parsed.state.currentUser : parsed;
            if (userData && userData.id === state.currentUser.id) {
              set({ currentUser: userData });
              return;
            }
          }
        }
      } catch { /* ignore */ }
    }

    isRefreshingPermissions = true;
    try {
      const userData = await api.get(`/auth/me?userId=${encodeURIComponent(state.currentUser.id)}`);
      
      const updatedUser: AppUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        avatar: userData.avatar,
        tenantId: userData.tenantId,
        tenantSlug: userData.tenantSlug,
        tenantName: userData.tenantName,
        tenantLogo: userData.tenantLogo,
        customRole: userData.customRole || null,
        platformRole: userData.platformRole || null,
      };
      set({ currentUser: updatedUser });

      // Sync logo if available in user data but missing in tenant state
      if (userData.tenantLogo && !get().currentTenantLogo) {
        get().setCurrentTenant(
          userData.tenantId,
          userData.tenantName,
          userData.tenantSlug,
          userData.tenantLogo
        );
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          localStorage.setItem('schoolsaas_profile_cache_time', String(now));
        } catch { /* ignore */ }
      }
    } catch (error: any) {
      if (error?.status === 404 || error?.status === 401 || error?.message === 'Session expired') {
        get().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    } finally {
      isRefreshingPermissions = false;
    }
  },

  setCurrentScreen: (screen) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEYS.LAST_SCREEN, screen); } catch { /* ignore */ }
    }
    set({ currentScreen: screen, currentSubScreen: null }); // Reset sub-screen when changing main screen
  },

  setCurrentSubScreen: (subScreen) => {
    set({ currentSubScreen: subScreen });
  },

  setSidebarOpen: (open) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, String(open)); } catch { /* ignore */ }
    }
    set({ sidebarOpen: open });
  },

  toggleSidebar: () => {
    const current = get().sidebarOpen;
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, String(!current)); } catch { /* ignore */ }
    }
    set({ sidebarOpen: !current });
  },

  setCurrentTenant: async (id, name, slug, logo) => {
    // 1. IMMEDIATE, INSTANT State Update for snappy UI transition
    set({ 
      currentTenantId: id, 
      currentTenantName: name, 
      currentTenantSlug: slug, 
      currentTenantLogo: logo // Set original URL immediately so UI loads instantly
    });

    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('schoolsaas_tenant_id', id || '');
      localStorage.setItem('schoolsaas_tenant_name', name || '');
      localStorage.setItem('schoolsaas_tenant_slug', slug || '');
      localStorage.setItem('schoolsaas_tenant_logo', logo || '');
    } catch { /* ignore */ }

    // 2. ASYNCHRONOUS background caching of logo to base64
    // We DO NOT await this so we don't block the UI mounting!
    (async () => {
      if (!logo || logo === 'undefined' || logo === 'null') return;
      try {
        const CACHE_KEY = `schoolsaas_logo_cache_${id}`;
        const cachedStr = localStorage.getItem(CACHE_KEY);
        const now = Date.now();
        const EIGHT_HOURS = 8 * 60 * 60 * 1000;

        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached.url === logo && (now - cached.timestamp < EIGHT_HOURS)) {
            // Update state again with base64 if it's already in cache
            set({ currentTenantLogo: cached.data });
            return;
          }
        }

        // Bug fix: use the Next.js rewrite proxy (/api/proxy/...) in the browser
        // so the request stays same-origin and avoids CORS preflight failures.
        // Only fall back to the raw API URL in SSR (window undefined).
        const logoProxyPath = `/tenants/logo-proxy?url=${encodeURIComponent(logo)}`;
        const proxyUrl = typeof window !== 'undefined'
          ? `/api/proxy${logoProxyPath}`
          : `${env.NEXT_PUBLIC_API_URL}${logoProxyPath}`;
        const response = await fetch(proxyUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          url: logo,
          data: base64Data,
          timestamp: now
        }));
        localStorage.setItem('schoolsaas_tenant_logo', base64Data);
        
        // Update Zustand state quietly once background processing is complete
        set({ currentTenantLogo: base64Data });
      } catch (e) {
        console.warn("Logo background cache fail:", e);
      }
    })();
  },


}));

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const screen = parseScreenFromPath(window.location.pathname);
    // Bug fix: only force-close sidebar on mobile (< 1024 px).
    // On desktop the sidebar should stay in whatever state the user set.
    const isMobile = window.innerWidth < 1024;
    useAppStore.setState(isMobile
      ? { currentScreen: screen, sidebarOpen: false }
      : { currentScreen: screen }
    );
  });
}
