"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { actionKeywords } from "@/components/layout/dashboard-keywords";
import { allQuickActions } from "./quick-actions-config";

export function StaffDashboard() {
  const { push } = useRouter();
  const { currentUser, currentTenantSlug, currentTenantId, setCurrentScreen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [clickCounts, setClickCounts] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("schoolsaas_staff_action_clicks");
        return stored ? JSON.parse(stored) : {};
      } catch (e) {
        console.error("Failed to load action clicks", e);
      }
    }
    return {};
  });

  const navigateTo = (screen: string) => {
    try {
      const updated = {
        ...clickCounts,
        [screen]: (clickCounts[screen] || 0) + 1
      };
      setClickCounts(updated);
      localStorage.setItem("schoolsaas_staff_action_clicks", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save action click", e);
    }

    setCurrentScreen(screen);
    const tid = currentTenantSlug || currentTenantId || currentUser?.tenantSlug || currentUser?.tenantId;
    if (tid) {
      push(`/${tid}/${screen}`);
    } else {
      push(`/${screen}`);
    }
  };

  const quickActions = allQuickActions.filter((action) => {
    if (!action.permModule) return true;
    return hasPermission(currentUser, action.permModule, "view");
  });

  const filteredQuickActions = quickActions.filter((action) => {
    const query = searchQuery.toLowerCase();
    const labelMatch = action.label.toLowerCase().includes(query);
    const kws = actionKeywords[action.screen] || [];
    const keywordsMatch = kws.some((kw) => kw.toLowerCase().includes(query));
    return labelMatch || keywordsMatch;
  });

  // Get top 7 most used actions (only those clicked at least once)
  const recommendedActions = quickActions
    .filter(action => (clickCounts[action.screen] || 0) > 0)
    .sort((a, b) => (clickCounts[b.screen] || 0) - (clickCounts[a.screen] || 0))
    .slice(0, 7);

  // Group actions by category
  const categoriesOrder = [
    "People Management",
    "Academic Management",
    "Operations",
    "Finance",
    "Communication & Support",
  ];

  const groupedActions = filteredQuickActions.reduce((acc, action) => {
    const cat = action.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {} as Record<string, typeof filteredQuickActions>);

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
        <div className="space-y-8">
          {/* Recommended / Most Used section */}
          {recommendedActions.length > 0 && !searchQuery && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  Recommended / Most Used
                </h4>
                <div className="h-px flex-1 bg-violet-100 dark:bg-violet-950/50" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {recommendedActions.map((action, idx) => {
                  const visibilityClass = 
                    idx === 4 ? "hidden lg:flex" :
                    idx === 5 ? "hidden xl:flex" :
                    idx === 6 ? "hidden 2xl:flex" :
                    "flex";

                  return (
                    <button
                      key={`rec-${action.screen}`}
                      type="button"
                      onClick={() => navigateTo(action.screen)}
                      className={cn(
                        "flex-col items-center justify-center p-6 rounded-2xl border border-violet-100 dark:border-violet-950/30 hover:shadow-lg transition-all bg-violet-50/25 dark:bg-violet-950/10 hover:border-violet-200 dark:hover:border-violet-900/50 text-center group gap-3 cursor-pointer",
                        visibilityClass
                      )}
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
                  );
                })}
              </div>
            </div>
          )}

          {categoriesOrder.map((category) => {
            const actions = groupedActions[category];
            if (!actions || actions.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {category}
                  </h4>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                  {actions.map((action) => (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
