"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useReducer, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useAcademicYears } from "@/hooks/use-academic-years";
import type { GradeRecord, StudentInfo } from "@/lib/types";

// Import types and sub-components
import type { AssessmentGrade } from "./my-grades/types";
import { GradesSkeleton } from "./my-grades/grades-skeleton";
import { GradesHeader } from "./my-grades/grades-header";
import { ExamsSummaryCards } from "./my-grades/exams-summary-cards";
import { SubjectPerformanceChart } from "./my-grades/subject-performance-chart";
import { GradeDistributionChart } from "./my-grades/grade-distribution-chart";
import { ExamsTable } from "./my-grades/exams-table";
import { AssessmentsSummaryCards } from "./my-grades/assessments-summary-cards";
import { AssessmentsPerformanceChart } from "./my-grades/assessments-performance-chart";
import { AssessmentsTable } from "./my-grades/assessments-table";
import { ResultPublishedBanner } from "@/components/shared/result-published-banner";

type State = {
  recharts: typeof import("recharts") | null;
  loading: boolean;
  students: StudentInfo[];
  grades: GradeRecord[];
  assessmentGrades: AssessmentGrade[];
  activeTab: string;
  topLevelTab: "exams" | "assessments";
  selectedYear: string;
};

type Action =
  | { type: 'SET_RECHARTS'; payload: typeof import("recharts") }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: { students: StudentInfo[]; grades: GradeRecord[]; assessmentGrades: AssessmentGrade[] } }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_TOP_LEVEL_TAB'; payload: "exams" | "assessments" }
  | { type: 'SET_SELECTED_YEAR'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_RECHARTS':
      return { ...state, recharts: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_TOP_LEVEL_TAB':
      return { ...state, topLevelTab: action.payload };
    case 'SET_SELECTED_YEAR':
      return { ...state, selectedYear: action.payload };
    default:
      return state;
  }
}

