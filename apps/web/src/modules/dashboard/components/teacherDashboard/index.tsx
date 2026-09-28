"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { useTeacherDashboard } from "@/lib/graphql/hooks";
import { toast } from "sonner";
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import {
  Bell,
  Calendar,
  Clock,
  School,
  UserCheck,
  ClipboardList,
  BookOpen,
  History,
  CalendarDays,
  TicketCheck,
  QrCode,
} from "lucide-react";

import { ComprehensiveDashboard } from "./ComprehensiveDashboard";
import { MinimalDashboard } from "./MinimalDashboard";

const SELF_ATTENDANCE_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  leave: "Leave",
  holiday: "Holiday",
  half_day: "Half day",
  not_marked: "Not marked",
};

const formatTime = (time: string) => {
  try {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${minutes} ${ampm}`;
  } catch (e) {
    return time;
  }
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

import { actionKeywords } from "@/components/layout/dashboard-keywords";

export function TeacherDashboard() {
  const { push } = useRouter();
  const { currentUser, currentTenantSlug, currentTenantId, setCurrentScreen } = useAppStore();
  const [layoutPref, setLayoutPref] = useState<string>("comprehensive");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pref = localStorage.getItem("schoolsaas_dashboard_layout_preference");
      if (pref) setLayoutPref(pref);
    }

    const handlePrefChange = (e: any) => {
      if (e.detail) setLayoutPref(e.detail);
    };

    window.addEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
    return () => {
      window.removeEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
    };
  }, []);

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    const tid = currentTenantSlug || currentTenantId || currentUser?.tenantSlug || currentUser?.tenantId;
    if (tid) {
      push(`/${tid}/${screen}`);
    } else {
      push(`/${screen}`);
    }
  };

  const { data, isPending, fetchStatus, isError, error } = useTeacherDashboard(
    currentUser?.name || "",
    // Only run the query hook when the layout preference is comprehensive
    { enabled: layoutPref === "comprehensive" } as any
  );

  // In React Query v5, when enabled:false, isPending=true but fetchStatus='idle'
  const isActuallyLoading = isPending && fetchStatus === 'fetching';

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load dashboard", { description: error?.message });
    }
  }, [isError, error]);

  const allTeacherQuickActions = [
    {
      label: "Scan Attendance QR",
      icon: <QrCode className="size-5" />,
      screen: "my-attendance",
      color: "bg-indigo-600 hover:bg-indigo-700",
      keywords: ["qr", "scan", "punch", "check in", "attendance"],
    },
    {
      label: "My Classes",
      icon: <School className="size-5" />,
      screen: "my-classes",
      color: "bg-violet-500 hover:bg-violet-600",
    },
    {
      label: "My Subjects",
      icon: <BookOpen className="size-5" />,
      screen: "my-subjects",
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      label: "Attendance",
      icon: <UserCheck className="size-5" />,
      screen: "take-attendance",
      color: "bg-sky-500 hover:bg-sky-600",
    },
    {
      label: "Assessments",
      icon: <ClipboardList className="size-5" />,
      screen: "assessments",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "School Exams",
      icon: <BookOpen className="size-5" />,
      screen: "school-exams",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Active Homework",
      icon: <ClipboardList className="size-5" />,
      screen: "homework",
      color: "bg-indigo-600 hover:bg-indigo-700",
      keywords: ["assignment", "task", "project"],
    },
    {
      label: "Old Homework",
      icon: <History className="size-5" />,
      screen: "old-homework",
      color: "bg-zinc-600 hover:bg-zinc-700",
      keywords: ["history", "assignment", "submitted"],
    },
    {
      label: "My Leaves",
      icon: <CalendarDays className="size-5" />,
      screen: "leaves",
      color: "bg-rose-500 hover:bg-rose-600",
      keywords: ["time off", "vacation", "holiday"],
    },
    {
      label: "Timetable",
      icon: <Clock className="size-5" />,
      screen: "timetable",
      color: "bg-emerald-500 hover:bg-emerald-600",
      keywords: ["schedule", "routine", "period"],
    },
    {
      label: "Notices",
      icon: <Bell className="size-5" />,
      screen: "notices",
      color: "bg-amber-500 hover:bg-amber-600",
    },
    {
      label: "Calendar",
      icon: <Calendar className="size-5" />,
      screen: "calendar",
      color: "bg-rose-600 hover:bg-rose-700",
    },
    {
      label: "Support Tickets",
      icon: <TicketCheck className="size-5" />,
      screen: "tickets",
      color: "bg-cyan-500 hover:bg-cyan-600",
      keywords: ["issues", "complaints", "helpdesk"],
    },
  ];

  const filteredQuickActions = allTeacherQuickActions.filter((action) => {
    const query = searchQuery.toLowerCase();
    const labelMatch = action.label.toLowerCase().includes(query);
    const kws = actionKeywords[action.screen] || [];
    const keywordsMatch = kws.some((kw) => kw.toLowerCase().includes(query));
    return labelMatch || keywordsMatch;
  });

  if (layoutPref === "minimal") {
    return (
      <MinimalDashboard
        filteredQuickActions={filteredQuickActions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        navigateTo={navigateTo}
      />
    );
  }

  if (isActuallyLoading) {
    return <FullPageSkeleton />;
  }

  const classes = data?.classes ?? [];
  const subjects = data?.subjects ?? [];
  const totalStudents = data?.totalStudents ?? 0;
  const pendingAssignments = data?.pendingAssignments ?? 0;
  const todaySchedule = data?.todaySchedule ?? [];
  const assignments = data?.recentAssignments ?? [];

  // The teacher's own attendance for today, not their class's student attendance rate.
  const todayAttendanceLabel =
    SELF_ATTENDANCE_LABELS[data?.todaySelfAttendance?.status ?? 'not_marked'] ?? 'Not marked';

  return (
    <ComprehensiveDashboard
      classes={classes}
      subjects={subjects}
      totalStudents={totalStudents}
      pendingAssignments={pendingAssignments}
      todaySchedule={todaySchedule}
      todayAttendanceLabel={todayAttendanceLabel}
      assignments={assignments}
      currentUser={currentUser}
      formatTime={formatTime}
      formatDate={formatDate}
      navigateTo={navigateTo}
    />
  );
}
