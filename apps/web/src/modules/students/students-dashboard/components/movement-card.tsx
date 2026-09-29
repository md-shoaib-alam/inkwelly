"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  StudentsEnrolmentPoint,
  StudentsMovementPoint,
} from "../../hooks/use-students-command-center";

/**
 * One trailing year, not the session window: a school that admits in April and loses
 * students in June reads as a flat line if the chart only spans the months already elapsed,
 * and the months a session has not reached yet cannot be shown at all.
 */
export function MovementCard({
  movement,
  enrolment,
  loading,
}: {
  movement: StudentsMovementPoint[];
  enrolment: StudentsEnrolmentPoint[];
  loading: boolean;
}) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const points = movement.map((m) => {
    const enrolled = enrolment.find((e) => e.period === m.month)?.students ?? 0;
    return { label: m.label, admissions: m.admissions, withdrawals: -m.withdrawals, enrolled };
  });
  const net = points.reduce((sum, p) => sum + p.admissions + p.withdrawals, 0);

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-teal-600 dark:text-teal-400">
          <TrendingUp className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">
          Movement and enrolment
        </span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · last {points.length} months · {net >= 0 ? "+" : ""}
          {net.toLocaleString()} net
        </span>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <Skeleton className="h-[212px] w-full rounded-lg" />
        ) : points.length === 0 ? (
          <div className="h-[212px] grid place-items-center">
            <p className="text-[12px] text-slate-400 dark:text-zinc-500">
              No student carries an admission date this side of the trailing year.
            </p>
          </div>
        ) : (
          <div className="h-[212px] w-full">
            {recharts ? (
              (() => {
                const {
                  ResponsiveContainer,
                  ComposedChart,
                  Bar,
                  Line,
                  XAxis,
                  YAxis,
                  CartesianGrid,
                  Tooltip,
                  ReferenceLine,
                } = recharts;
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={points} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tickMargin={8}
                        tick={{ fill: "#64748B" }}
                      />
                      <YAxis
                        yAxisId="movement"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tick={{ fill: "#64748B" }}
                        width={44}
                      />
                      <YAxis
                        yAxisId="enrolment"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tick={{ fill: "#94A3B8" }}
                        width={44}
                      />
                      <ReferenceLine yAxisId="movement" y={0} stroke="#CBD5E1" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 10px 30px rgba(2,6,23,.16)",
                          fontSize: 12,
                        }}
                        formatter={(value: unknown, name: string) => [
                          Math.abs(Number(value ?? 0)).toLocaleString(),
                          name,
                        ]}
                      />
                      <Bar
                        yAxisId="movement"
                        dataKey="admissions"
                        name="Admitted"
                        fill="#0D9488"
                        radius={[3, 3, 0, 0]}
                        barSize={12}
                      />
                      <Bar
                        yAxisId="movement"
                        dataKey="withdrawals"
                        name="Withdrawn"
                        fill="#F43F5E"
                        radius={[0, 0, 3, 3]}
                        barSize={12}
                      />
                      <Line
                        yAxisId="enrolment"
                        type="monotone"
                        dataKey="enrolled"
                        name="Enrolment"
                        stroke="#0EA5E9"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </ComposedChart>
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
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Admitted</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-rose-500" />
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Withdrawn</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-sky-500" />
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Enrolment</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-auto">
          Withdrawals are drawn below the axis
        </span>
      </div>
    </div>
  );
}
