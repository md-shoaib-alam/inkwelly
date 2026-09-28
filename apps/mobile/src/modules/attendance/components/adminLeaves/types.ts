export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  approverRemarks?: string;
  createdAt: string;
}

export const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: '#FF9500', label: 'Pending' },
  approved: { color: '#34C759', label: 'Approved' },
  rejected: { color: '#FF3B30', label: 'Rejected' },
  cancelled: { color: '#8E8E93', label: 'Cancelled' },
};

export const LEAVE_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  casual: { color: '#007AFF', label: 'Casual' },
  sick: { color: '#FF3B30', label: 'Sick' },
  earned: { color: '#34C759', label: 'Earned' },
  maternity: { color: '#AF52DE', label: 'Maternity' },
  paternity: { color: '#5856D6', label: 'Paternity' },
  duty: { color: '#5856D6', label: 'Duty Leave' },
};
