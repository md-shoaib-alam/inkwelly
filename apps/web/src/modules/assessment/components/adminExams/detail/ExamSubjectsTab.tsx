'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pencil,
  ClipboardList,
  Calculator,
  FlaskConical,
  BookOpen,
  Globe,
  Languages,
  Laptop,
  GraduationCap,
  Eye,
  Layers,
} from 'lucide-react';
import { ProcessedExam, ProcessedExamSubject } from '../active/ActiveExamTableRow';
import { ExamRecord } from '../types';

interface ExamSubjectsTabProps {
  exam: ProcessedExam;
  onEnterMarks: (exam: ExamRecord) => void;
  onViewResults: (exam: ExamRecord) => void;
}

// Function to return vibrant subject icon & container color matching Image 2
function getSubjectIcon(name: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('math')) {
    return {
      bg: 'bg-purple-600 text-white shadow-purple-500/20',
      icon: <Calculator className="size-4" />,
    };
  }
  if (lower.includes('sci')) {
    return {
      bg: 'bg-blue-500 text-white shadow-blue-500/20',
      icon: <FlaskConical className="size-4" />,
    };
  }
  if (lower.includes('eng')) {
    return {
      bg: 'bg-emerald-600 text-white shadow-emerald-500/20',
      icon: <BookOpen className="size-4" />,
    };
  }
  if (lower.includes('soc') || lower.includes('s.s') || lower.includes('history') || lower.includes('geo')) {
    return {
      bg: 'bg-orange-500 text-white shadow-orange-500/20',
      icon: <Globe className="size-4" />,
    };
  }
  if (lower.includes('hin') || lower.includes('urdu') || lower.includes('sans')) {
    return {
      bg: 'bg-rose-500 text-white shadow-rose-500/20',
      icon: <Languages className="size-4" />,
    };
  }
  if (lower.includes('comp') || lower.includes('it') || lower.includes('tech') || lower.includes('code')) {
    return {
      bg: 'bg-sky-500 text-white shadow-sky-500/20',
      icon: <Laptop className="size-4" />,
    };
  }
  return {
    bg: 'bg-indigo-600 text-white shadow-indigo-500/20',
    icon: <GraduationCap className="size-4" />,
  };
}

export function ExamSubjectsTab({ exam, onEnterMarks, onViewResults }: ExamSubjectsTabProps) {
  const allSubjects = exam.subjects || [];
  const distinctSubjects = exam.distinctSubjects || [];
  const isMultiSection = distinctSubjects.length > 0 && allSubjects.length > distinctSubjects.length;

  // Distinct sections available in this exam
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    allSubjects.forEach((s) => {
      const sec = s.fullExam?.classSection;
      if (sec) set.add(sec);
    });
    return Array.from(set).sort();
  }, [allSubjects]);

  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Subjects filtered by section
  const subjects = useMemo(() => {
    if (selectedSection === 'all' || availableSections.length <= 1) return allSubjects;
    return allSubjects.filter((s) => (s.fullExam?.classSection || '') === selectedSection);
  }, [allSubjects, selectedSection, availableSections]);

  const handleGlobalEnterMarks = () => {
    const target = subjects.find((s) => s.status !== 'completed') || subjects[0];
    if (target) {
      onEnterMarks(target.fullExam);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Header with Enter Marks button (Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-11 sm:size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              {exam.name} &gt; Subjects
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isMultiSection
                ? `${distinctSubjects.length} distinct subject${distinctSubjects.length !== 1 ? 's' : ''} · ${availableSections.length} sections · ${allSubjects.length} papers total`
                : 'Manage subjects and view mark entry status.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Section filter dropdown — only shown for multi-section exams */}
          {isMultiSection && availableSections.length > 1 && (
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-36 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-border/80 text-xs font-semibold h-9">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map((sec) => (
                  <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={handleGlobalEnterMarks}
            variant="outline"
            className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl font-semibold gap-2 shadow-sm text-sm"
          >
            <Pencil className="size-4 text-blue-600 dark:text-blue-400" />
            Enter Marks
          </Button>
        </div>
      </div>

      {/* Main Subjects Table Card (Image 2) */}
      <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-zinc-800/40">
              <TableRow className="border-b border-border/70">
                <TableHead className="w-12 text-center font-bold text-muted-foreground text-xs py-3.5">#</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm text-foreground py-3.5 pl-3">Subject</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm text-foreground py-3.5">Teacher</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm text-foreground py-3.5 text-center">
                  Total Students
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm text-foreground py-3.5 text-center">
                  Marks Entered
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm text-foreground py-3.5 text-center">Status</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm text-foreground py-3.5 text-right pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No subjects configured for this examination.
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((sub, idx) => {
                  const iconStyle = getSubjectIcon(sub.subjectName);
                  const isCompleted = sub.status === 'completed';

                  return (
                    <TableRow
                      key={sub.id || idx}
                      className="border-b last:border-none border-border/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors"
                    >
                      {/* # Index */}
                      <TableCell className="text-center font-bold text-foreground/50 text-xs py-4">
                        {idx + 1}
                      </TableCell>

                      {/* Subject with colorful icon box (Image 2) */}
                      <TableCell className="py-4 pl-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-8 sm:size-9 rounded-lg ${iconStyle.bg} flex items-center justify-center shrink-0 shadow-sm`}
                          >
                            {iconStyle.icon}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                              {sub.subjectName}
                            </span>
                            {sub.fullExam?.classSection && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                Section {sub.fullExam.classSection}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Teacher */}
                      <TableCell className="py-4 text-sm font-medium text-slate-700 dark:text-zinc-300">
                        {sub.teacherName || 'Assigned Teacher'}
                      </TableCell>

                      {/* Total Students */}
                      <TableCell className="py-4 text-center text-sm font-medium text-slate-700 dark:text-zinc-300 tabular-nums">
                        {sub.totalStudents ?? 0}
                      </TableCell>

                      {/* Marks Entered */}
                      <TableCell className="py-4 text-center text-sm font-semibold text-foreground tabular-nums">
                        {sub.marksEnteredCount ?? 0} / {sub.totalStudents ?? 0}
                      </TableCell>

                      {/* Status badge (Image 2) */}
                      <TableCell className="py-4 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            Completed
                          </span>
                        ) : sub.status === 'in_progress' ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            Not Started
                          </span>
                        )}
                      </TableCell>

                      {/* Actions (View / Enter Marks button in light blue) */}
                      <TableCell className="py-4 text-right pr-6">
                        {isCompleted ? (
                          <button
                            onClick={() => onViewResults(sub.fullExam)}
                            className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 transition-colors shadow-2xs"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            onClick={() => onEnterMarks(sub.fullExam)}
                            className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 transition-colors shadow-2xs"
                          >
                            Enter Marks
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
