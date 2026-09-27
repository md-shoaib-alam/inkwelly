"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart3, ChevronDown } from "lucide-react";
import { DashboardData, growthChartConfig } from "./types";

interface GrowthChartsProps {
  loading: boolean;
  data: DashboardData | undefined;
}

export function GrowthCharts({ loading, data }: GrowthChartsProps) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  // Format monthly data for bar chart
  const chartData = data?.monthlyData || [
    { month: "Apr", newTenants: 45, newUsers: 80 },
    { month: "May", newTenants: 60, newUsers: 110 },
    { month: "Jun", newTenants: 75, newUsers: 135 },
    { month: "Jul", newTenants: 85, newUsers: 120 },
    { month: "Aug", newTenants: 110, newUsers: 155 },
    { month: "Sep", newTenants: 145, newUsers: 185 },
  ];

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="size-3.5" />
            </div>
            Platform Insights
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Growth over the last 6 months
          </CardDescription>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
          Last 6 Months <ChevronDown className="size-3 text-slate-400" />
        </div>
      </CardHeader>

      <CardContent className="pt-2 flex-1 flex flex-col justify-between">
        {loading || !recharts ? (
          <div className="space-y-4">
            <div className="h-[210px] w-full flex items-end justify-between px-4 pb-4 pt-6 gap-3 border-b border-slate-100 dark:border-slate-800">
              {[45, 60, 75, 55, 90, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="flex items-end gap-1.5 w-full justify-center h-full">
                    <Skeleton
                      className="w-3 rounded-t-md"
                      style={{ height: `${Math.max(20, h * 0.6)}%` }}
                    />
                    <Skeleton
                      className="w-3 rounded-t-md"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <Skeleton className="h-3 w-6 rounded-sm" />
                </div>
              ))}
            </div>

            {/* Skeleton Legend */}
            <div className="flex items-center justify-center gap-6 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ChartContainer
              config={growthChartConfig}
              className="h-[210px] w-full"
            >
              {(() => {
                const { BarChart, Bar, XAxis, YAxis, CartesianGrid } = recharts;
                return (
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickMargin={8}
                      tick={{ fill: "#64748B" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickMargin={8}
                      tick={{ fill: "#64748B" }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="rounded-xl border-none shadow-xl"
                          formatter={(value, name) => {
                            return [value, name === 'newTenants' ? 'New Schools' : 'New Users'];
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="newTenants"
                      name="newTenants"
                      fill="#60A5FA" // Light blue
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                    <Bar
                      dataKey="newUsers"
                      name="newUsers"
                      fill="#2563EB" // Deep primary blue
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                );
              })()}
            </ChartContainer>

            {/* Custom Legend matching reference image */}
            <div className="flex items-center justify-center gap-6 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-[#60A5FA]" />
                <span className="font-medium text-slate-600 dark:text-slate-400">New Schools</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-[#2563EB]" />
                <span className="font-medium text-slate-600 dark:text-slate-400">New Users</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
