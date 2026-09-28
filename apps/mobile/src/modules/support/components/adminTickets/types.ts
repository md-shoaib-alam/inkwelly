export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  };
}

export interface Ticket {
  id: string;
  tenantId?: string | null;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'billing' | 'technical' | 'academics' | 'feature_request' | 'complaint' | 'other';
  createdBy: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
  creator?: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  } | null;
  assignee?: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  } | null;
  messages?: TicketMessage[];
}

export const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#007AFF' }, // Blue
  in_progress: { label: 'In Progress', color: '#AF52DE' }, // Purple
  on_hold: { label: 'On Hold', color: '#FF9500' }, // Orange
  resolved: { label: 'Resolved', color: '#34C759' }, // Green
  closed: { label: 'Closed', color: '#8E8E93' }, // Gray
};

export const TICKET_PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: '#8E8E93' },
  medium: { label: 'Medium', color: '#007AFF' },
  high: { label: 'High', color: '#FF9500' },
  urgent: { label: 'Urgent', color: '#FF3B30' },
};

export const TICKET_CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  general: { label: 'General', icon: 'help-circle-outline' },
  billing: { label: 'Billing & Fees', icon: 'card-outline' },
  technical: { label: 'Technical Issue', icon: 'hardware-chip-outline' },
  academics: { label: 'Academics', icon: 'book-outline' },
  feature_request: { label: 'Feature Request', icon: 'bulb-outline' },
  complaint: { label: 'Complaint', icon: 'alert-circle-outline' },
  other: { label: 'Other', icon: 'ellipsis-horizontal-outline' },
};
