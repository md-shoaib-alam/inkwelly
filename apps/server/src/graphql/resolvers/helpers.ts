import { db } from '../../lib/db'
import * as schema from '../../db/schema'
import { eq, count } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { staffMay, platformMay, isRootPlatformAdmin, type PermissionModule, type PlatformModule } from '../../lib/permissions'
import { resolveTenantId } from '../../lib/resolve-tenant'

/**
 * Authorization failures carry a stable code so the client can tell a denial
 * apart from a crash even though production masks error messages.
 */
function authError(code: 'UNAUTHENTICATED' | 'FORBIDDEN', message: string) {
  return new GraphQLError(message, { extensions: { code } })
}

/** A denial resolvers can throw that survives production error masking. */
export function forbidden(message: string) {
  return authError('FORBIDDEN', message)
}

export function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  if (date instanceof Date) return date.toISOString()
  return String(date)
}

export function checkAuth(context: any) {
  if (!context?.session?.user) {
    throw authError('UNAUTHENTICATED', 'Unauthorized');
  }
  return {
    user: context.session.user,
    tenantId: context.tenantId,
  };
}

export const SCHOOL_ADMIN_ROLES = ['admin', 'super_admin'];

// Fail closed: a caller outside our trust model gets a rejection, never a wider query.
function requireRoles(context: any, roles: string[]) {
  const user = context?.session?.user;
  if (!user) throw authError('UNAUTHENTICATED', 'Unauthorized');
  if (!roles.includes(user.role)) throw authError('FORBIDDEN', 'Forbidden: insufficient role');
  return { user, tenantId: context.tenantId as string | null };
}

export function requireSchoolAdmin(context: any) {
  return requireRoles(context, SCHOOL_ADMIN_ROLES);
}

/**
 * GraphQL twin of the REST `requirePermission` guard. Only staff are restricted;
 * every other role falls through to the resolver's existing tenant scoping.
 */
export async function requireModule(
  context: any,
  module: PermissionModule,
  action: 'view' | 'create' | 'edit' | 'delete'
) {
  const user = context?.session?.user;
  if (!user) throw authError('UNAUTHENTICATED', 'Unauthorized');
  if (!(await staffMay(user, module, action))) {
    throw authError('FORBIDDEN', `Forbidden: ${action} permission for ${module} is required`);
  }
  return { user, tenantId: context.tenantId };
}

/**
 * Any platform administrator, root or scoped. Use for the landing dashboard,
 * which the web sidebar shows to every platform admin regardless of grants;
 * everything narrower should use `requirePlatformModule` instead.
 */
export function requirePlatformUser(context: any) {
  return requireRoles(context, ['super_admin']);
}

/**
 * Platform twin of `requireModule`. A super_admin carrying a platform role is
 * narrowed to that role's grants; a root super_admin passes and keeps the
 * cross-tenant scope that `scopedTenantId` already provides.
 */
export async function requirePlatformModule(
  context: any,
  module: PlatformModule,
  action: 'view' | 'create' | 'edit' | 'delete'
) {
  const user = context?.session?.user;
  if (!user) throw authError('UNAUTHENTICATED', 'Unauthorized')
  if (!(await platformMay(user, module, action))) {
    throw authError('FORBIDDEN', `Forbidden: ${action} permission for ${module} is required`)
  }
  return { user, tenantId: context.tenantId };
}

/** Only the root owner (no platform role) may manage platform roles themselves. */
export async function requireRootPlatformAdmin(context: any) {
  const user = context?.session?.user;
  if (!user) throw authError('UNAUTHENTICATED', 'Unauthorized')
  if (!(await isRootPlatformAdmin(user))) {
    throw authError('FORBIDDEN', 'Forbidden: root platform administrator privileges required')
  }
  return { user, tenantId: context.tenantId };
}

/**
 * For operations a school admin runs inside their own school and a platform admin
 * may run anywhere: the admin path is unchanged, the platform path needs the
 * named grant. Without this, `requireSchoolAdmin` alone lets a scoped platform
 * admin act across schools on nothing more than membership.
 */
