"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Menu, ShieldCheck, School, Calendar, PanelLeftClose, PanelLeftOpen, LayoutDashboard, User, Crown, Settings as SettingsIcon, KeyRound, LogOut, ChevronDown } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { type NavItem, roleColors, roleLabels } from "./nav-config";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  items: NavItem[];
  resolvedScreen: string;
  layoutPref?: string | null;
  onPasswordChange?: () => void;
}

export function Header({ items, resolvedScreen, layoutPref = "comprehensive", onPasswordChange }: HeaderProps) {
  const { push, replace } = useRouter();
  const {
    currentUser,
    toggleSidebar,
    currentTenantName,
    sidebarOpen,
    setCurrentScreen,
    logout
  } = useAppStore();

  const isModernUI = true;
  const [prefFromStorage, setPrefFromStorage] = useState<string | null>(null);

  useEffect(() => {
    const readPref = () => {
      if (typeof window === "undefined") return;
      const isStaff = currentUser?.role === "staff";
      if (isStaff) {
        const p = localStorage.getItem("schoolsaas_staff_sidebar_preference");
        setPrefFromStorage(p === "enabled" ? "comprehensive" : "minimal");
      } else {
        const p = localStorage.getItem("schoolsaas_dashboard_layout_preference");
        setPrefFromStorage(p || "comprehensive");
      }
    };

    readPref();

    const handlePrefChange = () => {
      readPref();
    };

    window.addEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
    window.addEventListener("schoolsaas_staff_sidebar_pref_changed", handlePrefChange);
    window.addEventListener("storage", handlePrefChange);
    return () => {
      window.removeEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
      window.removeEventListener("schoolsaas_staff_sidebar_pref_changed", handlePrefChange);
      window.removeEventListener("storage", handlePrefChange);
    };
  }, [currentUser]);

  const effectiveIsMinimal = layoutPref === "minimal" || prefFromStorage === "minimal";
  const shouldShowDashboard = resolvedScreen !== "dashboard" && effectiveIsMinimal;

  const dates = useMemo(() => {
    const now = new Date();
    return {
      weekday: now.toLocaleDateString("en-GB", { weekday: "long" }),
      shortWeekday: now.toLocaleDateString("en-GB", { weekday: "short" }),
      date: now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      compact: now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      full: now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      short: now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    };
  }, []);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === "super_admin";
  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    const tid = currentUser.tenantSlug || currentUser.tenantId;
    if (tid) {
      push(`/${tid}/${screen}`);
    } else {
      push(`/${screen}`);
    }
  };

  return (
    <header className="shrink-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {!effectiveIsMinimal && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden size-8.5 sm:size-10 shrink-0 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-all"
            onClick={toggleSidebar}
          >
            <Menu className="size-4.5 sm:size-5" />
          </Button>
        )}

        {/* Back to Dashboard Button when in Minimal Mode */}
        {shouldShowDashboard && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 h-8.5 sm:h-9 px-2.5 sm:px-3.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
            onClick={() => navigateTo("dashboard")}
          >
            <LayoutDashboard className="size-3.5 sm:size-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Button>
        )}

        {!isModernUI && !shouldShowDashboard && (
          <h1 className="text-sm sm:text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {resolvedScreen === "profile"
              ? "My Profile"
              : items.find((i) => i.key === resolvedScreen)?.label || "Dashboard"}
          </h1>
        )}

        {/* Date Display Chip */}
        <div
          className={cn(
            "items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 shadow-2xs select-none whitespace-nowrap shrink-0",
            shouldShowDashboard ? "hidden md:flex" : "flex",
            !effectiveIsMinimal && "hidden sm:flex"
          )}
          suppressHydrationWarning
        >
          <Calendar className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          {/* Compact on mobile: Wed, 16 Sep */}
          <span className="sm:hidden font-semibold text-slate-900 dark:text-zinc-100">
            {dates.shortWeekday}, {dates.compact}
          </span>
          {/* Full on sm+: Wednesday, 16 September 2026 */}
          <span className="hidden sm:inline font-semibold text-slate-900 dark:text-zinc-100">
            {dates.weekday},
          </span>
          <span className="hidden sm:inline text-slate-500 dark:text-zinc-400">
            {dates.date}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <NotificationBell />
        <ThemeToggle />

        {/* Subtle Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5 sm:mx-1 hidden sm:block" />

        {/* User profile dropdown */}
        {(effectiveIsMinimal || isModernUI) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="size-8.5 sm:size-auto sm:h-10 p-0 sm:pl-1.5 sm:pr-3 sm:py-1 sm:gap-2.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-100/90 dark:hover:bg-zinc-800 shadow-2xs transition-all cursor-pointer group focus-visible:ring-0 shrink-0 flex items-center justify-center"
              >
                <Avatar className={cn(
                  "size-7 sm:size-7.5 cursor-pointer shadow-xs",
                  currentUser.role === "super_admin"
                    ? "ring-2 ring-blue-500/25"
                    : currentUser.role === "admin"
                    ? "ring-2 ring-emerald-500/25"
                    : currentUser.role === "teacher"
                    ? "ring-2 ring-blue-500/25"
                    : currentUser.role === "staff"
                    ? "ring-2 ring-orange-500/25"
                    : currentUser.role === "student"
                    ? "ring-2 ring-violet-500/25"
                    : "ring-2 ring-amber-500/25"
                )}>
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
                  <AvatarFallback
                    className={cn(
                      "text-white text-[10px] sm:text-[11px] font-bold",
                      roleColors[currentUser.role],
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium leading-none mt-0.5">
                    {roleLabels[currentUser.role] || (isSuperAdmin ? "Super Admin" : "School Admin")}
                  </span>
                </div>
                <ChevronDown className="hidden sm:block size-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-transform duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl p-1.5 shadow-xl shadow-black/20 border-slate-200/80 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 mb-1">
                <Avatar className="size-9 ring-2 ring-white dark:ring-zinc-800 shadow-xs">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
                  <AvatarFallback className={cn("text-white text-xs font-bold", roleColors[currentUser.role])}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{currentUser.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200" onClick={() => navigateTo("profile")}>
                <User className="size-4 text-blue-500" />
                My Profile
              </DropdownMenuItem>
              {currentUser.role === "admin" && (
                <>
                  <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200" onClick={() => navigateTo("school-subscription")}>
                    <Crown className="size-4 text-amber-500" />
                    My Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200" onClick={() => navigateTo("school-settings")}>
                    <SettingsIcon className="size-4 text-blue-500" />
                    School Settings
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200" onClick={() => onPasswordChange?.()}>
                <KeyRound className="size-4 text-orange-500" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30" onClick={() => { logout(); window.location.href = "/"; }}>
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
