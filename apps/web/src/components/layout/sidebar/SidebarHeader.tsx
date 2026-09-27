"use client";

import { Button } from "@/components/ui/button";
import { GraduationCap, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/store/use-app-store";

interface SidebarHeaderProps {
  isSuperAdmin: boolean;
  isModernUI?: boolean;
  sidebarOpen: boolean;
  tenantLogo: string | null;
  tenantName: string | null;
  currentUser: AppUser;
  onToggle: () => void;
}

export function SidebarHeader({
  isSuperAdmin,
  isModernUI = true,
  sidebarOpen,
  tenantLogo,
  tenantName,
  currentUser,
  onToggle,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        isModernUI
          ? cn(
              "px-5 py-4 flex items-center border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-[#0A0A0A]",
              sidebarOpen ? "justify-between" : "justify-center"
            )
          : cn(
              "mt-3 mb-2 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center",
              sidebarOpen
                ? "mx-3 p-3 rounded-xl justify-between"
                : "size-12 rounded-xl justify-center mx-auto"
            )
      )}
    >
      <div className={cn("flex items-center gap-3", !sidebarOpen && "lg:gap-0 lg:justify-center")}>
        {sidebarOpen && (
          <>
            {/* SchoolConnect Graduation Cap or School Logo Container */}
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center text-white shadow-xs overflow-hidden shrink-0",
                isSuperAdmin 
                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20" 
                  : "border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
              )}
            >
              {!isSuperAdmin ? (
                <img 
                  src={tenantLogo || currentUser?.tenantLogo || "/test.webp"} 
                  alt={tenantName || "School Logo"} 
                  className="size-full object-cover" 
                  loading="eager"
                />
              ) : (
                <GraduationCap className="size-6 text-white" />
              )}
            </div>
            <div className="transition-all duration-300">
              <h2
                className={cn(
                  "font-extrabold text-base leading-tight tracking-tight",
                  isSuperAdmin
                    ? "text-[#1E3A8A] dark:text-blue-400"
                    : "text-zinc-900 dark:text-zinc-100",
                )}
              >
                {isSuperAdmin
                  ? "SchoolConnect"
                  : tenantName || currentUser?.tenantName || "Demo Academy"}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {isSuperAdmin
                  ? "Platform Console"
                  : currentUser?.role === "teacher"
                  ? "Teacher Portal"
                  : currentUser?.role === "student"
                  ? "Student Portal"
                  : currentUser?.role === "parent"
                  ? "Parent Portal"
                  : currentUser?.role === "staff"
                  ? "Staff Portal"
                  : "Admin Portal"}
              </p>
            </div>
          </>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-8 transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 rounded-lg",
          isModernUI
            ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900",
        )}
        onClick={onToggle}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeftOpen className="size-4" />
        )}
      </Button>
    </div>
  );
}
