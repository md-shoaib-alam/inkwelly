"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ClassItem {
  id: string;
  name: string;
  section: string;
  classLevel?: string;
  slug?: string;
  studentCount?: number;
  todayMarked?: boolean;
  todayPercentage?: number | string;
  todayStatusText?: string;
}

interface ClassRegisterListProps {
  classes: ClassItem[];
  loading: boolean;
  onOpenRegister: (cls: ClassItem) => void;
  onOpenSummary: (cls: ClassItem) => void;
}

export function ClassRegisterList({
  classes,
  loading,
  onOpenRegister,
  onOpenSummary,
}: ClassRegisterListProps) {
  const [search, setSearch] = useState("");

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        `${c.name} - ${c.section}`.toLowerCase().includes(q) ||
        (c.classLevel && c.classLevel.toLowerCase().includes(q))
    );
  }, [classes, search]);

  return (
    <div className="space-y-6">
      {/* Title & Subtitle matching Image 1 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Classes
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Today's attendance by class · {classes.length} classes
        </p>
      </div>

      {/* Search classes... input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-sm focus-visible:ring-emerald-500"
        />
      </div>

      {/* Classes Table Container matching Image 1 */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                <th className="pl-6 py-3.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase w-1/3">
                  CLASS
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase w-1/3">
                  TODAY
                </th>
                <th className="pr-6 py-3.5 text-right text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase w-1/3">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td className="pl-6 py-4">
                      <Skeleton className="h-5 w-28 rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </td>
                    <td className="pr-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-20 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400"
                  >
                    No classes found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const classTitle = `${cls.name} - ${cls.section}`;
                  const isMarked = cls.todayMarked;

                  return (
                    <tr
                      key={cls.id}
                      onClick={() => onOpenRegister(cls)}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                    >
                      {/* CLASS */}
                      <td className="pl-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                          {classTitle}
                        </span>
                      </td>

                      {/* TODAY */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isMarked ? (
                          (() => {
                            let numRate = 0;
                            if (typeof cls.todayPercentage === "number") {
                              numRate = cls.todayPercentage;
                            } else if (typeof cls.todayPercentage === "string") {
                              const p = parseFloat(cls.todayPercentage);
                              if (!isNaN(p)) numRate = p;
                            } else if (
                              cls.todayStatusText &&
                              cls.todayStatusText !== "Marked" &&
                              cls.todayStatusText !== "Not marked"
                            ) {
                              const p = parseFloat(cls.todayStatusText);
                              if (!isNaN(p)) numRate = p;
                            }

                            const formatted = `${numRate.toFixed(1)}%`;
                            const badgeColorClass =
                              numRate >= 75
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : numRate >= 50
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                : "bg-rose-100/90 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300";

                            return (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight transition-colors",
                                  badgeColorClass
                                )}
                              >
                                {formatted}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-zinc-500 font-normal">
                            Not marked
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="pr-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Register Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenRegister(cls);
                            }}
                            className="h-8 px-3 rounded-lg border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 font-medium text-xs gap-1.5 transition-all shadow-2xs"
                          >
                            <BookOpen className="size-3.5 text-slate-500 dark:text-zinc-400" />
                            Register
                          </Button>

                          {/* Summary Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSummary(cls);
                            }}
                            className="h-8 px-3 rounded-lg border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 font-medium text-xs gap-1.5 transition-all shadow-2xs"
                          >
                            <BarChart2 className="size-3.5 text-slate-500 dark:text-zinc-400" />
                            Summary
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
