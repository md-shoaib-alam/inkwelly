import { Elysia } from 'elysia';
import { verifyJWT } from './jwt';
import type { AccessTokenPayload } from './jwt';
import { authCacheKey, getAuthCache, setAuthCache } from './authCache';
import { db } from './db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Auth middleware for Elysia — validates Bearer JWT token.
 * Derives `user` and `tenantId` into the request context.
 *
 * IMPORTANT: We return a sentinel `_authFailed` flag from the derive so that
 * `requireAuth`'s onBeforeHandle can reliably short-circuit before any route
 * handler accesses `user`. This avoids the Elysia `as:'global'` timing issue
 * where a null user leaks into handlers even though 401 was set.
 */
export const authPlugin = new Elysia({ name: 'auth' })
  .derive({ as: 'global' }, async ({ headers, params, query, body }) => {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        user: null as unknown as AccessTokenPayload,
        tenantId: null as string | null,
        dbUser: null as { name: string; tenantId: string | null } | null,
        _authFailed: true,
      };
    }

    const token = authHeader.substring(7);

    // Hot path: a fresh cache entry skips JWT verify, the Redis denylist GET
    // and the User SELECT entirely (~0.82 ms of the ~1.12 ms per-request CPU).
    // Approved trade-off: revocations bite within AUTH_CACHE_TTL_MS, not instantly.
    const cacheKey = authCacheKey(token);
    const cached = getAuthCache(cacheKey);
    if (cached) {
      return {
        user: cached.user as unknown as AccessTokenPayload,
        tenantId: cached.tenantId,
        dbUser: cached.dbUser,
        _authFailed: false,
      };
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.typ !== 'access') {
      return {
        user: null as unknown as AccessTokenPayload,
        tenantId: null as string | null,
        dbUser: null as { name: string; tenantId: string | null } | null,
        _authFailed: true,
      };
    }

    // Verify token has not expired due to password change, profile update, or user deactivation
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, payload.id),
      columns: { updatedAt: true, isActive: true, name: true, tenantId: true }
    });

    if (!dbUser || !dbUser.isActive) {
      return {
        user: null as unknown as AccessTokenPayload,
        tenantId: null as string | null,
        dbUser: null as { name: string; tenantId: string | null } | null,
        _authFailed: true,
      };
    }

    // Token issued-at (iat) is in seconds, convert to ms
    const tokenIatMs = payload.iat ? payload.iat * 1000 : 0;
    // Round updatedAt down to the nearest second to align with JWT's second-level resolution (iat)
    const dbUpdatedAtMs = Math.floor(dbUser.updatedAt.getTime() / 1000) * 1000;

    if (tokenIatMs < dbUpdatedAtMs) {
      return {
        user: null as unknown as AccessTokenPayload,
        tenantId: null as string | null,
        dbUser: null as { name: string; tenantId: string | null } | null,
        _authFailed: true,
      };
    }

    // Default tenantId from token
    let tenantId = payload.tenantId as string | null;

    // SuperAdmin master access: Resolve tenant context from request if missing in token
    if (!tenantId && payload.role === 'super_admin') {
      let rawId = headers['x-tenant-id'] ||
                  (params as any)?.slug ||
                  (query as any)?.tenantId ||
                  (body as any)?.tenantId;

      if (!rawId && headers['referer']) {
        const referer = headers['referer'];
        // Match path formats like: http://localhost:3000/slug-name/... or https://domain/slug-name/...
        const match = referer.match(/https?:\/\/[^\/]+\/([^\/]+)/);
        if (match && match[1] && match[1] !== 'api') {
          rawId = match[1];
        }
      }

      // Naming another school is the `tenants` grant, for REST exactly as in
      // GraphQL. A platform admin without it keeps an empty scope, so tenant-
      // scoped routes find nothing instead of reading whichever school was named.
      if (rawId) {
        const { platformMay } = await import('./permissions');
        if (await platformMay(payload, 'tenants', 'view')) {
          const { resolveTenantId } = await import('./resolve-tenant');
          tenantId = await resolveTenantId(rawId);
        }
      }
    }

    // Only cache results whose tenant came from the token itself. The
    // super-admin branch above resolves tenant from request headers, so its
    // result is request-specific and must never be replayed from cache.
    if (payload.tenantId) {
      setAuthCache(cacheKey, {
        user: payload as { id: string; exp?: number },
        tenantId,
        dbUser: { name: dbUser.name, tenantId: dbUser.tenantId },
      });
    }

    return {
      user: payload,
      tenantId,
      dbUser: { name: dbUser.name, tenantId: dbUser.tenantId },
      _authFailed: false,
    };
  });

