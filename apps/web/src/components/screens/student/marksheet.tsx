'use client';

import { Cinzel, Montserrat, Inter } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

import { useEffect, useReducer, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, FileText, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useAcademicYears } from '@/hooks/use-academic-years';
import type { ExamRecord } from '@/components/screens/admin/exams/types';
import { MARKSHEET_TEMPLATES } from '@/components/screens/admin/exams/marksheet-templates';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type State = {
  loading: boolean;
  studentInfo: any;
  exams: ExamRecord[];
  resultsMap: Record<string, any[]>;
  marksheetType: 'midterm' | 'final';
  selectedYear: string;
  templateId: string;
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STUDENT_INFO'; payload: any }
  | { type: 'SET_EXAMS'; payload: ExamRecord[] }
  | { type: 'SET_RESULTS_MAP'; payload: Record<string, any[]> }
  | { type: 'SET_MARKSHEET_TYPE'; payload: 'midterm' | 'final' }
  | { type: 'SET_SELECTED_YEAR'; payload: string }
  | { type: 'SET_TEMPLATE_ID'; payload: string }
  | { type: 'LOAD_SUCCESS'; payload: { studentInfo: any; exams: ExamRecord[]; resultsMap: Record<string, any[]>; templateId?: string } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_STUDENT_INFO':
      return { ...state, studentInfo: action.payload };
    case 'SET_EXAMS':
      return { ...state, exams: action.payload };
    case 'SET_RESULTS_MAP':
      return { ...state, resultsMap: action.payload };
    case 'SET_MARKSHEET_TYPE':
      return { ...state, marksheetType: action.payload };
    case 'SET_SELECTED_YEAR':
      return { ...state, selectedYear: action.payload };
    case 'SET_TEMPLATE_ID':
      return { ...state, templateId: action.payload };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        studentInfo: action.payload.studentInfo,
        exams: action.payload.exams,
        resultsMap: action.payload.resultsMap,
        templateId: action.payload.templateId ?? state.templateId,
      };
    default:
      return state;
  }
}

const initialState: State = {
  loading: true,
  studentInfo: null,
  exams: [],
  resultsMap: {},
  marksheetType: 'midterm',
  selectedYear: '',
  templateId: 'classic',
};

