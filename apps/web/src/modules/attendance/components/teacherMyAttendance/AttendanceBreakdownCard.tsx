'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { AttendanceMetrics } from './types';

interface AttendanceBreakdownCardProps {
  metrics: AttendanceMetrics;
}

export function AttendanceBreakdownCard({ metrics }: AttendanceBreakdownCardProps) {
  const total = metrics.recordedDays || 0;

  const presentPct = total > 0 ? (metrics.present / total) * 100 : 0;
  const absentPct = total > 0 ? (metrics.absent / total) * 100 : 0;
  const leavePct = total > 0 ? (metrics.leave / total) * 100 : 0;
  const holidayPct = total > 0 ? (metrics.holiday / total) * 100 : 0;

  const presentOffset = 0;
  const absentOffset = -presentPct;
  const leaveOffset = -(presentPct + absentPct);
  const holidayOffset = -(presentPct + absentPct + leavePct);

  const circlePath = "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-5 shadow-2xs space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
        Current Month Breakdown
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Circular Radial Donut Ring */}
        <div className="relative size-24 sm:size-28 shrink-0 flex items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              className="text-slate-100 dark:text-zinc-800"
              strokeWidth="3.8"
              stroke="currentColor"
              fill="none"
              d={circlePath}
            />
            {/* Green segment (Present) */}
            {presentPct > 0 && (
              <path
                className="text-emerald-500 transition-all duration-500"
                strokeDasharray={`${presentPct}, 100`}
                strokeDashoffset={presentOffset}
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d={circlePath}
              />
            )}
            {/* Rose segment (Absent) */}
            {absentPct > 0 && (
              <path
                className="text-rose-500 transition-all duration-500"
                strokeDasharray={`${absentPct}, 100`}
                strokeDashoffset={absentOffset}
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d={circlePath}
              />
            )}
            {/* Amber segment (Leave) */}
            {leavePct > 0 && (
              <path
                className="text-amber-500 transition-all duration-500"
                strokeDasharray={`${leavePct}, 100`}
                strokeDashoffset={leaveOffset}
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d={circlePath}
              />
            )}
            {/* Purple segment (Holiday) */}
            {holidayPct > 0 && (
              <path
                className="text-purple-500 transition-all duration-500"
                strokeDasharray={`${holidayPct}, 100`}
                strokeDashoffset={holidayOffset}
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d={circlePath}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-zinc-100">
              {metrics.recordedDays}
            </span>
            <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500">
              Days Logged
            </span>
          </div>
        </div>

        {/* Breakdown Rows */}
        <div className="w-full sm:flex-1 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-zinc-400">Present</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-zinc-100">
              {metrics.present} ({metrics.presentRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-zinc-400">Absent</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-zinc-100">
              {metrics.absent} ({metrics.absentRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-zinc-400">Leave</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-zinc-100">
              {metrics.leave} ({metrics.leaveRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-purple-500" />
              <span className="text-slate-600 dark:text-zinc-400">Holiday</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-zinc-100">
              {metrics.holiday} ({metrics.holidayRate}%)
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
