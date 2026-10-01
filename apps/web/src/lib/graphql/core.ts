import { env } from '../env';
import { triggerGlobalRefresh } from '../query-client';
import { getToken, getValidTokenOrRefresh } from '@/lib/api';
const API_BASE = env.NEXT_PUBLIC_API_URL;
const GRAPHQL_ENDPOINT = typeof window !== 'undefined' ? '/graphql-proxy' : `${API_BASE}/graphql`;

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getToken();
}

function getStoredTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('schoolsaas_tenant_id');
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

    if (res.status === 401) {
      // One refresher for the whole app. `getValidTokenOrRefresh` owns the single-flight
      // lock and the waiting queue that REST and axios already use, so an expiring access
      // token can no longer put two rotations in flight with the same stored refresh token
      // — the collision the server answers by invalidating the session.
      let newToken: string;
      try {
        newToken = await getValidTokenOrRefresh();
      } catch (refreshErr) {
        // The shared path has already cleared storage and redirected to sign in.
        currentQueue.forEach((op) => op.reject(refreshErr));
        return;
      }

      try {
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
      } catch (err) {
        currentQueue.forEach((op) => op.reject(err as Error));
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
  if (res.status === 401) {
    try {
      token = await getValidTokenOrRefresh();
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
      // The shared refresher has already forced the logout; fall through and let the
      // status check below report the failed mutation to the caller.
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
