'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, FileText, Calendar, CheckCircle2, Clock, CircleAlert, ArrowRight } from 'lucide-react';
import { ProcessedExam } from '../active/ActiveExamTableRow';
import { formatMockupDate } from '../active/activeExamsUtils';

interface ExamOverviewTabProps {
  exam: ProcessedExam;
  onNavigateTab: (tab: 'overview' | 'subjects' | 'preview' | 'publish') => void;
}

export function ExamOverviewTab({ exam, onNavigateTab }: ExamOverviewTabProps) {
  const allSubjectsCount = exam.completion?.total || exam.subjects?.length || 0;
  const distinctCount = exam.distinctSubjects?.length || exam.subjectCount || allSubjectsCount;
  const sectionsCount = distinctCount > 0 && allSubjectsCount > distinctCount
    ? Math.round(allSubjectsCount / distinctCount)
    : 1;
  const isMultiSection = sectionsCount > 1;

  const completed = exam.completion?.completed || 0;
  const inProgress = exam.completion?.inProgress || 0;
  const notStarted = exam.completion?.notStarted || 0;
  // For completion display: completed distinct subjects = sections where that subject is done
  // Use raw completion percentage (over all papers) as it's the most accurate
  const percentage = exam.completion?.percentage ?? 0;
  // For the label: show distinct subjects done / total distinct subjects
  const completedDistinct = distinctCount > 0 ? Math.round((completed / (sectionsCount || 1))) : completed;

  return (
    <div className="space-y-6">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Class */}
        <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60 shrink-0">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Class</p>
            <p className="text-sm sm:text-base font-bold text-foreground truncate">{exam.className}</p>
          </div>
        </div>

        {/* Type */}
        <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shrink-0">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Type</p>
            <p className="text-sm sm:text-base font-bold text-foreground capitalize truncate">
              {exam.examType.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Start Date */}
        <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-11 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-200/60 dark:border-pink-800/60 shrink-0">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Start Date</p>
            <p className="text-sm sm:text-base font-bold text-foreground truncate">{formatMockupDate(exam.startDate)}</p>
          </div>
        </div>

        {/* End Date */}
        <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-11 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/60 dark:border-sky-800/60 shrink-0">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">End Date</p>
            <p className="text-sm sm:text-base font-bold text-foreground truncate">{formatMockupDate(exam.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Subject Completion Card (Image 1) */}
      <Card className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border/70 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold text-foreground">Subject Completion</h3>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground font-medium">
              <strong className="text-foreground font-semibold">{completedDistinct}</strong> / {distinctCount} subjects completed
              {isMultiSection && (
                <span className="ml-1 text-xs text-muted-foreground/70">
                  ({sectionsCount} sections · {allSubjectsCount} papers)
                </span>
              )}
            </span>
            <span className="font-bold text-foreground">{percentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Completed */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Completed</p>
              <p className="text-lg font-bold text-emerald-950 dark:text-emerald-100 leading-tight">{completed}</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="size-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">In Progress</p>
              <p className="text-lg font-bold text-amber-950 dark:text-amber-100 leading-tight">{inProgress}</p>
            </div>
          </div>

          {/* Not Started */}
          <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="size-8 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0">
              <CircleAlert className="size-4" />
            </div>
            <div>
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Not Started</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{notStarted}</p>
            </div>
          </div>
        </div>

        {/* Quick actions footer */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            {completed === allSubjectsCount
              ? 'All subjects evaluated! Ready for result preview and publication.'
              : `${allSubjectsCount - completed} papers remaining to finish mark evaluation.`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('subjects')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              Manage Subjects <ArrowRight className="size-3.5" />
            </button>
            <span className="text-muted-foreground/60 text-xs">·</span>
            <button
              onClick={() => onNavigateTab('preview')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              Preview Result <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
