"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface NoticeFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
}

export function NoticeFilters({
  search,
  setSearch,
  priorityFilter,
  setPriorityFilter,
}: NoticeFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search notices..."
          className="pl-9 shadow-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
        <SelectTrigger className="w-full sm:w-40 shadow-none">
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
  );
}
