"use client";

import { CalendarDays, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ALL_DAYS, DAY_LABELS, DAY_FULL_LABELS } from "./constants";

interface WorkingDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: string[];
  setDraft: (days: string[]) => void;
  onSave: () => void;
  saving: boolean;
}

export function WorkingDaysDialog({
  open,
  onOpenChange,
  draft,
  setDraft,
  onSave,
  saving,
}: WorkingDaysDialogProps) {
  const toggleDay = (day: string) => {
    if (draft.includes(day)) {
      setDraft(draft.filter((d) => d !== day));
    } else {
      setDraft([...draft, day]);
    }
  };

  const applyPreset = (preset: string[]) => {
    setDraft([...preset]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5 text-emerald-600 dark:text-emerald-400" />
            Working Days Configuration
          </DialogTitle>
          <DialogDescription>
            Select the days your school operates. This will update the timetable
            grid for all classes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 py-4">
          {ALL_DAYS.map((day) => {
            const isSelected = draft.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                    : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <CalendarDays
                  className={`size-5 ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`}
                />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {DAY_LABELS[day]}
                </span>
                {!isSelected && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    Holiday
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick presets */}
        <div className="space-y-2 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Quick Presets
          </p>
          {/* Helper: compare two day arrays regardless of order */}
          {(() => {
            const MON_FRI = ["monday", "tuesday", "wednesday", "thursday", "friday"];
            const MON_SAT = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const SUN_THU = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
            const SAT_THU = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];
            const sorted = (arr: string[]) => [...arr].sort().join(",");
            const draftSorted = sorted(draft);
            const isActive = (preset: string[]) => draftSorted === sorted(preset);
            const activeClass = "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";

            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`text-xs h-8 ${isActive(MON_FRI) ? activeClass : ""}`}
                  onClick={() => applyPreset(MON_FRI)}
                >
                  Mon-Fri (5-day week)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`text-xs h-8 ${isActive(MON_SAT) ? activeClass : ""}`}
                  onClick={() => applyPreset(MON_SAT)}
                >
                  Mon-Sat (6-day week)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`text-xs h-8 ${isActive(SUN_THU) ? activeClass : ""}`}
                  onClick={() => applyPreset(SUN_THU)}
                >
                  Sun-Thu (Middle East)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`text-xs h-8 ${isActive(SAT_THU) ? activeClass : ""}`}
                  onClick={() => applyPreset(SAT_THU)}
                >
                  Sat-Thu (Friday Holiday)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`text-xs h-8 ${isActive(ALL_DAYS) ? activeClass : ""}`}
                  onClick={() => applyPreset(ALL_DAYS)}
                >
                  All 7 Days
                </Button>
              </div>
            );
          })()}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving && (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            )}
            {saving
              ? "Saving..."
              : `Save ${draft.length} Working Days`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
