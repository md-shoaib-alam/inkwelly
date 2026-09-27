'use client';

import { CheckCircle2, ArrowLeft, Loader2, Sparkles, Layers, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatToDdMmYyyy } from '@/lib/utils';
import { ClassOption } from '../types';
import { BulkSubjectRow } from './wizardTypes';

interface Step4ReviewProps {
  examName: string;
  selectedClasses: ClassOption[];
  selectedGrade: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  currentBulkRows: BulkSubjectRow[];
  submitting: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  isEdit?: boolean;
}

export function Step4Review({
  examName,
  selectedClasses,
  selectedGrade,
  academicYear,
  startDate,
  endDate,
  currentBulkRows,
  submitting,
  onBack,
  onCancel,
  onSubmit,
  isEdit = false,
}: Step4ReviewProps) {
  const chosenUniversalRows = currentBulkRows.filter((r) => r.selected);
  const totalPapersCount = chosenUniversalRows.length * selectedClasses.length;

  const rawName = selectedClasses[0]?.name || selectedGrade || 'Class 1';
  const cleanName = rawName.toLowerCase().startsWith('class')
    ? rawName
    : `Class ${rawName.replace(/^grade\s*/i, '')}`;
  const sectionsList = selectedClasses.map((c) => c.section).filter(Boolean);
  const sectionsDisplay = sectionsList.length > 0 ? sectionsList.join(', ') : 'All';

  // Distinct color palettes for the colorful icon badges matching the mobile mockup
  const subjectColors = [
    { bg: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
    { bg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    { bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { bg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' },
    { bg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
    { bg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400' },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
      {/* Step Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div className="size-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold flex items-center justify-center text-sm shrink-0">
          4
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Review & Create Exam</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Confirm all exam details and schedule before publishing.</p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Exam Name</p>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{examName || '-'}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Class</p>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{cleanName}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Section: <span className="font-semibold text-slate-700 dark:text-zinc-300">{sectionsDisplay}</span>
            </p>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Academic Year</p>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{academicYear}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Duration</p>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">
            {formatToDdMmYyyy(startDate)} to {formatToDdMmYyyy(endDate)}
          </p>
        </div>
      </div>

      {/* Summary of Papers */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-0.5">
          EXAM PAPERS TO SCHEDULE ({totalPapersCount} TOTAL ACROSS {selectedClasses.length} CLASS{selectedClasses.length > 1 ? 'ES' : ''})
        </h4>

        {/* Desktop View: Keep clean original desktop list */}
        <div className="hidden sm:block divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
          {chosenUniversalRows.map((row) => (
            <div key={row.key} className="p-3.5 flex items-center justify-between bg-white dark:bg-zinc-900 text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{row.subjectName}</span>
                  <span className="text-slate-400 ml-2">({row.totalMarks} Marks)</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400 font-medium">
                <span>{formatToDdMmYyyy(row.date)}</span>
                <span>
                  {row.startTime} - {row.endTime}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View: Exact match with screenshot (media_1790172340907.png) */}
        <div className="sm:hidden border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs">
          {chosenUniversalRows.map((row, idx) => {
            const colorScheme = subjectColors[idx % subjectColors.length];
            return (
              <div key={row.key} className="p-3.5 flex items-center justify-between gap-3">
                {/* Left side: Colorful layered icon + Name + Marks */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-10 rounded-2xl ${colorScheme.bg} flex items-center justify-center shrink-0`}>
                    <Layers className="size-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate leading-tight">
                      {row.subjectName}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      ({row.totalMarks} Marks)
                    </p>
                  </div>
                </div>

                {/* Right side: Calendar date + Clock time stack */}
                <div className="flex flex-col items-end gap-1 shrink-0 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-slate-400" />
                    <span className="text-[11px]">{formatToDdMmYyyy(row.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-slate-400" />
                    <span className="text-[11px]">{row.startTime} - {row.endTime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
        {/* Back Button: On mobile, styled as rounded-2xl with arrow & bold Back; on desktop, outline standard */}
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="h-11 sm:h-10 px-4 sm:px-5 rounded-2xl sm:rounded-xl border-slate-200 dark:border-zinc-700 gap-2 shrink-0 bg-white dark:bg-zinc-900 hover:bg-slate-50 font-semibold sm:font-normal text-slate-800 dark:text-zinc-200"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* Cancel button: Desktop only as in screenshot */}
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="hidden sm:inline-flex h-10 px-5 rounded-xl border-slate-200 dark:border-zinc-700"
          >
            Cancel
          </Button>

          {/* Submit button */}
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white h-11 sm:h-10 px-4 sm:px-7 rounded-2xl sm:rounded-xl font-semibold gap-2 shadow-md shadow-blue-500/25 justify-center cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4 fill-white/20" />
                <span>{isEdit ? 'Save Changes' : 'Create Exam Schedule'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
