import { AttendanceRecordItem, AttendanceMetrics, CalendarDayItem } from './types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Formats a Date object as YYYY-MM-DD in Indian Standard Time (Asia/Kolkata).
 * Prevents UTC day shifts.
 */
export function formatLocalDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Computes metric statistics strictly from actual database records for a given month.
 */
export function calculateAttendanceMetrics(
  records: AttendanceRecordItem[],
  daysInMonth: number
): AttendanceMetrics {
  let present = 0;
  let absent = 0;
  let leave = 0;
  let holiday = 0;

  records.forEach((r) => {
    const s = r.status?.toLowerCase();
    if (s === 'present' || s === 'half_day') present++;
    else if (s === 'absent') absent++;
    else if (s === 'leave') leave++;
    else if (s === 'holiday') holiday++;
  });

  const recordedDays = present + absent + leave + holiday;
  const workingDays = present + absent + leave;

  const presentRate = workingDays > 0 ? ((present / workingDays) * 100).toFixed(1) : '0.0';
  const absentRate = workingDays > 0 ? ((absent / workingDays) * 100).toFixed(1) : '0.0';
  const leaveRate = workingDays > 0 ? ((leave / workingDays) * 100).toFixed(1) : '0.0';
  const holidayRate = daysInMonth > 0 ? ((holiday / daysInMonth) * 100).toFixed(1) : '0.0';

  return {
    present,
    absent,
    leave,
    holiday,
    total: daysInMonth,
    recordedDays,
    workingDays,
    presentRate,
    absentRate,
    leaveRate,
    holidayRate,
  };
}

/**
 * Builds the calendar dates matrix (prev month filler, current month, next month filler).
 */
export function generateCalendarGrid(
  year: number,
  month: number, // 0-indexed
  records: AttendanceRecordItem[]
): CalendarDayItem[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun

  const prevMonthDays = new Date(year, month, 0).getDate();
  const days: CalendarDayItem[] = [];

  // Previous month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dNum = prevMonthDays - i;
    const mNum = month === 0 ? 12 : month;
    const yNum = month === 0 ? year - 1 : year;
    const dStr = `${yNum}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    days.push({
      dateStr: dStr,
      dayNumber: dNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const rec = records.find(
      (r) => r.date === dStr || r.date?.split('T')[0] === dStr || r.date?.trim() === dStr
    );
    days.push({
      dateStr: dStr,
      dayNumber: day,
      isCurrentMonth: true,
      status: (rec?.status?.toLowerCase() as any) || undefined,
      record: rec,
    });
  }

  // Next month filler days to complete grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const mNum = month === 11 ? 1 : month + 2;
    const yNum = month === 11 ? year + 1 : year;
    const dStr = `${yNum}-${String(mNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({
      dateStr: dStr,
      dayNumber: day,
      isCurrentMonth: false,
    });
  }

  return days;
}
