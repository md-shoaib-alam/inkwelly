import { apiFetch, fetchAllStudents } from '@/lib/api';
import { toast } from "sonner";
import { ExamRecord } from './types';

export interface TabulationRow {
  id: string;
  name: string;
  rollNumber: string;
  subjectMarks: Record<string, { marksObtained: number; totalMarks: number; status: string }>;
  totalObtained: number;
  totalMax: number;
  percentage: string;
  percentageVal: number;
  grade: string;
  status: string;
}

export interface LedgerData {
  className: string;
  classSection: string;
  academicYear: string;
  schoolName: string;
  subjectsList: string[];
  subjectMaxMarks: Record<string, number>;
  studentsTabulation: TabulationRow[];
  totalStudents: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  classAverage: string;
  ledgerTitle: string;
}

interface ExamResultDetail {
  examId: string;
  examName: string;
  subjectName: string;
  totalMarks: number;
  results: any[];
}

const getGrade = (percentageVal: number, status: string): string => {
  if (status === 'PENDING') return 'PENDING';
  if (status === 'FAIL' || percentageVal < 40) return 'F';
  if (percentageVal >= 90) return 'A+';
  if (percentageVal >= 80) return 'A';
  if (percentageVal >= 70) return 'B';
  if (percentageVal >= 60) return 'C';
  if (percentageVal >= 50) return 'D';
  return 'E';
};

export const compileTabularLedgerData = async ({
  classId,
  className,
  classSection,
  academicYear,
  examName,
}: {
  classId: string;
  className: string;
  classSection: string;
  academicYear: string;
  examName?: string;
}): Promise<LedgerData | null> => {
  try {
    // 1. Fetch students & exams in parallel with json parsing
    const [loadedStudents, examData] = await Promise.all([
      fetchAllStudents({ classId }),
      apiFetch(`/api/exams?classId=${classId}&limit=100`).then((res) => res.json())
    ]);

    const completedExams = (examData.data || examData || []).filter(
      (e: ExamRecord) => {
        const matchesBasic = (e.status === 'published' || e.isPublished === true) && e.academicYear === academicYear;
        if (!matchesBasic) return false;
        if (examName) {
          const cycleName = e.name.includes(' - ') ? e.name.split(' - ')[0] : e.name;
          return cycleName.trim().toLowerCase() === examName.trim().toLowerCase();
        }
        return true;
      }
    );

    if (loadedStudents.length === 0) {
      toast.error('No students found in this class.');
      return null;
    }

    if (completedExams.length === 0) {
      toast.error(
        examName
          ? `No completed exams found matching "${examName}" in this academic cycle.`
          : 'No completed exams found for this academic cycle.'
      );
      return null;
    }

    // 2. Fetch results for each completed exam in parallel
    const allExamResults: ExamResultDetail[] = await Promise.all(
      completedExams.map(async (exam: ExamRecord): Promise<ExamResultDetail> => {
        try {
          const res = await apiFetch(`/api/exams/results?examId=${exam.id}`);
          const data = await res.json();
          return { 
            examId: exam.id, 
            examName: exam.name, 
            subjectName: exam.subjectName, 
            totalMarks: exam.totalMarks, 
            results: data.results || [] 
          };
        } catch (err) {
          console.error(`Error loading results for exam ${exam.id}:`, err);
          return { 
            examId: exam.id, 
            examName: exam.name, 
            subjectName: exam.subjectName, 
            totalMarks: exam.totalMarks, 
            results: [] 
          };
        }
      })
    );

    // 3. Compile tabulation data
    const subjectMaxMarks: Record<string, number> = {};
    allExamResults.forEach((er: ExamResultDetail) => {
      subjectMaxMarks[er.subjectName] = er.totalMarks;
    });

    let totalStudents = loadedStudents.length;
    let passCount = 0;
    let failCount = 0;
    let pendingCount = 0;
    let sumPercentages = 0;

    const studentsTabulation: TabulationRow[] = loadedStudents.map((student: any) => {
      let totalObtained = 0;
      let totalMax = 0;
      const subjectMarks: Record<string, { marksObtained: number; totalMarks: number; status: string }> = {};

      allExamResults.forEach((er: ExamResultDetail) => {
        const res = er.results.find((r: any) => r.studentId === student.id);
        if (res) {
          const marks = res.marksObtained || 0;
          subjectMarks[er.subjectName] = {
            marksObtained: marks,
            totalMarks: er.totalMarks,
            status: res.status || 'pending'
          };
          totalObtained += marks;
          totalMax += er.totalMarks;
        } else {
          subjectMarks[er.subjectName] = {
            marksObtained: 0,
            totalMarks: er.totalMarks,
            status: 'pending'
          };
          totalMax += er.totalMarks;
        }
      });

      const percentageVal = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      sumPercentages += percentageVal;
      
      let hasFail = false;
      let hasPending = false;
      Object.values(subjectMarks).forEach(s => {
        if (s.status === 'fail') hasFail = true;
        if (s.status === 'pending' || s.status === 'absent') hasPending = true;
      });

      let overallStatus = 'PASS';
      if (hasPending) {
        overallStatus = 'PENDING';
        pendingCount++;
      } else if (hasFail || percentageVal < 40) {
        overallStatus = 'FAIL';
        failCount++;
      } else {
        passCount++;
      }

      const grade = getGrade(percentageVal, overallStatus);

      return {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber || '-',
        subjectMarks,
        totalObtained,
        totalMax,
        percentageVal,
        percentage: percentageVal.toFixed(1) + '%',
        grade,
        status: overallStatus
      };
    });

    const subjectsList: string[] = Array.from(new Set(allExamResults.map((er: ExamResultDetail) => er.subjectName)));
    const schoolName = loadedStudents[0]?.schoolName || 'SCHOOL ERP ACADEMY';
    const classAverage = totalStudents > 0 ? (sumPercentages / totalStudents).toFixed(1) + '%' : '0.0%';

    // Generate dynamic title based on the actual completed exams for this class
    const ledgerTitle = examName
      ? `TABULATION SHEET - ${examName.toUpperCase()}`
      : 'CONSOLIDATED TABULAR RESULTS SHEET';

    return {
      className,
      classSection,
      academicYear,
      schoolName,
      subjectsList,
      subjectMaxMarks,
      studentsTabulation,
      totalStudents,
      passCount,
      failCount,
      pendingCount,
      classAverage,
      ledgerTitle,
    };
  } catch (err) {
    console.error('Error compiling tabulation data:', err);
    toast.error('Failed to compile tabulation data.');
    return null;
  }
};
