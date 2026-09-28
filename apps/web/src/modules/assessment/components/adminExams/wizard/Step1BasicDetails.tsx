'use client';

import { FileText, Trophy, Users, GraduationCap, Calendar, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { parseLocalDate, formatLocalDate } from '@/lib/utils';
import { ClassOption } from '../types';
import { GradeGroup } from './wizardTypes';

interface Step1BasicDetailsProps {
  examName: string;
  setExamName: (val: string) => void;
  examType: string;
  setExamType: (val: string) => void;
  selectionMode: 'section' | 'grade';
  setSelectionMode: (mode: 'section' | 'grade') => void;
  selectedGrade: string;
  handleSelectGrade: (gradeName: string) => void;
  selectedClassIds: string[];
  handleSelectSectionClass: (id: string) => void;
  classes: ClassOption[];
  gradeGroups: GradeGroup[];
  selectedClasses: ClassOption[];
  academicYear: string;
  setAcademicYear: (year: string) => void;
  academicYears: any[];
  startDate: string;
  handleStartDateChange: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  isPastDate: (date: Date) => boolean;
  isEndDateDisabled: (date: Date) => boolean;
  description: string;
  setDescription: (val: string) => void;
  onCancel: () => void;
  onNext: () => void;
}

export function Step1BasicDetails({
  examName,
  setExamName,
  examType,
  setExamType,
  selectionMode,
  setSelectionMode,
  selectedGrade,
  handleSelectGrade,
  selectedClassIds,
  handleSelectSectionClass,
  classes,
  gradeGroups,
  selectedClasses,
  academicYear,
  setAcademicYear,
  academicYears,
  startDate,
  handleStartDateChange,
  endDate,
  setEndDate,
  isPastDate,
  isEndDateDisabled,
  description,
  setDescription,
  onCancel,
  onNext,
}: Step1BasicDetailsProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl sm:rounded-2xl p-5 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold flex items-center justify-center text-sm shrink-0">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Basic Details</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Enter the general information for this exam.</p>
          </div>
        </div>

        {/* Desktop Toggle in Top Right Corner */}
        <div className="hidden sm:inline-flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium border border-slate-200/80 dark:border-zinc-700/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectionMode('section');
              if (classes[0]) handleSelectSectionClass(classes[0].id);
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              selectionMode === 'section'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Section-wise
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectionMode('grade');
              const firstGrade = gradeGroups[0]?.gradeName || '';
              if (firstGrade) handleSelectGrade(firstGrade);
            }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectionMode === 'grade'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Class-wise</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
              All Sections
            </Badge>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Control: Class-wise vs Section-wise */}
      <div className="grid sm:hidden grid-cols-2 bg-slate-100/80 dark:bg-zinc-800/70 p-1 rounded-2xl text-xs font-semibold border border-slate-200/50 dark:border-zinc-700/50">
        <button
          type="button"
          onClick={() => {
            setSelectionMode('grade');
            const firstGrade = gradeGroups[0]?.gradeName || '';
            if (firstGrade) handleSelectGrade(firstGrade);
          }}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer text-center ${
            selectionMode === 'grade'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold border border-blue-100/70 dark:border-zinc-700'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
          }`}
        >
          Class-wise
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectionMode('section');
            if (classes[0]) handleSelectSectionClass(classes[0].id);
          }}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer text-center ${
            selectionMode === 'section'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold border border-blue-100/70 dark:border-zinc-700'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
          }`}
        >
          Section-wise
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-1">
        {/* Row 1, Col 1: Exam Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
            Exam Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-500" />
            <Input
              className="pl-10 h-11 bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-normal text-slate-800 dark:text-zinc-200 focus-visible:ring-blue-500"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Midterm Examination 2026 or Annual Final Exam"
            />
          </div>
        </div>

        {/* Row 1, Col 2: Exam Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
            Exam Type <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="w-full h-11 bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-normal text-slate-800 dark:text-zinc-200 pl-10">
                <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-500" />
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="midterm" className="text-xs sm:text-sm">Midterm</SelectItem>
                <SelectItem value="final" className="text-xs sm:text-sm">Final Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2, Col 1: Class Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
            {selectionMode === 'grade' ? 'Select Class (All Sections)' : 'Select Class & Section'} <span className="text-red-500">*</span>
          </Label>

          {selectionMode === 'section' ? (
            <div className="relative">
              <Select
                value={selectedClassIds[0] || ''}
                onValueChange={(val) => handleSelectSectionClass(val)}
              >
                <SelectTrigger className="w-full h-11 bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-normal text-slate-800 dark:text-zinc-200 pl-10">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-500" />
                  <SelectValue placeholder="Select class section" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {classes.map(c => {
                    const cleanName = c.name.toLowerCase().startsWith('class') || c.name.toLowerCase().startsWith('grade')
                      ? c.name.replace(/^grade/i, 'Class')
                      : `Class ${c.name}`;
                    return (
                      <SelectItem key={c.id} value={c.id} className="text-xs sm:text-sm">
                        {cleanName} - Section {c.section}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Select
                  value={selectedGrade || gradeGroups[0]?.gradeName || ''}
                  onValueChange={(val) => handleSelectGrade(val)}
                >
                  <SelectTrigger className="w-full h-11 bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-normal text-slate-800 dark:text-zinc-200 pl-10">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-500" />
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {gradeGroups.map(g => {
                      const displayGrade = g.gradeName.replace(/^grade/i, 'Class').trim();
                      const formattedName = displayGrade.toLowerCase().startsWith('class')
                        ? displayGrade
                        : `Class ${displayGrade}`;
                      return (
                        <SelectItem key={g.gradeName} value={g.gradeName} className="text-xs sm:text-sm">
                          {formattedName} ({g.classList.length} sections: {g.classList.map(c => c.section).join(', ')})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5 px-0.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="text-[11px] text-slate-400">Sections included:</span>
                <div className="flex flex-wrap items-center gap-1">
                  {selectedClasses.map(c => (
                    <span key={c.id} className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                      {c.section}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2, Col 2: Academic Year */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
            Academic Year <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-full h-11 bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-normal text-slate-800 dark:text-zinc-200 pl-10">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-500" />
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {academicYears.length > 0 ? (
                  academicYears.map(ay => (
                    <SelectItem key={ay.id} value={ay.name} className="text-xs sm:text-sm">
                      {ay.name} {ay.isCurrent && '(Current)'}
                    </SelectItem>
                  ))
                ) : (
                  (() => {
                    const y = new Date().getFullYear();
                    return [
                      <SelectItem key={`${y-1}-${y}`} value={`${y-1}-${y}`} className="text-xs sm:text-sm">{y-1}-{y}</SelectItem>,
                      <SelectItem key={`${y}-${y+1}`} value={`${y}-${y+1}`} className="text-xs sm:text-sm">{y}-{y+1} (Current)</SelectItem>,
                      <SelectItem key={`${y+1}-${y+2}`} value={`${y+1}-${y+2}`} className="text-xs sm:text-sm">{y+1}-{y+2}</SelectItem>
                    ];
                  })()
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Start Date & End Date - side by side on mobile & desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:col-span-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <DatePicker 
              date={parseLocalDate(startDate)} 
              onChange={(d) => handleStartDateChange(formatLocalDate(d))} 
              disabled={isPastDate}
              className="w-full h-11 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              End Date <span className="text-red-500">*</span>
            </Label>
            <DatePicker 
              date={parseLocalDate(endDate)} 
              onChange={(d) => setEndDate(formatLocalDate(d))} 
              disabled={isEndDateDisabled}
              className="w-full h-11 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Description (Optional)</Label>
          <span className="text-[11px] text-slate-400">{description.length}/500</span>
        </div>
        <div className="relative">
          <textarea
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details or guidelines for this examination..."
            rows={3}
            className="w-full rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-3 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-zinc-100 resize-none"
          />
        </div>
      </div>

      {/* Next Step Info Banner */}
      <div className="bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
        <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <span className="font-bold">Next Step: </span>
          Configure common subject schedules and then review/assign teachers per class section.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
        <Button variant="outline" onClick={onCancel} className="h-10 px-5 rounded-xl border-slate-200 dark:border-zinc-700 flex-1 sm:flex-initial">
          Cancel
        </Button>
        <Button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 sm:px-6 rounded-xl font-medium gap-2 shadow-sm shadow-blue-500/20 flex-1 sm:flex-initial justify-center"
        >
          <span>Next</span>
          <span className="hidden xs:inline">: Select Subjects</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
