'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceRecordItem } from './types';
import { MONTH_NAMES } from './utils';

interface AttendanceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRealMonth: number;
  currentRealYear: number;
  currentMonthRecords: AttendanceRecordItem[];
}

export function AttendanceHistoryDialog({
  open,
  onOpenChange,
  currentRealMonth,
  currentRealYear,
  currentMonthRecords,
}: AttendanceHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarRange className="size-5 text-blue-600" />
            <span>
              Full Attendance History - {MONTH_NAMES[currentRealMonth]} {currentRealYear}
            </span>
          </DialogTitle>
          <DialogDescription>
            Complete real attendance logs for the current month.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800 pt-2">
          {currentMonthRecords.length === 0 ? (
            <p className="text-xs text-center py-6 text-slate-500 dark:text-zinc-400">
              No attendance records found for {MONTH_NAMES[currentRealMonth]} {currentRealYear}.
            </p>
          ) : (
            currentMonthRecords.map((r) => {
              const [y, m, d] = r.date.split('-').map(Number);
              const dateObj = new Date(y, (m || 1) - 1, d);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={r.date} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-zinc-200">{formattedDate}</p>
                    <p className="text-slate-500 dark:text-zinc-400">
                      {r.checkIn
                        ? `${r.checkIn}${r.checkOut ? ` - ${r.checkOut}` : ''}`
                        : r.remarks || 'No check-in recorded'}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'text-[10px] capitalize font-semibold',
                      r.status === 'present' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      r.status === 'absent' && 'bg-rose-50 text-rose-700 border-rose-200',
                      r.status === 'leave' && 'bg-amber-50 text-amber-700 border-amber-200',
                      r.status === 'holiday' && 'bg-purple-50 text-purple-700 border-purple-200'
                    )}
                  >
                    {r.status}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
