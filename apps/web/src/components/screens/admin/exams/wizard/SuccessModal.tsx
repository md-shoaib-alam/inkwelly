'use client';

import { Check, X, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatedExamSummary } from './wizardTypes';

interface SuccessModalProps {
  summary: CreatedExamSummary;
  onSuccess: () => void;
}

export function SuccessModal({ summary, onSuccess }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Close X Button */}
        <button
          type="button"
          onClick={onSuccess}
          className="absolute top-4 right-4 size-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-600 dark:text-zinc-400 flex items-center justify-center transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Confetti & Success Checkmark Icon */}
        <div className="relative mx-auto size-24 flex items-center justify-center">
          <div className="absolute top-1 left-2 size-2 rounded-full bg-blue-500 animate-bounce delay-100" />
          <div className="absolute top-0 right-4 size-2.5 rounded-sm bg-blue-600 rotate-45" />
          <div className="absolute bottom-2 left-3 size-2 rounded-full bg-pink-500" />
          <div className="absolute top-6 right-0 size-2 rounded-full bg-amber-400" />
          <div className="absolute bottom-1 right-3 size-2 rounded-sm bg-emerald-400 rotate-12" />
          <div className="absolute -top-1 left-8 size-2 rounded-sm bg-orange-500 rotate-45" />

          {/* Main Green Checkmark Circle */}
          <div className="size-20 rounded-full bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <Check className="size-10 stroke-[3.5]" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {summary.isEdit ? 'Exam Updated Successfully!' : 'Exam Created Successfully!'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-zinc-200">{summary.examName}</span> has been{' '}
            {summary.isEdit ? 'updated' : 'created'} for{' '}
            <span className="font-semibold text-slate-700 dark:text-zinc-200">{summary.className}</span> with{' '}
            <span className="font-semibold text-slate-700 dark:text-zinc-200">{summary.totalSubjects} subjects</span>.
          </p>
        </div>

        {/* Info Badges Card */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Calendar className="size-3.5 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Start Date</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
              {summary.startDate}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Calendar className="size-3.5 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">End Date</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
              {summary.endDate}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <BookOpen className="size-3.5 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Subjects</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">
              {summary.totalSubjects}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onSuccess}
            className="flex-1 h-11 rounded-xl text-xs sm:text-sm font-medium border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
          >
            View Exam Details
          </Button>
          <Button
            onClick={onSuccess}
            className="flex-1 h-11 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25"
          >
            Go to Exams
          </Button>
        </div>
      </div>
    </div>
  );
}
