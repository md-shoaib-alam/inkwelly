"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const attendanceChartConfig = {
  rate: { label: "Attendance Rate (%)", color: "#10b981" },
} satisfies ChartConfig;

interface AttendanceTrendProps {
  isLoading: boolean;
  data: any[];
  recharts: any;
}

export function AttendanceTrend({ isLoading, data, recharts }: AttendanceTrendProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayData = isMobile ? (data ?? []).slice(-3) : (data ?? []);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="size-4 text-teal-600" />
          Monthly Attendance Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pl-2 sm:pl-6">
        {isLoading || !recharts ? (
          <Skeleton className="h-70 w-full" />
        ) : (
          (() => {
            const { BarChart, Bar, XAxis, YAxis, CartesianGrid } = recharts;
            return (
              <ChartContainer config={attendanceChartConfig} className="h-70 w-full">
                <BarChart data={displayData} margin={{ left: -5, right: 5, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} fontSize={12} unit="%" width={isMobile ? 40 : 45} />
                  <ChartTooltip 
                    cursor={{ stroke: "rgba(255, 255, 255, 0.35)", strokeDasharray: "3 3", strokeWidth: 1.5 }}
                    content={<ChartTooltipContent />} 
                  />
                  <Bar dataKey="rate" fill="var(--color-rate)" radius={[6, 6, 0, 0]} maxBarSize={48} className="cursor-pointer" />
                </BarChart>
              </ChartContainer>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}
