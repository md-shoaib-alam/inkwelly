'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Clock,
  Trophy,
  FileText,
  GraduationCap,
  Save,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Languages,
  Laptop,
} from 'lucide-react';
import { formatLocalDate, parseLocalDate } from '@/lib/utils';
import { ClassOption, ExamFormData } from './types';

export interface EditExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ExamFormData & {
    id: string;
    rawIds?: string[];
    className?: string;
    classSection?: string;
    subjectName?: string;
    subjects?: any[];
    subjectCount?: number;
    cleanName?: string;
  };
  setForm: (f: any) => void;
  saving: boolean;
  onSave: (customPayload?: any) => void;
  classes: ClassOption[];
  academicYears: any[];
  currentAcademicYear: string;
}

// Subject icon helper matching the modern design system
function getSubjectBadgeIcon(name: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('math')) return <Calculator className="size-3.5 text-purple-600 dark:text-purple-400" />;
  if (lower.includes('sci')) return <FlaskConical className="size-3.5 text-blue-600 dark:text-blue-400" />;
  if (lower.includes('eng')) return <BookOpen className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
  if (lower.includes('soc') || lower.includes('history') || lower.includes('geo')) {
    return <Globe className="size-3.5 text-orange-600 dark:text-orange-400" />;
  }
  if (lower.includes('hin') || lower.includes('urdu') || lower.includes('sans')) {
    return <Languages className="size-3.5 text-rose-600 dark:text-rose-400" />;
  }
  if (lower.includes('comp') || lower.includes('it') || lower.includes('tech')) {
    return <Laptop className="size-3.5 text-sky-600 dark:text-sky-400" />;
  }
  return <GraduationCap className="size-3.5 text-indigo-600 dark:text-indigo-400" />;
}

// Compute human readable duration between two HH:MM strings
function computeDuration(startTime?: string, endTime?: string): { label: string; isValid: boolean } {
  if (!startTime || !endTime) return { label: '', isValid: true };
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return { label: '', isValid: true };

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const diffMinutes = endMinutes - startMinutes;

  if (diffMinutes <= 0) {
    return { label: 'End time must be after start time', isValid: false };
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return { label: `${hours} hr ${minutes} mins`, isValid: true };
  }
  if (hours > 0) {
    return { label: `${hours} hr${hours > 1 ? 's' : ''}`, isValid: true };
  }
  return { label: `${minutes} mins`, isValid: true };
}

