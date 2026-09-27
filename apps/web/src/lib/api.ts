/**
 * Centralized API client : all requests go to ElysiaJS backend.
 * Includes silent token refresh with request queuing and automatic retry.
 */

import { env } from './env';
import { triggerGlobalRefresh } from './query-client';

const API_BASE = typeof window !== 'undefined' ? '/api/proxy' : env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_token');
}

function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('school_token', token);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_refresh_token');
}

function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('school_refresh_token', token);
}

function getTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('schoolsaas_tenant_id');
}

function buildHeaders(isFormData: boolean = false): Record<string, string> {
  const token = getToken();
  const tenantId = getTenantId();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

// ── Refresh token logic with queue ──

let isRefreshing = false;
let refreshFailed = false;
let refreshFailedTimer: ReturnType<typeof setTimeout> | null = null;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Mark refresh as failed and auto-reset after 10 s so transient
 * failures (e.g. 409 race, network blip) don't permanently brick the session.
 */
function markRefreshFailed() {
  refreshFailed = true;
  if (refreshFailedTimer) clearTimeout(refreshFailedTimer);
  refreshFailedTimer = setTimeout(() => {
    refreshFailed = false;
    refreshFailedTimer = null;
  }, 10_000);
}

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const data = await res.json();

  // Store the new tokens
  setToken(data.token);
  setRefreshToken(data.refreshToken);

  // Also update cookie so the cookie guard still works
  if (typeof document !== 'undefined') {
    const d = new Date();
    d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
    document.cookie = `school_token=${data.token};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  return data.token;
}

export function forceLogout() {
  if (typeof window === 'undefined') return;
  localStorage.clear();
  sessionStorage.clear();
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const [name] = cookie.split('=');
    document.cookie = name.trim() + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  }
  window.location.href = '/';
}

/**
 * Unified token refresh function:
 * Safe for concurrent callers across REST and GraphQL with automatic queuing.
 */
export async function getValidTokenOrRefresh(): Promise<string> {
  if (refreshFailed) {
    forceLogout();
    throw new Error('Session expired');
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    isRefreshing = false;
    refreshFailed = false;
    processQueue(null, newToken);
    triggerGlobalRefresh();
    return newToken;
  } catch (err) {
    isRefreshing = false;
    markRefreshFailed();
    processQueue(err as Error);
    forceLogout();
    throw err;
  }
}

/**
 * Central request function. On 401 it will:
 *  1. Queue if a refresh is already in progress
 *  2. Otherwise attempt one refresh, then RETRY the original request once
 *  3. On refresh failure, force logout
 *
 * The `attempt` param prevents infinite retry loops (max 2 attempts).
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { params?: Record<string, any> },
  attempt: number = 0
): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const isFormData = body instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: buildHeaders(isFormData),
    body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
    keepalive: true,
  });

  // ── 401 → silent refresh + retry ──
  if (res.status === 401 && attempt < 2) {
    try {
      await getValidTokenOrRefresh();
      return request<T>(method, path, body, options, attempt + 1);
    } catch {
      throw new Error('Session expired');
    }
  }

  // ── Other errors ──
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(errorBody?.error || errorBody?.message || `API Error ${res.status}`);
    (error as any).status = res.status;
    (error as any).body = errorBody;
    throw error;
  }

  return res.json();
}

// ── Public API ──

export const api = {
  get: async <T = any>(path: string, options?: { params?: Record<string, any> }): Promise<T> => {
    return request<T>('GET', path, undefined, options);
  },

  post: async <T = any>(path: string, body?: unknown): Promise<T> => {
    const result = await request<T>('POST', path, body);
    triggerGlobalRefresh(path);
    return result;
  },

  put: async <T = any>(path: string, body?: unknown): Promise<T> => {
    const result = await request<T>('PUT', path, body);
    triggerGlobalRefresh(path);
    return result;
  },

  patch: async <T = any>(path: string, body?: unknown): Promise<T> => {
    const result = await request<T>('PATCH', path, body);
    triggerGlobalRefresh(path);
    return result;
  },

  del: async <T = any>(path: string): Promise<T> => {
    const result = await request<T>('DELETE', path);
    triggerGlobalRefresh(path);
    return result;
  },

  /** Raw fetch for FormData uploads etc. */
  raw: async (path: string, init: RequestInit): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: res.statusText }));
      const error = new Error(errorBody?.error || errorBody?.message || `API Error ${res.status}`);
      (error as any).status = res.status;
      (error as any).body = errorBody;
      throw error;
    }
    const result = await res.json();
    if (init.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(init.method.toUpperCase())) {
      triggerGlobalRefresh(path);
    }
    return result;
  },
};

/** Login via Elysia : returns token + user data */
export async function loginWithElysia(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(body?.error || body?.message || `API Error ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Logout: call server to invalidate tokens, then clear local storage.
 */
export async function logoutWithElysia(): Promise<void> {
  const token = getToken();
  const refreshToken = getRefreshToken();
  if (token) {
    // Fire-and-forget: tell the server to revoke tokens
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken: refreshToken || undefined }),
      });
    } catch {
      // Ignore errors — we'll clear local state regardless
    }
  }
}

