"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AcademicsGrowthPoint } from "../../hooks/use-academics-command-center";

/**
 * Only enrolment and examinations are stamped with an academic year, so those are the two
 * series plotted. `Class`, `User` and `Subject` carry no year, so the reference's class /
 * teacher / subject trend lines cannot be reconstructed from this data.
 */
export function GrowthCard({
  sessions,
  points,
  loading,
}: {
  sessions: number;
  points: AcademicsGrowthPoint[];
  loading: boolean;
}) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const delta =
    points.length >= 2
      ? (() => {
          const first = points[0]?.students ?? 0;
          const last = points[points.length - 1]?.students ?? 0;
          if (!first) return null;
          return Math.round(((last - first) / first) * 100);
        })()
      : null;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-blue-600 dark:text-blue-400">
          <Activity className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">
          Session-over-session growth
        </span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {sessions} session{sessions === 1 ? "" : "s"}
          {delta !== null ? ` · ${delta > 0 ? "+" : ""}${delta}% enrolment` : ""}
        </span>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <Skeleton className="h-[212px] w-full rounded-lg" />
        ) : points.length === 0 ? (
          <div className="h-[212px] grid place-items-center">
            <p className="text-[12px] text-slate-400 dark:text-zinc-500">
              No students or examinations are tagged to an academic year yet.
            </p>
          </div>
        ) : (
          <div className="h-[212px] w-full">
            {recharts ? (
              (() => {
                const {
                  ResponsiveContainer,
                  LineChart,
                  Line,
                  XAxis,
                  YAxis,
                  CartesianGrid,
                  Tooltip,
                } = recharts;
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                      <XAxis
                        dataKey="year"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tickMargin={8}
                        tick={{ fill: "#64748B" }}
                      />
                      <YAxis
                        yAxisId="students"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tick={{ fill: "#64748B" }}
                        width={54}
                      />
                      <YAxis
                        yAxisId="exams"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tick={{ fill: "#94A3B8" }}
                        width={34}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 10px 30px rgba(2,6,23,.16)",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        yAxisId="students"
                        type="monotone"
                        dataKey="students"
                        name="Students"
                        stroke="#0D9488"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#0D9488" }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="exams"
                        type="monotone"
                        dataKey="exams"
                        name="Examinations"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={{ r: 3, fill: "#8B5CF6" }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 border-t border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-teal-600" />
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Students</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-violet-500" />
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Examinations</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-auto">
          Structure counts are not versioned per session
        </span>
      </div>
    </div>
  );
}
