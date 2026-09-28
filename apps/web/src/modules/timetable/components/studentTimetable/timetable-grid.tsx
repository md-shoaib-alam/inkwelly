import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";
import type { TimetableSlot } from "@/lib/types";
import { DAYS, DAY_LABELS, formatTime } from "./types";

interface TimetableGridProps {
  todayKey: string;
  timeSlots: { start: string; end: string }[];
  slotLookup: Record<string, TimetableSlot>;
  subjectColorMap: Record<string, string>;
  isCurrentSlot: (start: string, end: string) => boolean;
  isSlotPast: (start: string) => boolean;
}

export function TimetableGrid({
  todayKey,
  timeSlots,
  slotLookup,
  subjectColorMap,
  isCurrentSlot,
  isSlotPast,
}: TimetableGridProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-4 text-violet-500" />
            Weekly Schedule
          </CardTitle>
          {todayKey && (
            <Badge className="bg-violet-100 text-violet-700 text-[10px] hover:bg-violet-100">
              Today: {DAY_LABELS[todayKey]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px]">
          <div className="min-w-[640px]">
            {/* Table Header */}
            <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-2">
              <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 p-2" />
              {DAYS.map((day) => (
                <div
                  key={day}
                  className={`text-center text-xs font-semibold py-2 rounded-lg ${
                    day === todayKey
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {DAY_LABELS[day]}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {timeSlots.map((slot) => (
              <div
                key={slot.start}
                className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5"
              >
                {/* Time label */}
                <div className="flex items-center justify-center px-2 py-1">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatTime(slot.start)}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {formatTime(slot.end)}
                    </p>
                  </div>
                </div>

                {/* Day cells */}
                {DAYS.map((day) => {
                  const cellSlot = slotLookup[`${day}-${slot.start}`];
                  const isToday = day === todayKey;
                  const isCurrent =
                    isToday &&
                    cellSlot &&
                    isCurrentSlot(cellSlot.startTime, cellSlot.endTime);
                  const isPast =
                    isToday &&
                    cellSlot &&
                    isSlotPast(cellSlot.startTime) &&
                    !isCurrent;

                  return (
                    <div
                      key={day}
                      className={`rounded-lg border p-2 min-h-[60px] transition-all ${
                        cellSlot
                          ? subjectColorMap[cellSlot.subjectName] ||
                            "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                          : "bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 border-dashed"
                      } ${isToday && !cellSlot ? "bg-violet-50/30 border-violet-100" : ""} ${
                        isCurrent
                          ? "ring-2 ring-violet-500 ring-offset-1 shadow-md scale-[1.02]"
                          : ""
                      } ${isPast ? "opacity-60" : ""}`}
                    >
                      {cellSlot ? (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs font-semibold truncate">
                            {cellSlot.subjectName}
                          </p>
                          <p className="text-[10px] opacity-70 truncate">
                            {cellSlot.teacherName}
                          </p>
                          {isCurrent && (
                            <Badge className="bg-violet-500 text-white text-[9px] px-1.5 py-0 w-fit mt-0.5 hover:bg-violet-500">
                              Live
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-[10px] text-zinc-300">
                            -
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
