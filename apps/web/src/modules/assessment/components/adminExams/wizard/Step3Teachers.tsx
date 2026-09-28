'use client';

import { ArrowLeft, ArrowRight, UserCheck, Layers, Calendar, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatToDdMmYyyy } from '@/lib/utils';
import { ClassOption, SubjectOption } from '../types';
import { BulkSubjectRow } from './wizardTypes';

interface Step3TeachersProps {
  selectedClasses: ClassOption[];
  subjects: SubjectOption[];
  currentBulkRows: BulkSubjectRow[];
  teachers: any[];
  classTeacherAssignments: Record<string, string>;
  setClassTeacherAssignments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
}

export function Step3Teachers({
  selectedClasses,
  subjects,
  currentBulkRows,
  teachers,
  classTeacherAssignments,
  setClassTeacherAssignments,
  onBack,
  onCancel,
  onNext,
}: Step3TeachersProps) {
  const chosenUniversalRows = currentBulkRows.filter((r) => r.selected);

  const colors = [
    { bg: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
    { bg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    { bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { bg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' },
    { bg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
    { bg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400' },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Assign Teachers</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Teachers are categorized below by class section. Each class has its own subject teachers assigned.
            </p>
          </div>
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <UserCheck className="size-4" />
          <span>
            {chosenUniversalRows.length * selectedClasses.length} Exam Papers Across {selectedClasses.length} Class(es)
          </span>
        </div>
      </div>

      {/* Grouped Tables by Class Section */}
      <div className="space-y-6">
        {selectedClasses.map((cls, classIndex) => {
          const clsSubjects = subjects.filter((s) => s.classId === cls.id);

          return (
            <div key={cls.id} className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              {/* Class Category Header */}
              <div className="bg-slate-100/80 dark:bg-zinc-800/80 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {cls.section || classIndex + 1}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                      {cls.name} - Section {cls.section}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 text-[11px]">
                  Class {classIndex + 1} of {selectedClasses.length}
                </Badge>
              </div>

              {/* Class Subjects & Teachers Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/60 dark:bg-zinc-900/60">
                    <TableRow className="border-b border-slate-200/80 dark:border-zinc-800">
                      <TableHead className="w-12 text-center text-xs font-bold text-slate-700 dark:text-zinc-300">#</TableHead>
                      <TableHead className="min-w-[180px] text-xs font-bold text-slate-700 dark:text-zinc-300">Subject</TableHead>
                      <TableHead className="min-w-[200px] text-xs font-bold text-slate-700 dark:text-zinc-300">Current Teacher</TableHead>
                      <TableHead className="min-w-[220px] text-xs font-bold text-slate-700 dark:text-zinc-300">Change Teacher (Optional)</TableHead>
                      <TableHead className="min-w-[220px] text-xs font-bold text-slate-700 dark:text-zinc-300">Schedule Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chosenUniversalRows.map((univRow, idx) => {
                      const matchedSub = clsSubjects.find(
                        (s) => s.name.trim().toLowerCase() === univRow.key
                      );

                      const teacherKey = `${cls.id}_${univRow.key}`;
                      const currentTeacherId = matchedSub?.teacherId;
                      const currentTeacherObj = teachers.find((t) => t.id === currentTeacherId);
                      const currentTeacherName = currentTeacherObj?.name || (matchedSub as any)?.teacherName || 'Not Assigned';
                      const assignedTeacherId = classTeacherAssignments[teacherKey] ?? currentTeacherId ?? '';

                      const initials = currentTeacherName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      const colorScheme = colors[idx % colors.length];

                      return (
                        <TableRow key={univRow.key} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 border-b border-slate-100 dark:border-zinc-800">
                          {/* # */}
                          <TableCell className="text-center font-medium text-slate-500 text-xs">
                            {idx + 1}
                          </TableCell>

                          {/* Subject */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`size-8 rounded-lg ${colorScheme.bg} flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs`}>
                                <Layers className="size-4" />
                              </div>
                              <div>
                                <span className="font-semibold text-sm text-slate-800 dark:text-zinc-200">
                                  {univRow.subjectName}
                                </span>
                                {univRow.code && (
                                  <span className="text-[11px] text-slate-400 ml-1.5">({univRow.code})</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Current Teacher */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {initials || 'NA'}
                              </div>
                              <div className="text-xs">
                                <p className="font-medium text-slate-800 dark:text-zinc-200 leading-tight">
                                  {currentTeacherName}
                                </p>
                                <p className="text-[10px] text-slate-400">Class Assigned</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Change Teacher Dropdown */}
                          <TableCell>
                            <Select
                              value={assignedTeacherId}
                              onValueChange={(val) => {
                                setClassTeacherAssignments((prev) => ({
                                  ...prev,
                                  [teacherKey]: val,
                                }));
                              }}
                            >
                              <SelectTrigger className="h-9 w-full rounded-lg text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                                <SelectValue placeholder="Keep Assigned Teacher" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl max-h-56">
                                <SelectItem value={currentTeacherId || 'unassigned'} className="text-xs font-semibold text-blue-600">
                                  {currentTeacherName} (Default)
                                </SelectItem>
                                {teachers
                                  .filter((t) => t.id !== currentTeacherId)
                                  .map((t) => (
                                    <SelectItem key={t.id} value={t.id} className="text-xs">
                                      {t.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Schedule Preview */}
                          <TableCell>
                            <div className="flex flex-col text-xs text-slate-600 dark:text-zinc-400 gap-1">
                              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                                <Calendar className="size-3 text-blue-500" />
                                <span>{formatToDdMmYyyy(univRow.date)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3 text-slate-400" />
                                  {univRow.startTime} - {univRow.endTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="size-3 text-amber-500" />
                                  {univRow.totalMarks} Marks
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-10 px-5 rounded-xl border-slate-200 dark:border-zinc-700 gap-2 shrink-0 flex-1 sm:flex-initial"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </Button>
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <Button variant="outline" onClick={onCancel} className="hidden sm:inline-flex h-10 px-5 rounded-xl border-slate-200 dark:border-zinc-700">
            Cancel
          </Button>
          <Button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 rounded-xl font-medium gap-2 shadow-sm shadow-blue-500/20 flex-1 sm:flex-initial justify-center"
          >
            <span>Next</span>
            <span className="hidden xs:inline">: Review & Create</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
