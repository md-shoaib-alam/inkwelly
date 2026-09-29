"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AcademicsAxis } from "../../hooks/use-academics-command-center";

/**
 * Axes with `tracked: false` have no table behind them, so they are left out of the
 * polygon and shown as an em dash — plotting them at 0 would read as a coverage failure
 * the school caused, rather than a feature this build does not have.
 */

function scoreBand(score: number) {
  if (score >= 80) return { label: "On track", color: "#0D9488" };
  if (score >= 60) return { label: "Watch", color: "#F59E0B" };
  return { label: "Needs attention", color: "#DC2626" };
}

function percentColor(percent: number) {
  if (percent >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (percent >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function ReadinessCard({
  score,
  axes,
  loading,
}: {
  score: number;
  axes: AcademicsAxis[];
  loading: boolean;
}) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const band = scoreBand(score);
  const tracked = axes.filter((a) => a.tracked);
  const untracked = axes.filter((a) => !a.tracked);

  const r = 52;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-teal-600 dark:text-teal-400">
          <Compass className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Academic readiness</span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {axes.length}-axis session readiness
        </span>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-[124px] rounded-full" />
            <Skeleton className="h-[180px] flex-1 rounded-lg" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative size-[124px] shrink-0">
              <svg viewBox="0 0 124 124" className="size-full -rotate-90" aria-hidden="true">
                <circle
                  cx="62"
                  cy="62"
                  r={r}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="9"
                  className="dark:opacity-25"
                />
                <circle
                  cx="62"
                  cy="62"
                  r={r}
                  fill="none"
                  stroke={band.color}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${filled} ${circumference - filled}`}
                />
              </svg>
              <div className="absolute inset-0 grid place-content-center text-center">
                <p className="text-[26px] leading-none font-semibold text-slate-900 dark:text-zinc-50">{score}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">/100</p>
              </div>
            </div>

            <div className="flex-1 w-full min-w-0">
              {recharts && tracked.length >= 3 ? (
                <div className="h-[176px] w-full">
                  {(() => {
                    const {
                      ResponsiveContainer,
                      RadarChart,
                      Radar,
                      PolarGrid,
                      PolarAngleAxis,
                      PolarRadiusAxis,
                    } = recharts;
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={tracked} outerRadius="72%">
                          <PolarGrid stroke="#CBD5E1" opacity={0.5} />
                          <PolarAngleAxis
                            dataKey="label"
                            tick={{ fill: "#64748B", fontSize: 11 }}
                          />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            dataKey="percent"
                            name="Readiness"
                            stroke="#0D9488"
                            strokeWidth={2}
                            fill="#0D9488"
                            fillOpacity={0.22}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              ) : (
                <div className="h-[176px] w-full grid place-items-center px-6 text-center">
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {tracked.length < 3
                      ? "Too few tracked axes to plot a readiness shape."
                      : "Chart is loading."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && (
          <p className="mt-1 text-center text-[12px] font-semibold" style={{ color: band.color }}>
            {band.label}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-3 px-4 py-3 border-t border-slate-100 dark:border-zinc-800/80">
        {axes.map((axis) => (
          <div key={axis.key} className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {axis.label}
            </p>
            <p
              className={`text-[15px] font-semibold tabular-nums ${
                axis.tracked ? percentColor(axis.percent) : "text-slate-300 dark:text-zinc-600"
              }`}
              title={axis.detail}
            >
              {axis.tracked ? `${axis.percent}%` : "—"}
            </p>
          </div>
        ))}
      </div>

      {!loading && untracked.length > 0 && (
        <p className="px-4 pb-3 text-[11px] text-slate-400 dark:text-zinc-500">
          {untracked.map((a) => a.label).join(", ")}: {untracked[0]?.detail.toLowerCase()}
        </p>
      )}
    </div>
  );
}
