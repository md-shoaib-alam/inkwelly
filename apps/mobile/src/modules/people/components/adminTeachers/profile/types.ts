import type { Teacher } from '../types';

export type TeacherProfileTab = 'overview' | 'classes' | 'attendance';

export interface TeacherProfileProps {
  teacher: Teacher;
  onBack: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (teacher: Teacher) => void;
  onDelete?: (teacher: Teacher) => void;
  onRefresh?: () => void;
}

export const EMERALD = {
  primary: '#10B981',
  dark: '#059669',
  deep: '#047857',
  light: '#ECFDF5',
  border: '#A7F3D0',
  tint: 'rgba(16, 185, 129, 0.1)',
};

export function getInitials(name: string): string {
  if (!name) return 'TC';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
