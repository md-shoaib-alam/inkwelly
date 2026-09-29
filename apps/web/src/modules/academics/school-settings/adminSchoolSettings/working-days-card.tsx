import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ALL_DAYS, DayKey } from "./types";

interface WorkingDaysSettingsCardProps {
  workingDays: Set<DayKey>;
  onToggleDay: (dayKey: DayKey) => void;
  onQuickSelect: (days: DayKey[]) => void;
}

export function WorkingDaysSettingsCard({
  workingDays,
  onToggleDay,
  onQuickSelect,
}: WorkingDaysSettingsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Working Days</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          {ALL_DAYS.map((day) => {
            const isSelected = workingDays.has(day.key);
            const isLastSelected = isSelected && workingDays.size <= 1;

            return (
              <label
                key={day.key}
                className={`
                  flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors
                  ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                  }
                  ${isLastSelected && !isSelected ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleDay(day.key)}
                  disabled={isLastSelected && isSelected}
                  className="size-3.5"
                />
                <span className="text-[11px] sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {day.label}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-1">
          <span>Quick Select:</span>
          <button
            type="button"
            onClick={() => onQuickSelect(["monday", "tuesday", "wednesday", "thursday", "friday"])}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Mon–Fri
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onQuickSelect(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"])}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Mon–Sat
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onQuickSelect(["sunday", "monday", "tuesday", "wednesday", "thursday"])}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Sun–Thu
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
