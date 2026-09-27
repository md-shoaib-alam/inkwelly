"use client";


import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  UserCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { StudentInfo, AttendanceRecord } from "@/lib/types";

interface MonthlyData {
  month: string;
  rate: number;
}

const chartConfig = {
  rate: { label: "Attendance %", color: "#8b5cf6" },
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function StudentAttendance() {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);
  const { currentUser } = useAppStore();
  const [calendarOffset, setCalendarOffset] = useState(0);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - calendarOffset);
    return d;
  }, [calendarOffset]);

  const periodLabel = useMemo(() => {
    try {
      return baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch (e) {
      return "";
    }
  }, [baseDate]);

  const { data: student, isPending: profileLoading } = useQuery({
    queryKey: ["students", "me"],
    queryFn: async () => {
      const res = await apiFetch("/api/students/me");
      if (!res.ok) throw new Error("Failed to fetch student profile");
      return (await res.json()) as StudentInfo;
    },
  });

  const { data: attendanceData = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", "mine", student?.id],
    enabled: !!student?.id,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "1000");
      const res = await apiFetch(`/api/attendance?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      const records = Array.isArray(data.records) ? data.records : [];
      return records.filter((a: AttendanceRecord) => a.studentId === student!.id) as AttendanceRecord[];
    },
  });

  const loading = profileLoading || attendanceLoading;

  const stats = useMemo(() => getAttendanceStats(attendanceData), [attendanceData]);
  const monthlyData = useMemo(() => getMonthlyData(attendanceData), [attendanceData]);
  const calendarData = useMemo(() => getCalendarData(attendanceData, baseDate), [attendanceData, baseDate]);

  if (loading) return <AttendanceSkeleton />;

  return (
    <div className="space-y-6 pb-10 animate-fade-in select-none">
      <div className="space-y-6 mt-2 animate-in fade-in duration-300" suppressHydrationWarning>
        <AttendanceStats 
          percentage={stats.percentage}
          present={stats.present}
          absent={stats.absent}
        />

        <TodayAttendanceCard records={attendanceData} />

        <div className="w-full">
          <AttendanceCalendar 
            data={calendarData} 
            isPremium={true}
            currentPeriod={periodLabel}
            onPrev={() => setCalendarOffset(prev => prev + 1)}
            onNext={() => setCalendarOffset(prev => Math.max(0, prev - 1))}
          />
        </div>
      </div>
    </div>
  );
}

// Reuse Parent components and utils by importing them or moving them to common location
import { AttendanceStats } from "../parent/attendance/AttendanceStats";
import { AttendanceChart } from "../parent/attendance/AttendanceChart";
import { AttendanceCalendar } from "../parent/attendance/AttendanceCalendar";
import { TodayAttendanceCard } from "../parent/attendance/TodayAttendanceCard";
import { AttendanceSkeleton } from "../parent/attendance/AttendanceSkeleton";
import { getAttendanceStats, getMonthlyData, getCalendarData } from "../parent/attendance/utils";
