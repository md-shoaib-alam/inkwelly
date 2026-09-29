'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExamsHeaderProps {
  activeTab: string;
  onNewExamClick: () => void;
}

export function ExamsHeader({
  activeTab,
  onNewExamClick,
}: ExamsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {activeTab === 'exams' && "Exams"}
          {activeTab === 'results' && "Results Entry"}
          {activeTab === 'published' && "Published Results"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeTab === 'exams' && "Create and manage all school examinations."}
          {activeTab === 'results' && "Input and update student marks for completed exams."}
          {activeTab === 'published' && "View and review finalized exam outcomes."}
        </p>
      </div>

      {/* Header Actions: New Exam Button. The academic year lives in the URL
          and the header chip, so this screen has no year control of its own. */}
      {activeTab === 'exams' && (
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
          <Button
            onClick={onNewExamClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 px-3.5 sm:px-4 rounded-xl gap-1.5 shadow-sm shrink-0 cursor-pointer ml-auto"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span className="text-xs sm:text-sm">New Exam</span>
          </Button>
        </div>
      )}
    </div>
  );
}

