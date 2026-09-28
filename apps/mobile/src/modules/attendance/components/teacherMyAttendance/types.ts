export interface AttendanceRecordItem {
  id?: string;
  userId?: string;
  tenantId?: string;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'holiday' | string;
  checkIn?: string | null;
  checkOut?: string | null;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceMetrics {
  present: number;
  absent: number;
  leave: number;
  holiday: number;
  total: number;
  recordedDays: number;
  workingDays: number;
  presentRate: string;
  absentRate: string;
  leaveRate: string;
  holidayRate: string;
}

export interface CalendarDayItem {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  status?: 'present' | 'absent' | 'leave' | 'holiday';
  record?: AttendanceRecordItem;
}
