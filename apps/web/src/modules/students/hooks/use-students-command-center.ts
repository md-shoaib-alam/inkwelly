import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/lib/graphql/core';

export type StudentsSession = {
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  totalDays: number;
  dayNumber: number;
  percentComplete: number;
};

export type StudentsStats = {
  total: number;
  admissions: number;
  withdrawals: number;
  graduated: number;
  profileCompletePercent: number;
  boys: number;
  girls: number;
  otherGenders: number;
  medianAge: number;
  youngestAge: number;
  oldestAge: number;
  ageUnknown: number;
  classes: number;
  averageClassSize: number;
  largestClassName: string;
  largestClassSize: number;
  upcomingBirthdays: number;
  openAlerts: number;
};

export type StudentsStage = { key: string; label: string; students: number };

export type StudentsAgeBand = { band: string; boys: number; girls: number };

export type StudentsClassStrength = {
  classId: string;
  label: string;
  students: number;
  boys: number;
  girls: number;
  capacity: number;
};

export type StudentsMovementPoint = {
  month: string;
  label: string;
  admissions: number;
  withdrawals: number;
};

export type StudentsEnrolmentPoint = { period: string; label: string; students: number };

export type StudentsBirthday = {
  id: string;
  name: string;
  className: string;
  date: string;
  daysAway: number;
};

export type StudentsAlert = {
  code: string;
  severity: string;
  count: number;
  title: string;
  detail: string;
  screen: string;
};

/** The last time a student's own record changed — "last touched", not an audit trail. */
export type StudentsActivityEntry = {
  id: string;
  name: string;
  className: string;
  at: string;
  daysAgo: number;
};

/** A tile the shipped design shows and this build has no table for. */
export type StudentsUntrackedTile = { key: string; label: string; reason: string };

export type StudentsCommandCenter = {
  session: StudentsSession | null;
  stats: StudentsStats;
  stages: StudentsStage[];
  agePyramid: StudentsAgeBand[];
  classStrength: StudentsClassStrength[];
  movement: StudentsMovementPoint[];
  enrolment: StudentsEnrolmentPoint[];
  birthdays: StudentsBirthday[];
  alerts: StudentsAlert[];
  recentActivity: StudentsActivityEntry[];
  /** When the newest student record in this cohort changed, as a whole ISO instant. */
  lastUpdated: string | null;
  untracked: StudentsUntrackedTile[];
};

const GET_COMMAND_CENTER = `
  query StudentsCommandCenter($tenantId: String, $academicYear: String) {
    studentsCommandCenter(tenantId: $tenantId, academicYear: $academicYear) {
      session {
        name
        isCurrent
        startDate
        endDate
        totalDays
        dayNumber
        percentComplete
      }
      stats {
        total
        admissions
        withdrawals
        graduated
        profileCompletePercent
        boys
        girls
        otherGenders
        medianAge
        youngestAge
        oldestAge
        ageUnknown
        classes
        averageClassSize
        largestClassName
        largestClassSize
        upcomingBirthdays
        openAlerts
      }
      stages { key label students }
      agePyramid { band boys girls }
      classStrength { classId label students boys girls capacity }
      movement { month label admissions withdrawals }
      enrolment { period label students }
      birthdays { id name className date daysAway }
      alerts { code severity count title detail screen }
      recentActivity { id name className at daysAgo }
      lastUpdated
      untracked { key label reason }
    }
  }
`;

export function useStudentsCommandCenter(tenantId: string | null, academicYear?: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['students-command-center', tenantId, academicYear ?? null],
    queryFn: () =>
      graphqlQuery<{ studentsCommandCenter: StudentsCommandCenter }>(GET_COMMAND_CENTER, {
        tenantId: tenantId ?? undefined,
        academicYear: academicYear ?? undefined,
      }),
    enabled: !!tenantId,
    staleTime: 60_000,
  });

  return {
    data: data?.studentsCommandCenter,
    isLoading,
    error,
    refetch,
  };
}