export async function requireSchoolAdminOrPlatform(
  context: any,
  module: PlatformModule,
  action: 'view' | 'create' | 'edit' | 'delete'
) {
  const user = context?.session?.user;
  if (!user) throw authError('UNAUTHENTICATED', 'Unauthorized')
  if (user.role === 'super_admin') return requirePlatformModule(context, module, action);
  return requireSchoolAdmin(context);
}

// Only a super_admin may name a tenant; everyone else is pinned to their own.
export function scopedTenantId(auth: { user: any; tenantId: string | null }, requested?: string | null) {
  if (auth.user.role === 'super_admin') return requested || auth.tenantId || undefined;
  if (!auth.tenantId) throw authError('FORBIDDEN', 'Forbidden: session has no tenant');
  return auth.tenantId;
}

/**
 * Dashboard and widget queries take a client-supplied tenant slug. Only the
 * platform owner may name a school other than their own, so every other caller
 * is pinned to their session tenant before the slug is ever looked up.
 */
export async function resolveScopedTenantId(context: any, requested?: string | null): Promise<string> {
  const auth = checkAuth(context);
  const scoped = scopedTenantId(auth, requested);
  await assertCanNameTenant(auth.user, requested);
  const tenantId = scoped ? await resolveTenantId(scoped) : null;
  if (!tenantId) throw authError('FORBIDDEN', 'Forbidden: tenant context required');
  return tenantId;
}

/**
 * Cross-tenant reach is the `tenants` grant: a platform admin who can name a
 * school from a query argument must be able to see the school list. Root admins
 * hold every grant, so they are unaffected.
 */
async function assertCanNameTenant(user: any, requested?: string | null) {
  if (user?.role !== 'super_admin' || !requested) return;
  if (!(await platformMay(user, 'tenants', 'view'))) {
    throw authError('FORBIDDEN', 'Forbidden: view permission for tenants is required');
  }
}

/**
 * The tenant a school-data query should read. Non-admin roles are pinned to
 * their own tenant; a platform admin may name another school only while they
 * hold `tenants` view.
 */
export async function tenantFromArg(user: any, requested?: string | null): Promise<string | null> {
  if (user?.role !== 'super_admin') return user?.tenantId ?? null;
  await assertCanNameTenant(user, requested);
  if (requested) return await resolveTenantId(requested);
  return user?.tenantId ?? null;
}

// A caller's tenant must match the target row's tenant, or they are a super_admin.
// Returns the row (null for super_admin, whose scope is unrestricted) so callers
// can tell "field echoed back unchanged" apart from "field actually being changed".
export async function assertTenantOwnership(table: any, id: string, auth: { user: any; tenantId: string | null }, label = 'record') {
  if (auth.user.role === 'super_admin') return null;
  const [row] = await db.select().from(table).where(eq(table.id, id)).limit(1);
  if (!row) throw new Error(`${cap(label)} not found`);
  if (row.tenantId !== auth.tenantId) throw authError('FORBIDDEN', 'Forbidden: record belongs to another school');
  return row as { tenantId: string | null; role?: string };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function paginate<T>(
  table: any,
  queryModel: any,
  args: { page?: number; limit?: number; where?: any; with?: any; orderBy?: any; columns?: any },
  transform?: (item: any) => Promise<T> | T
) {
  const page = Math.max(1, args.page || 1);
  const limit = Math.max(1, args.limit || 50);
  const offset = (page - 1) * limit;

  const [items, totalRes] = await Promise.all([
    queryModel.findMany({
      where: args.where,
      with: args.with,
      columns: args.columns,
      orderBy: args.orderBy,
      limit,
      offset,
    }),
    db.select({ count: count() }).from(table).where(args.where)
  ]);

  const total = Number(totalRes[0]?.count || 0);

  const transformedItems = transform 
    ? await Promise.all(items.map((item: any) => transform(item)))
    : items;

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    items: transformedItems,
  };
}
