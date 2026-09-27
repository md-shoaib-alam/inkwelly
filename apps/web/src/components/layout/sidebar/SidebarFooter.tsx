"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, Crown, KeyRound, LogOut } from "lucide-react";
import type { AppUser } from "@/store/use-app-store";

interface SidebarFooterProps {
  isSuperAdmin: boolean;
  isModernUI?: boolean;
  sidebarOpen: boolean;
  currentUser: AppUser;
  initials: string;
  roleColors: Record<string, string>;
  roleLabels: Record<string, string>;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  onPasswordChange: () => void;
  isMinimal?: boolean;
}

export function SidebarFooter({
  isSuperAdmin,
  isModernUI = true,
  sidebarOpen,
  currentUser,
  initials,
  roleColors,
  roleLabels,
  onNavigate,
  onLogout,
  onPasswordChange,
  isMinimal = false,
}: SidebarFooterProps) {
  const renderProfileInfo = () => (
    <div className="flex items-center gap-2 p-2">
      <Avatar className="size-8">
        <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
        <AvatarFallback
          className={cn(
            "text-white text-[10px] font-semibold",
            roleColors[currentUser.role],
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col space-y-0.5">
        <p className="text-sm font-medium">{currentUser.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {currentUser.email}
        </p>
      </div>
    </div>
  );

  const renderDropdownItems = () => (
    <>
      <DropdownMenuItem 
        className="cursor-pointer gap-2"
        onClick={() => onNavigate("profile")}
      >
        <User className="size-4 text-emerald-500" />
        My Profile
      </DropdownMenuItem>
      {currentUser.role === "admin" && (
        <>
          <DropdownMenuItem 
            className="cursor-pointer gap-2"
            onClick={() => onNavigate("school-subscription")}
          >
            <Crown className="size-4 text-amber-500" />
            My Subscription
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer gap-2"
            onClick={() => onNavigate("school-settings")}
          >
            <Settings className="size-4 text-blue-500" />
            School Settings
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuItem 
        className="cursor-pointer gap-2"
        onClick={onPasswordChange}
      >
        <KeyRound className="size-4 text-orange-500" />
        Change Password
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
        onClick={onLogout}
      >
        <LogOut className="size-4" />
        Logout
      </DropdownMenuItem>
    </>
  );

  return (
    <div
      className={cn(
        isModernUI
          ? cn(
              "p-3 border-t border-slate-200/80 dark:border-zinc-800/80 space-y-3",
              !sidebarOpen && "flex flex-col items-center justify-center p-2"
            )
          : isMinimal
            ? "mb-6 flex items-center justify-center mx-auto"
            : cn(
                "bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-sm",
                sidebarOpen
                  ? "mx-3 mb-3 p-3 rounded-xl"
                  : "size-12 mb-3 rounded-xl flex items-center justify-center mx-auto"
              )
      )}
    >
      {/* "Need Help?" widget matching reference image bottom left */}
      {isModernUI && sidebarOpen && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 p-3.5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-zinc-100 leading-tight">Need Help?</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Contact our support team</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate(isSuperAdmin ? "settings" : currentUser.role === "admin" ? "school-settings" : "tickets")}
            className="w-full h-8 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-2xs"
          >
            Help & Support
          </Button>
        </div>
      )}

      {/* For Super Admin & Admin (isModernUI), render the Help & Support widget only (profile is in header per reference) */}
      {isModernUI ? null : (
        sidebarOpen && !isMinimal ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 w-full cursor-pointer select-none group p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                <Avatar className="size-9">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
                  <AvatarFallback
                    className={cn(
                      "text-white text-xs font-semibold",
                      roleColors[currentUser.role],
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {currentUser.customRole?.name || roleLabels[currentUser.role]}
                  </p>
                </div>

                <div className="size-8 flex items-center justify-center rounded-md transition-colors text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
                  <Settings className="size-4" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" alignOffset={12} side="top" sideOffset={8} className="w-72">
              {renderProfileInfo()}
              <DropdownMenuSeparator />
              {renderDropdownItems()}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" className="p-0 size-11 rounded-full focus-visible:ring-0 hover:bg-transparent">
                  <Avatar className={cn("size-11 cursor-pointer hover:scale-105 transition-all shadow-lg ring-2 ring-white/20", isMinimal && "ring-white/40")}>
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
                    <AvatarFallback
                      className={cn(
                        "text-white text-xs font-semibold",
                        roleColors[currentUser.role],
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isMinimal ? "center" : "start"} side={isMinimal ? "right" : "bottom"} className="w-72 ml-2">
                {renderProfileInfo()}
                <DropdownMenuSeparator />
                {renderDropdownItems()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      )}
    </div>
  );
}
