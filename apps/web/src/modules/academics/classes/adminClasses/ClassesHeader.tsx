"use client";

import { Button } from "@/components/ui/button";
import { List, LayoutGrid, Plus } from "lucide-react";

interface ClassesHeaderProps {
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
  canCreate: boolean;
  onAddClick: () => void;
}

export function ClassesHeader({
  viewMode,
  setViewMode,
  canCreate,
  onAddClick,
}: ClassesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          Classes
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Manage school classes for this session
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {canCreate && (
          <Button
            className="bg-[#0e766e] hover:bg-[#0d6962] text-white font-medium text-sm rounded-lg px-4 h-9.5 gap-1.5 shadow-xs cursor-pointer"
            onClick={onAddClick}
          >
            <Plus className="size-4" />
            Add Class
          </Button>
        )}
      </div>
    </div>
  );
}
