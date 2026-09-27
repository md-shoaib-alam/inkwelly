import { env } from '../env';
import { triggerGlobalRefresh } from '../query-client';
const API_BASE = env.NEXT_PUBLIC_API_URL;
const GRAPHQL_ENDPOINT = typeof window !== 'undefined' ? '/graphql-proxy' : `${API_BASE}/graphql`;

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_token');
}

function getStoredTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('schoolsaas_tenant_id');
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_refresh_token');
}

// ── GraphQL-level refresh interceptor ──
let graphqlRefreshing = false;
let graphqlRefreshFailed = false;
let graphqlRefreshFailedTimer: ReturnType<typeof setTimeout> | null = null;

function markGraphqlRefreshFailed() {
  graphqlRefreshFailed = true;
  if (graphqlRefreshFailedTimer) clearTimeout(graphqlRefreshFailedTimer);
  graphqlRefreshFailedTimer = setTimeout(() => {
    graphqlRefreshFailed = false;
    graphqlRefreshFailedTimer = null;
  }, 10_000);
}

async function refreshForGraphQL(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const refreshRes = await fetch(
    typeof window !== 'undefined' ? '/api/proxy/auth/refresh' : `${API_BASE}/auth/refresh`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }
  );

  if (!refreshRes.ok) throw new Error('Refresh failed');
  const data = await refreshRes.json();
  localStorage.setItem('school_token', data.token);
  localStorage.setItem('school_refresh_token', data.refreshToken);
  if (typeof document !== 'undefined') {
    const d = new Date(); d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
    document.cookie = `school_token=${data.token};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }
  return data.token;
}

let batchQueue: Array<{
  query: string;
  variables?: Record<string, unknown>;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}> = [];
let batchTimeout: NodeJS.Timeout | null = null;

async function flushBatch() {
  if (batchQueue.length === 0) return;
  const currentQueue = [...batchQueue];
  batchQueue = [];
  batchTimeout = null;

  const token = getStoredToken();
  const tenantId = getStoredTenantId();

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'x-tenant-id': tenantId } : {})
      },
      body: JSON.stringify(currentQueue.map(op => ({ query: op.query, variables: op.variables }))),
      keepalive: true,
    });

    if (res.status === 401 && !graphqlRefreshFailed) {
      // Try silent refresh then retry the batch
      if (graphqlRefreshing) {
        // Another refresh in progress — reject and let React Query retry
        const err = new Error('Token refresh in progress');
        currentQueue.forEach(op => op.reject(err));
        return;
      }
      graphqlRefreshing = true;
      try {
        const newToken = await refreshForGraphQL();
        graphqlRefreshing = false;
        graphqlRefreshFailed = false;

        // Retry the batch with new token
        const retryRes = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...(tenantId ? { 'x-tenant-id': tenantId } : {})
          },
          body: JSON.stringify(currentQueue.map(op => ({ query: op.query, variables: op.variables }))),
          keepalive: true,
        });

        if (!retryRes.ok) throw new Error(`Batch retry failed: ${retryRes.status}`);
        const retryResults = await retryRes.json();
        currentQueue.forEach((op, index) => {
          const result = retryResults[index];
          if (result.errors) op.reject(new Error(result.errors[0]?.message || 'GraphQL error'));
          else op.resolve(result.data);
        });
        return;
      } catch (refreshErr) {
        graphqlRefreshing = false;
        markGraphqlRefreshFailed();
        // Force logout
        if (typeof window !== 'undefined') {
          localStorage.clear(); sessionStorage.clear();
          window.location.href = '/';
        }
        currentQueue.forEach(op => op.reject(refreshErr));
        return;
      }
    }

    if (!res.ok) throw new Error(`Batch request failed: ${res.status}`);

    const results = await res.json();
    currentQueue.forEach((op, index) => {
      const result = results[index];
      if (result.errors) op.reject(new Error(result.errors[0]?.message || 'GraphQL error'));
      else op.resolve(result.data);
    });
  } catch (err) {
    currentQueue.forEach(op => op.reject(err));
  }
}

export async function graphqlQuery<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  return new Promise((resolve, reject) => {
    batchQueue.push({ query, variables, resolve, reject });
    if (!batchTimeout) {
      batchTimeout = setTimeout(flushBatch, 10); // 10ms batch window
    }
  });
}

export async function graphqlMutate<TData>(mutation: string, variables?: Record<string, unknown>): Promise<TData> {
  // Mutations are usually not batched to maintain order and immediate feedback
  let token = getStoredToken();
  const tenantId = getStoredTenantId();
  let res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(tenantId ? { 'x-tenant-id': tenantId } : {})
    },
    body: JSON.stringify({ query: mutation, variables }),
    keepalive: true,
  });

  // Handle 401 by attempting to refresh token once
  if (res.status === 401 && !graphqlRefreshFailed) {
    try {
      token = await refreshForGraphQL();
      res = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(tenantId ? { 'x-tenant-id': tenantId } : {})
        },
        body: JSON.stringify({ query: mutation, variables }),
        keepalive: true,
      });
    } catch {
      markGraphqlRefreshFailed();
    }
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[GraphQL Mutation Error] Status: ${res.status}`, { 
      mutation: mutation.substring(0, 100) + '...', 
      variables, 
      errorBody 
    });
    throw new Error(`GraphQL error: ${res.status}`);
  }
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error')
  // Mutation text is a stable string literal (unlike minified fn.toString()),
  // so it is a safe tag for scoped cache invalidation.
  triggerGlobalRefresh(mutation)
  return json.data as TData
}
