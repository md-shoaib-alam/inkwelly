'use client';

import { ArrowLeft, ArrowRight, Calendar, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { parseLocalDate, formatLocalDate } from '@/lib/utils';
import { ClassOption } from '../types';
import { BulkSubjectRow } from './wizardTypes';

interface Step2SubjectsProps {
  selectedClasses: ClassOption[];
  distinctSubjects: { key: string; name: string; code?: string; sampleId: string }[];
  currentBulkRows: BulkSubjectRow[];
  selectedCount: number;
  toggleAllSubjects: (selectAll: boolean) => void;
  toggleSelectSubject: (key: string) => void;
  updateSubjectField: (key: string, field: string, val: string) => void;
  isSubjectDateDisabled: (date: Date) => boolean;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
}

export function Step2Subjects({
  selectedClasses,
  distinctSubjects,
  currentBulkRows,
  selectedCount,
  toggleAllSubjects,
  toggleSelectSubject,
  updateSubjectField,
  isSubjectDateDisabled,
  onBack,
  onCancel,
  onNext,
}: Step2SubjectsProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="size-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold flex items-center justify-center text-sm shrink-0 mt-0.5 sm:mt-0">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Select Subjects & Schedule</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Select examination papers for {selectedClasses.map(c => `${c.name} - ${c.section}`).join(', ')} and set universal time and marks.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Badge variant="outline" className="px-2.5 sm:px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold whitespace-nowrap">
            {selectedCount} of {distinctSubjects.length} Selected
          </Badge>
        </div>
      </div>

      {/* Desktop Subjects Table */}
      <div className="hidden sm:block border border-slate-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/70 dark:bg-zinc-900/60">
            <TableRow>
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selectedCount === distinctSubjects.length && distinctSubjects.length > 0}
                  onCheckedChange={(c) => toggleAllSubjects(!!c)}
                />
              </TableHead>
              <TableHead className="min-w-[160px]">Subject Name</TableHead>
              <TableHead className="min-w-[150px]">Date *</TableHead>
              <TableHead className="w-28 text-center">Start Time</TableHead>
              <TableHead className="w-28 text-center">End Time</TableHead>
              <TableHead className="w-24 text-center">Total Marks</TableHead>
              <TableHead className="w-24 text-center">Passing Marks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBulkRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  No subjects configured for the selected classes yet. Please add subjects first in Subject management.
                </TableCell>
              </TableRow>
            ) : (
              currentBulkRows.map((row) => (
                <TableRow key={row.key} className={row.selected ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={() => toggleSelectSubject(row.key)}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-zinc-200">
                    {row.subjectName}
                    {row.code && <span className="text-xs text-slate-400 font-normal ml-1.5">({row.code})</span>}
                  </TableCell>
                  <TableCell>
                    <DatePicker
                      date={parseLocalDate(row.date)}
                      onChange={(d) => updateSubjectField(row.key, 'date', formatLocalDate(d))}
                      disabled={isSubjectDateDisabled}
                      className="h-9 w-full rounded-lg"
                    />
                  </TableCell>
                  <TableCell>
                    <TimePicker
                      value={row.startTime}
                      onChange={(v) => updateSubjectField(row.key, 'startTime', v)}
                      className="h-9 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <TimePicker
                      value={row.endTime}
                      onChange={(v) => updateSubjectField(row.key, 'endTime', v)}
                      className="h-9 text-xs"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={row.totalMarks}
                      onChange={(e) => updateSubjectField(row.key, 'totalMarks', e.target.value)}
                      className="h-9 w-18 mx-auto text-center font-medium rounded-lg"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={row.passingMarks}
                      onChange={(e) => updateSubjectField(row.key, 'passingMarks', e.target.value)}
                      className="h-9 w-18 mx-auto text-center font-medium rounded-lg"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Subjects View */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between pb-1 px-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-2">
            <Checkbox
              checked={selectedCount === distinctSubjects.length && distinctSubjects.length > 0}
              onCheckedChange={(c) => toggleAllSubjects(!!c)}
            />
            <span>Select All Subjects</span>
          </label>
        </div>

        {currentBulkRows.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed rounded-2xl text-slate-400 text-xs">
            No subjects configured for the selected classes.
          </div>
        ) : (
          currentBulkRows.map((row) => (
            <div
              key={row.key}
              className={`border rounded-2xl p-4 transition-all ${
                row.selected
                  ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs'
                  : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={row.selected}
                    onCheckedChange={() => toggleSelectSubject(row.key)}
                    className="size-5 rounded-md"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {row.subjectName}
                    </h4>
                    {row.code && (
                      <span className="text-[11px] text-slate-400 font-mono">Code: {row.code}</span>
                    )}
                  </div>
                </div>
                {row.selected && (
                  <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    Included
                  </Badge>
                )}
              </div>

              <div className="pt-3 space-y-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="size-3 text-blue-500" /> Exam Date *
                  </span>
                  <DatePicker
                    date={parseLocalDate(row.date)}
                    onChange={(d) => updateSubjectField(row.key, 'date', formatLocalDate(d))}
                    disabled={isSubjectDateDisabled}
                    className="h-10 w-full rounded-xl text-xs bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Clock className="size-3 text-blue-500" /> Start Time
                    </span>
                    <TimePicker
                      value={row.startTime}
                      onChange={(v) => updateSubjectField(row.key, 'startTime', v)}
                      className="h-10 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Clock className="size-3 text-blue-500" /> End Time
                    </span>
                    <TimePicker
                      value={row.endTime}
                      onChange={(v) => updateSubjectField(row.key, 'endTime', v)}
                      className="h-10 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Star className="size-3 text-amber-500" /> Total Marks
                    </span>
                    <div className="relative">
                      <Input
                        type="number"
                        value={row.totalMarks}
                        onChange={(e) => updateSubjectField(row.key, 'totalMarks', e.target.value)}
                        className="pl-8.5 h-10 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Star className="size-3 text-emerald-500" /> Passing
                    </span>
                    <div className="relative">
                      <Input
                        type="number"
                        value={row.passingMarks}
                        onChange={(e) => updateSubjectField(row.key, 'passingMarks', e.target.value)}
                        className="pl-8.5 h-10 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 px-5 rounded-2xl border-slate-200 dark:border-zinc-700 gap-2 shrink-0 flex-1 sm:flex-initial"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </Button>
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <Button variant="outline" onClick={onCancel} className="hidden sm:inline-flex h-11 px-5 rounded-xl border-slate-200 dark:border-zinc-700">
            Cancel
          </Button>
          <Button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-5 sm:px-6 rounded-2xl font-semibold gap-2 shadow-sm shadow-blue-500/20 flex-1 sm:flex-initial justify-center"
          >
            <span>Next</span>
            <span className="hidden sm:inline">: Assign Teachers</span>
            <span className="sm:hidden">: Assign Teachers</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
