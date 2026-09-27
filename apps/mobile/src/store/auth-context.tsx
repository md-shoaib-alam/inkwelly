import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { setAuthSession, registerOnUnauthorized, serverLogout, storeRefreshToken, removeRefreshToken, REFRESH_TOKEN_KEY, api } from '@/lib/api';
import type { DashboardData, ParentDashboardData } from '@/types';

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

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  address?: string;
  tenantId?: string;
  tenantLogo?: string;
  tenantName?: string;
  tenantEndDate?: string;
  customRole?: CustomRoleInfo | null;
  platformRole?: PlatformRoleInfo | null;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@auth_session_data';

const cacheTenantLogo = async (logoUrl: string | undefined) => {
  if (!logoUrl || !logoUrl.startsWith('http') || logoUrl === '/test.webp') return;
  try {
    const localUri = FileSystem.documentDirectory + 'tenant_logo.png';
    const downloadResult = await FileSystem.downloadAsync(logoUrl, localUri);
    if (downloadResult.status === 200) {
      await AsyncStorage.setItem('@tenant_logo_path', downloadResult.uri);
    }
  } catch (err) {
    console.warn('Failed to cache logo locally via FileSystem:', err);
  }
};

const isUserDifferent = (u1: User | null, u2: Partial<User> | null) => {
  if (!u1 || !u2) return true;

  const stableStringify = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value !== 'object') {
      return `${typeof value}:${JSON.stringify(value)}`;
    }
    if (Array.isArray(value)) {
      return '[' + value.map(stableStringify).join(',') + ']';
    }
    const record = value as Record<string, unknown>;
    return '{' + Object.keys(record).sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',') + '}';
  };

  if (u2.id !== undefined && u1.id !== u2.id) return true;
  if (u2.name !== undefined && u1.name !== u2.name) return true;
  if (u2.role !== undefined && u1.role !== u2.role) return true;
  if (u2.email !== undefined && u1.email !== u2.email) return true;
  if (u2.phone !== undefined && u1.phone !== u2.phone) return true;
  if (u2.address !== undefined && u1.address !== u2.address) return true;
  if (u2.tenantId !== undefined && u1.tenantId !== u2.tenantId) return true;
  if (u2.tenantLogo !== undefined && u1.tenantLogo !== u2.tenantLogo) return true;
  if (u2.tenantName !== undefined && u1.tenantName !== u2.tenantName) return true;
  if (u2.tenantEndDate !== undefined && u1.tenantEndDate !== u2.tenantEndDate) return true;
  if (u2.customRole !== undefined && stableStringify(u1.customRole) !== stableStringify(u2.customRole)) return true;
  if (u2.platformRole !== undefined && stableStringify(u1.platformRole) !== stableStringify(u2.platformRole)) return true;
  return false;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fire-and-forget server-side token revocation
      serverLogout().catch(() => {});

      setAuthSession(null, null);
      setUser(null);
      setGlobalDashboardCache(null);

      // Clear logo from file system
      try {
        const localUri = FileSystem.documentDirectory + 'tenant_logo.png';
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        }
      } catch (err) {
        console.warn('Failed to delete cached logo on logout:', err);
      }

      // Clear all important cached states when the user logs out
      await AsyncStorage.multiRemove([
        AUTH_STORAGE_KEY,
        REFRESH_TOKEN_KEY,
        'apiIp',
        'parent_selected_child_id',
        '@local_profile_overrides',
        '@tenant_logo_path'
      ]);
    } catch (error) {
       console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for unauthorized/not-found API response triggers
  useEffect(() => {
    registerOnUnauthorized(() => {
      logout();
    });
    return () => {
      // Clear the callback on unmount to avoid calling a stale logout
      registerOnUnauthorized(() => {});
    };
  }, [logout]);

  useEffect(() => {
    // Load session on app start
    async function loadSession() {
      try {
        const storedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedData) {
          const { token, userData } = JSON.parse(storedData);
          if (token && userData) {
            setAuthSession(token, userData.tenantId);
            setUser(userData);
            if (userData.tenantLogo) {
              cacheTenantLogo(userData.tenantLogo).catch(() => {});
            }
            
            // Perform silent validation check on startup to ensure user exists.
            // skipAuthInterceptor keeps the global logout from firing on a cold-start
            // network hiccup — we handle the result explicitly below.
            try {
              const freshMe = await api.get('/auth/me');
              // Server may return { user: {...} } or the user object directly
              const freshUser: Partial<User> | null =
                (freshMe as any)?.user ?? (freshMe as any) ?? null;
              if (freshUser && (freshUser as any).id) {
                setUser(prev => {
                  if (prev && !isUserDifferent(prev, freshUser)) {
                    return prev;
                  }
                  return prev ? { ...prev, ...freshUser } : freshUser as User;
                });
                if (freshUser.tenantLogo) {
                  cacheTenantLogo(freshUser.tenantLogo).catch(() => {});
                }
              }
            } catch (err: any) {
              // On definitive 401/404 the user no longer exists — log out.
              const status = err?.status as number | undefined;
              if (status === 401 || status === 404) {
                await logout();
              } else {
                // Transient failure (network, 500, etc.) — keep the cached session.
                console.warn('Startup session validation check failed:', err);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load auth session:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [logout]);

  // Periodically check if user still exists in database (every 30 seconds)
  // Depend on user?.id only — the user object changes reference on every sync,
  // which would otherwise restart the interval on every successful /me response.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;

    // isActive prevents the async callback from acting after unmount / logout
    let isActive = true;

    const interval = setInterval(async () => {
      if (!isActive) return;
      try {
        // skipAuthInterceptor: a transient 401 during the check must NOT silently
        // log the user out — we validate the response status explicitly below.
        const freshMe = await api.get('/auth/me');
        if (!isActive) return;
        // Server may return { user: {...} } or the user object directly
        const freshUser: Partial<User> | null =
          (freshMe as any)?.user ?? (freshMe as any) ?? null;
        if (freshUser && (freshUser as any).id) {
          setUser(prev => {
            if (prev && !isUserDifferent(prev, freshUser)) {
              return prev;
            }
            return prev ? { ...prev, ...freshUser } : freshUser as User;
          });
          if (freshUser.tenantLogo) {
            cacheTenantLogo(freshUser.tenantLogo).catch(() => {});
          }
        }
      } catch (err: any) {
        if (!isActive) return;
        const status = err?.status as number | undefined;
        if (status === 401 || status === 404) {
          // Definitive: the user account has been removed or the token is permanently
          // invalid. Log out explicitly.
          await logout();
        } else {
          // Transient network failure, server restart, etc. — keep the session alive.
          console.warn('Periodic user existence check failed:', err);
        }
      }
    }, 30000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [userId, logout]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<any>('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });

      if (res.success && res.token) {
        const userData = {
          id: res.user.id,
          name: res.user.name,
          role: res.user.role,
          email: res.user.email,
          phone: res.user.phone,
          address: res.user.address,
          tenantId: res.user.tenantId,
          tenantLogo: res.user.tenantLogo,
          tenantName: res.user.tenantName,
          tenantEndDate: res.user.tenantEndDate,
          customRole: res.user.customRole,
          platformRole: res.user.platformRole,
        };

        // Set global api headers
        setAuthSession(res.token, userData.tenantId);

        // Save refresh token
        if (res.refreshToken) {
          await storeRefreshToken(res.refreshToken);
        }

        // Save to AsyncStorage
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          token: res.token,
          userData: userData
        }));

        if (userData.tenantLogo) {
          cacheTenantLogo(userData.tenantLogo).catch(() => {});
        }

        setUser(userData);
      } else {
        throw new Error('Login failed: Token not found in response');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };



  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    const nextUser = { ...user, ...updatedData };
    setUser(nextUser);
    
    try {
      const storedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        parsed.userData = { ...parsed.userData, ...updatedData };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Failed to update user session data:', error);
    }
  };

  const role = user ? user.role : null;

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Simple global cache for dashboard prefetching
export type DashboardCache = DashboardData | ParentDashboardData | null;
export let globalDashboardCache: DashboardCache = null;
export function setGlobalDashboardCache(data: DashboardCache) {
  globalDashboardCache = data;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
