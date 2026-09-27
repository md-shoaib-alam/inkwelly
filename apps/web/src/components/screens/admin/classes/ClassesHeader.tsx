"use client";

import { Button } from "@/components/ui/button";
import { List, LayoutGrid, Plus } from "lucide-react";

interface ClassesHeaderProps {
  totalClasses: number;
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
  canCreate: boolean;
  onAddClick: () => void;
}

export function ClassesHeader({
  totalClasses,
  viewMode,
  setViewMode,
  canCreate,
  onAddClick,
}: ClassesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Classes
        </h2>
        <p className="text-sm text-muted-foreground">
          {totalClasses} classes configured
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={`size-8 p-0 ${viewMode === "table" ? "bg-white dark:bg-zinc-700 shadow-sm" : ""}`}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`size-8 p-0 ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm" : ""}`}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
        {canCreate && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={onAddClick}
          >
            <Plus className="size-4 mr-2" />
            Add Class
          </Button>
        )}
      </div>
    </div>
  );
}
