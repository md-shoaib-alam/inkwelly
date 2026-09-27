import { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent } from "@/components/ui/card";
import { useParentDashboard } from "@/lib/graphql/hooks";
import { 
  GraduationCap, 
  Award, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  Hash, 
  User, 
  Sparkles,
  TrendingUp,
  BookmarkCheck,
  ChevronRight,
  ArrowUpRight,
  ChevronDown
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Sub-components
import { StudentProfileCard } from "./children/StudentProfileCard";
import { PerformanceSection } from "./children/PerformanceSection";
import { GradesTable } from "./children/GradesTable";
import { ChildrenSkeleton } from "./children/ChildrenSkeleton";
import { ChildSelector } from "./ChildSelector";

// Utils
import { 
  getAttendanceForStudent, 
  getSubjectPerformance, 
  getOverallAvg 
} from "./children/utils";

export function ParentChildren() {
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState("");

  const { data, isPending } = useParentDashboard(currentUser?.name || "");

  const students = data?.children || [];

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
  }, [students, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    document.cookie = `lastSelectedStudent=${val}; path=/; max-age=31536000`;
  };

  if (isPending) return <ChildrenSkeleton />;

  if (students.length === 0) {
    return (
      <Card className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 shadow-sm">
        <CardContent className="p-16 text-center">
          <div className="size-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <GraduationCap className="size-8" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-6">No children found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">No student profiles are currently linked to your parental account. Please contact administrative staff to link your children.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedStudent = students.find((s) => s.id === activeTab) || students[0];

  const att = selectedStudent ? getAttendanceForStudent(selectedStudent.id, selectedStudent.attendance || []) : { percentage: 0, present: 0, absent: 0, total: 0 };
  const subjectPerf = selectedStudent ? getSubjectPerformance(selectedStudent.id, selectedStudent.grades || []) : [];
  const overall = selectedStudent ? getOverallAvg(selectedStudent.id, selectedStudent.grades || []) : { avg: 0, grade: "N/A" };
  const recentGrades = selectedStudent ? (selectedStudent.grades || []).slice(0, 8) : [];

  return (
    <div className="space-y-8 pb-12 select-none animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-4 min-w-fit">
            <ChildSelector 
              students={students} 
              selectedStudentId={selectedStudent.id} 
              onSelect={handleTabChange} 
            />
          </div>
        </div>
      </div>

      {/* Main Workspace Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Profile Card + Quick Actions */}
        <div className="space-y-6">
          <StudentProfileCard student={selectedStudent} />
          
          {/* Quick Actions Card - Moved here from main row */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-5 flex flex-col shadow-xs">
            <h4 className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-4">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <a href="attendance" className="p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border-2 border-zinc-100 dark:border-zinc-800/50 hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md active:scale-[0.98]">
                <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                  <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors whitespace-nowrap">
                  Attendance
                </span>
              </a>
              <a href="school-exams" className="p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border-2 border-zinc-100 dark:border-zinc-800/50 hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md active:scale-[0.98]">
                <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                  <Award className="size-3.5 text-violet-600 dark:text-violet-500" />
                </div>
                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors whitespace-nowrap">
                  Grades
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Center/Right Column: Main Dashboard Content (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Top Row: Metrics (Now full width of center column) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Attendance Stat Card */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 p-6 flex flex-col justify-between min-h-[140px] shadow-xs hover:border-emerald-500/20 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="size-5" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Live
                </span>
              </div>
              <div className="mt-4 text-left">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block">Attendance Rate</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                    {att.percentage}%
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">({att.present}/{att.total} days)</span>
                </div>
                <Progress value={att.percentage} className="h-1.5 mt-3 bg-zinc-100 dark:bg-zinc-900 [&>div]:bg-emerald-500" />
              </div>
            </div>

            {/* GPA Stat Card */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 p-6 flex flex-col justify-between min-h-[140px] shadow-xs hover:border-violet-500/20 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-violet-500/5 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform">
                  <Award className="size-5" />
                </div>
                <Badge variant="outline" className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 font-semibold text-[10px] uppercase rounded-full px-2.5 py-0.5">
                  {overall.grade} Grade
                </Badge>
              </div>
              <div className="mt-4 text-left">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block">Average Grade</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                    {overall.avg}%
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">Overall GPA</span>
                </div>
                <Progress value={overall.avg} className="h-1.5 mt-3 bg-zinc-100 dark:bg-zinc-900 [&>div]:bg-violet-500" />
              </div>
            </div>

            {/* Total Courses Card */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 p-6 flex flex-col justify-between min-h-[140px] shadow-xs hover:border-amber-500/20 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-amber-500/5 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <BookOpen className="size-5" />
                </div>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  Academic
                </span>
              </div>
              <div className="mt-4 text-left">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block">Active Courses</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                    {subjectPerf.length}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">Subjects</span>
                </div>
                <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium mt-3 uppercase tracking-wider flex items-center gap-1">
                  <BookmarkCheck className="size-3 text-amber-500" /> Syllabus aligned
                </div>
              </div>
            </div>
          </div>

          {/* Visual Performance Charts & Tables grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PerformanceSection data={subjectPerf} />
            <GradesTable grades={recentGrades} />
          </div>
        </div>
      </div>
    </div>
  );
}

