'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceRecordItem } from './types';
import { MONTH_NAMES } from './utils';

interface RecentAttendanceListProps {
  recentRecords: AttendanceRecordItem[];
  currentRealMonth: number;
  currentRealYear: number;
  onSelectDate: (dateStr: string) => void;
  onOpenViewAll: () => void;
  className?: string;
}

export function RecentAttendanceList({
  recentRecords,
  currentRealMonth,
  currentRealYear,
  onSelectDate,
  onOpenViewAll,
  className,
}: RecentAttendanceListProps) {
  return (
    <Card className={cn('lg:col-span-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-2xs flex flex-col justify-between', className)}>
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Recent Attendance
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenViewAll}
            disabled={recentRecords.length === 0}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 p-0 h-auto cursor-pointer gap-1 disabled:opacity-40"
          >
            <span>View All</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>

        {/* List */}
        {recentRecords.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CalendarDays className="size-8 text-slate-300 dark:text-zinc-700 mx-auto" />
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              No attendance logged yet for {MONTH_NAMES[currentRealMonth]} {currentRealYear}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 mt-1">
            {recentRecords.map((item) => {
              // Parse date parts to prevent timezone offsets
              const [y, m, d] = item.date.split('-').map(Number);
              const dayNum = d;
              const mShort = MONTH_NAMES[(m || 1) - 1]?.slice(0, 3);
              const isAbsent = item.status === 'absent';
              const isLeave = item.status === 'leave';

              return (
                <div
                  key={item.date}
                  className="py-3 flex items-center justify-between gap-2.5 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 rounded-xl px-1.5 transition-colors cursor-pointer"
                  onClick={() => onSelectDate(item.date)}
                >
                  {/* Date Block */}
                  <div
                    className={cn(
                      'size-10 rounded-xl flex flex-col items-center justify-center shrink-0 border text-center',
                      isAbsent
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40 text-rose-600'
                        : isLeave
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40 text-amber-600'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40 text-blue-600'
                    )}
                  >
                    <span className="text-xs font-bold leading-none">{dayNum}</span>
                    <span className="text-[9px] font-medium uppercase tracking-tight">{mShort}</span>
                  </div>

                  {/* Middle Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'size-1.5 rounded-full shrink-0',
                          isAbsent ? 'bg-rose-500' : isLeave ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 capitalize truncate">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {isAbsent
                        ? '--'
                        : item.checkIn
                        ? `${item.checkIn}${item.checkOut ? ` - ${item.checkOut}` : ''}`
                        : '--'}
                    </p>
                  </div>

                  {/* Right Badge */}
                  <div className="shrink-0 flex items-center gap-1">
                    <Badge
                      className={cn(
                        'text-[10px] px-2 py-0.5 font-semibold capitalize',
                        isAbsent
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                          : isLeave
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                      )}
                    >
                      {isAbsent ? 'Absent' : isLeave ? 'Leave' : 'On Time'}
                    </Badge>
                    <ChevronRight className="size-3 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
