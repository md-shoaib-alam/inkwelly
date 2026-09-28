"use client";

import { Clock, Coffee, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DAY_LABELS, DAY_FULL_LABELS } from "./constants";
import { formatTime, getSubjectBadgeClass, isCurrentPeriod } from "./helpers";
import type { TimetableSlot } from "./types";

interface DayViewProps {
  selectedDay: string;
  selectedDaySlots: TimetableSlot[][];
  timeSlots: { start: string; end: string }[];
  uniqueSubjects: string[];
  workingDays: string[];
  currentDayIndex: number;
  onSelectDay: (day: string) => void;
  onDeleteSlot: (id: string) => void;
  onEditSlot: (slot: TimetableSlot) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function DayView({
  selectedDay,
  selectedDaySlots,
  timeSlots,
  uniqueSubjects,
  workingDays,
  currentDayIndex,
  onSelectDay,
  onDeleteSlot,
  onEditSlot,
  canEdit,
  canDelete,
}: DayViewProps) {
  const dayIndex = workingDays.indexOf(selectedDay);
  const isToday = dayIndex === currentDayIndex;
  const hasAnySlot = selectedDaySlots.some((group) => group.length > 0);
  const showActions = canEdit || canDelete;

  return (
    <div>
      {/* Day Selector Pills */}
      <div className="flex items-center gap-1.5 p-3 border-b bg-muted/20 overflow-x-auto">
        {workingDays.map((day, idx) => {
          const isActive = day === selectedDay;
          const isCurrentDay = idx === currentDayIndex;

          return (
            <Button
              key={day}
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={
                isActive
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shrink-0"
                  : "shrink-0 text-muted-foreground hover:text-foreground"
              }
              onClick={() => onSelectDay(day)}
            >
              <span className="relative flex items-center gap-1.5">
                {DAY_LABELS[day]}
                {isCurrentDay && !isActive && (
                  <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-emerald-500" />
                )}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Day Header */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-foreground">
            {DAY_FULL_LABELS[selectedDay]}
          </h3>
          {isToday && (
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
              Today
            </Badge>
          )}
          {hasAnySlot && (
            <span className="text-xs text-muted-foreground ml-auto">
              {selectedDaySlots.filter((group) => group.length > 0).length} of{" "}
              {timeSlots.length} periods
            </span>
          )}
        </div>
      </div>

      {/* Timeline Cards */}
      <div className="px-4 sm:px-6 pb-6">
        {!hasAnySlot && timeSlots.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Coffee className="size-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No classes scheduled</p>
            <p className="text-sm mt-1">
              This day is completely free for the selected class.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] sm:left-[23px] top-3 bottom-3 w-px bg-border" />

            <div className="space-y-4">
              {selectedDaySlots.map((slotGroup, idx) => {
                const hasSlots = slotGroup.length > 0;
                const isCurrent =
                  isToday && hasSlots
                    ? isCurrentPeriod(
                        slotGroup[0].startTime,
                        slotGroup[0].endTime,
                      )
                    : false;

                return (
                  <div key={`${timeSlots[idx].start}-${timeSlots[idx].end}`} className="relative flex gap-4">
                    <div className="relative shrink-0 z-10 mt-5">
                      <div
                        className={`size-2.5 rounded-full border-2 ${
                          isCurrent
                            ? "bg-emerald-500 border-emerald-300 dark:border-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900/40"
                            : hasSlots
                              ? "bg-background border-emerald-400"
                              : "bg-background border-muted-foreground/30"
                        }`}
                      />
                    </div>

                    {hasSlots ? (
                      <div className="group relative flex-1 rounded-xl border p-4 transition-all bg-card hover:shadow-sm space-y-3">
                        {isCurrent && (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] px-1.5 py-0">
                            In Progress
                          </Badge>
                        )}
                        {slotGroup.map((slot) => (
                          <div
                            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                            key={slot.id}
                          >
                            <div className="flex-1 min-w-0">
                               <p className={`text-lg font-semibold leading-tight ${slot.label ? "text-amber-600 dark:text-amber-400" : ""}`}>
                                 {slot.label || slot.subjectName}
                               </p>
                               {!slot.label && (
                                 <>
                                   <p className="text-sm text-muted-foreground mt-1">
                                     {slot.teacherName}
                                   </p>
                                   <p className="text-xs text-muted-foreground mt-0.5">
                                     {slot.className}
                                   </p>
                                 </>
                               )}
                            </div>
                            <div className="flex items-center gap-2">
                               <div
                                 className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium ${slot.label ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : getSubjectBadgeClass(slot.subjectName, uniqueSubjects)}`}
                               >
                                 <div className="flex items-center gap-1.5">
                                   <Clock className="size-3" />
                                   {formatTime(slot.startTime)} -{" "}
                                   {formatTime(slot.endTime)}
                                 </div>
                               </div>
                              {showActions && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => onEditSlot(slot)}
                                      className="shrink-0 size-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                      title="Edit slot"
                                    >
                                      <Pencil className="size-3.5" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteSlot(slot.id)}
                                      className="shrink-0 size-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                      title="Delete slot"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl border border-dashed border-muted-foreground/25 p-4">
                        <p className="text-sm font-medium text-muted-foreground/50">
                          Free Period
                        </p>
                        <p className="text-xs text-muted-foreground/40 mt-0.5">
                          {formatTime(timeSlots[idx].start)} -{" "}
                          {formatTime(timeSlots[idx].end)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
