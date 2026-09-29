"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, MiniTile } from "./card";
import type {
  StudentsEnrolmentPoint,
  StudentsStats,
} from "../../hooks/use-students-command-center";

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toLocaleString()}`;

/**
 * How many students were on roll at the end of each month of the session. A student only
 * enters the series from their own admission month, so the curve cannot claim a child who
 * had not arrived yet — and a school with no admission date on a record simply is not in it.
 */
export function EnrolmentGrowthCard({
  enrolment,
  stats,
  loading,
}: {
  enrolment: StudentsEnrolmentPoint[];
  stats?: StudentsStats;
  loading: boolean;
}) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const points = enrolment.map((e) => ({ label: e.label, students: e.students }));
  const first = points[0];
  const admitted = stats?.admissions ?? 0;
  const withdrawn = stats?.withdrawals ?? 0;

  return (
    <Card
      title="Enrolment growth"
      subtitle="Active students across the session"
      icon={TrendingUp}
      tint="bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300"
      bodyClassName="px-5 pb-5 space-y-4"
    >
      {loading ? (
        <Skeleton className="h-[224px] w-full rounded-xl" />
      ) : (
        <>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              Active now
            </p>
            <p className="text-[34px] font-semibold leading-tight text-slate-900 dark:text-zinc-50 tabular-nums">
              {(stats?.total ?? 0).toLocaleString()}
            </p>
            {first && (
              <p className="text-[13px] text-slate-500 dark:text-zinc-400">
                from {first.students.toLocaleString()} in {first.label}
              </p>
            )}
          </div>

          <div className="h-[150px] w-full">
            {recharts ? (
              (() => {
                const {
                  ResponsiveContainer,
                  AreaChart,
                  Area,
                  XAxis,
                  YAxis,
                  Tooltip,
                } = recharts;
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="enrolmentFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0D9488" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
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
                        width={44}
                        tick={{ fill: "#94A3B8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 10px 30px rgba(2,6,23,.16)",
                          fontSize: 12,
                        }}
                        formatter={(value: unknown) => [Number(value ?? 0).toLocaleString(), "On roll"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="students"
                        stroke="#0D9488"
                        strokeWidth={2}
                        fill="url(#enrolmentFill)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()
            ) : (
              <Skeleton className="h-full w-full rounded-xl" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniTile value={signed(admitted)} label="Admitted" tone="teal" />
            <MiniTile
              value={signed(-withdrawn)}
              label="Withdrawn"
              tone="amber"
              title="Students who left during the session"
            />
            <MiniTile
              value={signed(admitted - withdrawn)}
              label="Net change"
              tone={admitted - withdrawn < 0 ? "rose" : "slate"}
            />
          </div>
        </>
      )}
    </Card>
  );
}
