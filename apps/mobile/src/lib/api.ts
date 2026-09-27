import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_IP = process.env.EXPO_PUBLIC_API_IP || 'https://eylisia-server.onrender.com';
export const DEFAULT_PORT = '4000';

const REFRESH_TOKEN_KEY = '@school_refresh_token';

function formatUrl(input: unknown) {
  let formatted = typeof input === 'string' ? input.trim() : '';
  if (!formatted) {
    formatted = 'https://eylisia-server.onrender.com';
  }

  const base = formatted.startsWith('http://') || formatted.startsWith('https://')
    ? (formatted.endsWith('/') ? formatted.slice(0, -1) : formatted)
    : `http://${formatted}:${DEFAULT_PORT}`;

  return base.includes('/api') ? base : `${base}/api`;
}

let dynamicApiBaseUrl = formatUrl(DEFAULT_IP);

/**
 * Updates the API host/IP and re-formats the base URL.
 * @param hostOrUrl The IP address, hostname, or full URL.
 */
export function setApiBaseUrl(hostOrUrl: string) {
  dynamicApiBaseUrl = formatUrl(hostOrUrl);
}

export function getApiBaseUrl() {
  return dynamicApiBaseUrl;
}

let authToken: string | null = null;
let tenantId: string | null = null;

export function setAuthSession(token: string | null, activeTenantId: string | null) {
  authToken = token;
  tenantId = activeTenantId;
  refreshFailed = false;
}

let onUnauthorizedCallback: (() => void) | null = null;

export function registerOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

async function checkConnection() {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) {
    // status 0 marks a *definitive* offline pre-flight failure. isTransientError()
    // treats it as non-retryable, so withRetry fails fast instead of hammering
    // a request ~4 times over ~10s when NetInfo already says there's no connection.
    const err = new Error('No internet connection. Please check your network setting and try again.') as Error & { status: number };
    err.status = 0;
    throw err;
  }
}

function getHeaders(isFormData: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }
  return headers;
}

// ── Refresh token logic with queue ──

let isRefreshing = false;
let refreshFailed = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

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

async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function storeRefreshToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

async function removeRefreshToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${dynamicApiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const data = await res.json();

  // Update the in-memory token immediately
  authToken = data.token;

  // Persist the new refresh token
  await storeRefreshToken(data.refreshToken);

  return data.token;
}

// ── Auth failure with silent refresh ──

async function handleAuthFailure(status: number, path: string): Promise<boolean> {
  // Don't intercept login failures
  if (path === '/auth/login' || path === 'auth/login') return false;

  // Only intercept 401/403/404-on-/auth/me
  const shouldIntercept = status === 401 || status === 403 || (status === 404 && path === '/auth/me');
  if (!shouldIntercept) return false;

  // If refresh already failed recently, do hard logout
  if (refreshFailed) {
    if (onUnauthorizedCallback) onUnauthorizedCallback();
    return true;
  }

  // If a refresh is already in progress, queue this failure
  if (isRefreshing) {
    return new Promise<boolean>((resolve) => {
      failedQueue.push({
        resolve: (_token) => resolve(true), // Token was refreshed, caller should retry
        reject: (_err) => {
          if (onUnauthorizedCallback) onUnauthorizedCallback();
          resolve(true);
        },
      });
    });
  }

  // Start refresh
  isRefreshing = true;

  try {
    await refreshAccessToken();
    isRefreshing = false;
    refreshFailed = false;
    processQueue(null, authToken!);
    return true; // Signal: token refreshed, caller should retry
  } catch (err) {
    isRefreshing = false;
    refreshFailed = true;
    processQueue(err instanceof Error ? err : new Error('Refresh failed'), null);
    if (onUnauthorizedCallback) onUnauthorizedCallback();
    return true;
  }
}