/**
 * Guard: Require valid authentication.
 * Use this in routes that need auth:
 *   .use(requireAuth)
 */
export const requireAuth = new Elysia({ name: 'requireAuth' })
  .use(authPlugin)
  .onBeforeHandle({ as: 'scoped' }, ({ user, _authFailed, set }: any) => {
    // Short-circuit on both the flag AND a null-check so even if the derive
    // somehow passed through, the handler is never reached with a null user.
    if (_authFailed || !user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  });

/**
 * Guard: Require super_admin role.
 *
 * `as: 'scoped'` is not decoration. A local hook only covers routes registered on
 * the same instance, so when this guard is mounted on a sub-instance that is
 * later composed into a parent (`platform.ts` does exactly that) the check is
 * silently dropped and the group is served unauthenticated. Scoped hooks travel
 * with the instance that uses them, which is what every guard here needs.
 */
export const requireSuperAdmin = new Elysia({ name: 'requireSuperAdmin' })
  .use(requireAuth)
  .onBeforeHandle({ as: 'scoped' }, ({ user, set }: any) => {
    // Spelled out rather than left to hook ordering: an absent caller is
    // unauthenticated (401 keeps the client's silent token refresh working), a
    // present-but-wrong-role caller is forbidden.
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    if (user.role !== 'super_admin') {
      set.status = 403;
      return { error: 'Forbidden' };
    }
  });

/**
 * Guard: Require tenant context.
 */
export const requireTenant = new Elysia({ name: 'requireTenant' })
  .use(requireAuth)
  .onBeforeHandle(({ tenantId, set }) => {
    if (!tenantId) {
      set.status = 403;
      return { error: 'Tenant context required' };
    }
  });

/**
 * Guard: Require specific user roles.
 * E.g.: requireRoles(['admin', 'super_admin'])
 *
 * `{ as: 'scoped' }` for the same reason `requireSuperAdmin` carries it: a local
 * hook covers only routes declared on this instance, and this instance declares
 * none — mounted as a plugin it would enforce nothing. Proven empirically:
 * local → anonymous and wrong-role both reach the handler (200); scoped → 401/403.
 */
export const requireRoles = (allowedRoles: string[]) =>
  new Elysia({ name: `requireRoles:${allowedRoles.join(',')}` })
    .use(requireAuth)
    .onBeforeHandle({ as: 'scoped' }, ({ user, set }: any) => {
      // Spelled out like requireSuperAdmin: an absent caller is unauthenticated
      // (401 keeps the client's silent token refresh working), a
      // present-but-wrong-role caller is forbidden.
      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      if (!allowedRoles.includes(user.role)) {
        set.status = 403;
        return { error: 'Access denied: insufficient permissions' };
      }
    });

/**
 * Guard: Require administrator privileges ('admin' or 'super_admin').
 */
export const requireAdmin = new Elysia({ name: 'requireAdmin' })
  .use(requireAuth)
  .onBeforeHandle(({ user, set }) => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      set.status = 403;
      return { error: 'Access denied: administrator privileges required' };
    }
  });

/**
 * Guard: Require staff or administrator privileges ('admin', 'super_admin', or 'staff').
 */
export const requireStaffOrAdmin = new Elysia({ name: 'requireStaffOrAdmin' })
  .use(requireAuth)
  .onBeforeHandle(({ user, set }) => {
    if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
      set.status = 403;
      return { error: 'Access denied: staff or administrator privileges required' };
    }
  });

