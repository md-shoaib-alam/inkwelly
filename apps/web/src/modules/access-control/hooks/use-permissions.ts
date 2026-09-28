'use client';

import { useAppStore } from '@/store/use-app-store';

/**
 * Hook to check if the current user has a specific permission for a module.
 *
 * Logic:
 * - If the user has NO customRole → full access (admin, teacher without custom role, etc.)
 * - If the user HAS a customRole → check their permissions map
 *   - If the module is not in the permissions map → NO access
 *   - If the action is not in the module's permission array → NO access
 *
 * Usage:
 *   const canEdit = usePermission('timetable', 'edit');
 *   const canCreate = usePermission('students', 'create');
 */
function usePermission(module: string, action: string): boolean {
  const currentUser = useAppStore((s) => s.currentUser);

  // No user or no custom role = full access (admin, teacher without custom role, etc.)
  if (!currentUser || !currentUser.customRole?.permissions) return true;

  // User has a custom role → enforce its permissions
  const perms = currentUser.customRole.permissions[module];
  return Array.isArray(perms) && perms.includes(action);
}

/**
 * Hook to get all permissions for a specific module.
 * Returns an object with view, create, edit, delete booleans.
 *
 * Usage:
 *   const { canView, canCreate, canEdit, canDelete } = useModulePermissions('timetable');
 */
export function useModulePermissions(module: string): {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
} {
  return {
    canView: usePermission(module, 'view'),
    canCreate: usePermission(module, 'create'),
    canEdit: usePermission(module, 'edit'),
    canDelete: usePermission(module, 'delete'),
  };
}
