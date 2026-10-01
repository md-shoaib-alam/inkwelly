import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/lib/graphql/core';

export type AcademicsSession = {
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  totalDays: number;
  dayNumber: number;
  percentComplete: number;
};

export type AcademicsStats = {
  classes: number;
  students: number;
  teachers: number;
  subjects: number;
  offerings: number;
  taught: number;
  classLevels: number;
  classesWithOfferings: number;
  ratio: number;
  ratioLabel: string;
  ratioBand: string;
};

export type AcademicsAxis = {
  key: string;
  label: string;
  tracked: boolean;
  percent: number;
  detail: string;
};

export type AcademicsStage = { key: string; label: string; classes: number; students: number };

export type AcademicsGrowthPoint = { year: string; students: number; exams: number };

export type AcademicsFinding = {
  code: string;
  severity: string;
  count: number;
  title: string;
  detail: string;
  screen: string;
};

export type AcademicsCommandCenter = {
  session: AcademicsSession | null;
  stats: AcademicsStats;
  readiness: { score: number; axes: AcademicsAxis[] };
  stages: AcademicsStage[];
  growth: { sessions: number; points: AcademicsGrowthPoint[] };
  findings: AcademicsFinding[];
};

const GET_COMMAND_CENTER = `
  query AcademicsCommandCenter($tenantId: String, $academicYear: String) {
    academicsCommandCenter(tenantId: $tenantId, academicYear: $academicYear) {
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
        classes
        students
        teachers
        subjects
        offerings
        taught
        classLevels
        classesWithOfferings
        ratio
        ratioLabel
        ratioBand
      }
      readiness {
        score
        axes { key label tracked percent detail }
      }
      stages { key label classes students }
      growth {
        sessions
        points { year students exams }
      }
      findings { code severity count title detail screen }
    }
  }
`;

export function useAcademicsCommandCenter(tenantId: string | null, academicYear?: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['academics-command-center', tenantId, academicYear ?? null],
    queryFn: () =>
      graphqlQuery<{ academicsCommandCenter: AcademicsCommandCenter }>(GET_COMMAND_CENTER, {
        tenantId: tenantId ?? undefined,
        academicYear: academicYear ?? undefined,
      }),
    enabled: !!tenantId,
    staleTime: 60_000,
  });

  return {
    data: data?.academicsCommandCenter,
    isLoading,
    error,
    refetch,
  };
}
