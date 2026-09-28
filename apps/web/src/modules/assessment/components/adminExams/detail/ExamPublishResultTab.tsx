'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileCheck2,
  Info,
  GraduationCap,
  Users,
  BookOpen,
  Award,
  CheckCircle2,
  Loader2,
  Calendar,
  Send,
} from 'lucide-react';
import { ProcessedExam } from '../active/ActiveExamTableRow';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface ExamPublishResultTabProps {
  exam: ProcessedExam;
  onSuccessPublished: () => void;
}

export function ExamPublishResultTab({ exam, onSuccessPublished }: ExamPublishResultTabProps) {
  const [publishToStudents, setPublishToStudents] = useState(true);
  const [publishToParents, setPublishToParents] = useState(true);
  const [publishTiming, setPublishTiming] = useState<'now' | 'schedule'>('now');
  const [publishing, setPublishing] = useState(false);
  const [isPublishedState, setIsPublishedState] = useState(exam.isPublished);

  // Distinct subjects (e.g. 5 subjects) for display
  const distinctSubjects = exam.distinctSubjects || [];
  const totalSubjects = distinctSubjects.length || exam.subjectCount || exam.subjects?.length || 0;

  // Raw subject papers count across all sections (e.g. 10 papers = 5 subjects x 2 sections)
  const rawSubjectCount = exam.subjects?.length || 0;
  const completedSubjects = exam.subjects?.filter((s) => s.status === 'completed').length || 0;
  const allCompleted = completedSubjects === rawSubjectCount && rawSubjectCount > 0;

  // True total unique students across all sections in this exam (e.g. 40, or 41 if Section A=20, B=21)
  const totalStudents = exam.totalStudents || 0;

  // Total marks is computed from distinct subjects (e.g. 5 subjects x 100 = 500)
  const totalMarks = exam.totalMarks || distinctSubjects.reduce((acc, s) => acc + (s.totalMarks || 0), 0) || 0;

  // Total marks entries expected across all student papers
  // Each paper has `s.totalStudents`. Sum of all papers' students = total marks entries expected!
  // E.g., Section A (20 students x 5 papers = 100) + Section B (21 students x 5 papers = 105) = 205 entries (or 200 for 40 students).
  const totalEntriesExpected =
    exam.subjects?.reduce((acc, s) => acc + (s.totalStudents || 0), 0) ||
    (totalStudents * totalSubjects);

  // Actual marks entered across all papers
  const actualEntries = exam.subjects?.reduce((acc, s) => acc + (s.marksEnteredCount || 0), 0) || 0;
  const entriesPercentage =
    totalEntriesExpected > 0 ? Math.round((actualEntries / totalEntriesExpected) * 100) : 0;

  const handlePublishSubmit = async () => {
    if (!allCompleted && !isPublishedState) {
      toast.error('All subjects must be marked as completed before publishing.');
      return;
    }

    setPublishing(true);
    try {
      const res = await apiFetch('/api/exams/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examIds: exam.rawIds,
          classId: exam.classId,
          examName: exam.name,
          publishToStudents,
          publishToParents,
        }),
      });

      if (res.ok) {
        toast.success(`Results for "${exam.name}" have been published to students and parents!`);
        setIsPublishedState(true);
        onSuccessPublished();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to publish exam results');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred while publishing results');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Title Header with Publish button (Image 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-11 sm:size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <FileCheck2 className="size-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">Publish Result</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Make the result visible to students and parents.
            </p>
          </div>
        </div>

        <div>
          <Button
            onClick={handlePublishSubmit}
            disabled={publishing || (!allCompleted && !isPublishedState)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl gap-2 shadow-sm px-5 py-2.5 disabled:opacity-60"
          >
            {publishing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Publishing...
              </>
            ) : isPublishedState ? (
              <>
                <CheckCircle2 className="size-4 text-white" />
                Results Published
              </>
            ) : (
              <>
                <Send className="size-4 text-white" />
                Publish Result
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Alert Banner (Image 4) */}
      {!isPublishedState && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            allCompleted
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300'
          }`}
        >
          <Info className="size-5 shrink-0" />
          <span>
            {allCompleted
              ? 'All subjects are marked as completed! You can now finalize and publish results.'
              : 'All subjects must be marked as completed before publishing.'}
          </span>
        </div>
      )}

      {/* 2-Column Cards Grid (Image 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Publication Settings Card */}
        <Card className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border/70 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground">Publication Settings</h3>

          {/* Publish To */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Publish To</p>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground select-none">
                <Checkbox
                  checked={publishToStudents}
                  onCheckedChange={(c) => setPublishToStudents(!!c)}
                  className="rounded-md"
                />
                Students
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground select-none">
                <Checkbox
                  checked={publishToParents}
                  onCheckedChange={(c) => setPublishToParents(!!c)}
                  className="rounded-md"
                />
                Parents
              </label>
            </div>
          </div>

          {/* Publish Date */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Publish Date</p>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-foreground select-none">
                <input
                  type="radio"
                  name="publishTiming"
                  checked={publishTiming === 'now'}
                  onChange={() => setPublishTiming('now')}
                  className="size-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Publish Now</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-foreground select-none">
                <input
                  type="radio"
                  name="publishTiming"
                  checked={publishTiming === 'schedule'}
                  onChange={() => setPublishTiming('schedule')}
                  className="size-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Schedule for Later</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Right: Result Summary Card (Image 4) */}
        <Card className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border/70 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Result Summary</h3>

          <div className="space-y-3.5 divide-y divide-border/60 text-sm">
            {/* Class */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <GraduationCap className="size-4 text-slate-500" />
                <span>Class</span>
              </div>
              <span className="font-bold text-foreground">{exam.className}</span>
            </div>

            {/* Total Students */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Users className="size-4 text-slate-500" />
                <span>Total Students</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">{totalStudents}</span>
            </div>

            {/* Total Subjects */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <BookOpen className="size-4 text-slate-500" />
                <span>Total Subjects</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">{totalSubjects}</span>
            </div>

            {/* Total Marks */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Award className="size-4 text-slate-500" />
                <span>Total Marks</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">{totalMarks}</span>
            </div>

            {/* Marks Entered */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <CheckCircle2 className="size-4 text-slate-500" />
                <span>Marks Entered</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">
                {allCompleted ? '100%' : `${entriesPercentage}%`}{' '}
                <span className="text-muted-foreground font-normal text-xs">
                  ({allCompleted ? totalEntriesExpected : actualEntries}/{totalEntriesExpected})
                </span>
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="size-4 text-slate-500" />
                <span>Status</span>
              </div>
              <div>
                {isPublishedState ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Published
                  </span>
                ) : allCompleted ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Ready to Publish
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Incomplete Evaluation
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
