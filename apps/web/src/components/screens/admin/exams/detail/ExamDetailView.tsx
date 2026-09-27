'use client';

import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Pencil, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedExam } from '../active/ActiveExamTableRow';
import { formatMockupDate } from '../active/activeExamsUtils';
import { ExamOverviewTab } from './ExamOverviewTab';
import { ExamSubjectsTab } from './ExamSubjectsTab';
import { ExamPreviewResultTab } from './ExamPreviewResultTab';
import { ExamPublishResultTab } from './ExamPublishResultTab';
import { ExamRecord } from '../types';

interface ExamDetailViewProps {
  exam: ProcessedExam;
  onBack: () => void;
  onEditExam: (exam: ExamRecord) => void;
  onEnterMarks: (exam: ExamRecord) => void;
  onViewResults: (exam: ExamRecord) => void;
  onRefreshData?: () => void;
}

export type DetailTabType = 'overview' | 'subjects' | 'preview' | 'publish';

export function ExamDetailView({
  exam,
  onBack,
  onEditExam,
  onEnterMarks,
  onViewResults,
  onRefreshData,
}: ExamDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTabType>('overview');

  const primaryFullExam = exam.subjects?.[0]?.fullExam || {
    id: exam.id,
    name: exam.name,
    subjectName: '',
    className: exam.className,
    classSection: exam.classSection || '',
    classId: exam.classId,
    subjectId: '',
    examType: exam.examType,
    date: exam.startDate,
    startTime: '09:00',
    endTime: '12:00',
    status: exam.status as any,
    totalMarks: exam.totalMarks,
    passingMarks: 40,
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Top Breadcrumb (Images 1, 2, 3, 4) */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-foreground transition-colors font-medium p-1 -ml-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800"
          title="Back to all exams"
        >
          <ArrowLeft className="size-4" />
          <span>Exams</span>
        </button>
        <ChevronRight className="size-3.5 text-muted-foreground/60" />
        <span
          className={`font-semibold cursor-pointer hover:underline ${
            activeTab === 'overview' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          {exam.name}
        </span>
        {activeTab === 'subjects' && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">Subjects</span>
          </>
        )}
        {activeTab === 'preview' && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">Preview Result</span>
          </>
        )}
        {activeTab === 'publish' && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">Publish</span>
          </>
        )}
      </div>

      {/* Main Header Row (Image 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-11 sm:size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <FileText className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{exam.name}</h1>
              {/* Status pill badge matching Image 1 */}
              {exam.isPublished ? (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Published
                </span>
              ) : exam.status === 'completed' ? (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Completed
                </span>
              ) : exam.status === 'in_progress' ? (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  In Progress
                </span>
              ) : exam.status === 'upcoming' ? (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Upcoming
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  Draft
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {exam.className} · {formatMockupDate(exam.startDate)} - {formatMockupDate(exam.endDate)}
            </p>
          </div>
        </div>

        <div>
          <Button
            variant="outline"
            onClick={() =>
              onEditExam({
                ...primaryFullExam,
                name: exam.name,
                rawIds: exam.rawIds,
                subjects: exam.subjects,
                subjectCount: exam.subjectCount,
                className: exam.className,
                classSection: exam.classSection || '',
                cleanName: exam.name,
              } as any)
            }
            className="rounded-xl border-border/80 text-foreground font-semibold gap-2 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <Pencil className="size-4 text-muted-foreground" />
            Edit Exam
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar (Image 1) */}
      <div className="flex items-center gap-1 sm:gap-6 border-b border-border/80 overflow-x-auto scrollbar-none px-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-sm font-semibold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'subjects'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Subjects
          <span className="size-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-bold flex items-center justify-center text-muted-foreground">
            {exam.distinctSubjects?.length || exam.subjectCount || exam.subjects?.length || 0}
          </span>
          {activeTab === 'subjects' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
            activeTab === 'preview'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Preview Result
          {activeTab === 'preview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('publish')}
          className={`pb-3 text-sm font-semibold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'publish'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Publish Result
          {exam.isPublished && <CheckCircle2 className="size-3.5 text-emerald-500" />}
          {activeTab === 'publish' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <ExamOverviewTab exam={exam} onNavigateTab={(tab) => setActiveTab(tab)} />
      )}

      {activeTab === 'subjects' && (
        <ExamSubjectsTab
          exam={exam}
          onEnterMarks={onEnterMarks}
          onViewResults={onViewResults}
        />
      )}

      {activeTab === 'preview' && (
        <ExamPreviewResultTab
          exam={exam}
          onNavigatePublish={() => setActiveTab('publish')}
        />
      )}

      {activeTab === 'publish' && (
        <ExamPublishResultTab
          exam={exam}
          onSuccessPublished={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
}
