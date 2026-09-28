import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List } from "lucide-react";
import type { TimetableSlot } from "@/lib/types";
import { DAYS, DAY_LABELS, DAY_FULL_LABELS, formatTime } from "./types";

interface TimetableListProps {
  todayKey: string;
  slotsByDay: Record<string, TimetableSlot[]>;
  subjectColorMap: Record<string, string>;
  isCurrentSlot: (start: string, end: string) => boolean;
  isSlotPast: (start: string) => boolean;
}

export function TimetableList({
  todayKey,
  slotsByDay,
  subjectColorMap,
  isCurrentSlot,
  isSlotPast,
}: TimetableListProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <List className="size-4 text-violet-500" />
            All Classes
          </CardTitle>
          {todayKey && (
            <Badge className="bg-violet-100 text-violet-700 text-[10px] hover:bg-violet-100">
              Today: {DAY_LABELS[todayKey]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[600px]">
          <div className="px-6 pb-6 space-y-6">
            {DAYS.map((day) => {
              const daySlots = slotsByDay[day];

              if (daySlots.length === 0) return null;

              const isToday = day === todayKey;

              return (
                <div key={day}>
                  {/* Day Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-violet-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {isToday
                        ? `Today: ${DAY_FULL_LABELS[day]}`
                        : DAY_FULL_LABELS[day]}
                    </div>
                    {isToday && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                        {daySlots.length} classes
                      </Badge>
                    )}
                    <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                  </div>

                  {/* Day Entries */}
                  <div className="space-y-2 ml-2">
                    {daySlots.map((slot) => {
                      const isCurrent =
                        isToday &&
                        isCurrentSlot(slot.startTime, slot.endTime);
                      const isPast =
                        isToday &&
                        isSlotPast(slot.startTime) &&
                        !isCurrent;
                      const colorClass =
                        subjectColorMap[slot.subjectName] ||
                        "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";

                      return (
                        <div
                          key={slot.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isCurrent
                              ? "border-violet-300 bg-violet-50/50 shadow-sm"
                              : `${colorClass} border`
                          } ${isPast ? "opacity-60" : ""}`}
                        >
                          {/* Now indicator */}
                          {isCurrent && (
                            <div className="flex flex-col items-center">
                              <div className="size-2.5 rounded-full bg-violet-500 animate-pulse" />
                              <div className="w-px h-6 bg-violet-300" />
                            </div>
                          )}

                          {/* Time */}
                          <div
                            className={`min-w-[100px] ${
                              isCurrent
                                ? "text-violet-700 dark:text-violet-400"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            <p className="text-xs font-semibold">
                              {formatTime(slot.startTime)} –{" "}
                              {formatTime(slot.endTime)}
                            </p>
                          </div>

                          {/* Subject */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                                  subjectColorMap[slot.subjectName] ||
                                  "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                                }`}
                              >
                                {slot.subjectName}
                              </span>
                              {isCurrent && (
                                <Badge className="bg-violet-500 text-white text-[9px] px-1.5 py-0 hover:bg-violet-500">
                                  Now
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                              {slot.teacherName}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
