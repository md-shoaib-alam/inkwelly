"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart3, GraduationCap } from "lucide-react";
import { SubjectAverage, gradeChartConfig } from "./types";
import { ChartSkeleton, TableSkeleton } from "./SummaryComponents";

export function AcademicReport() {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);
  const [gradeDistribution, setGradeDistribution] = useState<{ grade: string; count: number }[]>([]);
  const [subjectAverages, setSubjectAverages] = useState<SubjectAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await apiFetch("/api/reports/academics");
        if (!res.ok) throw new Error("Failed to fetch academic report");
        const data = await res.json();
        setGradeDistribution(data.gradeDistribution);
        setSubjectAverages(data.subjectAverages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  const getPerformanceColor = (avg: number, max: number) => {
    const pct = (avg / max) * 100;
    if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getPerformanceBadge = (avg: number, max: number) => {
    const pct = (avg / max) * 100;
    if (pct >= 80)
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
    if (pct >= 60)
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  };

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
        <CardContent className="p-6 text-center text-red-600 dark:text-red-400">
          <GraduationCap className="size-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Failed to load academic report</p>
          <p className="text-sm mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grade Distribution</CardTitle>
          <CardDescription>
            Number of students by grade across all subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !recharts ? (
            <ChartSkeleton />
          ) : subjectAverages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No grade data available</p>
            </div>
          ) : (
            <ChartContainer
              config={gradeChartConfig}
              className="h-[300px] w-full"
            >
              {(() => {
                const { BarChart, Bar, XAxis, YAxis, CartesianGrid } = recharts;
                return (
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="grade"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={52}
                    />
                  </BarChart>
                );
              })()}
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Subject-wise Average Performance
          </CardTitle>
          <CardDescription>
            Average marks, student count, and highest grade per subject
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={6} />
          ) : subjectAverages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No subject data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">
                      Students
                    </TableHead>
                    <TableHead className="text-center">Avg. Marks</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">
                      Max Marks
                    </TableHead>
                    <TableHead className="text-center">Highest Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectAverages.map((row) => (
                    <TableRow key={row.subject}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                            <GraduationCap className="size-3.5" />
                          </div>
                          {row.subject}
                        </div>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        {row.studentCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${getPerformanceColor(row.averageMarks, row.maxMarks)}`}
                        >
                          {row.averageMarks}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          / {row.maxMarks}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        {row.maxMarks}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`font-medium ${getPerformanceBadge(row.averageMarks, row.maxMarks)}`}
                        >
                          {row.highestGrade}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
