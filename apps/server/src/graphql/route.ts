import { Elysia } from 'elysia';
import { createYoga } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import { schema } from './schema';
import { authenticateAccessToken, type AuthenticatedCaller } from '../lib/auth';

/**
 * Masking turns every thrown error into an indistinguishable
 * INTERNAL_SERVER_ERROR, which would hide authorization denials too. Resolvers
 * tag denials with their own code, so let those through and mask everything
 * else behind the generic message.
 *
 * `YEAR_IN_USE` is not an auth denial: the rename guard is worth nothing unless
 * the admin can read which session holds the rows, so its message passes too.
 *
 * `BAD_USER_INPUT` is the same argument one step earlier. A rejected filter can
 * only ever describe the caller's own input, and "Unexpected error" for a typo in
 * a query gives the admin nothing to fix and gives an attacker a free oracle for
 * whether the field they named exists at all.
 */
const CLIENT_READABLE_CODES = new Set(['FORBIDDEN', 'UNAUTHENTICATED', 'YEAR_IN_USE', 'BAD_USER_INPUT']);

function maskError(error: any) {
  const original = error?.originalError;
  if (CLIENT_READABLE_CODES.has(original?.extensions?.code)) return original;
  return new GraphQLError('Unexpected error.');
}

// Create GraphQL Yoga instance
const yoga = createYoga({
  schema,
  context: async ({ request, authed }: { request: Request; authed?: AuthenticatedCaller | null }) => {
    // The gate below authenticates once per request and hands the result to
    // the context — never re-verify here, that doubles per-op auth cost.
    let user = null;
    let tenantId = null;

    if (authed) {
      user = authed.user;
      tenantId = authed.tenantId;

      // SuperAdmin can override tenantId via header
      if (!tenantId && (authed.user as any).role === 'super_admin') {
        const xTenantId = request.headers.get('x-tenant-id');
        // Cross-tenant reach is the `tenants` grant: a scoped platform admin
        // without it simply keeps their own (empty) scope instead of aiming at
        // any school they can guess the slug of.
        if (xTenantId) {
          const { platformMay } = await import('../lib/permissions');
          if (await platformMay(authed.user as any, 'tenants', 'view')) {
            const { resolveTenantId } = await import('../lib/resolve-tenant');
            tenantId = await resolveTenantId(xTenantId);
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
  const authed = token ? await authenticateAccessToken(token) : null;

  if (!authed) {
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

  return yoga.fetch(context.request, { authed });
}

/**
 * Mount GraphQL Yoga as an Elysia route.
 * Forwards requests for both /api/graphql and /graphql.
 */
export const graphqlRoutes = new Elysia()
  .all('/api/graphql', handleGraphQL)
  .all('/graphql', handleGraphQL);

