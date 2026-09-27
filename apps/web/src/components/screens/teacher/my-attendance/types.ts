export interface AttendanceRecordItem {
  id?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  date: string; // YYYY-MM-DD (local)
  month?: string; // YYYY-MM
  status: 'present' | 'absent' | 'leave' | 'holiday' | 'half_day';
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
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
  status?: 'present' | 'absent' | 'leave' | 'holiday' | 'half_day';
  record?: AttendanceRecordItem;
}
