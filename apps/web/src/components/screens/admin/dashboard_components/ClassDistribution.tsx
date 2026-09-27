"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const pieChartConfig = {
  students: { label: "Students", color: "#10b981" },
} satisfies ChartConfig;

const COLORS = [
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
  "#34d399",
  "#6ee7b7",
  "#a7f3d0",
  "#d1fae5",
];

interface ClassDistributionProps {
  isLoading: boolean;
  data: any[];
  recharts: any;
  maleStudents?: number;
  femaleStudents?: number;
}

export function ClassDistribution({ isLoading, data, recharts, maleStudents = 0, femaleStudents = 0 }: ClassDistributionProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <Card className="hidden lg:flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="size-4 text-cyan-600" />
          Class Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pb-3 sm:pb-4 flex-1 flex flex-col justify-between">
        {isLoading || !recharts ? (
          <Skeleton className="h-75 w-full" />
        ) : (
          (() => {
            const { PieChart, Pie, Cell } = recharts;
            
            // Group sections by main class name
            const groupedDataMap = (data ?? []).reduce((acc: Record<string, number>, item: any) => {
              const className = item.name.split("-")[0].trim();
              acc[className] = (acc[className] || 0) + Number(item.students || 0);
              return acc;
            }, {});

            const groupedData = Object.entries(groupedDataMap)
              .map(([name, students]) => ({ name, students }))
              .filter(item => item.students > 0)
              .sort((a, b) => {
                const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
                const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
                return numA - numB;
              });

            const COLORS = [
              "#10b981", // emerald
              "#06b6d4", // cyan
              "#3b82f6", // blue
              "#6366f1", // indigo
              "#8b5cf6", // violet
              "#a855f7", // purple
              "#f43f5e", // rose
              "#f59e0b", // amber
            ];

            const totalStudents = groupedData.reduce((sum, item) => sum + item.students, 0);

            return (
              <div className="flex flex-col justify-between flex-grow w-full">
                <ChartContainer config={pieChartConfig} className="h-55 w-full mb-2">
                  <PieChart margin={{ left: 24, right: 24, top: 10, bottom: 10 }}>
                    <Pie
                      data={groupedData}
                      cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={2}
                      dataKey="students" nameKey="name"
                      label={({ name }) => name}
                      labelLine={{ stroke: "rgba(100, 116, 139, 0.5)", strokeDasharray: "2 2" }}
                      fontSize={10}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      isAnimationActive={false}
                    >
                      {groupedData.map((entry, i) => (
                        <Cell 
                          key={entry.name} 
                          fill={COLORS[i % COLORS.length]} 
                          className="cursor-pointer focus:outline-none transition-opacity duration-300"
                          style={{
                            opacity: activeIndex === -1 || activeIndex === i ? 1 : 0.3,
                          }}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value) => `${Number(value).toLocaleString()} Students`}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>

                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-around w-full">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Students</span>
                    <span className="text-sm sm:text-base font-bold mt-1 text-cyan-600 dark:text-cyan-400">{totalStudents}</span>
                  </div>
                  <div className="h-8 w-px bg-border/60" />
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Male</span>
                    <span className="text-sm sm:text-base font-bold mt-1 text-blue-600 dark:text-blue-400">{maleStudents}</span>
                  </div>
                  <div className="h-8 w-px bg-border/60" />
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Female</span>
                    <span className="text-sm sm:text-base font-bold mt-1 text-pink-600 dark:text-pink-400">{femaleStudents}</span>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}
