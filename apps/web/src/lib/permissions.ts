import type { AppUser } from '@/store/use-app-store';

/**
 * Check if the current user has a specific permission for a module.
 *
 * - If user has NO platformRole (root/full-access super admin), they have ALL permissions.
 * - If user has a platformRole, check the permissions map.
 * - For tenant staff (customRole), check customRole permissions.
 *
 * @param user - The current logged-in user
 * @param module - The module name (e.g. 'tenants', 'billing', 'staff')
 * @param action - The action to check (e.g. 'view', 'create', 'edit', 'delete')
 * @returns true if the user has the permission
 */
export function hasPermission(
  user: AppUser | null,
  module: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  if (!user) return false;

  // Super admin without platform role = root admin with full access
  if (user.role === 'super_admin' && !user.platformRole) {
    return true;
  }

  // Super admin with platform role
  if (user.role === 'super_admin' && user.platformRole) {
    const perms = user.platformRole.permissions?.[module];
    if (!perms || perms.length === 0) return false;
    return perms.includes(action);
  }

  // Admins have full access to their tenant, even if a custom role also happens
  // to be attached to their account.
  if (user.role === 'admin') return true;

  // Tenant staff/teacher with custom role
  if (user.customRole && user.customRole.permissions) {
    const perms = user.customRole.permissions[module];
    if (!perms || perms.length === 0) return false;
    return perms.includes(action);
  }

  // No role info = no permission
  return false;
}

/**
 * Check if the current user is the root platform owner
 * (super_admin without a platform role assignment)
 */
export function isRootAdmin(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin' && !user.platformRole;
}

/**
 * Get the permission array for a specific module
 */
function getModulePermissions(
  user: AppUser | null,
  module: string
): string[] {
  if (!user) return [];

  if (user.role === 'super_admin' && !user.platformRole) {
    return ['view', 'create', 'edit', 'delete'];
  }

  if (user.role === 'admin') {
    return ['view', 'create', 'edit', 'delete'];
  }

  if (user.platformRole?.permissions?.[module]) {
    return user.platformRole.permissions[module];
  }

  if (user.customRole?.permissions?.[module]) {
    return user.customRole.permissions[module];
  }

  return [];
}
