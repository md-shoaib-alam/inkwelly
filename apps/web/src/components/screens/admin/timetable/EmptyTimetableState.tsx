"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EmptyTimetableStateProps {
  selectedClass?: string;
  classes?: any[];
  onClassSelect?: (id: string) => void;
  onManageClick?: () => void;
  canCreate?: boolean;
}

export function EmptyTimetableState({
  selectedClass,
  classes = [],
  onClassSelect,
  onManageClick,
  canCreate = true,
}: EmptyTimetableStateProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  const handleManage = () => {
    if (!selectedClass && classes.length > 0) {
      onClassSelect?.(classes[0].id);
      setTimeout(() => {
        onManageClick?.();
      }, 50);
      return;
    }
    onManageClick?.();
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4 text-center animate-in fade-in-50 duration-300">
      {/* 3D Timetable Illustration */}
      <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
        <img
          src="/assets/admin/timetable.avif"
          alt="No timetable records"
          className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain drop-shadow-sm select-none pointer-events-none"
          loading="eager"
        />
      </div>

      {/* Main Heading */}
      <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
        No timetable records found
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto mt-2 sm:mt-2.5 leading-relaxed">
        Create class timetables to organize subjects, teachers and time slots for
        your classes. Use the &ldquo;Manage&rdquo; button above to get started.
      </p>

      {/* Primary Action Button */}
      {canCreate && (
        <Button
          onClick={handleManage}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl h-10 px-5 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/35 transition-all duration-200 inline-flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="size-4" />
          <span>Manage Timetable</span>
        </Button>
      )}

      {/* Learn more helper link */}
      <button
        type="button"
        onClick={() => setGuideOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-colors"
      >
        <BookOpen className="size-3.5" />
        <span>Learn more about timetable setup</span>
      </button>

      {/* Timetable Setup Quick Guide Modal */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="size-5 text-emerald-600" />
              Timetable Setup Guide
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Follow these simple steps to set up and manage class timetables.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
              <div className="size-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Configure Working Days</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Use the Settings (⚙) icon to choose which days of the week school is in session.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
              <div className="size-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                2
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Select a Class & Add Periods</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Click &ldquo;Manage Timetable&rdquo; to add slots with start and end times, assign subjects and teachers, or add custom break labels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
              <div className="size-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Copy Across Days & Save</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Use &ldquo;Copy to all days&rdquo; to replicate a standard day schedule instantly across the whole week.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