export function StudentGrades({ initialTab }: { initialTab?: "exams" | "assessments" }) {
  const { currentUser } = useAppStore();
  
  const initialState: State = {
    recharts: null,
    loading: true,
    students: [],
    grades: [],
    assessmentGrades: [],
    activeTab: "all",
    topLevelTab: initialTab || "exams",
    selectedYear: "",
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    recharts,
    loading,
    grades,
    assessmentGrades,
    activeTab,
    topLevelTab,
    selectedYear,
  } = state;

  useEffect(() => {
    import("recharts").then((mod) => dispatch({ type: 'SET_RECHARTS', payload: mod }));
  }, []);

  const { academicYears } = useAcademicYears();

  // Set default selected year to current once loaded
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const current = academicYears.find((y: any) => y.isCurrent) || academicYears[0];
      if (current) dispatch({ type: 'SET_SELECTED_YEAR', payload: current.name });
    }
  }, [academicYears, selectedYear]);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await apiFetch("/api/students/me");
      if (!res.ok) throw new Error("Failed to fetch student profile");
      const targetStudent = await res.json();
      
      let fetchedGrades: GradeRecord[] = [];
      let fetchedAssessments: AssessmentGrade[] = [];

      if (targetStudent?.id) {
        const [gradesData, assessData, classAssessData] = await Promise.all([
          apiFetch(`/api/grades?studentId=${targetStudent.id}`).then((res) => res.json()),
          apiFetch(`/api/assessments/student-grades?studentId=${targetStudent.id}`).then((res) => res.json()),
          apiFetch(`/api/assessments?classId=${targetStudent.classId}`).then((res) => res.json())
        ]);
        fetchedGrades = Array.isArray(gradesData) ? gradesData : [];
        const gradedList = Array.isArray(assessData) ? assessData : [];
        const classAssessments = Array.isArray(classAssessData) ? classAssessData : [];

        const gradedMap = new Map(gradedList.map((g) => [g.assessmentId, g]));
        const combinedAssessments: AssessmentGrade[] = [...gradedList];

        classAssessments.forEach((a: any) => {
          if (!gradedMap.has(a.id)) {
            combinedAssessments.push({
              id: `pending_${a.id}`,
              assessmentId: a.id,
              title: a.title,
              type: a.type,
              subjectName: a.subject?.name || "N/A",
              marksObtained: null as any,
              totalMarks: a.totalMarks,
              passingMarks: a.passingMarks,
              remarks: "",
              createdAt: a.createdAt,
            });
          }
        });

        fetchedAssessments = combinedAssessments;
      }
      
      dispatch({ 
        type: 'SET_DATA', 
        payload: { 
          students: [targetStudent], 
          grades: fetchedGrades, 
          assessmentGrades: fetchedAssessments 
        } 
      });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter grades by academic year
  const yearFilteredGrades = useMemo(() => {
    if (!selectedYear) return grades;
    return grades;
  }, [grades, selectedYear]);

  const filteredGrades = useMemo(() => {
    if (activeTab === "all") return yearFilteredGrades;
    return yearFilteredGrades.filter((g) => g.examType.toLowerCase() === activeTab);
  }, [yearFilteredGrades, activeTab]);

  // Computed analytics
  const overallAvg = useMemo(() => {
    if (!grades.length) return 0;
    return Math.round(
      grades.reduce((s, g) => s + (g.marks / g.maxMarks) * 100, 0) /
        grades.length,
    );
  }, [grades]);

  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    grades.forEach((g) => {
      const letter = g.grade || "N/A";
      dist[letter] = (dist[letter] || 0) + 1;
    });
    return Object.entries(dist)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([grade, count]) => ({ grade, count }));
  }, [grades]);

  const gradeColorMap: Record<string, string> = {
    "A+": "#8b5cf6",
    A: "#7c3aed",
    "B+": "#6366f1",
    B: "#3b82f6",
    C: "#f59e0b",
    D: "#ef4444",
    "N/A": "#9ca3af",
  };

  const latestExam = useMemo(() => {
    if (!grades.length) return { data: [], label: "" };
    const examTypes = [...new Set(grades.map((g) => g.examType))];
    const latest = examTypes[0];
    const examGrades = grades.filter((g) => g.examType === latest);
    const data = examGrades.map((g) => ({
      subject:
        g.subjectName.length > 15
          ? g.subjectName.slice(0, 12) + "..."
          : g.subjectName,
      marks: Math.round((g.marks / g.maxMarks) * 100),
      fill:
        (g.marks / g.maxMarks) * 100 >= 80
          ? "#8b5cf6"
          : (g.marks / g.maxMarks) * 100 >= 60
            ? "#a78bfa"
            : "#f59e0b",
    }));
    return { data, label: latest };
  }, [grades]);

  const pieData = gradeDistribution.map((g) => ({
    name: g.grade,
    value: g.count,
    fill: gradeColorMap[g.grade] || "#9ca3af",
  }));

  const assessmentAvg = useMemo(() => {
    if (!assessmentGrades.length) return 0;
    return Math.round(
      assessmentGrades.reduce((s, g) => s + (g.marksObtained / g.totalMarks) * 100, 0) /
        assessmentGrades.length,
    );
  }, [assessmentGrades]);

  const latestAssessmentChartData = useMemo(() => {
    if (!assessmentGrades.length) return [];
    const grouped: Record<string, { sum: number; count: number }> = {};
    assessmentGrades.forEach((g) => {
      if (!grouped[g.subjectName]) grouped[g.subjectName] = { sum: 0, count: 0 };
      grouped[g.subjectName].sum += (g.marksObtained / g.totalMarks) * 100;
      grouped[g.subjectName].count += 1;
    });
    return Object.entries(grouped).map(([subj, val]) => {
      const avg = Math.round(val.sum / val.count);
      return {
        subject: subj.length > 15 ? subj.slice(0, 12) + "..." : subj,
        marks: avg,
        fill: avg >= 80 ? "#6366f1" : avg >= 50 ? "#818cf8" : "#ef4444",
      };
    });
  }, [assessmentGrades]);

  const chartConfig = {
    marks: { label: "Score %", color: "#8b5cf6" },
  };

  if (loading) return <GradesSkeleton />;

  return (
    <div className="space-y-6">
      {topLevelTab === "exams" && <ResultPublishedBanner />}
      <GradesHeader
        topLevelTab={topLevelTab}
        academicYears={academicYears}
        selectedYear={selectedYear}
        onSelectedYearChange={(v) => dispatch({ type: "SET_SELECTED_YEAR", payload: v })}
      />

      {topLevelTab === "exams" ? (
        <div className="space-y-6">
          <ExamsSummaryCards
            overallAvg={overallAvg}
            totalRecords={grades.length}
            uniqueSubjectsCount={[...new Set(grades.map((g) => g.subjectName))].length}
            uniqueExamTypesCount={[...new Set(grades.map((g) => g.examType))].length}
            highGradesCount={
              gradeDistribution.find((g) => g.grade === "A+" || g.grade === "A")?.count || 0
            }
            gradeDistribution={gradeDistribution}
            gradeColorMap={gradeColorMap}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubjectPerformanceChart
              recharts={recharts}
              latestExam={latestExam}
              chartConfig={chartConfig}
            />

            <GradeDistributionChart
              recharts={recharts}
              pieData={pieData}
              gradeDistribution={gradeDistribution}
              gradeColorMap={gradeColorMap}
              chartConfig={chartConfig}
            />
          </div>

          <ExamsTable
            activeTab={activeTab}
            onActiveTabChange={(v) => dispatch({ type: "SET_ACTIVE_TAB", payload: v })}
            filteredGrades={filteredGrades}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <AssessmentsSummaryCards
            assessmentAvg={assessmentAvg}
            totalGraded={assessmentGrades.length}
            uniqueSubjectsCount={[...new Set(assessmentGrades.map((a) => a.subjectName))].length}
            passedCount={
              assessmentGrades.filter((a) => (a.marksObtained || 0) >= (a.passingMarks || 0)).length
            }
          />

          <AssessmentsPerformanceChart
            recharts={recharts}
            latestAssessmentChartData={latestAssessmentChartData}
            chartConfig={chartConfig}
            assessmentAvg={assessmentAvg}
          />

          <AssessmentsTable assessmentGrades={assessmentGrades} />
        </div>
      )}
    </div>
  );
}
