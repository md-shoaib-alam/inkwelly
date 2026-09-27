"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const feeChartConfig = {
  amount: { label: "Revenue Collected", color: "#10b981" },
} satisfies ChartConfig;

interface FeeCollectionProps {
  isLoading: boolean;
  data: any[];
  recharts: any;
}

export function FeeCollection({ isLoading, data, recharts }: FeeCollectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayData = isMobile ? (data ?? []).slice(-3) : (data ?? []);

  return (
    <Card className="lg:col-span-2 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <IndianRupee className="size-4 text-emerald-600" />
          Monthly Fee Revenue Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pl-2 sm:pl-6 pb-3 sm:pb-4 flex-1 flex flex-col justify-between">
        {isLoading || !recharts ? (
          <Skeleton className="h-70 w-full" />
        ) : (
          (() => {
            const { BarChart, Bar, XAxis, YAxis, CartesianGrid } = recharts;
            
            // Calculate statistical highlights
            const totalCollected = (data ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
            const currentMonthData = (data ?? []).slice(-1)[0];
            const currentMonthRev = currentMonthData ? Number(currentMonthData.amount || 0) : 0;
            const maxMonthData = (data ?? []).reduce(
              (max, item) => Number(item.amount || 0) > Number(max.amount || 0) ? item : max,
              { month: "N/A", amount: 0 }
            );

            return (
              <div className="flex flex-col justify-between grow w-full">
                <ChartContainer config={feeChartConfig} className="h-75 w-full mb-2">
                  <BarChart data={displayData} margin={{ left: -5, right: 5, top: 5, bottom: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tickMargin={16} />
                    <YAxis 
                      domain={[0, 125000]} 
                      ticks={[0, 25000, 50000, 75000, 100000, 125000]} 
                      tickLine={false} 
                      axisLine={false} 
                      fontSize={12} 
                      unit="" 
                      tickFormatter={(v) => v >= 125000 ? `₹${(v / 1000).toFixed(0)}k+` : `₹${(v / 1000).toFixed(0)}k`}
                      width={isMobile ? 45 : 55} 
                    />
                    <ChartTooltip 
                      cursor={{ stroke: "rgba(255, 255, 255, 0.35)", strokeDasharray: "3 3", strokeWidth: 1.5 }}
                      content={
                        <ChartTooltipContent 
                          formatter={(value, name, item) => (
                            <>
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{
                                  backgroundColor: item.color || "var(--color-amount)",
                                }}
                              />
                              <div className="flex flex-1 justify-between items-center gap-4 leading-none">
                                <span className="text-muted-foreground">Revenue Collected</span>
                                <span className="font-mono font-medium text-foreground">
                                  ₹{Number(value).toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                        />
                      } 
                    />
                    <Bar dataKey="amount" fill="var(--color-amount)" radius={[6, 6, 0, 0]} maxBarSize={48} className="cursor-pointer" />
                  </BarChart>
                </ChartContainer>

                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-around w-full">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Collected</span>
                    <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{totalCollected.toLocaleString()}</span>
                  </div>
                  <div className="h-8 w-px bg-border/60" />
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Current Month</span>
                    <span className="text-sm sm:text-base font-bold text-foreground mt-1">₹{currentMonthRev.toLocaleString()}</span>
                  </div>
                  <div className="h-8 w-px bg-border/60" />
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Peak Month</span>
                    <span className="text-sm sm:text-base font-bold text-foreground mt-1">
                      ₹{Number(maxMonthData.amount || 0).toLocaleString()}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">({maxMonthData.month})</span>
                    </span>
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
