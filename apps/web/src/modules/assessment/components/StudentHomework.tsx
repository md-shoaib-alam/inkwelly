"use client";


import { apiFetch } from "@/lib/api";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Star,
  Loader2,
  Globe,
  BookOpen,
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

const formatHomeworkDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function StudentHomework() {
  const { currentUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [homeworks, setHomeworks] = useState<AssignmentInfo[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [viewMode, setViewMode] = useState<"list" | "diary">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [mySubmissions, setMySubmissions] = useState<StudentSubmission[]>([]);

  const student = useMemo(
    () =>
      Array.isArray(students)
        ? students.find((s) => s.email === currentUser?.email) || null
        : null,
    [students, currentUser?.email],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/students/me");
      if (!res.ok) throw new Error("Failed to fetch student profile");
      const targetStudent = await res.json();
      
      setStudents([targetStudent]);

      if (targetStudent?.id) {
        const homeworkRes = await apiFetch(
          `/api/homework?classId=${targetStudent.classId}`,
        );
        const homeworkData = await homeworkRes.json();
        setHomeworks(homeworkData);

        // Fetch real submissions for this student
        try {
          const subRes = await apiFetch(
            `/api/submissions?studentId=${targetStudent.id}`,
          );
          if (subRes.ok) {
            const subJson = await subRes.json();
            setMySubmissions(subJson.data || []);
          }
        } catch {
          /* no submissions yet */
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Enrich homework with REAL submission status from the submissions API
  const enrichedHomeworks: EnrichedHomework[] = useMemo(() => {
    const now = new Date();
    // Build a map of assignmentId -> submission for quick lookup
    const subMap = new Map<string, StudentSubmission>();
    mySubmissions.forEach((s) => subMap.set(s.assignmentId, s));

    return homeworks.map((a) => {
      const due = new Date(a.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const pastDue = diffDays < 0;

      // Check if student has a REAL submission
      const realSub = subMap.get(a.id);
      const isSubmitted = !!realSub;

      let status: HomeworkStatus;
      if (isSubmitted) {
        status = "submitted";
      } else if (pastDue) {
        status = "overdue";
      } else {
        status = "active";
      }

      let countdown: string;
      if (diffDays === 0) {
        countdown = "Due today";
      } else if (diffDays > 0) {
        countdown = `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
      } else {
        countdown = `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} overdue`;
      }

      return {
        ...a,
        status,
        countdown,
        daysLeft: diffDays,
        submitted: isSubmitted,
        submissionId: realSub?.id || null,
      };
    });
  }, [homeworks, mySubmissions]);

  const filteredHomeworks = useMemo(() => {
    if (activeTab === "all") return enrichedHomeworks;
    return enrichedHomeworks.filter((a) => a.status === activeTab);
  }, [enrichedHomeworks, activeTab]);

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

  const homeworkDays = useMemo(() => {
    return enrichedHomeworks
      .map((a) => {
        if (!a.createdAt) return null;
        const d = new Date(a.createdAt);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      })
      .filter(Boolean) as Date[];
  }, [enrichedHomeworks]);

  const counts = useMemo(
    () => ({
      all: enrichedHomeworks.length,
      active: enrichedHomeworks.filter((a) => a.status === "active").length,
      submitted: enrichedHomeworks.filter((a) => a.status === "submitted")
        .length,
      overdue: enrichedHomeworks.filter((a) => a.status === "overdue").length,
    }),
    [enrichedHomeworks],
  );

  const handleSubmit = async (homework: EnrichedHomework) => {
    if (!student) return;
    setSubmittingId(homework.id);
    try {
      const res = await apiFetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: homework.id,
          studentId: student.id,
          status: "submitted",
        }),
      });
      if (res.ok) {
        toast.success("Homework Submitted!", {
          description: `"${homework.title}" has been submitted successfully.`,
        });
        // Refresh submissions
        try {
          const subRes = await apiFetch(
            `/api/submissions?studentId=${student.id}`,
          );
          if (subRes.ok) {
            const subJson = await subRes.json();
            setMySubmissions(subJson.data || []);
          }
        } catch {
          /* ignore */
        }
      } else {
        toast.error("Failed to submit homework");
      }
    } catch {
      toast.error("Failed to submit homework");
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status: HomeworkStatus) => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
            Submitted
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
            Overdue
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCountdownColor = (status: HomeworkStatus) => {
    switch (status) {
      case "submitted":
        return "text-emerald-600";
      case "active":
        return "text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400";
      case "overdue":
        return "text-red-600 dark:text-red-400 font-medium";
      default:
        return "text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400";
    }
  };

  const getProgressValue = (status: HomeworkStatus) => {
    switch (status) {
      case "submitted":
        return 100;
      case "active":
        return 30;
      case "overdue":
        return 0;
      default:
        return 0;
    }
  };

  const getProgressColor = (status: HomeworkStatus) => {
    switch (status) {
      case "submitted":
        return "[&>div]:bg-emerald-500";
      case "active":
        return "[&>div]:bg-violet-500";
      case "overdue":
        return "[&>div]:bg-red-500";
      default:
        return "";
    }
  };

  if (loading) return <HomeworkSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            My Homework
          </h2>
          <p className="text-sm text-zinc-505 dark:text-zinc-400 mt-0.5">
            Manage and track your school homework
          </p>
        </div>
        <div className="flex bg-violet-50/60 dark:bg-zinc-900 border border-violet-100/50 dark:border-zinc-800 p-0.5 rounded-lg w-fit">
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
      </div>

      {/* Summary Cards */}
      {viewMode === "list" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            label="Today's Homework"
            count={selectedDateHomeworks.length + dueSelectedDateHomeworks.length}
            icon={<FileText className="size-4" />}
            color="violet"
          />
          <SummaryCard
            label="Active"
            count={counts.active}
            icon={<Clock className="size-4" />}
            color="amber"
          />
          <SummaryCard
            label="Submitted"
            count={counts.submitted}
            icon={<CheckCircle2 className="size-4" />}
            color="emerald"
          />
          <SummaryCard
            label="Overdue"
            count={counts.overdue}
            icon={<AlertTriangle className="size-4" />}
            color="red"
          />
        </div>
      )}

      {/* Homework List / Diary Card */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className={`pb-3 ${viewMode === "diary" ? "hidden lg:block" : ""}`}>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-violet-500" />
            {viewMode === "list" ? "Homework List" : "My Daily Planner Diary"}
          </CardTitle>
        </CardHeader>
        <CardContent className={viewMode === "diary" ? "p-0 lg:p-6 lg:pt-0" : "px-4 py-4 sm:p-6 sm:pt-0"}>
          {viewMode === "list" ? (
            <div className="space-y-4">
              {/* Date Header / Selector for List View */}
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
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
              <ScrollArea className="max-h-150 pr-3">
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
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-violet-755 dark:text-violet-400 mb-2 flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-violet-500" />
                          Assigned Today ({selectedDateHomeworks.length})
                        </h4>
                        <div className="space-y-2.5">
                          {selectedDateHomeworks.map((a) => (
                            <ListHomeworkCard
                              key={a.id}
                              a={a}
                              getStatusBadge={getStatusBadge}
                              getCountdownColor={getCountdownColor}
                              getProgressValue={getProgressValue}
                              getProgressColor={getProgressColor}
                              onSubmit={handleSubmit}
                              submittingId={submittingId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Due Today */}
                    {dueSelectedDateHomeworks.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-rose-755 dark:text-rose-450 mb-2 flex items-center gap-1.5 mt-2">
                          <span className="size-1.5 rounded-full bg-rose-500" />
                          Due Today ({dueSelectedDateHomeworks.length})
                        </h4>
                        <div className="space-y-2.5">
                          {dueSelectedDateHomeworks.map((a) => (
                            <ListHomeworkCard
                              key={a.id}
                              a={a}
                              getStatusBadge={getStatusBadge}
                              getCountdownColor={getCountdownColor}
                              getProgressValue={getProgressValue}
                              getProgressColor={getProgressColor}
                              onSubmit={handleSubmit}
                              submittingId={submittingId}
                            />
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
              onSubmit={handleSubmit}
              submittingId={submittingId}
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
  getCountdownColor,
  getProgressValue,
  getProgressColor,
  onSubmit,
  submittingId,
}: {
  a: EnrichedHomework;
  getStatusBadge: (status: HomeworkStatus) => React.ReactNode;
  getCountdownColor: (status: HomeworkStatus) => string;
  getProgressValue: (status: HomeworkStatus) => number;
  getProgressColor: (status: HomeworkStatus) => string;
  onSubmit: (homework: EnrichedHomework) => void;
  submittingId: string | null;
}) {
  return (
    <div
      className={`p-4 rounded-xl border bg-card hover:shadow-sm transition-all ${
        a.status === "overdue" ? "border-rose-100 dark:border-rose-950/40 bg-rose-50/10" :
        a.status === "submitted" ? "border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10" :
        "border-zinc-100 dark:border-zinc-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-start justify-between gap-2 mb-1.5">
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
          <p className="text-[11px] text-muted-foreground mb-2">Teacher: {a.teacherName}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" suppressHydrationWarning>
              <Clock className={`size-3.5 ${getCountdownColor(a.status)}`} />
              <span className={getCountdownColor(a.status)} suppressHydrationWarning>{a.countdown}</span>
            </div>
            <span suppressHydrationWarning>Due: {formatHomeworkDate(a.dueDate)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 sm:ml-4 shrink-0 self-center sm:self-start">
          {a.status !== "submitted" && (
            <Button
              size="sm"
              onClick={() => onSubmit(a)}
              disabled={submittingId === a.id}
              className={`
                text-xs gap-1.5
                ${a.status === "overdue"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-violet-500 hover:bg-violet-600 text-white"
                }
              `}
            >
              {submittingId === a.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Submit
            </Button>
          )}
          {a.status === "submitted" && (
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1">
              <CheckCircle2 className="size-3" />
              Submitted
            </Badge>
          )}
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

/* ─── Summary Card ─── */
function SummaryCard({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-500 dark:bg-violet-600 text-white",
    amber: "bg-amber-500 dark:bg-amber-600 text-white",
    emerald: "bg-emerald-500 dark:bg-emerald-600 text-white",
    red: "bg-red-500 dark:bg-red-600 text-white",
  };
  const iconBg = colorMap[color] || colorMap.violet;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            {icon}
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {count}
          </p>
        </div>
        <p className="text-xs text-zinc-505 dark:text-zinc-400 mt-2">
          {label} Homework
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Skeleton ─── */
function HomeworkSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-44 mb-2" />
        <Skeleton className="h-4 w-60" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-130 rounded-xl" />
    </div>
  );
}
