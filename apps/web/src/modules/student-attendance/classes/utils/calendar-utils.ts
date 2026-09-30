import { format, parse, addMonths, subMonths } from 'date-fns';

export interface MonthDayInfo {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su';
  isSunday: boolean;
  isSaturday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWorkingDay: boolean;
  isOutsideSession?: boolean;
}

// Well-known national / school holidays for default calendar marks
const COMMON_HOLIDAYS_BY_MONTH_DAY: Record<string, string> = {
  '01-26': 'REPUBLIC DAY',
  '08-15': 'INDEPENDENCE DAY',
  '09-04': 'JANMASHTAMI',
  '10-02': 'GANDHI JAYANTI',
  '11-01': 'DIWALI',
  '12-25': 'CHRISTMAS',
};

const DAY_OF_WEEK_SHORT: Record<number, 'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'> = {
  0: 'Su',
  1: 'Mo',
  2: 'Tu',
  3: 'We',
  4: 'Th',
  5: 'Fr',
  6: 'Sa',
};

export function slugify(value: string): string {
  return (value || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function buildClassSlug(name: string, section?: string): string {
  const parts = [slugify(name), section ? slugify(section) : ''].filter(Boolean);
  return parts.join('-');
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(yearMonth: string): string {
  try {
    const d = parse(yearMonth, 'yyyy-MM', new Date());
    return format(d, 'MMMM yyyy');
  } catch {
    return yearMonth;
  }
}

export function getPrevMonth(yearMonth: string): string {
  try {
    const d = parse(yearMonth, 'yyyy-MM', new Date());
    return format(subMonths(d, 1), 'yyyy-MM');
  } catch {
    return yearMonth;
  }
}

export function getNextMonth(yearMonth: string): string {
  try {
    const d = parse(yearMonth, 'yyyy-MM', new Date());
    return format(addMonths(d, 1), 'yyyy-MM');
  } catch {
    return yearMonth;
  }
}

export interface GetMonthDaysOptions {
  customHolidays?: Array<{ date: string; name: string }>;
  sessionStartDate?: string; // YYYY-MM-DD
  sessionEndDate?: string;   // YYYY-MM-DD
}

export function getMonthDays(
  yearMonth: string,
  options?: GetMonthDaysOptions | Array<{ date: string; name: string }>
): MonthDayInfo[] {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr || '2026', 10);
  const month = parseInt(monthStr || '9', 10); // 1-indexed

  const customHolidays = Array.isArray(options) ? options : options?.customHolidays;
  const sessionStartDate = !Array.isArray(options) ? options?.sessionStartDate : undefined;
  const sessionEndDate = !Array.isArray(options) ? options?.sessionEndDate : undefined;

  // Total days in this month
  const totalDays = new Date(year, month, 0).getDate();
  const days: MonthDayInfo[] = [];

  const holidayMap = new Map<string, string>();
  if (customHolidays) {
    for (const h of customHolidays) {
      if (h.date && h.name) holidayMap.set(h.date, h.name.toUpperCase());
    }
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeekNum = dateObj.getDay();
    const dayOfWeek = DAY_OF_WEEK_SHORT[dayOfWeekNum] || 'Mo';
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthDayKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isSunday = dayOfWeekNum === 0;
    const isSaturday = dayOfWeekNum === 6;

    let holidayName = holidayMap.get(dateStr) || COMMON_HOLIDAYS_BY_MONTH_DAY[monthDayKey];
    const isHoliday = !!holidayName && !isSunday;

    // Academic session boundary check (matching Image 2)
    const isOutsideSession = Boolean(
      (sessionStartDate && dateStr < sessionStartDate) ||
      (sessionEndDate && dateStr > sessionEndDate)
    );

    const isWorkingDay = !isSunday && !isHoliday && !isOutsideSession;

    days.push({
      date: dateStr,
      dayOfMonth: day,
      dayOfWeek: dayOfWeek as MonthDayInfo['dayOfWeek'],
      isSunday,
      isSaturday,
      isHoliday,
      holidayName,
      isWorkingDay,
      isOutsideSession,
    });
  }

  return days;
}

export function countWorkingDays(days: MonthDayInfo[]): number {
  return days.filter((d) => d.isWorkingDay).length;
}
