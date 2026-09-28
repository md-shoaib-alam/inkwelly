import { useState, useMemo, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Building2, 
  Check, 
  ChevronDown, 
  Users, 
  CircleDot, 
  SlidersHorizontal,
  Download,
  Plus
} from "lucide-react";
import { ROLES, STATUS_OPTIONS, TenantInfo } from "./types";

interface UserFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  tenantFilter: string;
  onTenantFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  tenants: TenantInfo[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  tenantSearch: string;
  onTenantSearchChange: (val: string) => void;
  totalCount: number;
  startItem: number;
  endItem: number;
  onExport?: () => void;
  onAddUser?: () => void;
}

export function UserFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  tenantFilter,
  onTenantFilterChange,
  statusFilter,
  onStatusFilterChange,
  tenants,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  tenantSearch,
  onTenantSearchChange,
  totalCount,
  startItem,
  endItem,
  onExport,
  onAddUser,
}: UserFiltersProps) {
  const [open, setOpen] = useState(false);

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
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.slug.toLowerCase().includes(tenantSearch.toLowerCase())
    );
  }, [tenants, tenantSearch]);

  const hasActiveFilters = search !== "" || roleFilter !== "all" || tenantFilter !== "all" || statusFilter !== "all";

  const handleResetFilters = () => {
    onSearchChange("");
    onRoleFilterChange("all");
    onTenantFilterChange("all");
    onStatusFilterChange("all");
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center">
        {/* Row 1 on mobile: Search Input + Mobile Filters Button */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-9 h-9 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl text-xs placeholder:text-slate-400 shadow-2xs focus-visible:ring-1 focus-visible:ring-blue-500"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Reset / Filters Button (mobile only) */}
          <Button
            variant="outline"
            onClick={hasActiveFilters ? handleResetFilters : undefined}
            className={`sm:hidden h-9 px-3 rounded-xl border-blue-200 dark:border-blue-900/60 bg-[#EFF6FF] hover:bg-blue-100/70 text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400 text-xs font-semibold gap-1.5 transition-colors shrink-0 shadow-2xs ${
              hasActiveFilters ? "ring-1 ring-blue-400" : ""
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filters</span>
          </Button>
        </div>

        {/* Row 2 on mobile: 3 Filter Selects in one row */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="h-9 w-full sm:w-[135px] rounded-xl border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] sm:text-xs font-medium shadow-2xs px-2 sm:px-3 truncate">
              <div className="flex items-center gap-1.5 truncate">
                <Users className="size-3.5 text-slate-400 shrink-0 hidden xs:inline sm:inline" />
                <SelectValue placeholder="All Roles" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value} className="text-xs font-medium">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tenant/School Filter */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="h-9 w-full sm:w-[155px] rounded-xl border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] sm:text-xs font-medium justify-between shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800/80 px-2 sm:px-3 truncate"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="size-3.5 text-slate-400 shrink-0 hidden xs:inline sm:inline" />
                  <span className="truncate">
                    {tenantFilter === "all" ? "All Schools" : (tenants.find(t => t.id === tenantFilter)?.name || "All Schools")}
                  </span>
                </div>
                <ChevronDown className="ml-1 size-3 shrink-0 text-slate-400 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[280px] max-w-sm p-0 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl rounded-xl" align="start">
              <div className="flex items-center border-b px-3 border-slate-200 dark:border-zinc-800">
                <Search className="mr-2 size-3.5 shrink-0 text-slate-400" />
                <Input
                  placeholder="Search schools..."
                  value={tenantSearch}
                  onChange={(e) => onTenantSearchChange(e.target.value)}
                  className="flex h-9 w-full bg-transparent py-2 text-xs outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
                />
              </div>
              <ScrollArea className="h-56 p-1">
                <button
                  type="button"
                  onClick={() => {
                    onTenantFilterChange("all");
                    setOpen(false);
                    onTenantSearchChange("");
                  }}
                  className="flex items-center justify-between w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100">All Schools</span>
                  {tenantFilter === "all" && <Check className="size-3.5 text-blue-600 shrink-0" />}
                </button>

                {filteredTenants.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">No schools found.</div>
                ) : (
                  filteredTenants.map((t, index) => (
                    <button
                      key={t.id}
                      ref={index === filteredTenants.length - 1 ? lastTenantElementRef : undefined}
                      type="button"
                      onClick={() => {
                        onTenantFilterChange(t.id);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate pr-2">{t.name}</span>
                      {tenantFilter === t.id && <Check className="size-3.5 text-blue-600 shrink-0" />}
                    </button>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-9 w-full sm:w-[130px] rounded-xl border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] sm:text-xs font-medium shadow-2xs px-2 sm:px-3 truncate">
              <div className="flex items-center gap-1.5 truncate">
                <CircleDot className="size-3.5 text-slate-400 shrink-0 hidden xs:inline sm:inline" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs font-medium">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset / Filters Button (desktop only) */}
          <Button
            variant="outline"
            onClick={hasActiveFilters ? handleResetFilters : undefined}
            className={`hidden sm:inline-flex h-9 px-3.5 rounded-xl border-blue-200 dark:border-blue-900/60 bg-[#EFF6FF] hover:bg-blue-100/70 text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400 text-xs font-semibold gap-1.5 transition-colors shrink-0 shadow-2xs ${
              hasActiveFilters ? "ring-1 ring-blue-400" : ""
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* Row 3 on mobile / Row 2 on desktop: Counter & Action Buttons */}
      <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          <span className="hidden sm:inline">Showing </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount === 0 ? "0" : `${startItem}–${endItem}`}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount.toLocaleString()}</span>
          <span className="hidden sm:inline"> users</span>
        </p>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={onExport}
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300 text-xs font-semibold gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Export</span>
          </Button>

          {/* Add User Button */}
          <Button
            onClick={onAddUser}
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Add User</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
