import type { Student, SiblingInfo } from '@/types/index';

export interface StudentProfileProps {
  student: Student;
  onBack: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (student: Student) => void;
  onToggleStatus?: (student: Student) => void;
  onStudentUpdated?: (student: Student) => void;
}

export type ProfileTab = 'overview' | 'academics' | 'attendance' | 'fees';

export const EMERALD = {
  primary: '#10B981',
  dark: '#059669',
  lightBg: '#ECFDF5',
  darkBg: '#064E3B28',
  lightBorder: '#A7F3D0',
  darkBorder: '#065F46',
  avatarBg: '#D1FAE5',
  avatarText: '#065F46',
  badgeText: '#047857',
};

export function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function calculateAge(dobStr?: string | null): string {
  if (!dobStr) return '—';
  try {
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return '—';
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years` : '< 1 year';
  } catch {
    return '—';
  }
}
