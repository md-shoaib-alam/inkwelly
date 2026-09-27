'use client';

import { ExamRecord } from './types';
import { useMemo, useState, useEffect, useRef, useReducer } from 'react';
import { apiFetch, fetchAllStudents } from '@/lib/api';
import { toast } from "sonner";
import { useReactToPrint } from 'react-to-print';
import { Printer, Loader2 } from 'lucide-react';
import { MARKSHEET_TEMPLATES } from './marksheet-templates';
import { MarksheetControls } from './marksheet-preview/MarksheetControls';
import { MarksheetStandaloneToolbar } from './marksheet-preview/MarksheetStandaloneToolbar';
import { MarksheetSheetsPreview } from './marksheet-preview/MarksheetSheetsPreview';
import { MarksheetPrintContainer } from './marksheet-preview/MarksheetPrintContainer';


interface MarksheetPreviewPageProps {
  classId: string;
  classNameStr: string; // e.g. "Grade 10"
  classSection: string; // e.g. "A"
  academicYear: string;
  onBack: () => void;
  isStandalone?: boolean;
  examName?: string;
}

type State = {
  selectedStudentId: string;
  marksheetType: 'midterm' | 'final';
  selectedTemplateId: string;
  students: any[];
  exams: ExamRecord[];
  resultsMap: Record<string, any[]>;
  loading: boolean;
  printing: boolean;
  zoomScale: number;
};

type Action =
  | { type: 'SET_SELECTED_STUDENT_ID'; payload: string }
  | { type: 'SET_MARKSHEET_TYPE'; payload: 'midterm' | 'final' }
  | { type: 'SET_SELECTED_TEMPLATE_ID'; payload: string }
  | { type: 'SET_DATA'; payload: Partial<State> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PRINTING'; payload: boolean }
  | { type: 'SET_ZOOM_SCALE'; payload: number }
  | { type: 'RESET_FOR_CLASS' };

const initialState: State = {
  selectedStudentId: 'all',
  marksheetType: 'midterm',
  selectedTemplateId: 'classic',
  students: [],
  exams: [],
  resultsMap: {},
  loading: false,
  printing: false,
  zoomScale: 0.6,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SELECTED_STUDENT_ID':
      return { ...state, selectedStudentId: action.payload };
    case 'SET_MARKSHEET_TYPE':
      return { ...state, marksheetType: action.payload };
    case 'SET_SELECTED_TEMPLATE_ID':
      return { ...state, selectedTemplateId: action.payload };
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PRINTING':
      return { ...state, printing: action.payload };
    case 'SET_ZOOM_SCALE':
      return { ...state, zoomScale: action.payload };
    case 'RESET_FOR_CLASS':
      return { ...state, selectedStudentId: 'all', marksheetType: 'midterm' };
    default:
      return state;
  }
}

