"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClassSelect } from "@/components/ui/class-select";
import { Search, List, LayoutGrid } from "lucide-react";

interface SubjectsFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  classFilter: string;
  onClassFilterChange: (v: string) => void;
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
}

export function SubjectsFilters({
  search,
  onSearchChange,
  classFilter,
  onClassFilterChange,
  viewMode,
  setViewMode,
}: SubjectsFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Top filter row: search + class select */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between w-full">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center flex-1">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects…"
              className="pl-9 w-full bg-background"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-[200px]">
              <ClassSelect
                value={classFilter}
                onValueChange={onClassFilterChange}
                placeholder="Select Class"
                className="w-full"
              />
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0 sm:hidden">
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
          </div>
        </div>

        {/* Desktop View Mode Toggle */}
        <div className="hidden sm:flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
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
      </div>
    </div>
  );
}
