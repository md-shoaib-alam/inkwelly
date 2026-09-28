"use client";

import { Search } from "lucide-react";

interface MinimalDashboardProps {
  filteredQuickActions: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  navigateTo: (screen: string) => void;
}

export function MinimalDashboard({
  filteredQuickActions,
  searchQuery,
  setSearchQuery,
  navigateTo,
}: MinimalDashboardProps) {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Quick Actions
        </h3>
        
        {/* Search bar */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-zinc-800 dark:text-zinc-200 shadow-sm transition-all"
          />
        </div>
      </div>

      {filteredQuickActions.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          No matching quick actions found.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {filteredQuickActions.map((action) => (
            <button
              key={action.screen}
              type="button"
              onClick={() => navigateTo(action.screen)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all bg-white dark:bg-zinc-950 hover:border-transparent text-center group gap-3 cursor-pointer"
            >
              <div
                className={`p-3.5 rounded-xl text-white ${action.color} transition-transform group-hover:scale-110 shadow-md`}
              >
                {action.icon}
              </div>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
