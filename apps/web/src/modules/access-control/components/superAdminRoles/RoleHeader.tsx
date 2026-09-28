"use client";

import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleHeaderProps {
  onCreateRole: () => void;
  activeTab: "templates" | "roles";
  onTabChange: (tab: "templates" | "roles") => void;
}

export function RoleHeader({
  onCreateRole,
  activeTab,
  onTabChange,
}: RoleHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Segmented Control Toggle */}
      <div className="inline-grid grid-cols-2 h-9 sm:h-10 p-1 rounded-xl bg-muted/70 border border-border w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onTabChange("templates")}
          className={cn(
            "rounded-lg text-xs font-semibold px-4 cursor-pointer transition-all flex items-center justify-center gap-1.5",
            activeTab === "templates"
              ? "bg-card text-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span>Role Templates</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("roles")}
          className={cn(
            "rounded-lg text-xs font-semibold px-4 cursor-pointer transition-all flex items-center justify-center gap-1.5",
            activeTab === "roles"
              ? "bg-card text-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UserCheck className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span>Your Roles</span>
        </button>
      </div>

      <Button
        onClick={onCreateRole}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-xl gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <Plus className="size-3.5 stroke-[2.5]" />
        <span>Create Role</span>
      </Button>
    </div>
  );
}
