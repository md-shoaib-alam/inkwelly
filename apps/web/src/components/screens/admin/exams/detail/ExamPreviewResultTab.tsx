'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSpreadsheet, ArrowRight, Printer, Download } from 'lucide-react';
import { ProcessedExam } from '../active/ActiveExamTableRow';
import { fetchAllStudents, apiFetch } from '@/lib/api';

interface ExamPreviewResultTabProps {
  exam: ProcessedExam;
  onNavigatePublish: () => void;
}

export function ExamPreviewResultTab({ exam, onNavigatePublish }: ExamPreviewResultTabProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [subjectResults, setSubjectResults] = useState<Record<string, Record<string, number>>>({}); // subjectId -> { studentId: marks }
  const [selectedSection, setSelectedSection] = useState('all');

  const subjects = useMemo(() => exam.subjects || [], [exam.subjects]);

  // Distinct subjects (deduplicated by name) — 5 subjects even if exam spans 2 sections
  const distinctSubjects = useMemo(() => exam.distinctSubjects || [], [exam.distinctSubjects]);

  // Load students for this class and result marks for each subject
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        // Collect all distinct classIds involved in this exam cycle (e.g. Class 1-A and Class 1-B)
        const classIds = Array.from(
          new Set(
            subjects
              .map((s) => s.fullExam?.classId)
              .filter((cId): cId is string => Boolean(cId))
          )
        );

        let studentList: any[] = [];
        if (classIds.length > 1) {
          const studentLists = await Promise.all(
            classIds.map((cId) => fetchAllStudents({ classId: cId }))
          );
          studentList = studentLists.flat();
        } else {
          studentList = await fetchAllStudents({ classId: exam.classId });
        }

        // Deduplicate students by id
        const uniqueStudentsMap = new Map<string, any>();
        studentList.forEach((s) => {
          if (s?.id) uniqueStudentsMap.set(s.id, s);
        });
        const deduplicatedStudents = Array.from(uniqueStudentsMap.values());

        if (!isMounted) return;
        setStudents(deduplicatedStudents);

        // Fetch results for ALL section exam papers concurrently (all 10 if 2 sections)
        const resultsMap: Record<string, Record<string, number>> = {};
        await Promise.all(
          subjects.map(async (sub) => {
            try {
              const res = await apiFetch(`/api/exams/results?examId=${sub.id}`);
              if (res.ok) {
                const data = await res.json();
                const list = data.results || [];
                const marksMap: Record<string, number> = {};
                list.forEach((r: any) => {
                  marksMap[r.studentId] = Number(r.marksObtained);
                });
                resultsMap[sub.id] = marksMap;
              }
            } catch {
              // fallback gracefully
            }
          })
        );

        if (isMounted) {
          setSubjectResults(resultsMap);
        }
      } catch (err) {
        console.error('Failed to load matrix preview data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [exam.classId, subjects]);

  // Helper to calculate Grade from percentage
  const calcGrade = (pct: number) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  // Matrix rows — uses distinctSubjects (5 columns) and looks up the correct section paper per student
  const matrixRows = useMemo(() => {
    return students
      .filter((s: any) => {
        if (selectedSection === 'all') return true;
        const studentSec = s.section || (s.className ? s.className.split('-')[1]?.trim() : '');
        return studentSec === selectedSection;
      })
      .map((student: any) => {
        let studentTotal = 0;
        let totalPossible = 0;
        let hasAnyMarks = false;

        const studentSection = student.section || (student.className ? student.className.split('-')[1]?.trim() : '') || 'default';
        const marksBySubject: Record<string, number | string> = {};

        distinctSubjects.forEach((distinctSub) => {
          // Pick the exam ID for this student's section, fallback to 'default' or first available
          const examId =
            distinctSub.sectionExamIds[studentSection] ||
            distinctSub.sectionExamIds['default'] ||
            Object.values(distinctSub.sectionExamIds)[0];

          const fetchedMark = examId ? subjectResults[examId]?.[student.id] : undefined;
          if (fetchedMark !== undefined && fetchedMark !== null) {
            marksBySubject[distinctSub.subjectName] = fetchedMark;
            studentTotal += Number(fetchedMark);
            totalPossible += distinctSub.totalMarks || 100;
            hasAnyMarks = true;
          } else {
            marksBySubject[distinctSub.subjectName] = '-';
          }
        });

        const pct = hasAnyMarks && totalPossible > 0
          ? Number(((studentTotal / totalPossible) * 100).toFixed(1))
          : null;
        const grade = pct !== null ? calcGrade(pct) : '-';

        return {
          studentId: student.id,
          rollNumber: student.rollNumber || '-',
          studentName: student.name || 'Unnamed Student',
          marksBySubject,
          total: hasAnyMarks ? studentTotal : '-',
          percentage: pct !== null ? `${pct}%` : '-',
          grade,
        };
      });
  }, [students, distinctSubjects, subjectResults, selectedSection]);

  // Distinct sections for dropdown from real students
  const sections = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s: any) => {
      const sec = s.section || (s.className ? s.className.split('-')[1]?.trim() : '');
      if (sec) set.add(sec);
    });
    return Array.from(set);
  }, [students]);


  return (
    <div className="space-y-4">
      {/* Title Header with Breadcrumb and Info (Image 3) */}
      <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="size-11 sm:size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <FileSpreadsheet className="size-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">Preview Result</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Review complete result before publishing.
              </p>
            </div>
          </div>

          <Button
            onClick={onNavigatePublish}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl gap-2 shadow-sm"
          >
            Proceed to Publish <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Filter Dropdowns (Image 3) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
          <div className="w-40 sm:w-44">
            <Select defaultValue="class">
              <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-border/80 text-xs sm:text-sm font-semibold">
                <SelectValue placeholder="Class 10">{exam.className}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">{exam.className}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40 sm:w-44">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-border/80 text-xs sm:text-sm font-semibold">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabulation Matrix Table (Image 3) */}
      <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-zinc-800/40">
              <TableRow className="border-b border-border/70">
                <TableHead className="w-20 text-center font-bold text-muted-foreground text-xs py-3.5">
                  Roll No.
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm text-foreground py-3.5 pl-3">
                  Student Name
                </TableHead>
                {/* Subject Columns — deduplicated: 5 subjects, not 10 papers */}
                {distinctSubjects.map((distinctSub) => (
                  <TableHead
                    key={distinctSub.subjectName}
                    className="font-semibold text-xs sm:text-sm text-foreground py-3.5 text-center min-w-20"
                  >
                    {distinctSub.subjectName}
                  </TableHead>
                ))}
                <TableHead className="font-bold text-xs sm:text-sm text-foreground py-3.5 text-center min-w-16">
                  Total
                </TableHead>
                <TableHead className="font-bold text-xs sm:text-sm text-foreground py-3.5 text-center min-w-16">
                  %
                </TableHead>
                <TableHead className="font-bold text-xs sm:text-sm text-foreground py-3.5 text-center min-w-16 pr-6">
                  Grade
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={distinctSubjects.length + 5} className="py-4">
                      <Skeleton className="h-6 w-full rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : matrixRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={distinctSubjects.length + 5} className="text-center py-12 text-muted-foreground">
                    No student records found for this class.
                  </TableCell>
                </TableRow>
              ) : (
                matrixRows.map((row, idx) => (
                  <TableRow
                    key={row.studentId || idx}
                    className="border-b last:border-none border-border/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors"
                  >
                    {/* Roll No */}
                    <TableCell className="text-center font-bold text-foreground/60 text-xs py-4 tabular-nums">
                      {row.rollNumber}
                    </TableCell>

                    {/* Student Name */}
                    <TableCell className="py-4 pl-3 font-semibold text-sm text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                      {row.studentName}
                    </TableCell>

                    {/* Subject Marks Columns — keyed by subjectName (deduplicated) */}
                    {distinctSubjects.map((distinctSub) => {
                      const mark = row.marksBySubject[distinctSub.subjectName];
                      return (
                        <TableCell
                          key={distinctSub.subjectName}
                          className="py-4 text-center font-medium text-sm text-slate-800 dark:text-zinc-200 tabular-nums"
                        >
                          {mark !== undefined ? mark : '-'}
                        </TableCell>
                      );
                    })}

                    {/* Total */}
                    <TableCell className="py-4 text-center font-bold text-sm text-foreground tabular-nums">
                      {row.total}
                    </TableCell>

                    {/* Percentage */}
                    <TableCell className="py-4 text-center font-semibold text-sm text-foreground tabular-nums">
                      {row.percentage}%
                    </TableCell>

                    {/* Grade */}
                    <TableCell className="py-4 text-center pr-6">
                      <span
                        className={`inline-flex items-center justify-center font-bold text-xs px-2.5 py-0.5 rounded-md ${
                          row.grade.startsWith('A')
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : row.grade.startsWith('B')
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : row.grade.startsWith('C')
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {row.grade}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
