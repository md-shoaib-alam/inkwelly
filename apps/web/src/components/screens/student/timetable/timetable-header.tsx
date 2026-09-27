import { Button } from "@/components/ui/button";
import { LayoutGrid, List, CalendarDays } from "lucide-react";
import { ViewMode } from "./types";

interface TimetableHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function TimetableHeader({ viewMode, setViewMode }: TimetableHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          My Timetable
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Weekly class schedule and time slots
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-1">
        <Button
          size="sm"
          variant={viewMode === "grid" ? "default" : "ghost"}
          onClick={() => setViewMode("grid")}
          className={
            viewMode === "grid"
              ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }
        >
          <LayoutGrid className="size-4 mr-1.5" />
          Grid
        </Button>
        <Button
          size="sm"
          variant={viewMode === "list" ? "default" : "ghost"}
          onClick={() => setViewMode("list")}
          className={
            viewMode === "list"
              ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }
        >
          <List className="size-4 mr-1.5" />
          List
        </Button>
        <Button
          size="sm"
          variant={viewMode === "day" ? "default" : "ghost"}
          onClick={() => setViewMode("day")}
          className={
            viewMode === "day"
              ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }
        >
          <CalendarDays className="size-4 mr-1.5" />
          Day
        </Button>
      </div>
    </div>
  );
}
