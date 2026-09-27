import { ClassInfo, AttendanceRecord, GradeRecord, FeeRecord } from "@/lib/types";
import { ChartConfig } from "@/components/ui/chart";

export interface AttendanceSummary {
  present: number;
  absent: number;
  total: number;
  presentPct: string;
  absentPct: string;
}

export interface DailyAttendance {
  date: string;
  present: number;
  absent: number;
}

export interface SubjectAverage {
  subject: string;
  averageMarks: number;
  maxMarks: number;
  studentCount: number;
  highestGrade: string;
}

export interface FeeSummary {
  totalFees: number;
  collected: number;
  pending: number;
}

export interface FeeTypeBreakdown {
  type: string;
  collected: number;
  pending: number;
}

export const attendanceChartConfig = {
  present: { label: "Present", color: "#10b981" },
  absent: { label: "Absent", color: "#ef4444" },
} satisfies ChartConfig;

export const gradeChartConfig = {
  count: { label: "Students", color: "#8b5cf6" },
} satisfies ChartConfig;

export const feeBreakdownConfig = {
  collected: { label: "Collected", color: "#10b981" },
  pending: { label: "Pending", color: "#f59e0b" },
} satisfies ChartConfig;
