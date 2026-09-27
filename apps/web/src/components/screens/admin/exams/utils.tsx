'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { parseLocalDate } from '@/lib/utils';
import { ExamRecord, ExamFormData } from './types';

const statusConfig: Record<string, { bg: string; label: string }> = {
  scheduled: { bg: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', label: 'Scheduled' },
  ongoing: { bg: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', label: 'Ongoing' },
  in_progress: { bg: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', label: 'In Progress' },
  completed: { bg: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800', label: 'Completed' },
  published: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', label: 'Published' },
  cancelled: { bg: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Cancelled' },
};

const examTypeConfig: Record<string, { bg: string; label: string }> = {
  unit_test: { bg: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800', label: 'Unit Test' },
  midterm: { bg: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800', label: 'Midterm' },
  final: { bg: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', label: 'Final' },
  quiz: { bg: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800', label: 'Quiz' },
  practical: { bg: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800', label: 'Practical' },
};

export const emptyExamForm: ExamFormData = {
  classId: '', subjectId: '', examType: 'midterm', name: '',
  date: '', startTime: '', endTime: '', totalMarks: '100', passingMarks: '40',
  academicYear: ''
};

export function TabLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 dark:border-sky-950/40 bg-gradient-to-r from-sky-50/60 via-blue-50/40 to-sky-100/50 dark:from-sky-950/20 dark:via-blue-950/10 dark:to-sky-900/20 px-5 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-5 sm:h-6 w-36 sm:w-56 rounded-lg" />
            <Skeleton className="hidden sm:block h-3.5 w-72 sm:w-96 rounded-md" />
            <Skeleton className="h-9 w-full max-w-sm rounded-xl mt-2" />
          </div>
          <Skeleton className="h-18 sm:h-22 w-24 sm:w-32 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Header Skeleton (Title on Desktop, Actions on Mobile & Desktop) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="hidden md:flex items-center gap-3.5">
          <Skeleton className="size-11 sm:size-12 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-28 rounded-md" />
            <Skeleton className="h-3.5 w-56 rounded-md" />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full md:w-auto">
          <Skeleton className="h-9 w-full sm:w-44 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-border/60 pb-2">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>

      {/* Main Table Card Skeleton */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2.5 border-b border-border/30 last:border-0">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="space-y-1 flex-1 max-w-xs">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const formatDate = (d: string) => {
  if (!d) return '--';
  const parsed = parseLocalDate(d);
  return parsed ? parsed.toLocaleDateString() : d || '--';
};

export const formatTime = (t: any) => t || '--:--';

export const getStatusBadge = (s: string) => (
  <Badge className={statusConfig[s]?.bg}>{statusConfig[s]?.label || s}</Badge>
);

export const getExamTypeBadge = (t: string) => (
  <Badge className={examTypeConfig[t]?.bg}>{examTypeConfig[t]?.label || t}</Badge>
);

export const getGroupedExams = (examsList: ExamRecord[]) => {
  const groups: Record<string, { cycleName: string; academicYear: string; exams: ExamRecord[] }> = {};
  
  examsList.forEach(exam => {
    const cycleName = exam.name.includes(' - ') ? exam.name.split(' - ')[0] : exam.name;
    const academicYear = exam.academicYear || '2024-2025';
    const key = `${cycleName}::${academicYear}`;
    
    if (!groups[key]) {
      groups[key] = {
        cycleName,
        academicYear,
        exams: []
      };
    }
    groups[key].exams.push(exam);
  });
  
  return Object.values(groups).sort((a, b) => {
    if (a.academicYear !== b.academicYear) {
      return b.academicYear.localeCompare(a.academicYear);
    }
    return a.cycleName.localeCompare(b.cycleName);
  });
};
