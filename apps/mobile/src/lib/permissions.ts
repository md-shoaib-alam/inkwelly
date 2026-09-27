import { User } from '@/store/auth-context';

export function hasPermission(
  user: User | null,
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

  // Tenant staff/teacher with custom role
  if (user.customRole && user.customRole.permissions) {
    const perms = user.customRole.permissions[module];
    if (!perms || perms.length === 0) return false;
    return perms.includes(action);
  }

  // Admins have full access to their tenant
  if (user.role === 'admin') return true;

  // No role info = no permission
  return false;
}

export function isRootAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin' && !user.platformRole;
}

/**
 * A staff account whose role carries no usable grant is denied every gated
 * route server-side, so the tab bar hides those screens and the UI has to say
 * why instead of just looking empty.
 */
export function staffHasNoGrants(user: User | null): boolean {
  if (!user || user.role !== 'staff') return false;
  const perms = user.customRole?.permissions;
  if (!perms) return true;
  return !Object.values(perms).some((actions) => Array.isArray(actions) && actions.length > 0);
}
