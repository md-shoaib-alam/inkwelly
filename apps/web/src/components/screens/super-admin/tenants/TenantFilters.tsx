import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, List } from "lucide-react";
import { ViewMode } from "./types";
import { SCHOOL_PLANS } from "@/lib/billing-constants";

interface TenantFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

export function TenantFilters({
  search,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  sortBy = "newest",
  onSortChange,
}: TenantFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const onSearchChangeRef = useRef(onSearchChange);

  // Sync ref with the latest onSearchChange callback
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Sync local search when the external search prop changes (e.g., cleared/reset)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce the onSearchChange callback using the stable ref
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChangeRef.current(localSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const renderViewModeToggle = (extraClass = "") => (
    <div className={`items-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 rounded-xl h-9 shadow-2xs shrink-0 ${extraClass}`}>
      <Button
        variant="ghost"
        size="icon"
        className={`size-7.5 rounded-lg transition-colors ${
          viewMode === "grid"
            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
        onClick={() => onViewModeChange("grid")}
        title="Grid View"
      >
        <LayoutGrid className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`size-7.5 rounded-lg transition-colors ${
          viewMode === "table"
            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
        onClick={() => onViewModeChange("table")}
        title="List View"
      >
        <List className="size-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-2.5 pt-1">
      {/* Search Input & Mobile View Mode Toggle */}
      <div className="flex items-center gap-2 flex-1 min-w-0 md:max-w-xl">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
          <Input
            placeholder="Search schools..."
            className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 rounded-xl text-xs placeholder:text-slate-400 shadow-2xs focus-visible:ring-1 focus-visible:ring-blue-500"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        {/* View Mode Toggle near search bar on mobile */}
        {renderViewModeToggle("flex md:hidden")}
      </div>

      {/* 3 Selects: All Plans, All Status, Sort by in 1 row on mobile */}
      <div className="grid grid-cols-3 md:flex md:items-center gap-1.5 sm:gap-2">
        {/* Plans Dropdown */}
        <Select value={planFilter} onValueChange={onPlanFilterChange}>
          <SelectTrigger className="w-full md:w-[125px] h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs px-2 sm:px-3 truncate">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent className="rounded-xl text-xs">
            <SelectItem value="all" className="text-xs">All Plans</SelectItem>
            {SCHOOL_PLANS.map((plan) => (
              <SelectItem key={plan.id} value={plan.id} className="text-xs">
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Dropdown */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full md:w-[125px] h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs px-2 sm:px-3 truncate">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl text-xs">
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="active" className="text-xs">Active</SelectItem>
            <SelectItem value="trial" className="text-xs">Trial</SelectItem>
            <SelectItem value="suspended" className="text-xs">Suspended</SelectItem>
            <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={onSortChange || (() => {})}>
          <SelectTrigger className="w-full md:w-[145px] h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs px-2 sm:px-3 truncate">
            <span className="hidden sm:inline text-slate-400 mr-1 text-[11px]">Sort:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl text-xs">
            <SelectItem value="newest" className="text-xs">Newest</SelectItem>
            <SelectItem value="oldest" className="text-xs">Oldest</SelectItem>
            <SelectItem value="name_asc" className="text-xs">Name (A-Z)</SelectItem>
            <SelectItem value="students_desc" className="text-xs">Most Students</SelectItem>
          </SelectContent>
        </Select>

        {/* Desktop View Mode Toggle */}
        {renderViewModeToggle("hidden md:flex")}
      </div>
    </div>
  );
}
