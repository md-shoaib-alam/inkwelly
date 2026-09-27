"use client";

import { Crown, IndianRupee, Building2, Plus, Search, Check, ChevronsUpDown, Loader2, Users, BarChart3, UserX, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubscriptionStatsProps {
  stats: any;
  selectedTenant: string;
  onTenantChange: (value: string) => void;
  tenants: any[];
  onNewSetup: () => void;
  parentsTotal: number;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  tenantSearch: string;
  onTenantSearchChange: (value: string) => void;
}

export function SubscriptionStats({
  stats,
  selectedTenant,
  onTenantChange,
  tenants,
  onNewSetup,
  parentsTotal,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  tenantSearch,
  onTenantSearchChange,
}: SubscriptionStatsProps) {
  const [open, setOpen] = useState(false);
  const [showStatsOnMobile, setShowStatsOnMobile] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastTenantElementRef = useCallback((node: HTMLButtonElement | null) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && fetchNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) =>
      t.name.toLowerCase().includes(tenantSearch.toLowerCase())
    );
  }, [tenants, tenantSearch]);

  const activePlans = stats?.activeSubscriptions || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const avgValue = stats?.totalSubscriptions
    ? Math.round(totalRevenue / stats.totalSubscriptions)
    : 0;
  const nonSubscribers = !selectedTenant
    ? null
    : Math.max(0, parentsTotal - (stats?.totalSubscriptions || 0));

  return (
    <div className="space-y-4">
      {/* 1. Header Card: School selector + New Setup button */}
      <div className="rounded-2xl border border-border bg-card shadow-2xs p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Title: hidden on mobile because the hero banner above already has this title */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Crown className="size-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">B2C User Subscriptions</h3>
            <p className="text-xs text-muted-foreground">Manage premium access across all schools</p>
          </div>
        </div>

        {/* Controls — full-width row on mobile, auto on desktop */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* School selector — grows to fill on mobile */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 px-2.5 h-9 flex-1 sm:flex-none transition-colors">
            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={open}
                  className="flex-1 sm:w-[190px] justify-between cursor-pointer h-7 font-semibold px-1 text-xs hover:bg-transparent"
                >
                  <span className="truncate">
                    {selectedTenant ? (tenants.find(t => t.id === selectedTenant)?.name || "Select School") : "Select School"}
                  </span>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 border border-border rounded-xl bg-popover shadow-xl" align="end">
                <div className="flex items-center border-b px-3 border-border">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search schools..."
                    value={tenantSearch}
                    onChange={(e) => onTenantSearchChange(e.target.value)}
                    className="flex h-9 w-full rounded-md bg-transparent py-3 text-xs outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                  />
                </div>
                <ScrollArea className="h-48 p-1">
                  {filteredTenants.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">No schools found.</div>
                  ) : (
                    <>
                      {filteredTenants.map((t, index) => (
                        <button
                          key={`${t.id}-${index}`}
                          ref={index === filteredTenants.length - 1 ? lastTenantElementRef : null}
                          onClick={() => {
                            onTenantChange(t.id);
                            setOpen(false);
                            onTenantSearchChange("");
                          }}
                          className="flex items-center justify-between w-full text-left px-3 py-1.5 text-xs hover:bg-muted rounded-md transition-colors cursor-pointer"
                        >
                          <span className="font-medium truncate pr-2">{t.name}</span>
                          {selectedTenant === t.id && (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                      {isFetchingNextPage && (
                        <div className="flex items-center justify-center p-2 text-muted-foreground gap-1.5">
                          <Loader2 className="size-3 animate-spin" />
                          <span className="text-xs">Loading...</span>
                        </div>
                      )}
                    </>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* New Setup button */}
          <Button
            className="h-9 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs cursor-pointer"
            onClick={onNewSetup}
          >
            <Plus className="size-3.5" />
            <span>New Setup</span>
          </Button>
        </div>
      </div>

      {/* Mobile Toggle Dropdown Button for Stats */}
      <div className="flex sm:hidden items-center justify-between">
        <button
          type="button"
          onClick={() => setShowStatsOnMobile((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="size-3.5" />
            </div>
            <span>Subscription Overview Stats</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{showStatsOnMobile ? "Hide" : "Show"}</span>
            {showStatsOnMobile ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </div>
        </button>
      </div>

      {/* 2. Separate Stats Card — collapsible on mobile, always visible on desktop */}
      <div className={`${showStatsOnMobile ? "block" : "hidden"} sm:block rounded-2xl border border-border bg-card shadow-2xs overflow-hidden`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
          {/* Active Plans */}
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="size-7 sm:size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <Users className="size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-tight">Active plans</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{activePlans}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">+0 this month</p>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="size-7 sm:size-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                  <IndianRupee className="size-3.5 sm:size-4 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-tight">Total revenue</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-0.5">
                <span className="text-sm sm:text-base font-semibold">₹</span>
                {totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">+0 this month</p>
            </div>
          </div>

          {/* Avg Plan Value */}
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="size-7 sm:size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <BarChart3 className="size-3.5 sm:size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-tight">Avg plan value</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-0.5">
                <span className="text-sm sm:text-base font-semibold">₹</span>
                {avgValue.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">+0 this month</p>
            </div>
          </div>

          {/* Non-subscribers */}
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="size-7 sm:size-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                  <UserX className="size-3.5 sm:size-4 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-tight">Non-subscribers</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                {nonSubscribers === null ? "–" : nonSubscribers}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {nonSubscribers === null ? "No data yet" : "without a plan"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