export function EditExamDialog({
  open,
  onOpenChange,
  form,
  setForm,
  saving,
  onSave,
  classes,
  academicYears,
  currentAcademicYear,
}: EditExamDialogProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'subjects'>('general');
  const [applyToAllSubjects, setApplyToAllSubjects] = useState<boolean>(true);
  const [subjectRows, setSubjectRows] = useState<any[]>([]);

  // Synchronize internal subject rows when dialog opens with exam data
  useEffect(() => {
    if (open) {
      setActiveTab('general');
      const subs = form.subjects || [];
      if (subs.length > 0) {
        setSubjectRows(
          subs.map((s) => ({
            id: s.id || s.fullExam?.id,
            subjectName: s.subjectName || s.name || 'Subject',
            teacherName: s.teacherName || s.fullExam?.teacherName || '',
            date: s.date || form.date,
            startTime: s.startTime || form.startTime || '09:00',
            endTime: s.endTime || form.endTime || '11:00',
            totalMarks: String(s.totalMarks || form.totalMarks || 100),
            passingMarks: String(s.passingMarks || form.passingMarks || 40),
          }))
        );
      } else {
        setSubjectRows([]);
      }
    }
  }, [open, form.id]);

  const hasSubjects = subjectRows.length > 0;
  const duration = useMemo(() => computeDuration(form.startTime, form.endTime), [form.startTime, form.endTime]);

  const totalNum = Number(form.totalMarks) || 0;
  const passNum = Number(form.passingMarks) || 0;
  const passPct = totalNum > 0 ? Math.round((passNum / totalNum) * 100) : 0;
  const isPassValid = totalNum > 0 && passNum <= totalNum;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isPastDate = (date: Date) => date < today;

  const updateSubjectField = (id: string, field: string, value: string) => {
    setSubjectRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name?.trim()) return;

    // Build payload including rawIds and per-subject overrides if available
    const payload: any = {
      ...form,
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      applyToAllSubjects,
    };

    if (form.rawIds && form.rawIds.length > 0) {
      payload.rawIds = form.rawIds;
    }

    if (!applyToAllSubjects && subjectRows.length > 0) {
      payload.subjectUpdates = subjectRows.map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        totalMarks: Number(s.totalMarks),
        passingMarks: Number(s.passingMarks),
      }));
    }

    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1.5rem)] sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-3xl max-h-[92vh] flex flex-col p-0 border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden focus:outline-none"
      >
        {/* Header Section with Brand Gradient & Icon */}
        <div className="relative px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white dark:from-blue-950/30 dark:via-zinc-900 dark:to-zinc-900 shrink-0">
          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors z-20 cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="size-11 sm:size-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <GraduationCap className="size-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                  EXAM CONFIGURATION
                </span>
                {form.className && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                    {form.className} {form.classSection ? `· Sec ${form.classSection}` : ''}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Edit Exam Details
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                Update schedule, timings, marks, and evaluation parameters for this exam.
              </DialogDescription>
            </div>
          </div>

          {/* Sub Navigation if exam has multiple subjects */}
          {hasSubjects && (
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'general'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <FileText className="size-3.5" />
                <span>General & Schedule</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subjects')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'subjects'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Layers className="size-3.5" />
                <span>Subjects Schedule ({subjectRows.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5 overscroll-contain">
            {activeTab === 'general' ? (
              <>
                {/* ── CARD 1: Basic Information ── */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-semibold text-sm">
                    <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                    <span>Basic Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Exam Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Exam Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Midterm Examination 2026"
                        className="h-10 text-sm rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 font-medium"
                        required
                      />
                    </div>

                    {/* Academic Year */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Academic Year <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={form.academicYear || currentAcademicYear}
                        onValueChange={(v) => setForm({ ...form, academicYear: v })}
                      >
                        <SelectTrigger className="h-10 text-sm rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 font-medium">
                          <SelectValue placeholder="Select Academic Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((ay) => (
                            <SelectItem key={ay.id} value={ay.name}>
                              {ay.name} {ay.isCurrent && '(Current)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Exam Type */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Exam Type <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={form.examType || 'midterm'}
                        onValueChange={(v) => setForm({ ...form, examType: v })}
                      >
                        <SelectTrigger className="h-10 text-sm rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 font-medium capitalize">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="midterm">Midterm Examination</SelectItem>
                          <SelectItem value="final">Final Examination</SelectItem>
                          <SelectItem value="unit_test">Unit Test / Assessment</SelectItem>
                          <SelectItem value="quarterly">Quarterly Examination</SelectItem>
                          <SelectItem value="half_yearly">Half Yearly Examination</SelectItem>
                          <SelectItem value="practical">Practical / Lab Exam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Class & Section (Informational or Selectable) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Class & Section
                      </Label>
                      {form.className ? (
                        <div className="h-10 px-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          <span>{form.className} {form.classSection ? `(${form.classSection})` : ''}</span>
                          <span className="text-xs text-muted-foreground font-normal">Assigned</span>
                        </div>
                      ) : (
                        <Select
                          value={form.classId}
                          onValueChange={(v) => setForm({ ...form, classId: v })}
                        >
                          <SelectTrigger className="h-10 text-sm rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 font-medium">
                            <SelectValue placeholder="Select Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} - {c.section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── CARD 2: Schedule & Timings ── */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                      <Calendar className="size-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Schedule & Timings</span>
                    </div>
                    {duration.label && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          duration.isValid
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                        }`}
                      >
                        <Clock className="size-3" />
                        {duration.isValid ? `Duration: ${duration.label}` : duration.label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Exam Date */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Exam Date <span className="text-rose-500">*</span>
                      </Label>
                      <DatePicker
                        date={parseLocalDate(form.date)}
                        onChange={(d) => setForm({ ...form, date: formatLocalDate(d) })}
                        disabled={isPastDate}
                      />
                    </div>

                    {/* Start Time */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Start Time
                      </Label>
                      <TimePicker
                        value={form.startTime}
                        onChange={(v) => setForm({ ...form, startTime: v })}
                      />
                    </div>

                    {/* End Time */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        End Time
                      </Label>
                      <TimePicker
                        value={form.endTime}
                        onChange={(v) => setForm({ ...form, endTime: v })}
                      />
                    </div>
                  </div>
                </div>

                {/* ── CARD 3: Scoring & Passing Criteria ── */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                      <Trophy className="size-4 text-amber-500" />
                      <span>Marks & Pass Criteria</span>
                    </div>
                    {isPassValid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                        <CheckCircle2 className="size-3" />
                        Pass Percentage: {passPct}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="size-3" />
                        Invalid Marks Ratio
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Total Marks */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Total Marks
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={form.totalMarks}
                        onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                        className="h-10 text-sm rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 font-semibold"
                      />
                      <p className="text-[11px] text-muted-foreground">Maximum score attainable on this exam paper.</p>
                    </div>

                    {/* Passing Marks */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Passing Marks
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max={form.totalMarks || '1000'}
                        value={form.passingMarks}
                        onChange={(e) => setForm({ ...form, passingMarks: e.target.value })}
                        className="h-10 text-sm rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 font-semibold"
                      />
                      <p className="text-[11px] text-muted-foreground">Minimum score required to qualify as passed.</p>
                    </div>
                  </div>

                  {/* Multi-subject sync checkbox */}
                  {hasSubjects && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-zinc-300">
                        <Checkbox
                          checked={applyToAllSubjects}
                          onCheckedChange={(c) => setApplyToAllSubjects(!!c)}
                        />
                        <span>
                          Apply this timing & marks configuration to all {subjectRows.length} subject papers
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── TAB 2: Individual Subject Schedules ── */
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
                    <Sparkles className="size-4 text-blue-600 shrink-0" />
                    <span>Customize specific dates, timings, or marks for individual subjects in this exam cycle.</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubjectRows((prev) =>
                        prev.map((r) => ({
                          ...r,
                          date: form.date,
                          startTime: form.startTime,
                          endTime: form.endTime,
                          totalMarks: form.totalMarks,
                          passingMarks: form.passingMarks,
                        }))
                      );
                    }}
                    className="h-8 text-xs rounded-lg border-blue-200 text-blue-700 hover:bg-blue-100/60 shrink-0 font-medium"
                  >
                    Sync All to General
                  </Button>
                </div>

                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-x-auto shadow-2xs">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-zinc-800/60">
                      <TableRow className="border-b border-slate-200 dark:border-zinc-800">
                        <TableHead className="font-bold text-xs py-3">Subject</TableHead>
                        <TableHead className="font-bold text-xs py-3 min-w-[140px]">Date</TableHead>
                        <TableHead className="font-bold text-xs py-3 w-28 text-center">Start Time</TableHead>
                        <TableHead className="font-bold text-xs py-3 w-28 text-center">End Time</TableHead>
                        <TableHead className="font-bold text-xs py-3 w-20 text-center">Total</TableHead>
                        <TableHead className="font-bold text-xs py-3 w-20 text-center">Passing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectRows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <TableCell className="py-3 font-semibold text-xs text-slate-800 dark:text-zinc-200">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                {getSubjectBadgeIcon(row.subjectName)}
                              </div>
                              <div>
                                <p className="leading-tight">{row.subjectName}</p>
                                {row.teacherName && (
                                  <p className="text-[10px] text-muted-foreground font-normal">{row.teacherName}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <DatePicker
                              date={parseLocalDate(row.date)}
                              onChange={(d) => updateSubjectField(row.id, 'date', formatLocalDate(d))}
                              disabled={isPastDate}
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <TimePicker
                              value={row.startTime}
                              onChange={(v) => updateSubjectField(row.id, 'startTime', v)}
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <TimePicker
                              value={row.endTime}
                              onChange={(v) => updateSubjectField(row.id, 'endTime', v)}
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Input
                              type="number"
                              value={row.totalMarks}
                              onChange={(e) => updateSubjectField(row.id, 'totalMarks', e.target.value)}
                              className="h-8 text-center text-xs font-semibold px-1 rounded-lg"
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Input
                              type="number"
                              value={row.passingMarks}
                              onChange={(e) => updateSubjectField(row.id, 'passingMarks', e.target.value)}
                              className="h-8 text-center text-xs font-semibold px-1 rounded-lg"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions with Brand Colors */}
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-zinc-900/80 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 hidden sm:block">
              {hasSubjects ? `${subjectRows.length} subject papers in this exam` : 'Changes take effect immediately'}
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5 rounded-xl border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !form.name?.trim() || !duration.isValid || !isPassValid}
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
