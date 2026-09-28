"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";

interface NoticesHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (v: string) => void;
  canCreate: boolean;
  onAddClick: () => void;
}

export function NoticesHeader({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  canCreate,
  onAddClick,
}: NoticesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search notices…"
            className="pl-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="important">Important</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {canCreate && (
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
          onClick={onAddClick}
        >
          <Plus className="size-4 mr-2" />
          Create Notice
        </Button>
      )}
    </div>
  );
}
