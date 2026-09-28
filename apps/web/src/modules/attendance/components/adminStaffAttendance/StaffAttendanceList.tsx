'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CalendarDays } from 'lucide-react';
import { StaffAttendanceRow } from './StaffAttendanceRow';
import { AttendanceStatus, StaffAttendanceItem } from './types';

interface StaffAttendanceListProps {
  activeTab: string;
  recordsCount: number;
  filtered: StaffAttendanceItem[];
  pendingChanges: Record<string, AttendanceStatus>;
  queryLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMarkAll: (status: AttendanceStatus) => void;
  onStatusChange: (userId: string, status: AttendanceStatus) => void;
}

export function StaffAttendanceList({
  activeTab,
  recordsCount,
  filtered,
  pendingChanges,
  queryLoading,
  searchQuery,
  onSearchChange,
  onMarkAll,
  onStatusChange,
}: StaffAttendanceListProps) {
  const isTeacher = activeTab === 'teacher';

  return (
    <div className="mt-6">
      <Card className="rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-zinc-900/80 backdrop-blur-md z-10 border-b border-zinc-200 dark:border-zinc-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start sm:gap-4 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <CalendarDays className="size-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100 leading-none">
                    {isTeacher ? 'Teachers List' : 'Staff List'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                    Attendance Registry
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-[10px] h-6 px-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 rounded-md font-bold"
              >
                {recordsCount} total
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-xl sm:w-auto">
              <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 italic">
                Quick:
              </div>
              <button
                type="button"
                className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
                onClick={() => onMarkAll('present')}
              >
                All Present
              </button>
              <button
                type="button"
                className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-95 cursor-pointer"
                onClick={() => onMarkAll('absent')}
              >
                All Absent
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <div className="relative group max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input
              placeholder={`Search ${isTeacher ? 'teachers' : 'staff'}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            {queryLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-400 text-sm italic">
                  No records found for {isTeacher ? 'teachers' : 'staff'}.
                </p>
              </div>
            ) : (
              filtered.map((staff, index) => {
                const mod = !!pendingChanges[staff.id];
                const cur = (pendingChanges[staff.id] || staff.status) as AttendanceStatus;
                return (
                  <StaffAttendanceRow
                    key={staff.id}
                    staff={staff}
                    index={index}
                    currentStatus={cur}
                    isModified={mod}
                    onStatusChange={onStatusChange}
                  />
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