/**
 * Drop-in replacement for fetch("/api/...").
 * On 401 it silently refreshes the access token (shared queue with
 * `api.get/post/...`) and retries the request once. If the refresh fails we
 * return the original 401 Response untouched, so callers that inspect
 * `res.status` keep working exactly as before.
 */
export async function apiFetch(path: string, init?: RequestInit, attempt: number = 0): Promise<Response> {
  let cleanPath = path.startsWith('/api') ? path.slice(4) : path;
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  const normalizedBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const url = `${normalizedBase}${cleanPath}`;

  const token = getToken();
  const tenantId = getTenantId();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
  };

  if (init?.headers) {
    const initHeaders = init.headers as Record<string, string>;
    Object.assign(headers, initHeaders);
  } else if (init?.body && typeof init.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
    });
  } catch (err) {
    // An intentional abort (e.g. closing the QR kiosk cancels its long-poll) is not a
    // failure worth alarming the console over — rethrow silently so callers handle it.
    if ((err as Error)?.name === 'AbortError' || init?.signal?.aborted) throw err;
    console.error(`Fetch failed for ${url}:`, err);
    throw err;
  }

  // ── 401 → silent refresh + retry once ──
  if (res.status === 401 && attempt < 1 && getRefreshToken()) {
    try {
      await getValidTokenOrRefresh();
      return apiFetch(path, init, attempt + 1);
    } catch {
      // refresh already forced a logout; hand the 401 back to the caller
    }
  }

  if (res.ok && init?.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(init.method.toUpperCase())) {
    triggerGlobalRefresh(path);
  }
  return res;
}

// Re-export helpers for use in login screen
export { setToken, setRefreshToken, getToken, getRefreshToken };

export { API_BASE };

/**
 * Fetch ALL students for a given classId (or all classes if omitted),
 * automatically paginating through every server page.
 *
 * The server hard-caps each page at MAX_STUDENT_LIMIT=100, so never pass a
 * big limit — just let this function loop until `hasMore` is false.
 */
export async function fetchAllStudents(params: {
  classId?: string;
  status?: string;
  search?: string;
} = {}): Promise<any[]> {
  let page = 1;
  const all: any[] = [];
  while (true) {
    const qs = new URLSearchParams({ mode: 'min', limit: '100', page: String(page) });
    if (params.classId) qs.set('classId', params.classId);
    if (params.status)  qs.set('status',  params.status);
    if (params.search)  qs.set('search',  params.search);

    const res = await apiFetch(`/api/students?${qs.toString()}`);
    const data = await res.json();
    const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
    all.push(...items);
    if (!data?.hasMore || items.length === 0) break;
    page++;
  }
  return all;
}
