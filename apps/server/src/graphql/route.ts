import { Elysia } from 'elysia';
import { createYoga } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import { schema } from './schema';
import { verifyJWT } from '../lib/jwt';

const AUTH_ERROR_CODES = new Set(['FORBIDDEN', 'UNAUTHENTICATED']);

/**
 * Masking turns every thrown error into an indistinguishable
 * INTERNAL_SERVER_ERROR, which would hide authorization denials too. Resolvers
 * tag denials with their own code, so let those through and mask everything
 * else behind the generic message.
 */
function maskError(error: any) {
  const original = error?.originalError;
  if (AUTH_ERROR_CODES.has(original?.extensions?.code)) return original;
  return new GraphQLError('Unexpected error.');
}

// Create GraphQL Yoga instance
const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    // Get token from Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');
    let user = null;
    let tenantId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1] || '';
      const payload = await verifyJWT(token);
      if (payload) {
        user = payload;
        tenantId = (payload as any).tenantId;

        // SuperAdmin can override tenantId via header
        if (!tenantId && (payload as any).role === 'super_admin') {
          const xTenantId = request.headers.get('x-tenant-id');
          // Cross-tenant reach is the `tenants` grant: a scoped platform admin
          // without it simply keeps their own (empty) scope instead of aiming at
          // any school they can guess the slug of.
          if (xTenantId) {
            const { platformMay } = await import('../lib/permissions');
            if (await platformMay(payload as any, 'tenants', 'view')) {
              const { resolveTenantId } = await import('../lib/resolve-tenant');
              tenantId = await resolveTenantId(xTenantId);
            }
          }
        }
      }
    }

    const { createLoaders } = await import('../lib/loaders');
    return {
      session: user ? { user } : null,
      user,
      tenantId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'unknown',
      loaders: createLoaders(),
    };
  },
  //  Security: Only enable GraphiQL in development
  graphiql: process.env.NODE_ENV !== 'production',
  //  Security: Mask errors in production
  maskedErrors: process.env.NODE_ENV === 'production' ? { maskError } : false,
  //  Performance: Enable batching for production efficiency on 3G
  batching: {
    limit: 4,
  },
});

/**
 * Handle GraphQL requests with proper HTTP 401 when the Bearer token is
 * missing, expired or invalid, so frontend clients (REST/GraphQL) can silently
 * auto-refresh without stalling.
 *
 * Every operation in this schema belongs to a signed-in role (school staff or
 * platform admin), so an absent token is rejected exactly like a bad one.
 * Without this gate resolvers that forget checkAuth run as an anonymous
 * context and return rows from every tenant.
 */
async function handleGraphQL(context: { request: Request }) {
  if (context.request.method === 'OPTIONS') {
    return yoga.fetch(context.request);
  }

  const authHeader = context.request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1]?.trim() : undefined;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload) {
    return new Response(
      JSON.stringify({
        errors: [
          {
            message: 'Unauthorized',
            extensions: { code: 'UNAUTHENTICATED', status: 401 },
          },
        ],
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return yoga.fetch(context.request);
}

/**
 * Mount GraphQL Yoga as an Elysia route.
 * Forwards requests for both /api/graphql and /graphql.
 */
export const graphqlRoutes = new Elysia()
  .all('/api/graphql', handleGraphQL)
  .all('/graphql', handleGraphQL);

