"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useStudentDashboard } from "@/lib/graphql/hooks";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  TrendingUp,
  ClipboardList,
  Calendar,
  BookOpen,
  Clock,
  Bell,
  Star,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { ResultPublishedBanner } from "@/components/shared/result-published-banner";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString();
};

const getSlotStatus = (startTime: string, endTime: string) => {
  const now = new Date();
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  
  const slotStart = new Date(now);
  slotStart.setHours(startH, startM, 0, 0);
  
  const slotEnd = new Date(now);
  slotEnd.setHours(endH, endM, 0, 0);
  
  return {
    isCurrent: now >= slotStart && now <= slotEnd,
    isPast: now > slotEnd
  };
};

export function StudentDashboard() {
  const { push } = useRouter();
  const { slug } = useParams();
  const { currentUser, currentTenantName, currentTenantLogo } = useAppStore();
  const { data, isPending, fetchStatus, isError, error } = useStudentDashboard(
    currentUser?.email,
  );

  // In React Query v5, when enabled:false, isPending=true but fetchStatus='idle'
  const isActuallyLoading = isPending && fetchStatus === "fetching";

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load dashboard", { description: error?.message });
    }
  }, [isError, error]);

  // Simple fetch for student context (className, rollNumber)
  const [studentInfo, setStudentInfo] = useState<{
    className: string;
    rollNumber: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      apiFetch("/api/students/me")
        .then((r) => r.json())
        .then((s: any) => {
          if (s && s.id)
            setStudentInfo({
              className: s.className,
              rollNumber: s.rollNumber,
              name: s.name,
            });
        })
        .catch(() => { });
    }
  }, [currentUser?.email]);

  // Computed from GraphQL hook data
  const attendanceRate = data?.attendanceRate ?? 0;
  const avgGrade = data?.avgGrade ?? 0;
  const pendingAssignments = data?.pendingAssignments ?? 0;
  const today = new Date();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayName = dayNames[today.getDay()];
  const todayTimetable = (data?.todaySchedule ?? [])
    .filter((t) => t.day.toLowerCase() === todayName.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const recentGrades = (data?.recentGrades ?? []).slice(0, 5);
  const studentNotices = (data?.notices ?? []).filter(
    (n) => n.targetRole === "all" || n.targetRole === "student",
  );

  const getGreeting = () => {
    const h = today.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isActuallyLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 text-white shadow-md">
        <div className="absolute top-0 right-0 size-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="p-6 lg:p-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-inner">
                <img
                  src={currentTenantLogo || "/test.webp"}
                  alt={currentTenantName || ""}
                  className="size-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">
                  {studentInfo?.name || currentUser?.name || "Student"}
                </h2>
                <p className="text-violet-100/80 mt-0.5 text-xs sm:text-sm font-medium">
                  {studentInfo
                    ? `${studentInfo.className} • Roll ${studentInfo.rollNumber}`
                    : `Welcome to ${currentTenantName || "the school"}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 shrink-0 self-start sm:self-auto text-white" suppressHydrationWarning>
              <Calendar className="size-4" />
              <span className="text-sm font-medium">
                {today.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Published Notification */}
      <ResultPublishedBanner />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance"
          value={`${Number(attendanceRate).toFixed(2).replace(/\.00$/, "")}%`}
          icon={<UserCheck className="size-5" />}
          trend={attendanceRate >= 85 ? "Good" : "Needs Improvement"}
          trendUp={attendanceRate >= 85}
          color="violet"
        />
        <StatCard
          title="Average Grade"
          value={`${Number(avgGrade).toFixed(2).replace(/\.00$/, "")}%`}
          icon={<TrendingUp className="size-5" />}
          trend={
            avgGrade >= 75
              ? "Excellent"
              : avgGrade >= 60
                ? "Good"
                : "Needs Work"
          }
          trendUp={avgGrade >= 60}
          color="emerald"
        />
        <StatCard
          title="Homework"
          value={String(pendingAssignments || 0)}
          icon={<ClipboardList className="size-5" />}
          trend="Pending"
          trendUp={false}
          color="amber"
        />
        <StatCard
          title="Events"
          value={String(pendingAssignments || 0)}
          icon={<Calendar className="size-5" />}
          trend="Upcoming"
          trendUp={true}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <Card className="lg:col-span-2 rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-violet-500" />
                Today&apos;s Schedule
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {todayName.charAt(0).toUpperCase() + todayName.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todayTimetable.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                <BookOpen className="size-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No classes scheduled for today</p>
                <p className="text-xs mt-1">Enjoy your day off! 🎉</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[320px]">
                <div className="space-y-2">
                  {todayTimetable.map((slot) => {
                    const { isCurrent, isPast } = getSlotStatus(slot.startTime, slot.endTime);
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${isCurrent
                          ? "bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800"
                          : isPast
                            ? "bg-zinc-50 dark:bg-zinc-800/50 opacity-60"
                            : "bg-zinc-50 dark:bg-zinc-800/50 hover:bg-violet-50/50 dark:hover:bg-violet-900/20"
                          }`}
                        suppressHydrationWarning
                      >
                        <div className="flex-shrink-0 w-20 text-center">
                          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            {slot.startTime}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {slot.endTime}
                          </p>
                        </div>
                        <div
                          className={`w-0.5 h-10 rounded-full ${isCurrent ? "bg-violet-400" : "bg-zinc-200 dark:bg-zinc-700"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {slot.subjectName}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {slot.className}
                          </p>
                        </div>
                        {isCurrent && (
                          <Badge className="bg-violet-500 text-white text-[10px] px-2">
                            Live
                          </Badge>
                        )}
                        {isPast && (
                          <CheckCircle2 className="size-4 text-green-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-4 text-violet-500" />
              Recent Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentGrades.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                <GraduationCap className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No grades yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGrades.map((g) => {
                  const pct = Math.round((g.marks / g.maxMarks) * 100);
                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {g.subjectName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {g.examType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs font-semibold ${pct >= 80
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : pct >= 60
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            }`}
                        >
                          {g.grade || "N/A"}
                        </Badge>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {Number(g.marks).toFixed(2).replace(/\.00$/, "")}/{g.maxMarks}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-violet-500" />
            Announcements & Notices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentNotices.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 dark:text-zinc-500">
              <Bell className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No announcements</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentNotices.slice(0, 4).map((notice) => (
                <div
                  key={notice.id}
                  className={`p-4 rounded-lg border transition-colors hover:shadow-sm ${notice.priority === "urgent"
                    ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30"
                    : notice.priority === "important"
                      ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${notice.priority === "urgent"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : notice.priority === "important"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}
                        >
                          {notice.priority}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {notice.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {notice.content}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2" suppressHydrationWarning>
                        {notice.authorName} •{" "}
                        {formatDate(notice.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-600 dark:bg-violet-500",
    emerald: "bg-emerald-600 dark:bg-emerald-500",
    amber: "bg-amber-600 dark:bg-amber-500",
    blue: "bg-blue-600 dark:bg-blue-500",
  };
  const iconBg = colorMap[color] || "bg-zinc-600";

  return (
    <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg text-white ${iconBg}`}>{icon}</div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {title}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-[10px] font-medium ${trendUp ? "text-green-600" : "text-amber-600"}`}
          >
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Skeleton ─── */
function DashboardSkeleton() {
  return <FullPageSkeleton />;
}
