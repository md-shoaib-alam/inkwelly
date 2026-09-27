"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useParentDashboard } from "@/lib/graphql/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ChildSelector } from "./ChildSelector";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Globe,
  BookOpen,
  BookMarked,
  Users,
  List,
  CalendarDays,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { StudentInfo, AssignmentInfo } from "@/lib/types";
import { DailyDiaryPlanner } from "@/components/shared/daily-diary-planner";

type HomeworkStatus = "active" | "submitted" | "overdue";

interface StudentSubmission {
  id: string;
  status: string;
  submittedAt: string;
  assignmentId: string;
}

interface EnrichedHomework extends AssignmentInfo {
  status: HomeworkStatus;
  countdown: string;
  daysLeft: number;
  submitted: boolean;
  submissionId: string | null;
}

export function ParentHomework() {
  const { currentUser } = useAppStore();
  const [activeStudentId, setActiveStudentId] = useState("");
  const { data, isPending } = useParentDashboard(currentUser?.name || "");
  const children = useMemo(() => (data?.children || []) as StudentInfo[], [data?.children]);

  useEffect(() => {
    if (children.length > 0) {
      const savedTab = document.cookie
        .split("; ")
        .find((row) => row.startsWith("parentSelectedStudentHome="))
        ?.split("=")[1];
      
      const targetId = savedTab && children.some(s => s.id === savedTab) ? savedTab : children[0].id;
      if (targetId !== activeStudentId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveStudentId(targetId);
      }
    }
  }, [children, activeStudentId]);

  const handleStudentChange = (val: string) => {
    setActiveStudentId(val);
    document.cookie = `parentSelectedStudentHome=${val}; path=/; max-age=31536000`;
  };

  if (isPending) return <HomeworkSkeleton />;

  if (children.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-12 text-center">
          <Users className="size-12 mx-auto text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-4">No children registered</h3>
          <p className="text-sm text-muted-foreground mt-1">Contact administration to link your child to this account.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedStudent = children.find((c) => c.id === activeStudentId) || children[0];

  return (
    <div className="space-y-6 pb-10 animate-fade-in select-none">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5">
        <div className="space-y-3.5 text-left">
          <div className="flex items-center gap-2">
            <BookMarked className="size-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Homework & Diary
            </h2>
          </div>
          {/* Children Switcher Dropdown */}
          <ChildSelector 
            students={children}
            selectedStudentId={selectedStudent.id}
            onSelect={handleStudentChange}
          />
        </div>
      </div>

      <div className="space-y-6 mt-6 animate-in fade-in duration-300">
        <ChildHomeworkView student={selectedStudent} />
      </div>
    </div>
  );
}

const formatDueDate = (dueDate: string) => {
  try {
    return new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return dueDate;
  }
};

/* ─── Child Homework View ─── */
function ChildHomeworkView({ student }: { student: StudentInfo }) {
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<AssignmentInfo[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [filterTab, setFilterTab] = useState("active");
  const [viewMode, setViewMode] = useState<"list" | "diary">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const fetchChildData = useCallback(async () => {
    setLoading(true);
    try {
      const [homeworkRes, submissionsRes] = await Promise.all([
        apiFetch(`/api/homework?classId=${student.classId}`),
        apiFetch(`/api/submissions?studentId=${student.id}`).catch(() => null)
      ]);

      const homeworkData = await homeworkRes.json();
      setHomeworks(Array.isArray(homeworkData) ? homeworkData : []);

      if (submissionsRes && submissionsRes.ok) {
        const subsJson = await submissionsRes.json();
        setSubmissions(subsJson.data || []);
      } else {
        setSubmissions([]);
      }
    } catch (e) {
      console.error("Failed to fetch homework data", e);
    } finally {
      setLoading(false);
    }
  }, [student.id, student.classId]);

  useEffect(() => {
    fetchChildData();
  }, [fetchChildData]);

  const enrichedHomeworks: EnrichedHomework[] = useMemo(() => {
    const now = new Date();
    const subMap = new Map<string, StudentSubmission>();
    submissions.forEach((s) => subMap.set(s.assignmentId, s));

    return homeworks.map((a) => {
      const due = new Date(a.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const pastDue = diffDays < 0;

      const realSub = subMap.get(a.id);
      const isSubmitted = !!realSub;

      let status: HomeworkStatus;
      if (isSubmitted) status = "submitted";
      else if (pastDue) status = "overdue";
      else status = "active";

      let countdown: string;
      if (diffDays === 0) countdown = "Due today";
      else if (diffDays > 0) countdown = `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
      else countdown = `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} overdue`;

      return {
        ...a,
        status,
        countdown,
        daysLeft: diffDays,
        submitted: isSubmitted,
        submissionId: realSub?.id || null,
      };
    });
  }, [homeworks, submissions]);

  const filteredHomeworks = useMemo(() => {
    if (filterTab === "all") return enrichedHomeworks;
    return enrichedHomeworks.filter((a) => a.status === filterTab);
  }, [enrichedHomeworks, filterTab]);

  // Daily Diary filters
  const selectedDateHomeworks = useMemo(() => {
    if (!selectedDate) return [];
    return enrichedHomeworks.filter((a) => {
      if (!a.createdAt) return false;
      const d = new Date(a.createdAt);
      return (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      );
    });
  }, [enrichedHomeworks, selectedDate]);

  const dueSelectedDateHomeworks = useMemo(() => {
    if (!selectedDate) return [];
    return enrichedHomeworks.filter((a) => {
      const d = new Date(a.dueDate);
      const isDue = (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      );
      if (!isDue) return false;

      // Exclude if already shown in "Assigned Today" to prevent duplicate listing
      if (a.createdAt) {
        const c = new Date(a.createdAt);
        const isAssigned = (
          c.getFullYear() === selectedDate.getFullYear() &&
          c.getMonth() === selectedDate.getMonth() &&
          c.getDate() === selectedDate.getDate()
        );
        if (isAssigned) return false;
      }
      return true;
    });
  }, [enrichedHomeworks, selectedDate]);

  // Homework dates for calendar indicators
  const homeworkDays = useMemo(() => {
    return enrichedHomeworks
      .map((a) => {
        if (!a.createdAt) return null;
        const d = new Date(a.createdAt);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      })
      .filter(Boolean) as Date[];
  }, [enrichedHomeworks]);

  const counts = useMemo(() => ({
    all: enrichedHomeworks.length,
    active: enrichedHomeworks.filter((a) => a.status === "active").length,
    submitted: enrichedHomeworks.filter((a) => a.status === "submitted").length,
    overdue: enrichedHomeworks.filter((a) => a.status === "overdue").length,
  }), [enrichedHomeworks]);

  const getStatusBadge = (status: HomeworkStatus) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] font-bold shadow-none">Submitted</Badge>;
      case "active":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 text-[10px] font-bold shadow-none">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-0 text-[10px] font-bold shadow-none">Overdue</Badge>;
      default:
        return null;
    }
  };

  const getProgressValue = (status: HomeworkStatus) => {
    switch (status) {
      case "submitted": return 100;
      case "active": return 30;
      case "overdue": return 0;
      default: return 0;
    }
  };

  const getProgressColor = (status: HomeworkStatus) => {
    switch (status) {
      case "submitted": return "[&>div]:bg-emerald-500";
      case "active": return "[&>div]:bg-violet-500/70";
      case "overdue": return "[&>div]:bg-rose-500";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === "list" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <HomeworkSummaryCard label="Today's Homework" count={selectedDateHomeworks.length + dueSelectedDateHomeworks.length} icon={<FileText className="size-4" />} themeColor="violet" />
          <HomeworkSummaryCard label="Active" count={counts.active} icon={<Clock className="size-4" />} themeColor="amber" />
          <HomeworkSummaryCard label="Submitted" count={counts.submitted} icon={<CheckCircle2 className="size-4" />} themeColor="emerald" />
          <HomeworkSummaryCard label="Overdue" count={counts.overdue} icon={<AlertTriangle className="size-4" />} themeColor="red" />
        </div>
      )}

      <Card className="rounded-xl shadow-sm border-zinc-200/60 dark:border-zinc-800">
        <CardHeader className="pb-3 pt-5 flex flex-row items-center justify-between space-y-0 gap-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 tracking-tight">
            <FileText className="size-4 text-violet-500" />
            Homework Tracker & Diary
          </CardTitle>
          <div className="flex bg-violet-50/60 dark:bg-zinc-900 border border-violet-100/50 dark:border-zinc-800 p-0.5 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`text-xs gap-1.5 h-7 px-3 rounded-md transition-all shadow-none ${viewMode === "list" ? "bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-300 font-semibold shadow-xs" : "text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100"}`}
            >
              <List className="size-3.5" />
              List View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("diary")}
              className={`text-xs gap-1.5 h-7 px-3 rounded-md transition-all shadow-none ${viewMode === "diary" ? "bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-300 font-semibold shadow-xs" : "text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100"}`}
            >
              <CalendarIcon className="size-3.5" />
              Daily Diary
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 px-4 sm:px-5 pb-5">
          {viewMode === "list" ? (
            <div className="space-y-4">
              {/* Date Header / Selector for List View */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="text-left flex flex-col justify-center">
                  <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-stone-100">
                    {selectedDate ? format(selectedDate, "eeee") : "Select Date"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                    {selectedDate ? format(selectedDate, "MMM d, yyyy") : ""}
                  </p>
                </div>
                {/* Popover Calendar for list view */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      type="button"
                      className="h-8 text-[11px] font-bold px-3 bg-violet-50/60 dark:bg-zinc-900 border border-violet-100/50 dark:border-zinc-800 text-violet-700 dark:text-violet-300 hover:bg-violet-100/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <CalendarDays className="size-3.5 mr-1 text-violet-500" />
                      Select Date
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-stone-950 border border-zinc-200 dark:border-zinc-800" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      modifiers={{ hasHomework: homeworkDays }}
                      modifiersClassNames={{
                        hasHomework: "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:bg-violet-500 after:rounded-full font-bold text-violet-700"
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* List of homework for selected date */}
              <ScrollArea className="max-h-[500px] pr-3">
                {selectedDateHomeworks.length === 0 && dueSelectedDateHomeworks.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                    <FileText className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No homework found</p>
                    <p className="text-xs text-zinc-505 mt-1">
                      No homework assigned or due on this date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Assigned Today */}
                    {selectedDateHomeworks.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-violet-500" />
                          Assigned Today ({selectedDateHomeworks.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedDateHomeworks.map((a) => (
                            <ListHomeworkCard key={a.id} a={a} getStatusBadge={getStatusBadge} getProgressValue={getProgressValue} getProgressColor={getProgressColor} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Due Today */}
                    {dueSelectedDateHomeworks.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 dark:text-rose-450 mb-2 flex items-center gap-1.5 mt-2">
                          <span className="size-1.5 rounded-full bg-rose-500" />
                          Due Today ({dueSelectedDateHomeworks.length})
                        </h4>
                        <div className="space-y-2">
                          {dueSelectedDateHomeworks.map((a) => (
                            <ListHomeworkCard key={a.id} a={a} getStatusBadge={getStatusBadge} getProgressValue={getProgressValue} getProgressColor={getProgressColor} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <DailyDiaryPlanner
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              homeworkDays={homeworkDays}
              selectedDateAssignments={selectedDateHomeworks}
              dueSelectedDateAssignments={dueSelectedDateHomeworks}
              getStatusBadge={getStatusBadge}
              getProgressValue={getProgressValue}
              getProgressColor={getProgressColor}
              emptyMessage="No homework assigned or due on this date."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── List View Card Sub-component ─── */
function ListHomeworkCard({
  a,
  getStatusBadge,
  getProgressValue,
  getProgressColor,
}: {
  a: EnrichedHomework;
  getStatusBadge: (status: HomeworkStatus) => React.ReactNode;
  getProgressValue: (status: HomeworkStatus) => number;
  getProgressColor: (status: HomeworkStatus) => string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border bg-card hover:shadow-sm transition-all ${
        a.status === "overdue" ? "border-rose-100 dark:border-rose-950/40 bg-rose-50/10" :
        a.status === "submitted" ? "border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10" :
        "border-zinc-100 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{a.title}</h4>
            {getStatusBadge(a.status)}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] bg-muted/30 border-border shadow-none font-medium">{a.subjectName}</Badge>
            <Badge variant="outline" className="text-[10px] bg-muted/30 border-border shadow-none font-medium flex items-center gap-1">
              {a.mode === "online" ? <Globe className="size-2.5 text-sky-500" /> : <BookOpen className="size-2.5 text-amber-500" />}
              {a.mode === "online" ? "Online Submission" : "Offline Paper"}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">Assigned by {a.teacherName}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className={`size-3.5 ${a.status === "overdue" ? "text-rose-500" : "text-muted-foreground"}`} />
              <span className={a.status === "overdue" ? "text-rose-600 font-medium" : ""} suppressHydrationWarning>{a.countdown}</span>
            </div>
            <span suppressHydrationWarning>Due: {new Date(a.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-zinc-100/70 dark:border-zinc-800/60 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Progress Tracking</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{getProgressValue(a.status)}%</span>
        </div>
        <Progress value={getProgressValue(a.status)} className={`h-1 ${getProgressColor(a.status)}`} />
      </div>
    </div>
  );
}

/* ─── Summary Card Sub-component ─── */
function HomeworkSummaryCard({ label, count, icon, themeColor }: { label: string; count: number; icon: React.ReactNode; themeColor: "violet" | "amber" | "emerald" | "red" }) {
  const schemes = {
    violet: "from-violet-500 to-purple-600 text-violet-700 bg-violet-50 dark:bg-violet-950/20",
    amber: "from-amber-500 to-orange-500 text-amber-700 bg-amber-50 dark:bg-amber-950/20",
    emerald: "from-emerald-500 to-teal-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20",
    red: "from-rose-500 to-red-600 text-rose-700 bg-rose-50 dark:bg-rose-950/20",
  };
  const theme = schemes[themeColor];
  return (
    <Card className="rounded-xl shadow-none border-zinc-200/60 dark:border-zinc-800">
      <CardContent className="p-4 text-left flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.split(" ").slice(0,2).join(" ")} text-white shadow-xs`}>{icon}</div>
          <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{count}</span>
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground mt-2">{label} Homework</p>
      </CardContent>
    </Card>
  );
}

/* ─── Skeleton Loading ─── */
function HomeworkSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full max-w-[300px] rounded-md" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-[450px] rounded-xl" />
    </div>
  );
}
