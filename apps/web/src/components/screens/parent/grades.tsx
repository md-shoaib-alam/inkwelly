"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { useParentDashboard } from "@/lib/graphql/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, BookOpen, Award, CheckCircle2, ClipboardList, GraduationCap, FileText } from "lucide-react";
import type { StudentInfo, GradeRecord } from "@/lib/types";

// Sub-components
import { GradesSummary } from "./grades/GradesSummary";
import { PerformanceChart } from "./grades/PerformanceChart";
import { GradesTable } from "./grades/GradesTable";
import { GradesSkeleton } from "./grades/GradesSkeleton";
import { ResultPublishedBanner } from "@/components/shared/result-published-banner";
import { ChildSelector } from "./ChildSelector";

// Utils
import { getGradesForStudent, getSubjectChartData, getOverallStats } from "./grades/utils";

interface AssessmentGrade {
  id: string;
  assessmentId: string;
  title: string;
  type: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  passingMarks: number;
  remarks: string | null;
  createdAt: string;
}

export function ParentGrades({ initialTab = "exams" }: { initialTab?: "exams" | "assessments" }) {
  const { currentUser } = useAppStore();
  const params = useParams();
  const { push } = useRouter();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const topLevelTab = initialTab;
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [activeTab, setActiveTab] = useState("");
  
  // State for Assessment view
  const [assessmentGrades, setAssessmentGrades] = useState<AssessmentGrade[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const { data, isPending } = useParentDashboard(currentUser?.name || "");
  const students = (data?.children || []) as StudentInfo[];

  useEffect(() => {
    if (students.length > 0) {
      const savedTab = document.cookie
        .split("; ")
        .find((row) => row.startsWith("lastSelectedStudent="))
        ?.split("=")[1];
      
      if (savedTab && students.some(s => s.id === savedTab)) {
        setActiveTab(savedTab);
      } else if (!activeTab) {
        setActiveTab(students[0].id);
      }
    }
  }, [students]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    document.cookie = `lastSelectedStudent=${val}; path=/; max-age=31536000`;
  };

  const handleViewMarksheet = () => {
    if (activeTab && slug) {
      push(`/${slug}/view-marksheet?studentId=${activeTab}`);
    }
  };

  // Fetch Exam Grades (Loads everything for all students at once)
  useEffect(() => {
    async function fetchGrades() {
      if (students.length === 0 || topLevelTab !== "exams") return;
      try {
        const res = await apiFetch("/api/grades");
        const raw = await res.json();
        setGrades(Array.isArray(raw) ? raw : (raw.items || []));
      } catch (e) {
        console.error("Failed to fetch grades", e);
      }
    }
    fetchGrades();
  }, [students.length, topLevelTab]);

  // Fetch Assessments for the active student
  const fetchAssessmentsForStudent = useCallback(async (studentId: string) => {
    if (!studentId || topLevelTab !== "assessments") return;
    setLoadingAssessments(true);
    try {
      const res = await apiFetch(`/api/assessments/student-grades?studentId=${studentId}`);
      if (res.ok) {
        const raw = await res.json();
        setAssessmentGrades(Array.isArray(raw) ? raw : []);
      } else {
        setAssessmentGrades([]);
      }
    } catch (e) {
      console.error("Failed to fetch assessment grades", e);
      setAssessmentGrades([]);
    } finally {
      setLoadingAssessments(false);
    }
  }, [topLevelTab]);

  useEffect(() => {
    if (activeTab && topLevelTab === "assessments") {
      fetchAssessmentsForStudent(activeTab);
    }
  }, [activeTab, topLevelTab, fetchAssessmentsForStudent]);

  // Process continuous assessment data
  const assessmentStats = useMemo(() => {
    if (assessmentGrades.length === 0) return { avg: 0, total: 0, passCount: 0 };
    
    const totalPct = assessmentGrades.reduce((sum, item) => sum + (item.marksObtained / item.totalMarks) * 100, 0);
    const passCount = assessmentGrades.filter((a) => a.marksObtained >= a.passingMarks).length;

    return {
      avg: Math.round(totalPct / assessmentGrades.length),
      total: assessmentGrades.length,
      passCount,
    };
  }, [assessmentGrades]);

  const assessmentChartData = useMemo(() => {
    const subjectMap = new Map<string, { totalPct: number; count: number }>();
    assessmentGrades.forEach((g) => {
      const pct = (g.marksObtained / g.totalMarks) * 100;
      if (!subjectMap.has(g.subjectName)) {
        subjectMap.set(g.subjectName, { totalPct: 0, count: 0 });
      }
      const entry = subjectMap.get(g.subjectName)!;
      entry.totalPct += pct;
      entry.count++;
    });
    
    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      percentage: Math.round(data.totalPct / data.count),
    }));
  }, [assessmentGrades]);

  if (isPending) return <GradesSkeleton />;

  if (students.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-12 text-center flex flex-col items-center">
          <TrendingUp className="size-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-4">No children linked</h3>
          <p className="text-sm text-muted-foreground mt-1">Contact account services to enroll or link students.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedStudent = students.find((s) => s.id === activeTab) || students[0];
  const studentGrades = getGradesForStudent(selectedStudent.id, grades);
  const chartData = getSubjectChartData(selectedStudent.id, grades);
  const stats = getOverallStats(selectedStudent.id, grades);

  return (
    <div className="space-y-6 pb-10 animate-fade-in select-none">
      <div className="flex flex-col gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {topLevelTab === "exams" ? (
              <GraduationCap className="size-5 text-amber-600" />
            ) : (
              <ClipboardList className="size-5 text-violet-600" />
            )}
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              {topLevelTab === "exams" ? "School Exams" : "Class Assessments"}
            </h2>
          </div>

          {/* Top-Right Action Button */}
          {topLevelTab === "exams" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-semibold border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-950/20 shadow-sm"
              onClick={handleViewMarksheet}
            >
              <FileText className="size-3.5" />
              View Marksheet
            </Button>
          )}
        </div>

        <div className="text-left">
          {/* Children Switcher Dropdown */}
          <ChildSelector 
            students={students}
            selectedStudentId={selectedStudent.id}
            onSelect={handleTabChange}
          />
        </div>
      </div>

      {topLevelTab === "exams" && (
        <ResultPublishedBanner studentId={selectedStudent.id} />
      )}

      <div className="space-y-6 mt-6 animate-in fade-in duration-300 text-left">
        {topLevelTab === "exams" ? (
          // RENDER OFFICIAL EXAMS VIEW
          <>
            <GradesSummary 
              avg={stats.avg}
              grade={stats.grade}
              highestSubject={stats.highest.subject}
              highestPct={stats.highest.pct}
              totalExams={stats.totalExams}
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <PerformanceChart data={chartData} />
              </div>
              <div className="lg:col-span-3">
                <GradesTable studentName={selectedStudent.name} grades={studentGrades} />
              </div>
            </div>
          </>
        ) : (
          // RENDER CONTINUOUS ASSESSMENTS VIEW
          <>
            {loadingAssessments ? (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted/40 animate-pulse rounded-xl" />)}
                </div>
                <div className="h-80 bg-muted/30 animate-pulse rounded-xl" />
              </div>
            ) : (
              <>
                {/* Assessment Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="rounded-xl shadow-none border-zinc-200/60 dark:border-zinc-800">
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                      <div className="inline-flex p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-2">
                        <TrendingUp className="size-5" />
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">{assessmentStats.avg}%</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Average Score</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl shadow-none border-zinc-200/60 dark:border-zinc-800">
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                      <div className="inline-flex p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-2">
                        <Award className="size-5" />
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">{assessmentStats.total}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Total Assessments</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl shadow-none border-zinc-200/60 dark:border-zinc-800">
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                      <div className="inline-flex p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">{assessmentStats.passCount}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Passed Assessments</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Re-use exams performance chart with mapped assessment data */}
                  <div className="lg:col-span-2">
                    <PerformanceChart data={assessmentChartData} />
                  </div>

                  {/* List Assessments */}
                  <div className="lg:col-span-3">
                    <Card className="rounded-xl shadow-none border-zinc-200/60 dark:border-zinc-800 h-full">
                      <CardHeader className="p-4 border-b border-zinc-100/60 dark:border-zinc-800/50">
                        <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <ClipboardList className="size-4 text-violet-500" />
                          {selectedStudent.name}&apos;s Assessments
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[300px]">
                          {assessmentGrades.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                              <BookOpen className="size-8 opacity-30 mb-2" />
                              <p className="text-xs font-semibold">No assessments recorded yet</p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader className="bg-muted/20 sticky top-0">
                                <TableRow className="border-zinc-100 dark:border-zinc-800/70">
                                  <TableHead className="text-xs font-semibold h-9">Subject/Title</TableHead>
                                  <TableHead className="text-xs font-semibold h-9">Type</TableHead>
                                  <TableHead className="text-center text-xs font-semibold h-9">Score</TableHead>
                                  <TableHead className="text-center text-xs font-semibold h-9">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {assessmentGrades.map((g) => {
                                  const pct = Math.round((g.marksObtained / g.totalMarks) * 100);
                                  const isPass = g.marksObtained >= g.passingMarks;
                                  return (
                                    <TableRow key={g.id} className="border-zinc-100 dark:border-zinc-800/60">
                                      <TableCell className="py-2.5 text-left">
                                        <div className="flex flex-col text-left">
                                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{g.title}</span>
                                          <span className="text-[10px] text-muted-foreground">{g.subjectName}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2.5">
                                        <Badge variant="outline" className="text-[9px] bg-muted/30 px-1.5 font-bold uppercase tracking-wide border-none">
                                          {g.type.replace(/_/g, " ")}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-2.5 text-center">
                                        <span className="text-xs font-bold">
                                          {Number(g.marksObtained).toFixed(2).replace(/\.00$/, "")}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">/{g.totalMarks}</span>
                                      </TableCell>
                                      <TableCell className="py-2.5 text-center">
                                        <Badge className={`text-[9px] border-none font-bold shadow-none px-1.5 py-0.5 ${
                                          isPass ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                        }`}>
                                          {isPass ? "PASS" : "FAIL"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
