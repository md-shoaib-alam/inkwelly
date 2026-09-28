"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Search, UserMinus, UserPlus, Users, X, ChevronDown } from "lucide-react";
import type { RoleRecord, UserRecord } from "./types";

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRole: RoleRecord | null;
  loading: boolean;
  assignedUsers: UserRecord[];
  filteredAvailable: UserRecord[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  assigningLoading: string | null;
  onAssignChange: (userId: string, targetRoleId: string | null) => void;
}

export function AssignRoleDialog({
  open,
  onOpenChange,
  activeRole,
  loading,
  assignedUsers,
  filteredAvailable,
  searchQuery,
  setSearchQuery,
  assigningLoading,
  onAssignChange,
}: AssignRoleDialogProps) {
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const [visibleCount, setVisibleCount] = useState(15);
  const [isAssignedExpanded, setIsAssignedExpanded] = useState(true);

  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, open]);

  const displayedAvailable = useMemo(() => {
    return filteredAvailable.slice(0, visibleCount);
  }, [filteredAvailable, visibleCount]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredAvailable.length) {
          setVisibleCount((prev) => prev + 15);
        }
      });
      if (node) observer.current.observe(node);
    },
    [visibleCount, filteredAvailable.length]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] p-0 overflow-hidden flex flex-col rounded-2xl border-none bg-card shadow-2xl">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <UserPlus className="size-5 text-blue-600" />
            Manage Staff: {activeRole?.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Assign or remove this role from teachers and staff members
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5 scrollbar-thin">
              {/* Assigned Users */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsAssignedExpanded(!isAssignedExpanded)}
                  className="w-full flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-1.5 px-1 hover:bg-zinc-55 dark:hover:bg-zinc-800/30 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-emerald-500 shrink-0" />
                    <span>Assigned Staff ({assignedUsers.length})</span>
                  </div>
                  <ChevronDown 
                    className={`size-4 text-zinc-400 transition-transform duration-200 ${
                      isAssignedExpanded ? "rotate-180" : ""
                    }`} 
                  />
                </button>

                {isAssignedExpanded && (
                  assignedUsers.length === 0 ? (
                    <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center bg-zinc-50 dark:bg-zinc-800/40 border border-dashed rounded-xl">
                      No staff assigned yet. Add from the list below.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {assignedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-xl border bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/10 dark:border-emerald-800/30"
                        >
                          <Avatar className="size-8.5 shrink-0">
                            <AvatarFallback
                              className="text-white text-xs font-bold"
                              style={{ backgroundColor: activeRole?.color }}
                            >
                              {getInitial(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                            onClick={() => onAssignChange(user.id, null)}
                            disabled={assigningLoading === user.id}
                          >
                            {assigningLoading === user.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <UserMinus className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              <Separator />

              {/* Available Users */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-750 dark:text-zinc-350 mb-2.5 flex items-center gap-2">
                  <UserPlus className="size-4 text-blue-500 shrink-0" />
                  <span>Available to Assign ({filteredAvailable.length})</span>
                </h4>
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 dark:text-zinc-500" />
                  <Input
                    placeholder="Search teachers & staff..."
                    className="pl-9 h-9.5 text-xs sm:text-sm rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <ScrollArea className="max-h-[200px] overflow-y-auto pr-1">
                  {filteredAvailable.length === 0 ? (
                    <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center">
                      {searchQuery
                        ? "No users found matching your search."
                        : "All users already have a role assigned."}
                    </p>
                  ) : (
                    <div className="space-y-1.5 pb-2">
                      {displayedAvailable.map((user, idx) => {
                        const isLast = idx === displayedAvailable.length - 1;
                        return (
                          <div
                            key={user.id}
                            ref={isLast ? lastElementRef : undefined}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-800/60"
                          >
                            <Avatar className="size-7.5 shrink-0">
                              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 text-xs font-bold">
                                {getInitial(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-zinc-850 dark:text-zinc-200 font-medium truncate">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-550 truncate">
                                {user.email}
                              </p>
                            </div>
                            {user.customRole && (
                              <Badge
                                variant="outline"
                                className="text-[9px] shrink-0 hidden sm:inline-flex uppercase tracking-wider font-semibold"
                                style={{
                                  borderColor: user.customRole.color + "40",
                                  color: user.customRole.color,
                                }}
                              >
                                {user.customRole.name}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 shrink-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                              onClick={() => onAssignChange(user.id, activeRole!.id)}
                              disabled={assigningLoading === user.id}
                            >
                              {assigningLoading === user.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                      {visibleCount < filteredAvailable.length && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="size-4 animate-spin text-zinc-400" />
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
            {/* Footer Done action */}
            <div className="p-4 bg-secondary/15 border-t shrink-0 flex justify-end">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/10 px-6"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
