'use client';

import React from 'react';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TodayScheduleProps {
  schedule: any[];
  formatTime: (time: string) => string;
  onNavigate?: (screen: string) => void;
}

export function TodaySchedule({
  schedule,
  formatTime,
  onNavigate,
}: TodayScheduleProps) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Clock className="size-4 sm:size-4.5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50">
            Today&apos;s Schedule
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/40">
            {schedule.length} classes
          </span>
        </div>

        {/* Desktop Button / Mobile Arrow */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('timetable')}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 h-7.5 px-2.5 cursor-pointer shadow-xs"
          >
            <Calendar className="size-3 text-blue-600 dark:text-blue-400" />
            <span>View Timetable</span>
          </Button>

          <button
            onClick={() => onNavigate?.('timetable')}
            className="sm:hidden size-6 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
            aria-label="View Timetable"
          >
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center py-4 sm:py-6">
        {schedule.length === 0 ? (
          <div className="text-center flex flex-col items-center justify-center py-2">
            <img
              src="/assets/admin/timetable.avif"
              alt="No timetable"
              className="w-24 sm:w-28 h-20 sm:h-24 object-contain mb-2 select-none pointer-events-none"
            />
            <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
              No classes scheduled for today
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Enjoy your day off!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.map((entry, index) => (
              <div
                key={entry.id || index}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-center min-w-[60px] py-1 px-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {formatTime(entry.startTime)}
                    </p>
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
                      {formatTime(entry.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {entry.subjectName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {entry.className}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 rounded-lg px-2 py-0.5"
                >
                  Period {index + 1}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