export function MarksheetPreviewPage({
  classId,
  classNameStr,
  classSection,
  academicYear,
  onBack,
  isStandalone = false,
  examName
}: MarksheetPreviewPageProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [downloading, setDownloading] = useState(false);
  const {
    selectedStudentId,
    marksheetType,
    selectedTemplateId,
    students,
    exams,
    resultsMap,
    loading,
    printing,
    zoomScale
  } = state;

  const setSelectedStudentId = (id: string) => dispatch({ type: 'SET_SELECTED_STUDENT_ID', payload: id });
  const setMarksheetType = (type: 'midterm' | 'final') => dispatch({ type: 'SET_MARKSHEET_TYPE', payload: type });
  const setSelectedTemplateId = (id: string) => dispatch({ type: 'SET_SELECTED_TEMPLATE_ID', payload: id });
  const setZoomScale = (scale: number) => dispatch({ type: 'SET_ZOOM_SCALE', payload: scale });
  const setPrinting = (printing: boolean) => dispatch({ type: 'SET_PRINTING', payload: printing });

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Load students, completed exams, and parallel results
  useEffect(() => {
    if (!classId) return;

    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // 1. Fetch Students & Completed Exams for this class, and Tenant Settings in parallel
        const [loadedStudents, examData, settingsData] = await Promise.all([
          fetchAllStudents({ classId }),
          apiFetch(`/api/exams?classId=${classId}&limit=100`).then((res) => res.json()),
          apiFetch(`/api/tenant-settings`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        ]);

        if (settingsData?.defaultMarksheetTemplateId) {
          dispatch({ type: 'SET_SELECTED_TEMPLATE_ID', payload: settingsData.defaultMarksheetTemplateId });
        }
        // Only consider published exams
        let completedExams = (examData.data || examData || []).filter(
          (e: ExamRecord) => (e.status === 'published' || e.isPublished === true) && e.academicYear === academicYear
        );

        if (examName) {
          completedExams = completedExams.filter((e: ExamRecord) => {
            const cycleName = e.name.includes(' - ') ? e.name.split(' - ')[0] : e.name;
            return cycleName.toLowerCase() === examName.toLowerCase();
          });
        }

        // 2. Fetch results in parallel for each completed exam
        let resultsMapPayload: Record<string, any[]> = {};
        if (completedExams.length > 0) {
          const allResults = await Promise.all(
            completedExams.map(async (exam: ExamRecord) => {
              try {
                const res = await apiFetch(`/api/exams/results?examId=${exam.id}`);
                const data = await res.json();
                return { examId: exam.id, results: data.results || [] };
              } catch (err) {
                console.error(`Error loading results for exam ${exam.id}:`, err);
                return { examId: exam.id, results: [] };
              }
            })
          );
          allResults.forEach(item => {
            resultsMapPayload[item.examId] = item.results;
          });
        }

        dispatch({
          type: 'SET_DATA',
          payload: {
            students: loadedStudents,
            exams: completedExams,
            resultsMap: resultsMapPayload
          }
        });
      } catch (err) {
        console.error("Failed to load marksheet data:", err);
        toast.error("Failed to fetch exam results data");
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, [classId, academicYear, examName]);

  // Handle responsive zoom scaling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newScale = 0.6; // Default for desktop
      
      if (width < 640) {
        // Mobile: calculate scale to fit 794px width with consistent padding
        newScale = Math.min(0.5, (width - 48) / 794);
      } else if (width < 1024) {
        // Tablet
        newScale = Math.min(0.7, (width - 100) / 794);
      }
      
      // Update if significant change or initial load
      if (Math.abs(state.zoomScale - newScale) > 0.05) {
        setZoomScale(Number(newScale.toFixed(2)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.zoomScale]);

  // Clean student selection state when opened
  useEffect(() => {
    dispatch({ type: 'RESET_FOR_CLASS' });
  }, [classId]);

  // Extract unique subjects from exams
  const subjectsList = useMemo(() => {
    const map: Record<string, { id: string; name: string }> = {};
    exams.forEach(e => {
      if (e.subjectId) {
        map[e.subjectId] = { id: e.subjectId, name: e.subjectName };
      }
    });
    return Object.values(map);
  }, [exams]);

  // Grade Boundaries Helper
  const getGradeAndRemarks = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', remarks: 'Outstanding performance!', color: 'text-emerald-600 dark:text-emerald-400' };
    if (percentage >= 80) return { grade: 'A', remarks: 'Excellent work!', color: 'text-emerald-500 dark:text-emerald-300' };
    if (percentage >= 70) return { grade: 'B', remarks: 'Very good effort.', color: 'text-blue-500 dark:text-blue-400' };
    if (percentage >= 60) return { grade: 'C', remarks: 'Good job, keep it up.', color: 'text-amber-500 dark:text-amber-400' };
    if (percentage >= 50) return { grade: 'D', remarks: 'Satisfactory performance.', color: 'text-orange-500 dark:text-orange-400' };
    if (percentage >= 40) return { grade: 'E', remarks: 'Pass, needs improvement.', color: 'text-zinc-600 dark:text-zinc-400' };
    return { grade: 'F', remarks: 'Fail, needs significant improvement.', color: 'text-red-500 dark:text-red-400' };
  };

  // Compile a student's marksheet statistics
  const compileMarksheet = (student: any) => {
    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    let subjectsCount = 0;
    let hasFail = false;
    let hasPending = false;

    const subjectsData = subjectsList.map(sub => {
      // Find matching midterm exam
      const midtermExam = exams.find(e => e.subjectId === sub.id && e.examType === 'midterm');
      const midtermResults = midtermExam ? resultsMap[midtermExam.id] : null;
      const midtermStudentResult = midtermResults ? midtermResults.find(r => r.studentId === student.id) : null;
      
      // Find matching final exam
      const finalExam = exams.find(e => e.subjectId === sub.id && e.examType === 'final');
      const finalResults = finalExam ? resultsMap[finalExam.id] : null;
      const finalStudentResult = finalResults ? finalResults.find(r => r.studentId === student.id) : null;

      // Extract marks
      const midtermMarks = midtermStudentResult ? Number(midtermStudentResult.marksObtained) : null;
      const finalMarks = finalStudentResult ? Number(finalStudentResult.marksObtained) : null;

      const midtermMax = midtermExam ? midtermExam.totalMarks : 0;
      const finalMax = finalExam ? finalExam.totalMarks : 0;

      let subMax = 0;
      let subObtained = 0;
      let subPassing = 0;
      let status: 'pass' | 'fail' | 'pending' = 'pending';

      if (marksheetType === 'midterm') {
        subMax = midtermMax;
        subObtained = midtermMarks || 0;
        subPassing = midtermExam?.passingMarks || 0;
        status = midtermStudentResult ? midtermStudentResult.status : 'pending';
      } else if (marksheetType === 'final') {
        subMax = finalMax;
        subObtained = finalMarks || 0;
        subPassing = finalExam?.passingMarks || 0;
        status = finalStudentResult ? finalStudentResult.status : 'pending';
      } else {
        // Combined
        subMax = midtermMax + finalMax;
        subObtained = (midtermMarks || 0) + (finalMarks || 0);
        subPassing = (midtermExam?.passingMarks || 0) + (finalExam?.passingMarks || 0);
        
        // Pass if combined percentage is >= 40% (or pass both)
        if (midtermStudentResult && finalStudentResult) {
          const passMarks = (midtermExam?.passingMarks || 0) + (finalExam?.passingMarks || 0);
          status = subObtained >= passMarks ? 'pass' : 'fail';
        } else if (midtermStudentResult || finalStudentResult) {
          status = 'pending';
        }
      }

      if (subMax > 0) {
        totalMaxMarks += subMax;
        totalObtainedMarks += subObtained;
        subjectsCount++;
        if (status === 'fail') hasFail = true;
        if (status === 'pending') hasPending = true;
      }

      return {
        subjectName: sub.name,
        midtermMarks: midtermMarks !== null ? `${Number(midtermMarks.toFixed(2))}/${midtermMax}` : '-',
        finalMarks: finalMarks !== null ? `${Number(finalMarks.toFixed(2))}/${finalMax}` : '-',
        obtained: subMax > 0 ? `${Number(subObtained.toFixed(2))}/${subMax}` : '-',
        maxMarks: subMax,
        obtainedMarks: Number(subObtained.toFixed(2)),
        passingMarks: subPassing,
        percentage: subMax > 0 ? Math.round((subObtained / subMax) * 100) : 0,
        status
      };
    });

    const overallPercentage = totalMaxMarks > 0 ? Math.round((totalObtainedMarks / totalMaxMarks) * 100) : 0;
    const gradeDetails = getGradeAndRemarks(overallPercentage);
    
    let overallStatus: 'pass' | 'fail' | 'pending' = 'pass';
    if (hasPending) overallStatus = 'pending';
    else if (hasFail || overallPercentage < 40) overallStatus = 'fail';

    return {
      id: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber || '-',
      schoolName: student.schoolName || 'SCHOOL ERP ACADEMY',
      subjects: subjectsData,
      totalMaxMarks,
      totalObtainedMarks: Number(totalObtainedMarks.toFixed(2)),
      overallPercentage,
      grade: gradeDetails.grade,
      remarks: gradeDetails.remarks,
      color: gradeDetails.color,
      status: overallStatus
    };
  };

  // Preview Students compile
  const previewStudents = useMemo(() => {
    if (students.length === 0) return [];
    if (selectedStudentId === 'all') {
      return students.map(student => compileMarksheet(student));
    }
    const student = students.find(s => s.id === selectedStudentId);
    return student ? [compileMarksheet(student)] : [];
  }, [students, selectedStudentId, exams, resultsMap, marksheetType]);

  // Modern print handler using react-to-print
  const handlePrintBase = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: selectedStudentId === 'all' 
      ? `Marksheets_${classNameStr}_${classSection}` 
      : `Marksheet_${students.find(s => s.id === selectedStudentId)?.name || 'Student'}`,
    onAfterPrint: () => setPrinting(false),
  });

  const handlePrint = () => {
    if (students.length === 0) return;
    setPrinting(true);
    // Give react brief window to mount print contents
    setTimeout(() => {
      handlePrintBase();
    }, 200);
  };

  const handleDownloadPDF = async () => {
    if (students.length === 0) return;
    try {
      const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
      const filename = selectedStudentId === 'all' 
        ? `Marksheets_${classNameStr}_${classSection}.pdf` 
        : `Marksheet_${students.find(s => s.id === selectedStudentId)?.name || 'Student'}.pdf`;

      await downloadContainerAsPDF({
        containerRef: printContainerRef,
        pageClassName: 'marksheet-page-break',
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

  const SelectedTemplate = MARKSHEET_TEMPLATES.find(t => t.id === selectedTemplateId)?.component || MARKSHEET_TEMPLATES[0].component;

  if (isStandalone) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
        <MarksheetStandaloneToolbar
          classNameStr={classNameStr}
          classSection={classSection}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          students={students}
          loading={loading}
          marksheetType={marksheetType}
          setMarksheetType={setMarksheetType}
          exams={exams}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
          printing={printing}
          handlePrint={handlePrint}
          onBack={onBack}
          downloading={downloading}
          handleDownloadPDF={handleDownloadPDF}
        />
        
        {/* Standalone View Container */}
        <div className="viewer-container">
          <MarksheetSheetsPreview
            loading={loading}
            exams={exams}
            students={students}
            previewStudents={previewStudents}
            zoomScale={zoomScale}
            SelectedTemplate={SelectedTemplate}
            classNameStr={classNameStr}
            classSection={classSection}
            academicYear={academicYear}
            marksheetType={marksheetType}
            selectedStudentId={selectedStudentId}
            isStandalone={true}
            examName={examName}
          />
        </div>

        {/* Hidden Print Container */}
        <MarksheetPrintContainer
          printContainerRef={printContainerRef}
          previewStudents={previewStudents}
          SelectedTemplate={SelectedTemplate}
          classNameStr={classNameStr}
          classSection={classSection}
          academicYear={academicYear}
          marksheetType={marksheetType}
          examName={examName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarksheetControls
        classNameStr={classNameStr}
        classSection={classSection}
        onBack={onBack}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        marksheetType={marksheetType}
        setMarksheetType={setMarksheetType}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        zoomScale={zoomScale}
        setZoomScale={setZoomScale}
        handlePrint={handlePrint}
        students={students}
        exams={exams}
        loading={loading}
        printing={printing}
        downloading={downloading}
        handleDownloadPDF={handleDownloadPDF}
      />

      <MarksheetSheetsPreview
        loading={loading}
        exams={exams}
        students={students}
        previewStudents={previewStudents}
        zoomScale={zoomScale}
        SelectedTemplate={SelectedTemplate}
        classNameStr={classNameStr}
        classSection={classSection}
        academicYear={academicYear}
        marksheetType={marksheetType}
        selectedStudentId={selectedStudentId}
        examName={examName}
      />

      <MarksheetPrintContainer
        printContainerRef={printContainerRef}
        previewStudents={previewStudents}
        SelectedTemplate={SelectedTemplate}
        classNameStr={classNameStr}
        classSection={classSection}
        academicYear={academicYear}
        marksheetType={marksheetType}
        examName={examName}
      />
    </div>
  );
}
