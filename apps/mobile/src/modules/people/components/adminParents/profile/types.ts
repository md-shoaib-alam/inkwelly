import type { Parent, Child } from '../types';

export type ParentProfileTab = 'overview' | 'children' | 'fees';

export interface ParentProfileProps {
  parent: Parent;
  onBack: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (parent: Parent) => void;
  onDelete?: (parent: Parent) => void;
  onLinkChildClick?: () => void;
  onUnlinkChildClick?: (child: Child) => void;
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
  if (!name) return 'PR';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
