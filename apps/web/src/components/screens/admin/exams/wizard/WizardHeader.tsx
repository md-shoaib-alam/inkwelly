'use client';

import { ArrowLeft, FileText, Check } from 'lucide-react';

interface WizardHeaderProps {
  currentStep: number;
  onCancel: () => void;
  onStepClick: (stepNumber: number) => void;
  isEdit?: boolean;
}

export function WizardHeader({ currentStep, onCancel, onStepClick, isEdit = false }: WizardHeaderProps) {
  const steps = [
    { number: 1, title: 'Basic Details', subtitle: 'Exam information' },
    { number: 2, title: 'Select Subjects', subtitle: 'Choose subjects' },
    { number: 3, title: 'Assign Teachers', subtitle: 'Review or modify' },
    { number: 4, title: isEdit ? 'Review & Update' : 'Review & Create', subtitle: isEdit ? 'Confirm and update' : 'Confirm and create' },
  ];
  return (
    <div className="space-y-4">
      {/* Top Header: Desktop has standard icon + title; Mobile has circular back button + right orange icon */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <div className="flex items-center gap-3">
          {/* Circular Back button visible only on mobile */}
          <button
            type="button"
            onClick={onCancel}
            className="sm:hidden size-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-zinc-700/60 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="size-5 stroke-[2.2]" />
          </button>

          {/* Desktop Orange Document Icon */}
          <div className="hidden sm:flex size-11 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 items-center justify-center shrink-0 border border-orange-200 dark:border-orange-900/30">
            <FileText className="size-6 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {isEdit ? 'Edit Exam' : 'Create Exam'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isEdit ? 'Update examination schedule and details.' : 'Set up a new examination with basic details.'}
            </p>
          </div>
        </div>

        {/* Mobile Orange Document Icon on far right */}
        <div className="sm:hidden size-10 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-200/80 dark:border-orange-900/30">
          <FileText className="size-5 stroke-[2.2]" />
        </div>
      </div>

      {/* Stepper Progress Bar: Desktop */}
      <div className="hidden sm:block py-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-2">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div key={s.number} className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (s.number < currentStep) onStepClick(s.number);
                  }}
                  className={`size-9 sm:size-10 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-100 dark:ring-blue-900/30'
                      : isCompleted
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  {isCompleted ? <Check className="size-4 sm:size-5 stroke-[2.5]" /> : s.number}
                </button>
                <div className="text-left">
                  <div className={`text-xs font-semibold leading-tight whitespace-nowrap ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-500 leading-tight whitespace-nowrap">
                    {s.subtitle}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-6 sm:w-10 lg:w-16 h-0.5 bg-slate-200 dark:bg-zinc-800 mx-1 sm:mx-2 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden py-2 px-1">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            const label = s.number === 1 ? 'Basic Details' : s.number === 2 ? 'Subjects' : s.number === 3 ? 'Teachers' : 'Review';
            return (
              <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.number < currentStep) onStepClick(s.number);
                    }}
                    className={`size-9 rounded-full font-semibold text-xs flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-100 dark:ring-blue-900/30'
                        : isCompleted
                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 border border-slate-200/80 dark:border-zinc-700'
                    }`}
                  >
                    {isCompleted ? <Check className="size-4 stroke-[2.5]" /> : s.number}
                  </button>
                  <span className={`text-[11px] font-medium text-center leading-tight whitespace-nowrap ${
                    isCurrent ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-zinc-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-slate-200 dark:bg-zinc-800 mx-2 -mt-4.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
