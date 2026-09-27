'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserCheck, UserX } from 'lucide-react';
import { AttendanceStatus, StaffAttendanceItem } from './types';

interface StaffAttendanceRowProps {
  staff: StaffAttendanceItem;
  index: number;
  currentStatus: AttendanceStatus;
  isModified: boolean;
  onStatusChange: (userId: string, status: AttendanceStatus) => void;
}

const getStatusBg = (status: string) => {
  switch (status) {
    case 'present':
      return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    case 'absent':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    default:
      return '';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present':
      return <UserCheck className="size-3.5" />;
    case 'absent':
      return <UserX className="size-3.5" />;
    default:
      return null;
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export function StaffAttendanceRow({
  staff,
  index,
  currentStatus,
  onStatusChange,
}: StaffAttendanceRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border transition-all ${getStatusBg(
        currentStatus
      )}`}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono w-6 text-center">
          {index + 1}
        </span>
        <Avatar className="size-8 flex-shrink-0">
          <AvatarFallback className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            {getInitials(staff.staffName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate capitalize">
            {staff.staffName}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{staff.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-auto">
        {(['present', 'absent'] as AttendanceStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(staff.id, status)}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
              currentStatus === status
                ? `${getStatusBg(status)} ${
                    status === 'present'
                      ? 'bg-emerald-500 dark:bg-emerald-500 text-white'
                      : 'bg-red-500 dark:bg-red-500 text-white'
                  } border-transparent shadow-sm ring-1 ring-white/10`
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-950'
            }`}
          >
            {getStatusIcon(status)}
            <span className="sm:inline capitalize">{status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
