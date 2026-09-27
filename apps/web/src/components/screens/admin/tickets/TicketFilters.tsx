"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { TICKET_CATEGORIES } from "./constants";

interface TicketFiltersProps {
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
}

export function TicketFilters({
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
}: TicketFiltersProps) {
  return (
    <div className="space-y-4">
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-zinc-100/80 dark:bg-zinc-800/80 p-1 border border-zinc-200/50 dark:border-zinc-700/50 h-10">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-all px-3"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="open" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-all px-3"
          >
            Open
          </TabsTrigger>
          <TabsTrigger 
            value="in_progress" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-all px-3"
          >
            In Progress
          </TabsTrigger>
          <TabsTrigger 
            value="on_hold" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-all px-3"
          >
            On Hold
          </TabsTrigger>
          <TabsTrigger 
            value="resolved" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-all px-3"
          >
            Resolved
          </TabsTrigger>
          <TabsTrigger 
            value="closed" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-all px-3"
          >
            Closed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TICKET_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
