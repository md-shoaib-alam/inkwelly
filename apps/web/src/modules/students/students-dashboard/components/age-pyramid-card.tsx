"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentsAgeBand } from "../../hooks/use-students-command-center";

/**
 * Boys and girls per band, from `Student.dateOfBirth` against today. A band with no one in
 * it is still drawn: an empty 3-5 row in a school that starts at Grade 1 is a fact about the
 * school, not a gap in the data.
 */
export function AgePyramidCard({
  bands,
  unknown,
  loading,
}: {
  bands: StudentsAgeBand[];
  unknown: number;
  loading: boolean;
}) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const rows = bands.map((b) => ({ band: b.band, boys: b.boys, girls: b.girls }));
  const tracked = rows.reduce((sum, r) => sum + r.boys + r.girls, 0);

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-violet-600 dark:text-violet-400">
          <BarChart3 className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Age spread</span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {tracked.toLocaleString()} with a date of birth
        </span>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <Skeleton className="h-[212px] w-full rounded-lg" />
        ) : tracked === 0 ? (
          <div className="h-[212px] grid place-items-center px-6 text-center">
            <p className="text-[12px] text-slate-400 dark:text-zinc-500">
              {unknown > 0
                ? `None of the ${unknown.toLocaleString()} students on roll has a date of birth, so there is no age to plot.`
                : "No students on roll yet."}
            </p>
          </div>
        ) : (
          <div className="h-[212px] w-full">
            {recharts ? (
              (() => {
                const {
                  ResponsiveContainer,
                  BarChart,
                  Bar,
                  XAxis,
                  YAxis,
                  CartesianGrid,
                  Tooltip,
                  Legend,
                } = recharts;
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rows}
                      layout="vertical"
                      margin={{ top: 0, right: 12, left: -6, bottom: 0 }}
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.6} />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tick={{ fill: "#64748B" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="band"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        width={48}
                        tick={{ fill: "#64748B" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 10px 30px rgba(2,6,23,.16)",
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={18}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="boys" name="Boys" fill="#0EA5E9" radius={[0, 3, 3, 0]} barSize={9} />
                      <Bar dataKey="girls" name="Girls" fill="#8B5CF6" radius={[0, 3, 3, 0]} barSize={9} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()
            ) : null}
          </div>
        )}
      </div>

      {!loading && unknown > 0 && (
        <p className="px-4 pb-3 text-[11px] text-slate-400 dark:text-zinc-500">
          {unknown.toLocaleString()} students are missing from this chart because no date of
          birth is on their record.
        </p>
      )}
    </div>
  );
}
