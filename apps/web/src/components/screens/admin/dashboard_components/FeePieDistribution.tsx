"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const feePieChartConfig = {
  collected: { label: "Collected Amount", color: "#10b981" },
} satisfies ChartConfig;

const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
];

interface FeePieDistributionProps {
  isLoading: boolean;
  data: any[];
  recharts: any;
}

export function FeePieDistribution({ isLoading, data, recharts }: FeePieDistributionProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  
  // Get current month name (e.g., "June")
  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  // Filter out items with 0 collected to keep chart clean, and map for display
  const pieData = (data ?? [])
    .map(item => ({
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      value: Number(item.collected || 0),
    }))
    .filter(item => item.value > 0);

  return (
    <Card className="hidden lg:block">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <IndianRupee className="size-4 text-emerald-600" />
            Fee Revenue Breakdown
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200/40 dark:border-emerald-800/30">
            {currentMonthName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pb-3 sm:pb-4">
        {isLoading || !recharts ? (
          <Skeleton className="h-70 w-full" />
        ) : pieData.length === 0 ? (
          <div className="h-70 flex items-center justify-center text-sm text-muted-foreground">
            No fee collection data available
          </div>
        ) : (
          (() => {
            const { PieChart, Pie, Cell } = recharts;
            const totalVal = pieData.reduce((sum, item) => sum + item.value, 0);
            return (
              <div className="flex flex-col">
                <ChartContainer config={feePieChartConfig} className="h-55 w-full">
                  <PieChart margin={{ left: 24, right: 24, top: 10, bottom: 10 }}>
                    <Pie
                       data={pieData}
                       cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={2}
                       dataKey="value" nameKey="name"
                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                       labelLine={{ stroke: "rgba(100, 116, 139, 0.5)", strokeDasharray: "2 2" }}
                       fontSize={10}
                       onMouseEnter={(_, index) => setActiveIndex(index)}
                       onMouseLeave={() => setActiveIndex(-1)}
                       isAnimationActive={false}
                    >
                      {pieData.map((entry, i) => (
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
                          formatter={(value) => `₹${Number(value).toLocaleString()}`}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>

                <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-2 w-full">
                  {pieData.map((entry, i) => {
                    const percentage = totalVal > 0 ? ((entry.value / totalVal) * 100).toFixed(0) : 0;
                    return (
                      <div 
                        key={entry.name} 
                        className={cn(
                          "flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/30 dark:bg-muted/5 border transition-all duration-300",
                          activeIndex === i ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/5" : "border-border/30 hover:border-border/60"
                        )}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(-1)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs font-semibold text-foreground truncate">{entry.name}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 shrink-0 ml-2">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{entry.value.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}

