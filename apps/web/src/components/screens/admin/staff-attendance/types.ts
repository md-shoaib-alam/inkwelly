export type AttendanceStatus = 'present' | 'absent';

export interface StaffAttendanceItem {
  id: string;
  staffName: string;
  role: string;
  status: AttendanceStatus;
}

export interface AttendanceStatsData {
  total: number;
  present: number;
  absent: number;
}

export interface StaffAttendanceProps {
  initialTab?: string;
}
