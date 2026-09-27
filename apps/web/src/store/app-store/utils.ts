import { AppUser, UserRole } from './types';

export const STORAGE_KEYS = {
  USER: 'schoolsaas_user:v1',
  THEME: 'schoolsaas-theme',
  LAST_SCREEN: 'schoolsaas_last_screen',
  SIDEBAR_STATE: 'schoolsaas_sidebar',
  SEARCH_QUERIES: 'schoolsaas_searches',
} as const;

export const CACHE_TTL = 5 * 60 * 1000;
export const SESSION_EXPIRY_DAYS = 30;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  apiCache.set(key, { data, timestamp: Date.now() });
  try {
    localStorage.setItem(`schoolsaas_cache_${key}`, JSON.stringify(data));
    localStorage.setItem(`schoolsaas_cache_ts_${key}`, String(Date.now()));
  } catch { /* ignore */ }
}

export function invalidateCache(key?: string): void {
  if (key) {
    apiCache.delete(key);
    try { localStorage.removeItem(`schoolsaas_cache_${key}`); localStorage.removeItem(`schoolsaas_cache_ts_${key}`); } catch { /* ignore */ }
  } else {
    apiCache.clear();
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('schoolsaas_cache_')) localStorage.removeItem(k);
      });
    } catch { /* ignore */ }
  }
}

const RESERVED_PLATFORM_KEYWORDS = [
  'login', 'api', 'admin', 'super-admin', 'dashboard', 'tenants', 
  'billing', 'users', 'audit-logs', 'analytics', 'platform-analytics', 
  'integrations', 'roles', 'staff', 'settings', 'manage-admins', 'subscriptions'
];

export function parseScreenFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'dashboard';
  if (RESERVED_PLATFORM_KEYWORDS.includes(parts[0])) return parts[0];
  if (parts.length >= 2) return parts[1] || 'dashboard';
  return 'dashboard';
}

export function parseTenantFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  if (RESERVED_PLATFORM_KEYWORDS.includes(parts[0])) return null;
  return parts[0];
}

const validScreens: Record<UserRole, string[]> = {
  super_admin: ['dashboard', 'tenants', 'billing', 'users', 'audit-logs', 'platform-analytics', 'integrations', 'roles', 'staff', 'settings', 'manage-admins'],
  admin: ['dashboard', 'students', 'teachers', 'parents', 'classes', 'subjects', 'attendance', 'fees', 'notices', 'timetable', 'calendar', 'reports', 'roles', 'staff', 'tickets', 'school-settings', 'academic-years', 'expenses', 'promotions', 'bulk-promote', 'graduated', 'certificates', 'leaves', 'student-leaves', 'teacher-leaves', 'staff-leaves', 'grades', 'teacher-attendance', 'staff-attendance', 'exams', 'results-entry', 'published-results', 'admit-cards'],
  teacher: ['dashboard', 'my-classes', 'my-subjects', 'attendance', 'my-attendance', 'take-attendance', 'grade-management', 'assessments', 'school-exams', 'assignments', 'homework', 'leaves', 'timetable', 'notices', 'calendar', 'tickets'],
  student: ['dashboard', 'my-classes', 'my-grades', 'school-exams', 'assessments', 'my-attendance', 'assignments', 'homework', 'timetable', 'notices', 'fees', 'calendar', 'tickets'],
  parent: ['dashboard', 'children', 'grades', 'school-exams', 'assessments', 'homework', 'attendance', 'fees', 'notices', 'timetable', 'subscription', 'calendar', 'tickets'],
  staff: ['dashboard', 'students', 'teachers', 'attendance', 'teacher-attendance', 'staff-attendance', 'my-attendance', 'fees', 'expenses', 'grades', 'notices', 'timetable', 'calendar', 'classes', 'subjects', 'reports', 'certificates', 'tickets', 'academic-years'],
};

export function isValidScreen(role: UserRole, screen: string): boolean {
  return validScreens[role]?.includes(screen) ?? false;
}
