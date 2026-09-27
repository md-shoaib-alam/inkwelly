import React from "react";
import { Search, Layers, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubscriptionFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  planFilter: string;
  onPlanFilterChange: (val: string) => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
}

export function SubscriptionFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  viewMode,
  onViewModeChange,
}: SubscriptionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search schools by name, domain, or plan..."
          className="pl-9 h-9 text-xs rounded-xl border bg-card placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="flex-1 sm:w-[130px] h-9 text-xs rounded-xl bg-card">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial Mode</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {/* Plan Filter */}
        <Select value={planFilter} onValueChange={onPlanFilterChange}>
          <SelectTrigger className="flex-1 sm:w-[130px] h-9 text-xs rounded-xl bg-card">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Plans" />
            </div>
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle (Desktop) */}
        <div className="hidden sm:flex items-center bg-muted/60 dark:bg-slate-900 border border-border p-0.5 rounded-xl h-9 shrink-0 shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            className={`size-7.5 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
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
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onViewModeChange("table")}
            title="Table View"
          >
            <List className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
