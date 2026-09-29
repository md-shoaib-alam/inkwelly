import { Elysia } from 'elysia';
import { db } from './db';
import { customRoles, platformRoles, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { dataCache } from './cache';
import { requireAuth } from './auth';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

/** Mirrors PERMISSION_MODULES in school-web/.../admin/roles/constants.ts */
export type PermissionModule =
  | 'academic-years' | 'attendance' | 'calendar' | 'classes'
  | 'exams' | 'expenses' | 'fees' | 'grades' | 'leaves' | 'notices' | 'parents'
  | 'promotions' | 'reports' | 'staff' | 'students' | 'subjects' | 'teachers'
  | 'tickets' | 'timetable';

/** Mirrors PLATFORM_MODULES in school-web/.../super-admin/roles/types.ts */
export type PlatformModule =
  | 'analytics' | 'api' | 'audit-logs' | 'billing' | 'integrations' | 'manage-admins'
  | 'notices' | 'notifications' | 'reports' | 'security' | 'settings' | 'staff'
  | 'support' | 'tenants' | 'users';

export type PermissionMap = Partial<Record<PermissionModule, PermissionAction[]>>;
export type PlatformPermissionMap = Partial<Record<PlatformModule, PermissionAction[]>>;

/**
 * `restricted: false` means the caller's role is outside the grant system
 * (school admin, teacher, parent, student, or a root super admin) and passes
 * every check in the tier they belong to. `restricted: true` with an empty map
 * is the opposite: a caller whose role points at no grants at all.
 *
 * `permissions` is the school tier (staff + customRole) and `platform` is the
 * platform tier (super_admin + platformRole). A caller only ever occupies one.
 */
interface AccessProfile {
  restricted: boolean;
  permissions: PermissionMap;
  platform: PlatformPermissionMap;
}

const ACCESS_CACHE_TTL_MS = 5 * 60 * 1000;

const accessKey = (userId: string) => `perm:user:${userId}`;

function parseActionList(actions: unknown): PermissionAction[] {
  if (!Array.isArray(actions)) return [];
  return actions.filter(
    (a): a is PermissionAction => a === 'view' || a === 'create' || a === 'edit' || a === 'delete'
  );
}

/** Unknown module keys are dropped, so a stale blob can never widen a grant. */
function parsePermissionMap<T extends string>(blob: string | null | undefined, known: readonly T[]): Partial<Record<T, PermissionAction[]>> {
  if (!blob) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(blob);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

  const result: Partial<Record<T, PermissionAction[]>> = {};
  for (const [module, actions] of Object.entries(parsed as Record<string, unknown>)) {
    if (!known.includes(module as T)) continue;
    const valid = parseActionList(actions);
    if (valid.length > 0) result[module as T] = valid;
  }
  return result;
}

const SCHOOL_MODULE_LIST = [
  'academic-years', 'attendance', 'calendar', 'classes', 'exams',
  'expenses', 'fees', 'grades', 'leaves', 'notices', 'parents', 'promotions',
  'reports', 'staff', 'students', 'subjects', 'teachers', 'tickets', 'timetable',
] as const satisfies readonly PermissionModule[];

const PLATFORM_MODULE_LIST = [
  'analytics', 'api', 'audit-logs', 'billing', 'integrations', 'manage-admins',
  'notices', 'notifications', 'reports', 'security', 'settings', 'staff',
  'support', 'tenants', 'users',
] as const satisfies readonly PlatformModule[];

const EMPTY: AccessProfile = { restricted: false, permissions: {}, platform: {} };

async function loadAccessProfile(userId: string): Promise<AccessProfile> {
  const [row] = await db
    .select({
      role: users.role,
      userTenantId: users.tenantId,
      customRoleTenantId: customRoles.tenantId,
      customPermissions: customRoles.permissions,
      platformRoleId: users.platformRoleId,
      platformPermissions: platformRoles.permissions,
    })
    .from(users)
    .leftJoin(customRoles, eq(customRoles.id, users.customRoleId))
    .leftJoin(platformRoles, eq(platformRoles.id, users.platformRoleId))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return EMPTY;

  if (row.role === 'staff') {
    // A role belonging to another tenant grants nothing, even if the id was guessed.
    if (!row.customRoleTenantId || row.customRoleTenantId !== row.userTenantId) {
      return { restricted: true, permissions: {}, platform: {} };
    }
    return {
      restricted: true,
      permissions: parsePermissionMap(row.customPermissions, SCHOOL_MODULE_LIST),
      platform: {},
    };
  }

  // A super_admin with a platform role is scoped by that role's grants. Without
  // one they are the root owner and hold everything.
  if (row.role === 'super_admin' && row.platformRoleId) {
    return {
      restricted: true,
      permissions: {},
      platform: parsePermissionMap(row.platformPermissions, PLATFORM_MODULE_LIST),
    };
  }

  return EMPTY;
}

export async function getAccessProfile(userId: string): Promise<AccessProfile> {
  return dataCache.getOrSet<AccessProfile>(accessKey(userId), () => loadAccessProfile(userId), ACCESS_CACHE_TTL_MS);
}

export function hasAction(profile: AccessProfile, module: PermissionModule, action: PermissionAction): boolean {
  if (!profile.restricted) return true;
  return (profile.permissions[module] ?? []).includes(action);
}

/** Single entry point for non-Elysia call sites (GraphQL resolvers, helpers). */
export async function staffMay(user: { id?: string; role?: string } | null | undefined, module: PermissionModule, action: PermissionAction): Promise<boolean> {
  if (!user) return false;
  if (user.role !== 'staff') return true;
  if (!user.id) return false;
  return hasAction(await getAccessProfile(user.id), module, action);
}

/**
 * Platform twin of `staffMay`: only a super_admin who carries a platform role is
 * narrowed. Everyone else (including a root super_admin) falls through to the
 * `requireSuperAdmin` gate already mounted on the same route group.
 */
export async function platformMay(user: { id?: string; role?: string } | null | undefined, module: PlatformModule, action: PermissionAction): Promise<boolean> {
  if (!user) return false;
  if (user.role !== 'super_admin') return false;
  if (!user.id) return false;

  const profile = await getAccessProfile(user.id);
  if (!profile.restricted) return true;
  return (profile.platform[module] ?? []).includes(action);
}

/** Root = super_admin with no platform role. Only root may manage platform roles. */
export async function isRootPlatformAdmin(user: { id?: string; role?: string } | null | undefined): Promise<boolean> {
  if (!user || user.role !== 'super_admin') return false;
  if (!user.id) return false;
  return !(await getAccessProfile(user.id)).restricted;
}

const ACTION_BY_METHOD: Record<string, PermissionAction> = {
  GET: 'view',
  HEAD: 'view',
  OPTIONS: 'view',
  POST: 'create',
  PUT: 'edit',
  PATCH: 'edit',
  DELETE: 'delete',
};

/**
 * Guard: staff members must hold the matching grant for this route group's module.
 * Every other role passes through untouched, so mounting this cannot change
 * behaviour for admins, teachers, parents or students.
 */
export const requirePermission = (module: PermissionModule, action?: PermissionAction) =>
  new Elysia({ name: `requirePermission:${module}` })
    .use(requireAuth)
    .onBeforeHandle({ as: 'scoped' }, async (ctx: any) => {
      const user = ctx.user;
      // 401, not a pass-through: this guard deliberately ignores non-staff roles,
      // and an anonymous caller is nobody's staff.
      if (!user) {
        ctx.set.status = 401;
        return { error: 'Unauthorized' };
      }
      if (user.role !== 'staff') return;

      const method = ctx.request?.method ?? 'GET';
      const required = action ?? ACTION_BY_METHOD[method] ?? 'view';
      if (!(await staffMay(user, module, required))) {
        ctx.set.status = 403;
        // `code` lets clients render "ask your admin for access" without
        // matching the message text; the module/action pair says what to ask for.
        return {
          error: `Access denied: ${required} permission for ${module} is required`,
          code: 'PERMISSION_NOT_GRANTED',
          module,
          action: required,
        };
      }
    });

/**
 * Guard: a super_admin who carries a platform role must hold the matching grant
 * for this route group's platform module. Mount this alongside `requireSuperAdmin`,
 * never instead of it — it denies non-super_admins on purpose so it cannot widen
 * a group that forgot the role check.
 */
export const requirePlatformPermission = (module: PlatformModule, action?: PermissionAction) =>
  new Elysia({ name: `requirePlatformPermission:${module}` })
    .use(requireAuth)
    .onBeforeHandle({ as: 'scoped' }, async (ctx: any) => {
      const user = ctx.user;
      if (!user) {
        ctx.set.status = 401;
        return { error: 'Unauthorized' };
      }
      if (user.role !== 'super_admin') {
        ctx.set.status = 403;
        return { error: 'Access denied: platform administrator privileges required' };
      }

      const method = ctx.request?.method ?? 'GET';
      const required = action ?? ACTION_BY_METHOD[method] ?? 'view';
      if (!(await platformMay(user, module, required))) {
        ctx.set.status = 403;
        return {
          error: `Access denied: ${required} permission for ${module} is required`,
          code: 'PERMISSION_NOT_GRANTED',
          module,
          action: required,
        };
      }
    });

/**
 * Guard: platform-role administration (creating roles, handing them out) is the
 * one thing a scoped platform admin must never do, or any grant could be widened
 * from below.
 */
export const requireRootPlatformAdmin = () =>
  new Elysia({ name: 'requireRootPlatformAdmin' })
    .use(requireAuth)
    .onBeforeHandle({ as: 'scoped' }, async (ctx: any) => {
      if (!ctx.user) {
        ctx.set.status = 401;
        return { error: 'Unauthorized' };
      }
      if (!(await isRootPlatformAdmin(ctx.user))) {
        ctx.set.status = 403;
        return { error: 'Access denied: root platform administrator privileges required' };
      }
    });

export async function invalidateUserPermissions(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  await dataCache.deleteMatch(userIds.map((id) => accessKey(id)));
}

/**
 * Called after a role's permissions change or the role is deleted. Revokes the
 * cached grants of its members immediately; the TTL only bounds staleness for
 * paths that forget to call this.
 */
export async function invalidateRolePermissions(roleId: string): Promise<void> {
  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.customRoleId, roleId));
  await invalidateUserPermissions(members.map((m) => m.id));
}

/** Platform twin of `invalidateRolePermissions`. */
export async function invalidatePlatformRolePermissions(roleId: string): Promise<void> {
  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.platformRoleId, roleId));
  await invalidateUserPermissions(members.map((m) => m.id));
}