export interface RequestOptions {
  params?: Record<string, unknown>;
  skipAuthInterceptor?: boolean;
  timeout?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 25000;

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  _isRetry: boolean = false
): Promise<T> {
  await checkConnection();

  let url = `${dynamicApiBaseUrl}${path}`;
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

  const isFormData =
    body instanceof FormData ||
    (body != null &&
      typeof body === 'object' &&
      (body.constructor?.name === 'FormData' || Array.isArray((body as any)._parts)));

  // Setup abort controller for timeout and external cancellation
  const controller = new AbortController();
  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  let didTimeout = false;

  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  let onParentAbort: (() => void) | undefined;
  if (options?.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      onParentAbort = () => controller.abort();
      options.signal.addEventListener('abort', onParentAbort, { once: true });
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: getHeaders(isFormData),
      body: isFormData ? (body as any) : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (fetchErr: any) {
    clearTimeout(timer);
    if (onParentAbort && options?.signal) {
      options.signal.removeEventListener('abort', onParentAbort);
    }
    if (didTimeout) {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs / 1000}s. Please check your connection.`) as Error & { status: number };
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw fetchErr;
  } finally {
    clearTimeout(timer);
    if (onParentAbort && options?.signal) {
      options.signal.removeEventListener('abort', onParentAbort);
    }
  }

  if (!response.ok) {
    // Only run the global auth interceptor (logout trigger) when explicitly allowed.
    // Callers like the periodic user-existence check pass skipAuthInterceptor:true so
    // a transient network hiccup does not silently log the user out.
    if (!options?.skipAuthInterceptor) {
      const handled = await handleAuthFailure(response.status, path);

      if (handled && authToken && !_isRetry) {
        // Token was refreshed — retry the original request once with the new token
        return request<T>(method, path, body, options, true);
      }
    }

    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Not a JSON response or no error field
    }

    // Attach the HTTP status to the error so callers can distinguish
    // a definitive auth failure (401/404) from a transient server error.
    const err = new Error(errorMessage) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  return await response.json();
}

/**
 * Server-side logout: revoke tokens on the server.
 */
export async function serverLogout(): Promise<void> {
  try {
    const refreshToken = await getStoredRefreshToken();
    await fetch(`${dynamicApiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: refreshToken || undefined }),
    });
  } catch {
    // Ignore — we'll clear local state regardless
  }
}

export const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),

  post: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),

  put: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),

  patch: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),

  delete: <T = any>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

/**
 * Returns true for errors that are safe to retry:
 *   - Network/fetch failures (no HTTP status attached)
 *   - 5xx server errors (server crashed, cold-starting, overloaded)
 *
 * Auth errors (4xx) are intentionally NOT retried — they represent
 * definitive server rejections that the user or token-refresh flow
 * must resolve.
 */
export function isTransientError(err: unknown): boolean {
  const status = (err as any)?.status as number | undefined;
  if (status === undefined) return true;   // network / fetch failure
  return status >= 500;                    // server-side crash / cold-start
}

/**
 * Wraps an async function with automatic exponential-backoff retries.
 * Only retries on transient failures (network errors, 5xx).
 * 4xx errors propagate immediately without retry.
 *
 * @param fn        The async function to retry.
 * @param maxTries  Total attempts (default 4 = 3 retries after the first try).
 * @param baseDelay Initial delay in ms; doubles each attempt (default 1500ms).
 * @param signal    Optional AbortSignal to cancel in-flight retries.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxTries = 4,
  baseDelay = 1500,
  signal?: AbortSignal
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxTries; attempt++) {
    if (signal?.aborted) throw new Error('Cancelled');
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err)) throw err;  // 4xx — don't retry
      if (attempt < maxTries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);   // 1.5s, 3s, 6s…
        await new Promise<void>((resolve, reject) => {
          let timer: ReturnType<typeof setTimeout>;
          const onAbort = () => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            reject(new Error('Cancelled'));
          };
          timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
          }, delay);
          signal?.addEventListener('abort', onAbort, { once: true });
        });
      }
    }
  }
  throw lastErr;
}

// Export refresh token helpers for use in auth context
export { storeRefreshToken, removeRefreshToken, REFRESH_TOKEN_KEY };

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
    const qs: Record<string, string> = { mode: 'min', limit: '100', page: String(page) };
    if (params.classId) qs.classId = params.classId;
    if (params.status)  qs.status  = params.status;
    if (params.search)  qs.search  = params.search;
    const query = Object.entries(qs).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

    const data = await api.get<any>(`/students?${query}`);
    const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
    all.push(...items);
    if (!data?.hasMore || items.length === 0) break;
    page++;
  }
  return all;
}
