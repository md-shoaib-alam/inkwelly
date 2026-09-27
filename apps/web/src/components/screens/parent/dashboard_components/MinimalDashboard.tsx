"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Baby, 
  GraduationCap, 
  UserCheck, 
  Coins, 
  Bell, 
  Clock, 
  Calendar, 
  LifeBuoy, 
  Sparkles,
  User,
  KeyRound,
  LogOut,
  FileText,
  BookOpen,
  ClipboardList
} from "lucide-react";

interface QuickAction {
  label: string;
  screen: string;
  category: string;
  color: string;
  icon: React.ReactNode;
  isAction?: boolean;
}

const parentQuickActions: QuickAction[] = [
  {
    label: "My Children",
    screen: "children",
    category: "Operations",
    color: "bg-blue-600 dark:bg-blue-500",
    icon: <Baby className="size-5" />
  },
  {
    label: "Fees",
    screen: "fees",
    category: "Operations",
    color: "bg-emerald-600 dark:bg-emerald-500",
    icon: <Coins className="size-5" />
  },
  {
    label: "Subscription",
    screen: "subscription",
    category: "Operations",
    color: "bg-indigo-600 dark:bg-indigo-500",
    icon: <Sparkles className="size-5" />
  },
  {
    label: "Homework",
    screen: "homework",
    category: "Academics",
    color: "bg-amber-600 dark:bg-amber-500",
    icon: <FileText className="size-5" />
  },
  {
    label: "School Exams",
    screen: "school-exams",
    category: "Academics",
    color: "bg-violet-600 dark:bg-violet-500",
    icon: <BookOpen className="size-5" />
  },
  {
    label: "Assessments",
    screen: "assessments",
    category: "Academics",
    color: "bg-purple-600 dark:bg-purple-500",
    icon: <ClipboardList className="size-5" />
  },
  {
    label: "Attendance",
    screen: "attendance",
    category: "Academics",
    color: "bg-teal-600 dark:bg-teal-500",
    icon: <UserCheck className="size-5" />
  },
  {
    label: "Timetable",
    screen: "timetable",
    category: "Academics",
    color: "bg-sky-600 dark:bg-sky-500",
    icon: <Clock className="size-5" />
  },
  {
    label: "Notices",
    screen: "notices",
    category: "Support & Info",
    color: "bg-rose-600 dark:bg-rose-500",
    icon: <Bell className="size-5" />
  },
  {
    label: "Calendar",
    screen: "calendar",
    category: "Support & Info",
    color: "bg-amber-600 dark:bg-amber-500",
    icon: <Calendar className="size-5" />
  },
  {
    label: "Tickets",
    screen: "tickets",
    category: "Support & Info",
    color: "bg-zinc-600 dark:bg-zinc-500",
    icon: <LifeBuoy className="size-5" />
  },
  {
    label: "My Profile",
    screen: "profile",
    category: "Account & Settings",
    color: "bg-emerald-500",
    icon: <User className="size-5" />
  },
  {
    label: "Change Password",
    screen: "change-password-action",
    category: "Account & Settings",
    color: "bg-orange-500",
    icon: <KeyRound className="size-5" />,
    isAction: true
  },
  {
    label: "Log Out",
    screen: "logout-action",
    category: "Account & Settings",
    color: "bg-red-500",
    icon: <LogOut className="size-5" />,
    isAction: true
  }
];

export function MinimalDashboard() {
  const { push, replace } = useRouter();
  const { currentUser, currentTenantSlug, currentTenantId, setCurrentScreen, logout } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("schoolsaas_parent_action_clicks");
        if (stored) {
          setClickCounts(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load action clicks", e);
      }
    }
  }, []);

  const navigateTo = (screen: string) => {
    if (screen === "logout-action") {
      logout();
      replace("/");
      return;
    }

    if (screen === "change-password-action") {
       window.dispatchEvent(new CustomEvent("open-change-password"));
       return;
    }

    try {
      const updated = {
        ...clickCounts,
        [screen]: (clickCounts[screen] || 0) + 1
      };
      setClickCounts(updated);
      localStorage.setItem("schoolsaas_parent_action_clicks", JSON.stringify(updated));
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

  const filteredQuickActions = parentQuickActions.filter((action) => {
    const query = searchQuery.toLowerCase();
    return action.label.toLowerCase().includes(query) || action.category.toLowerCase().includes(query);
  });

  // Get top 4 most used actions (clicked at least once)
  const recommendedActions = parentQuickActions
    .filter(action => (clickCounts[action.screen] || 0) > 0)
    .sort((a, b) => (clickCounts[b.screen] || 0) - (clickCounts[a.screen] || 0))
    .slice(0, 4);

  // Group actions by category
  const categoriesOrder = ["Academics", "Operations", "Support & Info", "Account & Settings"];

  const groupedActions = filteredQuickActions.reduce((acc, action) => {
    const cat = action.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {} as Record<string, typeof filteredQuickActions>);

  return (
    <div className="space-y-8 w-full mt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Quick Actions
          </h3>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:max-w-[280px] group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Search dashboard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 text-zinc-800 dark:text-zinc-200 shadow-sm transition-all placeholder:text-zinc-500"
          />
        </div>
      </div>

      {filteredQuickActions.length === 0 ? (
        <div className="py-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            No matching quick actions found. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Recommended / Most Used section */}
          {recommendedActions.length > 0 && !searchQuery && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Sparkles className="size-3" />
                  Recommended
                </h4>
                <div className="h-px flex-1 bg-amber-200 dark:bg-amber-900/30" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recommendedActions.map((action) => (
                  <button
                    key={`rec-${action.screen}`}
                    type="button"
                    onClick={() => navigateTo(action.screen)}
                    className="flex flex-col items-center justify-center p-6 rounded-3xl border border-amber-200/60 dark:border-amber-900/20 hover:shadow-xl hover:shadow-amber-500/10 transition-all bg-white dark:bg-zinc-950 hover:border-amber-500/50 text-center group gap-4 cursor-pointer"
                  >
                    <div
                      className={`p-4 rounded-2xl text-white ${action.color} transition-all group-hover:scale-110 shadow-lg`}
                    >
                      {action.icon}
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 tracking-tight">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {categoriesOrder.map((category) => {
            const actions = groupedActions[category];
            if (!actions || actions.length === 0) return null;

            return (
              <div key={category} className="space-y-5">
                <div className="flex items-center gap-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                    {category}
                  </h4>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-900" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {actions.map((action) => (
                    <button
                      key={action.screen}
                      type="button"
                      onClick={() => navigateTo(action.screen)}
                      className="flex flex-col items-center justify-center p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:shadow-zinc-500/5 transition-all bg-white dark:bg-zinc-950 hover:border-amber-500/30 text-center group gap-4 cursor-pointer"
                    >
                      <div
                        className={`p-4 rounded-2xl text-white ${action.color} transition-all group-hover:scale-110 shadow-md`}
                      >
                        {action.icon}
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 tracking-tight">
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
