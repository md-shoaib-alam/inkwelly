'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';

interface ActiveExamsEmptyStateProps {
  onNewExamClick?: () => void;
}

export function ActiveExamsEmptyState({ onNewExamClick }: ActiveExamsEmptyStateProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={9} className="py-12 sm:py-16 text-center">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
          <div className="relative w-36 h-28 sm:w-44 sm:h-32 mb-3 overflow-hidden">
            <Image
              src="/assets/admin/examtop.avif"
              alt="No Examinations"
              fill
              className="object-contain"
              sizes="180px"
            />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight">
            No examinations found in this category.
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs leading-normal">
            There are no examinations scheduled here. Click below to start scheduling a new exam!
          </p>
          {onNewExamClick && (
            <Button
              onClick={onNewExamClick}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-xl gap-1.5 shadow-sm shadow-blue-500/20 text-xs sm:text-sm"
            >
              <Plus className="size-4 stroke-[2]" />
              <span>New Exam</span>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
