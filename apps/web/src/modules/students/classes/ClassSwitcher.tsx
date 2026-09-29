"use client";

import { useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatGradeLabel, CLASS_GRADES } from "@/lib/class-options";
import type { ClassInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ClassSwitcherProps {
  /** Every class the school has, not the filtered page the list screen shows. */
  classes: ClassInfo[];
  /** The tenant-wide count, so the label stays true when the list is capped. */
  classCount: number;
  currentId: string;
  onPick: (cls: ClassInfo) => void;
  onAllClasses: () => void;
}

// One row per grade, its sections as chips — the shape the reference uses, because a
// school thinks in "1st, section A" rather than in a flat list of fourteen strings.
const GRADE_ORDER = new Map(CLASS_GRADES.map((g, i) => [g, i]));

export function ClassSwitcher({ classes, classCount, currentId, onPick, onAllClasses }: ClassSwitcherProps) {
  const groups = useMemo(() => {
    const byGrade = new Map<string, ClassInfo[]>();
    for (const cls of classes) {
      const list = byGrade.get(cls.grade);
      if (list) list.push(cls);
      else byGrade.set(cls.grade, [cls]);
    }
    return [...byGrade.entries()]
      .sort((a, b) => (GRADE_ORDER.get(a[0]) ?? 99) - (GRADE_ORDER.get(b[0]) ?? 99))
      .map(([grade, sections]) => ({
        grade,
        sections: [...sections].sort((a, b) => a.section.localeCompare(b.section)),
      }));
  }, [classes]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronDown className="size-4" />
          <span className="text-[13px] font-medium">Switch class</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] rounded-xl p-0">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">Switch class</p>
          <p className="text-[12.5px] text-slate-500 dark:text-zinc-400">{classCount} classes</p>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {groups.map((group) => (
            <div key={group.grade} className="flex items-start gap-2 px-2 py-1.5">
              <span className="w-24 shrink-0 pt-1 text-[12.5px] font-medium text-slate-600 dark:text-zinc-300">
                {formatGradeLabel(group.grade)}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.sections.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => onPick(cls)}
                    className={cn(
                      "inline-flex min-w-[30px] items-center justify-center gap-1 rounded-md border px-2 py-1 text-[12px] font-semibold transition-colors cursor-pointer",
                      cls.id === currentId
                        ? "border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-600 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-teal-400",
                    )}
                  >
                    {cls.id === currentId && <Check className="size-3" />}
                    {cls.section}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 p-2 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onAllClasses}
            className="w-full justify-start text-[13px] font-semibold text-teal-700 dark:text-teal-400"
          >
            All classes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
