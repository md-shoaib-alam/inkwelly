'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  CalendarCheck,
  XCircle,
  Clock,
  CalendarDays,
  Star,
  CalendarRange,
} from 'lucide-react';
import { AttendanceMetrics } from './types';
import { MONTH_NAMES } from './utils';
import { cn } from '@/lib/utils';

interface MonthlyMetricCardsProps {
  metrics: AttendanceMetrics;
  currentRealMonth: number;
  currentRealYear: number;
  className?: string;
}

export function MonthlyMetricCards({
  metrics,
  currentRealMonth,
  currentRealYear,
  className,
}: MonthlyMetricCardsProps) {
  return (
    <div className={cn(className)}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
            This Month Overview
          </span>
        </div>
        <span className="text-[11px] sm:text-xs font-normal text-slate-500 dark:text-zinc-400 shrink-0">
          {metrics.recordedDays} of {metrics.total} days logged
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
        {/* Card 1: Present */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shrink-0">
              <CalendarCheck className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none sm:leading-tight">
                {metrics.present}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">Present</p>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(Number(metrics.presentRate), 100)}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              {metrics.presentRate}%
            </span>
          </div>
        </Card>

        {/* Card 2: Absent */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40 shrink-0">
              <XCircle className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none sm:leading-tight">
                {metrics.absent}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">Absent</p>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(Number(metrics.absentRate), 100)}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600 dark:text-rose-400 shrink-0">
              {metrics.absentRate}%
            </span>
          </div>
        </Card>

        {/* Card 3: Leave */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40 shrink-0">
              <Clock className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none sm:leading-tight">
                {metrics.leave}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">Leave</p>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(Number(metrics.leaveRate), 100)}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
              {metrics.leaveRate}%
            </span>
          </div>
        </Card>

        {/* Card 4: Holiday */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40 shrink-0">
              <CalendarDays className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none sm:leading-tight">
                {metrics.holiday}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">Holiday</p>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(Number(metrics.holidayRate), 100)}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-purple-600 dark:text-purple-400 shrink-0">
              {metrics.holidayRate}%
            </span>
          </div>
        </Card>

        {/* Card 5: Total Days (Responsive 2-col span on mobile) */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center sm:items-start justify-between sm:justify-start gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="size-8 sm:size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                <Star className="size-4 sm:size-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none sm:leading-tight">
                  {metrics.total}
                </p>
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">Total Days</p>
              </div>
            </div>
            {/* Mobile indicator on right */}
            <div className="sm:hidden flex items-center gap-1.5">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">100%</span>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 w-full" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 hidden sm:inline">
              100%
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
