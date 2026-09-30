import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/lib/graphql/core';

/** What a school that has never opened the attendance settings is measured against. */
export const DEFAULT_CUTOFF = '09:00';
export const DEFAULT_TARGET = 92;

export type AttendanceSession = {
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  totalDays: number;
  dayNumber: number;
  percentComplete: number;
};

export type AttendanceSettingsView = {
  cutoffTime: string;
  targetRate: number;
  cutoffPassed: boolean;
  isSchoolDayToday: boolean;
  todayHolidayName: string;
};

export type AttendanceStats = {
  todayRate: number;
  presentToday: number;
  absentToday: number;
  unmarkedToday: number;
  rollStrength: number;
  markedClasses: number;
  totalClasses: number;
  classesLeft: number;
  weekRate: number;
  sessionRate: number;
  previousMonthRate: number | null;
  sessionRateDelta: number | null;
  todayRateDelta: number;
};

export type AttendanceStatusCell = {
  key: string;
  label: string;
  students: number;
  share: number;
  /** `students` for the five statuses, `classes` for the unmarked column. */
  kind: string;
};

export type AttendanceMarkingRow = {
  classId: string;
  label: string;
  marked: boolean;
  studentsMarked: number;
  studentsOnRoll: number;
  rate: number;
  present: number;
  absent: number;
  teacherName: string;
  teacherAvatar: string | null;
};

export type AttendanceCalendarDay = {
  date: string;
  dayOfMonth: number;
  rate: number;
  marked: boolean;
  isSchoolDay: boolean;
  isHoliday: boolean;
  markName: string;
  band: string;
};

export type AttendanceMonthMark = { date: string; name: string; kind: string };

export type AttendanceCommandCenter = {
  session: AttendanceSession | null;
  settings: AttendanceSettingsView;
  stats: AttendanceStats;
  statusBreakdown: AttendanceStatusCell[];
  marking: AttendanceMarkingRow[];
  calendar: AttendanceCalendarDay[];
  monthLabel: string;
  displayedMonth: string;
  monthMarks: AttendanceMonthMark[];
  today: string;
};

const GET_COMMAND_CENTER = `
  query AttendanceCommandCenter($tenantId: String, $academicYear: String, $month: String) {
    attendanceCommandCenter(tenantId: $tenantId, academicYear: $academicYear, month: $month) {
      session {
        name
        isCurrent
        startDate
        endDate
        totalDays
        dayNumber
        percentComplete
      }
      settings {
        cutoffTime
        targetRate
        cutoffPassed
        isSchoolDayToday
        todayHolidayName
      }
      stats {
        todayRate
        presentToday
        absentToday
        unmarkedToday
        rollStrength
        markedClasses
        totalClasses
        classesLeft
        weekRate
        sessionRate
        previousMonthRate
        sessionRateDelta
        todayRateDelta
      }
      statusBreakdown { key label students share kind }
      marking {
        classId
        label
        marked
        studentsMarked
        studentsOnRoll
        rate
        present
        absent
        teacherName
        teacherAvatar
      }
      calendar { date dayOfMonth rate marked isSchoolDay isHoliday markName band }
      monthLabel
      displayedMonth
      monthMarks { date name kind }
      today
    }
  }
`;

/**
 * `month` moves the calendar grid only; every rate stays anchored on today, which is why
 * the chevrons refetch rather than re-slice what is already cached.
 */
export function useAttendanceCommandCenter(
  tenantId: string | null,
  academicYear?: string | null,
  month?: string | null,
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance-command-center', tenantId, academicYear ?? null, month ?? null],
    queryFn: () =>
      graphqlQuery<{ attendanceCommandCenter: AttendanceCommandCenter }>(GET_COMMAND_CENTER, {
        tenantId: tenantId ?? undefined,
        academicYear: academicYear ?? undefined,
        month: month ?? undefined,
      }),
    enabled: !!tenantId,
    staleTime: 60_000,
  });

  return {
    data: data?.attendanceCommandCenter,
    isLoading,
    error,
    refetch,
  };
}
