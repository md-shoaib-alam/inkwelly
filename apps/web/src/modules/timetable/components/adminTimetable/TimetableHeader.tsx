"use client";

import { Button } from "@/components/ui/button";
import { ClassSelect } from "@/components/ui/class-select";
import { Calendar, LayoutGrid, List, CalendarDays, Plus, Settings } from "lucide-react";
import type { ViewMode } from "./types";

interface TimetableHeaderProps {
  currentClass: any;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  selectedClass: string;
  onClassChange: (id: string) => void;
  canEdit: boolean;
  canCreate: boolean;
  onSettingsClick: () => void;
  onManageClick: () => void;
}

export function TimetableHeader({
  currentClass,
  viewMode,
  setViewMode,
  selectedClass,
  onClassChange,
  canEdit,
  canCreate,
  onSettingsClick,
  onManageClick,
}: TimetableHeaderProps) {
  const viewSwitcher = (
    <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-xs shrink-0">
      <Button
        size="sm"
        variant={viewMode === "grid" ? "default" : "ghost"}
        onClick={() => setViewMode("grid")}
        className="h-8 px-2 sm:px-2.5 text-xs"
      >
        <LayoutGrid className="size-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        size="sm"
        variant={viewMode === "list" ? "default" : "ghost"}
        onClick={() => setViewMode("list")}
        className="h-8 px-2 sm:px-2.5 text-xs"
      >
        <List className="size-4 sm:mr-1.5" />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        size="sm"
        variant={viewMode === "day" ? "default" : "ghost"}
        onClick={() => setViewMode("day")}
        className="h-8 px-2 sm:px-2.5 text-xs"
      >
        <CalendarDays className="size-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Day</span>
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
      {/* Top row on mobile: Title on left, View Switcher on right */}
      <div className="flex items-center justify-between gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="size-9 sm:size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="size-4.5 sm:size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold whitespace-nowrap leading-tight">Weekly Timetable</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {currentClass
                ? `${currentClass.name}-${currentClass.section}`
                : "Select a class"}
            </p>
          </div>
        </div>

        {/* View Switcher on mobile (< lg) */}
        <div className="lg:hidden shrink-0">
          {viewSwitcher}
        </div>
      </div>

      {/* Controls row: Aligned in one horizontal row on mobile */}
      <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
        {/* View Switcher on desktop (>= lg) */}
        <div className="hidden lg:block shrink-0">
          {viewSwitcher}
        </div>

        <ClassSelect
          value={selectedClass}
          onValueChange={onClassChange}
          placeholder="Select Class"
          className="flex-1 lg:w-56"
        />

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5 sm:px-3 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 shadow-xs shrink-0"
            onClick={onSettingsClick}
            title="Timetable Settings"
          >
            <Settings className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        )}

        {selectedClass && canCreate && (
          <Button
            size="sm"
            onClick={onManageClick}
            className="h-9 px-3 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all duration-200 shrink-0"
          >
            <Plus className="size-4 mr-1.5" />
            <span>Manage</span>
          </Button>
        )}
      </div>
    </div>
  );
}
