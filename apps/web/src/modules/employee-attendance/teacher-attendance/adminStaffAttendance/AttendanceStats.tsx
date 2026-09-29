'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';

interface AttendanceStatsProps {
  total: number;
  present: number;
  absent: number;
}

export function AttendanceStats({
  total,
  present,
  absent,
}: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6">
      <Card className="rounded-xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardContent className="p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Users className="size-4 sm:size-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium truncate">
              Total
            </p>
            <p className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              {total}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardContent className="p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <UserCheck className="size-4 sm:size-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium truncate">
              Present
            </p>
            <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
              {present}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardContent className="p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <UserX className="size-4 sm:size-5 text-red-500 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium truncate">
              Absent
            </p>
            <p className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400 leading-tight">
              {absent}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
