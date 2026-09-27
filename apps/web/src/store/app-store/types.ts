export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'staff';

export interface CustomRoleInfo {
  id: string;
  name: string;
  color: string;
  permissions: Record<string, string[]>;
}

export interface PlatformRoleInfo {
  id: string;
  name: string;
  color: string;
  permissions: Record<string, string[]>;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  tenantLogo?: string | null;
  phone?: string;
  address?: string;

  customRole?: CustomRoleInfo | null;
  platformRole?: PlatformRoleInfo | null;
}

export interface AppState {
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
  refreshPermissions: () => Promise<void>;

  currentScreen: string;
  setCurrentScreen: (screen: string) => void;

  currentSubScreen: string | null;
  setCurrentSubScreen: (subScreen: string | null) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  currentTenantId: string | null;
  currentTenantSlug: string | null;
  currentTenantName: string | null;
  currentTenantLogo: string | null;
  setCurrentTenant: (id: string, name: string, slug: string, logo?: string | null) => Promise<void>;

}