export function StudentMarksheet() {
  const { academicYears } = useAcademicYears();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get('studentId');
  const examTypeParam = searchParams.get('examType'); // e.g. 'midterm' or 'final' passed from banner
  const examYearParam = searchParams.get('academicYear'); // optional year from banner

  const marksheetContainerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    loading,
    studentInfo,
    exams,
    resultsMap,
    marksheetType,
    selectedYear,
    templateId,
  } = state;

  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      // If the banner passed an academic year, use that; otherwise pick current
      const targetYear = examYearParam
        ? academicYears.find((y: any) => y.name === examYearParam)
        : null;
      const current = targetYear || academicYears.find((y: any) => y.isCurrent) || academicYears[0];
      if (current) dispatch({ type: 'SET_SELECTED_YEAR', payload: current.name });
    }
  }, [academicYears, selectedYear, examYearParam]);

  // Auto-select exam type from URL param (set by result banner click)
  useEffect(() => {
    if (!examTypeParam) return;
    const normalized = examTypeParam.toLowerCase().replace(/[\s-]/g, '') as 'midterm' | 'final';
    if (normalized === 'midterm' || normalized === 'final') {
      dispatch({ type: 'SET_MARKSHEET_TYPE', payload: normalized });
    }
  }, [examTypeParam]);

  useEffect(() => {
    if (!selectedYear) return;
    const load = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const studentUrl = studentIdParam ? `/api/students/${studentIdParam}` : '/api/students/me';
        const [meRes, settingsRes] = await Promise.all([
          apiFetch(studentUrl),
          apiFetch('/api/tenant-settings').catch(() => null)
        ]);

        if (!meRes.ok) throw new Error('Failed to fetch student info');
        const me = await meRes.json();

        let currentTemplateId = 'classic';
        if (settingsRes && settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData?.defaultMarksheetTemplateId) {
            currentTemplateId = settingsData.defaultMarksheetTemplateId;
          }
        }

        const examsRes = await apiFetch(`/api/exams?classId=${me.classId}&limit=100`);
        const examsData = await examsRes.json();
        const completedExams = (examsData.data || examsData || []).filter(
          (e: ExamRecord) => (e.status === 'published' || e.isPublished === true) && e.academicYear === selectedYear
        );

        let currentResultsMap: Record<string, any[]> = {};
        if (completedExams.length > 0) {
          const resultsArr = await Promise.all(
            completedExams.map(async (exam: ExamRecord) => {
              try {
                const r = await apiFetch(`/api/exams/results?examId=${exam.id}`);
                const d = await r.json();
                return { examId: exam.id, results: d.results || [] };
              } catch { return { examId: exam.id, results: [] }; }
            })
          );
          resultsArr.forEach(item => { currentResultsMap[item.examId] = item.results; });
        }

        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            studentInfo: me,
            exams: completedExams,
            resultsMap: currentResultsMap,
            templateId: currentTemplateId,
          },
        });
      } catch (err) {
        console.error(err);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    load();
  }, [selectedYear, studentIdParam]);

  const subjectsList = useMemo(() => {
    const map: Record<string, { id: string; name: string }> = {};
    exams.forEach(e => { if (e.subjectId) map[e.subjectId] = { id: e.subjectId, name: e.subjectName }; });
    return Object.values(map);
  }, [exams]);

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', remarks: 'Outstanding performance!', color: 'text-emerald-600' };
    if (pct >= 80) return { grade: 'A',  remarks: 'Excellent work!', color: 'text-emerald-500' };
    if (pct >= 70) return { grade: 'B',  remarks: 'Very good effort.', color: 'text-blue-500' };
    if (pct >= 60) return { grade: 'C',  remarks: 'Good job, keep it up.', color: 'text-amber-500' };
    if (pct >= 50) return { grade: 'D',  remarks: 'Satisfactory performance.', color: 'text-orange-500' };
    if (pct >= 40) return { grade: 'E',  remarks: 'Pass, needs improvement.', color: 'text-zinc-600' };
    return { grade: 'F', remarks: 'Fail, needs significant improvement.', color: 'text-red-500' };
  };

  const marksheet = useMemo(() => {
    if (!studentInfo || subjectsList.length === 0) return null;
    const sid = studentInfo.id;
    let totalMax = 0, totalObtained = 0, hasFail = false, hasPending = false;

    const rows = subjectsList.map(sub => {
      const mid = exams.find(e => e.subjectId === sub.id && e.examType === 'midterm');
      const fin = exams.find(e => e.subjectId === sub.id && e.examType === 'final');
      const midRes = mid ? (resultsMap[mid.id] || []).find((r: any) => r.studentId === sid) : null;
      const finRes = fin ? (resultsMap[fin.id] || []).find((r: any) => r.studentId === sid) : null;

      const midM = midRes ? Number(midRes.marksObtained) : null;
      const finM = finRes ? Number(finRes.marksObtained) : null;
      const midMax = mid?.totalMarks || 0;
      const finMax = fin?.totalMarks || 0;

      let subMax = 0, subObt = 0, subPassing = 0, status: 'pass' | 'fail' | 'pending' = 'pending';
      if (marksheetType === 'midterm') {
        subMax = midMax; subObt = midM ?? 0; subPassing = mid?.passingMarks || 0; status = midRes ? midRes.status : 'pending';
      } else if (marksheetType === 'final') {
        subMax = finMax; subObt = finM ?? 0; subPassing = fin?.passingMarks || 0; status = finRes ? finRes.status : 'pending';
      } else {
        subMax = midMax + finMax; subObt = (midM ?? 0) + (finM ?? 0);
        subPassing = (mid?.passingMarks || 0) + (fin?.passingMarks || 0);
        if (midRes && finRes) {
          const passing = (mid?.passingMarks || 0) + (fin?.passingMarks || 0);
          status = subObt >= passing ? 'pass' : 'fail';
        } else if (midRes || finRes) status = 'pending';
      }

      if (subMax > 0) {
        totalMax += subMax; totalObtained += subObt;
        if (status === 'fail') hasFail = true;
        if (status === 'pending') hasPending = true;
      }
      const pct = subMax > 0 ? Math.round((subObt / subMax) * 100) : 0;
      return { subjectName: sub.name, midM, midMax, finM, finMax, subObt, subMax, pct, status, subPassing };
    });

    const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const gradeInfo = getGrade(overallPct);
    const overallStatus: 'pass' | 'fail' | 'pending' = hasPending ? 'pending' : (hasFail || overallPct < 40) ? 'fail' : 'pass';
    return { rows, totalMax, totalObtained, overallPct, gradeInfo, overallStatus };
  }, [studentInfo, subjectsList, exams, resultsMap, marksheetType]);

  const remarks = useMemo(() => {
    if (!marksheet) return '';
    return marksheet.overallStatus === 'pending'
      ? 'Results pending for some subjects. Please check back once all results are published.'
      : marksheet.gradeInfo.remarks;
  }, [marksheet]);

  const compiledSheet = useMemo(() => {
    if (!marksheet || !studentInfo) return null;

    const subjectsData = marksheet.rows.map(row => {
      return {
        subjectName: row.subjectName,
        midtermMarks: row.midM !== null ? `${Number(row.midM.toFixed(2))}/${row.midMax}` : '-',
        finalMarks: row.finM !== null ? `${Number(row.finM.toFixed(2))}/${row.finMax}` : '-',
        obtained: row.subMax > 0 ? `${Number(row.subObt.toFixed(2))}/${row.subMax}` : '-',
        maxMarks: row.subMax,
        obtainedMarks: Number(row.subObt.toFixed(2)),
        passingMarks: row.subPassing,
        percentage: row.pct,
        status: row.status
      };
    });

    return {
      studentName: studentInfo.name,
      rollNumber: studentInfo.rollNumber || '-',
      schoolName: studentInfo.schoolName || 'SCHOOL ERP ACADEMY',
      subjects: subjectsData,
      totalMaxMarks: marksheet.totalMax,
      totalObtainedMarks: Number(marksheet.totalObtained.toFixed(2)),
      overallPercentage: marksheet.overallPct,
      grade: marksheet.gradeInfo.grade,
      remarks: remarks,
      color: marksheet.gradeInfo.color,
      status: marksheet.overallStatus
    };
  }, [marksheet, studentInfo, remarks]);

  const SelectedTemplate = useMemo(() => {
    return MARKSHEET_TEMPLATES.find(t => t.id === templateId)?.component || MARKSHEET_TEMPLATES[0].component;
  }, [templateId]);

  const handleDownload = async () => {
    if (!compiledSheet) return;
    try {
      const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
      const filename = `Marksheet_${compiledSheet.studentName.replace(/\s+/g, '_')}_${marksheetType}.pdf`;
      
      await downloadContainerAsPDF({
        containerRef: marksheetContainerRef,
        pageClassName: 'marksheet-page-download',
        filename,
        onStart: () => {
          setDownloading(true);
          toast.info("Generating PDF, please wait...", { id: 'pdf-progress' });
        },
        onProgress: (current, total) => {
          toast.info(`Generating page ${current} of ${total}...`, { id: 'pdf-progress' });
        },
        onComplete: () => {
          setDownloading(false);
          toast.success("PDF downloaded successfully!", { id: 'pdf-progress' });
        },
        onError: (err: any) => {
          setDownloading(false);
          toast.error("Failed to generate PDF: " + err.message, { id: 'pdf-progress' });
        }
      });
    } catch (err: any) {
      console.error(err);
      setDownloading(false);
      toast.error("An error occurred during PDF generation.", { id: 'pdf-progress' });
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-150 w-full rounded-xl" />
    </div>
  );

  if (!studentInfo) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
      <AlertCircle className="size-10 mb-3 opacity-50" />
      <p className="text-sm font-medium">Could not load student information.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="size-5 text-violet-500" />
            My Marksheet
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {studentInfo.name} · {studentInfo.className} · Roll {studentInfo.rollNumber}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {academicYears.length > 0 && (
            <Select value={selectedYear} onValueChange={(v) => dispatch({ type: 'SET_SELECTED_YEAR', payload: v })}>
              <SelectTrigger className="w-37.5 h-9 text-sm">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y: any) => (
                  <SelectItem key={y.id} value={y.name}>
                    {y.name}{y.isCurrent ? ' (Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={marksheetType} onValueChange={(v: any) => dispatch({ type: 'SET_MARKSHEET_TYPE', payload: v })}>
            <SelectTrigger className="w-32.5 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="midterm">Midterm</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleDownload}
            disabled={downloading || !compiledSheet}
            className="gap-2 bg-violet-600 hover:bg-violet-750 text-white h-9 px-4 text-sm font-semibold rounded-lg shadow-sm"
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* ── Sheet Preview ── */}
      {!compiledSheet || compiledSheet.subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 border-2 border-dashed rounded-xl">
          <GraduationCap className="size-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No published exam results found for {selectedYear}</p>
          <p className="text-xs mt-1 opacity-60">Results will appear here once your teacher publishes them.</p>
        </div>
      ) : (
        <div ref={marksheetContainerRef} className="w-full overflow-x-auto pb-6 flex justify-center bg-zinc-50 dark:bg-zinc-950/20 p-4 sm:p-6 rounded-2xl">
          <div 
            className="shrink-0 transition-all duration-300 shadow-2xl rounded-lg bg-white marksheet-page-download"
            style={{ 
              width: 794, 
              height: 1123 
            }}
          >
            {compiledSheet && (
              <SelectedTemplate 
                sheet={compiledSheet}
                classNameStr={studentInfo.className || ''}
                classSection={studentInfo.classSection || ''}
                academicYear={selectedYear}
                marksheetType={marksheetType}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
