"use client";

import { ChevronRight, Circle, Clock, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DAY_FULL_LABELS } from "./constants";
import { formatTime, getSubjectBadgeClass, getSubjectDotClass, isCurrentPeriod } from "./helpers";
import type { TimetableSlot } from "./types";

interface ListViewProps {
  slotsByDay: Map<string, TimetableSlot[]>;
  uniqueSubjects: string[];
  workingDays: string[];
  currentDayIndex: number;
  onDeleteSlot: (id: string) => void;
  onEditSlot: (slot: TimetableSlot) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function ListView({
  slotsByDay,
  uniqueSubjects,
  workingDays,
  currentDayIndex,
  onDeleteSlot,
  onEditSlot,
  canEdit,
  canDelete,
}: ListViewProps) {
  const showActions = canEdit || canDelete;

  return (
    <div className="divide-y">
      {workingDays.map((day, dayIdx) => {
        const daySlotsList = slotsByDay.get(day);
        if (!daySlotsList || daySlotsList.length === 0) return null;

        const isToday = dayIdx === currentDayIndex;

        return (
          <div
            key={day}
            className={`p-4 sm:px-6 ${isToday ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <h3
                className={`text-sm font-semibold ${isToday ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}
              >
                {DAY_FULL_LABELS[day]}
              </h3>
              {isToday && (
                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-[10px] px-1.5 py-0">
                  Today
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-muted-foreground"
              >
                {daySlotsList.length}{" "}
                {daySlotsList.length === 1 ? "period" : "periods"}
              </Badge>
            </div>

            <div className="space-y-1.5">
              {daySlotsList.map((slot) => {
                const isCurrent =
                  isToday && isCurrentPeriod(slot.startTime, slot.endTime);

                return (
                  <div
                    key={slot.id}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      isCurrent
                        ? "bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="shrink-0 w-24 sm:w-28">
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatTime(slot.startTime)}
                      </span>
                      <span className="text-xs text-muted-foreground mx-1">
                        -
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatTime(slot.endTime)}
                      </span>
                    </div>

                    <div className="shrink-0">
                      <Circle
                        className={`size-2 fill-current ${isCurrent ? "text-emerald-500" : "text-transparent"}`}
                      />
                    </div>

                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />

                    {slot.label ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                         <Clock className="size-3" />
                         {slot.label}
                      </div>
                    ) : (
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${getSubjectBadgeClass(slot.subjectName, uniqueSubjects)}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${getSubjectDotClass(slot.subjectName, uniqueSubjects)}`}
                        />
                        {slot.subjectName}
                      </div>
                    )}

                    <div className="hidden sm:flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                      {slot.teacherName && (
                        <>
                          <span>{slot.teacherName}</span>
                          <span className="text-muted-foreground/40">|</span>
                        </>
                      )}
                      <span>{slot.className}</span>
                    </div>

                    {showActions && (
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEditSlot(slot)}
                            className="size-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                            title="Edit slot"
                          >
                            <Pencil className="size-3" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteSlot(slot.id)}
                            className="size-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Delete slot"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
