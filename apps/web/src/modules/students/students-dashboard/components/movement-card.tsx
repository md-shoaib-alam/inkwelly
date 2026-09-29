"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Repeat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, MiniTile } from "./card";
import { useTenantHref } from "../../hooks/use-tenant-href";
import type {
  StudentsMovementPoint,
  StudentsStats,
} from "../../hooks/use-students-command-center";

/**
 * Admissions and withdrawals month by month, inside the session the school is running.
 * A move between two classes of the same school is neither of those, so it is not counted
 * here — the header links to the screen that does that work, and the tile that would hold
 * it says so rather than showing a number nothing measures.
 */
export function MovementCard({
  movement,
  stats,
  reasons,
  loading,
}: {
  movement: StudentsMovementPoint[];
  stats?: StudentsStats;
  reasons: Record<string, string>;
  loading: boolean;
}) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);
  const tenantHref = useTenantHref();

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const points = movement.map((m) => ({
    label: m.label,
    Admissions: m.admissions,
    Withdrawals: m.withdrawals,
  }));
  const transfersReason = reasons["transfers"] ?? "No table records a class move on its own.";

  return (
    <Card
      title="Movement this session"
      subtitle="Admissions vs withdrawals by month"
      icon={Repeat}
      tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
      bodyClassName="px-5 pb-5 space-y-4"
      trailing={
        <a
          href={tenantHref("class-change")}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
        >
          Transfers
          <ArrowUpRight className="size-3.5" />
        </a>
      }
    >
      {loading ? (
        <Skeleton className="h-[224px] w-full rounded-xl" />
      ) : (
        <>
          <div className="h-[150px] w-full">
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
                } = recharts;
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={points}
                      margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
                      barGap={3}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                        opacity={0.6}
                      />
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
                        allowDecimals={false}
                        tick={{ fill: "#94A3B8" }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(148,163,184,0.08)" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 10px 30px rgba(2,6,23,.16)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="Admissions" fill="#0D9488" radius={[3, 3, 0, 0]} barSize={10} />
                      <Bar dataKey="Withdrawals" fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()
            ) : (
              <Skeleton className="h-full w-full rounded-xl" />
            )}
          </div>

          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-teal-600" />
              <span className="text-[12px] font-medium text-slate-500 dark:text-zinc-400">
                Admissions
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-[12px] font-medium text-slate-500 dark:text-zinc-400">
                Withdrawals
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniTile
              value={(stats?.admissions ?? 0).toLocaleString()}
              label="Admissions"
              tone="teal"
            />
            <MiniTile
              value={(stats?.withdrawals ?? 0).toLocaleString()}
              label="Withdrawals"
              tone="amber"
            />
            <MiniTile
              value={<ArrowRight className="size-4" />}
              label="Transferred in"
              soon
              title={transfersReason}
            />
            <MiniTile
              value={(stats?.promoted ?? 0).toLocaleString()}
              label="Promoted"
              tone="emerald"
              title="Completed promotions inside this session"
            />
          </div>
        </>
      )}
    </Card>
  );
}
