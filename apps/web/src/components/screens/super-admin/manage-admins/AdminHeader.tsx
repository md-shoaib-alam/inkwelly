import Image from "next/image";
import { Search, Plus, ShieldCheck, LayoutGrid, List, Users, UserCheck, UserX, Clock, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminViewMode, AdminRecord, formatDate } from "./types";
import { useState } from "react";

interface AdminHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onAddClick: () => void;
  viewMode: AdminViewMode;
  onViewModeChange: (mode: AdminViewMode) => void;
  admins: AdminRecord[];
}

export function AdminHeader({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddClick,
  viewMode,
  onViewModeChange,
  admins,
}: AdminHeaderProps) {
  const [showStatsOnMobile, setShowStatsOnMobile] = useState(false);

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.isActive).length;
  const inactiveAdmins = admins.filter((a) => !a.isActive).length;
  const latestAdmin = admins.length > 0 ? admins[admins.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Hero Banner with roletop illustration */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/90 dark:border-blue-900/40 px-4 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 right-10 w-48 h-36 bg-sky-300/15 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Copy */}
          <div className="max-w-md min-w-0">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/40 shadow-2xs">
              <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400" />
              <span>Platform Administration</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-1 sm:mt-1.5">
              Manage Admins. Complete Control.
            </h3>

            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 leading-snug font-normal">
              Create and manage platform super administrator accounts with root-level access.
            </p>
          </div>

          {/* Right 3D Illustration */}
          <div className="relative flex items-center justify-end shrink-0 pr-0.5 sm:pr-2">
            <div className="relative h-14 sm:h-20 md:h-22 aspect-[16/9] overflow-hidden select-none">
              <Image
                src="/assets/super-admin/mangeadmintop.avif"
                alt="Manage Admins"
                fill
                priority
                className="object-contain scale-125 drop-shadow-md"
                sizes="(max-width: 640px) 110px, (max-width: 768px) 160px, 200px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Root Owner Advisory Note - hidden on mobile, visible on desktop */}
      <div className="hidden sm:block rounded-xl border border-border bg-muted/40 p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">
              Platform Admin Accounts
            </p>
            <p className="text-muted-foreground mt-0.5 leading-normal">
              Super admins have full access to all schools, billing, and platform settings. The root platform owner is protected and cannot be modified or deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button for Stats */}
      <div className="block sm:hidden">
        <button
          type="button"
          onClick={() => setShowStatsOnMobile((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-800/40">
              <BarChart3 className="size-3.5" />
            </div>
            <span className="font-semibold text-xs">Admin Overview Stats ({totalAdmins} Total)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span>{showStatsOnMobile ? "Hide" : "Show"}</span>
            {showStatsOnMobile ? (
              <ChevronUp className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </button>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className={`${showStatsOnMobile ? "grid" : "hidden"} sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`}>
        {/* Total Admins */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="size-3.5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate">
              Total Admins
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2.5">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {totalAdmins}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
            Platform administrators
          </p>
        </div>

        {/* Active Admins */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="size-3.5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate">
              Active Admins
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2.5">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {activeAdmins}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
            Currently active
          </p>
        </div>

        {/* Inactive Admins */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <UserX className="size-3.5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate">
              Inactive Admins
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2.5">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {inactiveAdmins}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
            Currently suspended
          </p>
        </div>

        {/* Last Created */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Clock className="size-3.5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate">
              Last Created
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2.5">
            <span className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
              {latestAdmin ? formatDate(latestAdmin.createdAt) : "None"}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
            Most recent admin
          </p>
        </div>
      </div>

      {/* Search, Filter, View Mode, and Add Button Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground opacity-50 group-focus-within:opacity-100 transition-opacity" />
          <Input
            placeholder="Search admins by name or email..."
            className="pl-9 h-9 text-xs rounded-xl border bg-card placeholder:text-muted-foreground focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs rounded-xl bg-card border-border">
              <div className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${statusFilter === "inactive" ? "bg-rose-500" : "bg-emerald-500"}`} />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle (Desktop only) */}
          <div className="hidden sm:flex items-center bg-muted/60 dark:bg-slate-900 border border-border p-0.5 rounded-xl h-9 shrink-0 shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              className={`size-7.5 rounded-lg transition-colors cursor-pointer ${
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
              className={`size-7.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onViewModeChange("table")}
              title="List View"
            >
              <List className="size-3.5" />
            </Button>
          </div>

          <Button
            className="h-9 px-3 sm:px-4 text-xs font-semibold rounded-xl shrink-0 gap-1.5 cursor-pointer shadow-2xs"
            onClick={onAddClick}
          >
            <Plus className="size-3.5" />
            <span>Add Super Admin</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

