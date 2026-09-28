'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface AttendanceFooterProps {
  hasChanges: boolean;
  pendingCount: number;
  activeTab: string;
  isSaving: boolean;
  onSave: () => void;
}

export function AttendanceFooter({
  hasChanges,
  pendingCount,
  activeTab,
  isSaving,
  onSave,
}: AttendanceFooterProps) {
  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 lg:left-[calc(18rem+1.5rem)] lg:right-10 flex flex-col sm:flex-row items-center justify-between bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-3 sm:p-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800 gap-3 z-30">
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
        {hasChanges ? (
          <div className="flex items-center gap-2.5">
            <div className="size-2 bg-blue-600 rounded-full animate-ping shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {pendingCount} Pending in {activeTab === 'teacher' ? 'Teachers' : 'Staff'}
            </span>
          </div>
        ) : (
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 italic">
            No unsaved changes
          </span>
        )}
      </div>
      <Button
        onClick={onSave}
        disabled={isSaving || !hasChanges}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 sm:px-10 h-10 sm:h-12 shadow-md shadow-blue-500/20 font-bold text-xs sm:text-sm cursor-pointer"
      >
        {isSaving ? (
          'Syncing...'
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Save className="size-4" /> Save {activeTab === 'teacher' ? 'Teachers' : 'Staff'} Attendance
          </span>
        )}
      </Button>
    </div>
  );
}
