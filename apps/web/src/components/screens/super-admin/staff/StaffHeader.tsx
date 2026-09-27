import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ShieldCheck, LayoutGrid, List } from "lucide-react";
import { StaffViewMode } from "./types";

interface StaffHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  canCreate: boolean;
  onAddClick: () => void;
  viewMode: StaffViewMode;
  onViewModeChange: (mode: StaffViewMode) => void;
}

export function StaffHeader({
  search,
  onSearchChange,
  canCreate,
  onAddClick,
  viewMode,
  onViewModeChange,
}: StaffHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Hero Banner with staff illustration */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-50/90 via-purple-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900 border border-purple-100/90 dark:border-purple-900/40 px-4 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-purple-400/15 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 right-10 w-48 h-36 bg-indigo-300/15 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Copy */}
          <div className="max-w-md min-w-0">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-200/60 dark:border-purple-800/40 shadow-2xs">
              <ShieldCheck className="size-3 text-purple-600 dark:text-purple-400" />
              <span>Staff Access</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-1 sm:mt-1.5">
              Platform Staff. Role Controls.
            </h3>

            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 leading-snug font-normal">
              Manage platform operations, permissions, and administrative staff members.
            </p>
          </div>

          {/* Right 3D Illustration */}
          <div className="relative flex items-center justify-end shrink-0 pr-0.5 sm:pr-2">
            <div className="relative h-14 sm:h-20 md:h-22 aspect-[16/9] overflow-hidden select-none">
              <Image
                src="/assets/super-admin/stafftop.avif"
                alt="Staff Management"
                fill
                priority
                className="object-contain scale-125 drop-shadow-md"
                sizes="(max-width: 640px) 110px, (max-width: 768px) 160px, 200px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Staff Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create platform staff accounts with restricted role-based permissions
          </p>
        </div>
      <div className="flex gap-2 items-center w-full sm:w-auto">
        <div className="relative max-w-xs flex-1 sm:flex-none w-full sm:w-60 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground opacity-50 group-focus-within:opacity-100 transition-opacity" />
          <Input
            placeholder="Search by name, email, phone..."
            className="pl-9 h-9 text-sm rounded-lg border focus-visible:ring-primary/20 focus-visible:border-primary"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* View Mode Toggle (Desktop) */}
        <div className="hidden sm:flex items-center bg-muted/60 dark:bg-slate-900 border border-border p-0.5 rounded-xl h-9 shrink-0 shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            className={`size-7.5 rounded-lg transition-colors ${
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
            className={`size-7.5 rounded-lg transition-colors ${
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

        {canCreate && (
          <Button
            className="h-9 px-4 text-sm rounded-lg shrink-0 gap-1.5"
            onClick={onAddClick}
          >
            <Plus className="size-3.5" />
            Add Staff
          </Button>
        )}
      </div>
    </div>
    </div>
  );
}
