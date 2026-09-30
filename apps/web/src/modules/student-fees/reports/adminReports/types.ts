import { ClassInfo, GradeRecord, FeeRecord } from "@/lib/types";
import { ChartConfig } from "@/components/ui/chart";

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

export const gradeChartConfig = {
  count: { label: "Students", color: "#8b5cf6" },
} satisfies ChartConfig;

export const feeBreakdownConfig = {
  collected: { label: "Collected", color: "#10b981" },
  pending: { label: "Pending", color: "#f59e0b" },
} satisfies ChartConfig;
