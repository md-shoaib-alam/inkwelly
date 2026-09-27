"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface AttendanceChartProps {
  data: any[];
  isPremium?: boolean;
}

export function AttendanceChart({ data, isPremium }: AttendanceChartProps) {
  const { push } = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  return (
    <Card className="rounded-xl shadow-sm relative overflow-hidden border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader className="p-3 sm:p-4 pb-0">
        <div className="flex items-center gap-2 text-left">
          <Calendar className="size-4 sm:size-5 text-amber-600" />
          <CardTitle className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Monthly Attendance
          </CardTitle>
        </div>
        <CardDescription className="text-[10px] sm:text-xs text-left">
          Last 6 months breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 relative">
        <div className={`h-[200px] min-h-[200px] sm:h-64 sm:min-h-[256px] w-full transition-all duration-500 ${!isPremium ? "blur-[6px] pointer-events-none select-none opacity-40 scale-95" : ""}`}>
          {!recharts ? (
            <div className="size-full flex items-center justify-center">
              <div className="size-full animate-pulse bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg" />
            </div>
          ) : (
            (() => {
              const {
                Bar,
                BarChart,
                XAxis,
                YAxis,
                Tooltip,
                ResponsiveContainer,
                CartesianGrid,
              } = recharts;
              return (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={data}
                    barGap={1}
                    barCategoryGap="15%"
                  >
                    <defs>
                      <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                      className="dark:stroke-zinc-800/50"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={20}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.92)",
                        backdropFilter: "blur(8px)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                        padding: "10px 14px",
                      }}
                      labelStyle={{ color: "#9ca3af", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ color: "#f3f4f6", fontSize: "12px", fontWeight: "600", padding: "1px 0" }}
                    />
                    <Bar
                      dataKey="present"
                      fill="url(#presentGradient)"
                      radius={[3, 3, 0, 0]}
                      name="Present"
                    />
                    <Bar
                      dataKey="absent"
                      fill="url(#absentGradient)"
                      radius={[3, 3, 0, 0]}
                      name="Absent"
                    />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()
          )}
        </div>

        {!isPremium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50 shadow-xl w-full max-w-[240px] sm:max-w-xs animate-in zoom-in-95 duration-300">
              <div className="size-10 sm:size-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Calendar className="size-5 sm:size-6 text-amber-600" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Unlock Analytics</h4>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mb-3 sm:mb-4 px-2">
                6-month history and monthly trends are for Premium members.
              </p>
              <button 
                type="button"
                onClick={() => push(`/${slug}/subscription`)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] sm:text-xs font-bold py-2 sm:py-2.5 px-4 rounded-xl transition-all shadow-md shadow-amber-600/20 active:scale-95 uppercase tracking-wider"
              >
                Buy Premium
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
