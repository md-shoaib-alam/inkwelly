import type { StaffMember, CustomRole } from '../types';

export type StaffProfileTab = 'overview' | 'attendance';

export interface StaffProfileProps {
  member: StaffMember;
  roles?: CustomRole[];
  onBack: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (member: StaffMember) => void;
  onDelete?: (member: StaffMember) => void;
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
  if (!name) return 'ST';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
