"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, GraduationCap } from "lucide-react";
import { MONTH_NAMES, ALL_EVENT_TYPES, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "./types";

interface CalendarHeaderProps {
  currentYear: number;
  currentMonth: number;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  canCreate: boolean;
  openCreateDialog: () => void;
  title?: string;
  description?: string;
}

export function CalendarHeader({
  currentYear,
  currentMonth,
  typeFilter,
  setTypeFilter,
  goToPrevMonth,
  goToNextMonth,
  goToToday,
  canCreate,
  openCreateDialog,
  title = "Calendar",
  description = "View school events and activities",
}: CalendarHeaderProps) {
  return (
    <div className="bg-white dark:bg-neutral-900/40 rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] shadow-sm overflow-hidden">
      {/* Title & Actions Top Row */}
      <div className="p-4 sm:px-6 sm:py-5 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center w-full sm:w-auto mt-1 sm:mt-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs font-semibold border-zinc-200/70 dark:border-white/[0.08] rounded-xl">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                {ALL_EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[t] }} />
                      <span>{EVENT_TYPE_LABELS[t]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canCreate && (
              <Button 
                className="bg-blue-600 hover:bg-blue-500 dark:bg-rose-600 dark:hover:bg-rose-500 text-white shadow-sm rounded-xl h-9 px-4 text-xs font-bold flex items-center transition-all duration-200 active:scale-95 ml-auto sm:ml-0" 
                onClick={openCreateDialog}
              >
                <Plus className="size-3.5 mr-1.5 stroke-[2.5]" />
                Add Event
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Month navigation row */}
      <div className="px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between bg-zinc-50/40 dark:bg-white/[0.01]">
        {/* Left Side: Packed Month Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors duration-200" 
            onClick={goToPrevMonth}
          >
            <ChevronLeft className="size-4 fill-current" />
          </Button>
          
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight min-w-[100px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>

          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors duration-200" 
            onClick={goToNextMonth}
          >
            <ChevronRight className="size-4 fill-current" />
          </Button>
        </div>

        {/* Right Side: Relocated Today Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-4 text-xs font-bold border-zinc-200/70 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.02] rounded-xl transition-all duration-150 active:scale-95 text-zinc-700 dark:text-zinc-300"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>
    </div>
  );
}

