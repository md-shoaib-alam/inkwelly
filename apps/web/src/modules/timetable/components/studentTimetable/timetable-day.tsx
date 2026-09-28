import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MapPin, Timer } from "lucide-react";
import type { TimetableSlot } from "@/lib/types";
import { DAYS, DAY_LABELS, DAY_FULL_LABELS, formatTime } from "./types";

interface TimetableDayProps {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  todayKey: string;
  slotsByDay: Record<string, TimetableSlot[]>;
  timeSlots: { start: string; end: string }[];
  slotLookup: Record<string, TimetableSlot>;
  subjectColorMap: Record<string, string>;
  currentTimeStr: string;
  isCurrentSlot: (start: string, end: string) => boolean;
  isSlotPast: (start: string) => boolean;
}

export function TimetableDay({
  selectedDay,
  setSelectedDay,
  todayKey,
  slotsByDay,
  timeSlots,
  slotLookup,
  subjectColorMap,
  currentTimeStr,
  isCurrentSlot,
  isSlotPast,
}: TimetableDayProps) {
  const selectedDaySlots = slotsByDay[selectedDay] || [];

  return (
    <div className="space-y-4">
      {/* Day Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DAYS.map((day) => {
          const isSelected = day === selectedDay;
          const isToday = day === todayKey;

          return (
            <Button
              key={day}
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => setSelectedDay(day)}
              className={`rounded-full px-4 shrink-0 ${
                isSelected
                  ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                  : isToday
                    ? "border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {DAY_LABELS[day]}
              {isToday && !isSelected && (
                <span className="ml-1.5 size-1.5 rounded-full bg-violet-500 inline-block" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Day Info Header */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {DAY_FULL_LABELS[selectedDay]}
                {selectedDay === todayKey && (
                  <span className="ml-2 text-sm font-normal text-violet-500">
                    (Today)
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {selectedDaySlots.length} classes scheduled
              </p>
            </div>
            {selectedDaySlots.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTime(selectedDaySlots[0].startTime)} –{" "}
                  {formatTime(
                    selectedDaySlots[selectedDaySlots.length - 1].endTime,
                  )}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {(() => {
                    const totalMin = selectedDaySlots.reduce((acc, s) => {
                      const [sh, sm] = s.startTime.split(":").map(Number);
                      const [eh, em] = s.endTime.split(":").map(Number);
                      return acc + (eh * 60 + em) - (sh * 60 + sm);
                    }, 0);
                    const hrs = Math.floor(totalMin / 60);
                    const mins = totalMin % 60;
                    return hrs > 0
                      ? `${hrs}h ${mins}m total`
                      : `${mins}m total`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Day Timeline */}
      <div className="relative space-y-3">
        {/* Timeline line */}
        {selectedDaySlots.length > 0 && (
          <div className="absolute left-[23px] top-8 bottom-8 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
        )}

        {timeSlots.map((ts, idx) => {
          const slot = slotLookup[`${selectedDay}-${ts.start}`] || null;
          const isCurrentSlotActive =
            selectedDay === todayKey &&
            slot &&
            isCurrentSlot(slot.startTime, slot.endTime);
          const isPastSlot =
            selectedDay === todayKey &&
            slot &&
            isSlotPast(slot.startTime) &&
            !isCurrentSlotActive;

          if (!slot) {
            // Free Period
            return (
              <div key={`${selectedDay}-${ts.start}`} className="relative">
                <Card className="rounded-xl border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-center z-10">
                      <div className="size-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900" />
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium min-w-[90px]">
                        {formatTime(ts.start)} – {formatTime(ts.end)}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                        <Clock className="size-3.5" />
                        <span className="text-xs font-medium border-none">
                          Free Period
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }

          const colorClass =
            subjectColorMap[slot.subjectName] ||
            "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";

          return (
            <div key={slot.id} className="relative">
              <Card
                className={`rounded-xl border transition-all ${
                  isCurrentSlotActive
                    ? "border-violet-300 shadow-lg shadow-violet-100 dark:shadow-none"
                    : isPastSlot
                      ? "opacity-60"
                      : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-col items-center z-10 pt-0.5">
                      {isCurrentSlotActive ? (
                        <div className="size-5 rounded-full bg-violet-500 border-2 border-violet-300 flex items-center justify-center">
                          <div className="size-2 rounded-full bg-white dark:bg-zinc-900 animate-pulse" />
                        </div>
                      ) : (
                        <div
                          className={`size-5 rounded-full border-2 ${
                            isPastSlot
                              ? "border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700"
                              : "border-violet-400 bg-white dark:bg-zinc-900"
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-bold truncate ${colorClass.split(" ")[1] || "text-zinc-900 dark:text-zinc-100"}`}
                            >
                              {slot.subjectName}
                            </h4>
                            {isCurrentSlotActive && (
                              <Badge className="bg-violet-500 text-white text-[10px] px-2 py-0 hover:bg-violet-500 shrink-0">
                                In Progress
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="size-3.5" />
                          {slot.teacherName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {slot.className}
                        </span>
                      </div>

                      {isCurrentSlotActive && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <Timer className="size-3.5 text-violet-500" />
                            <span className="text-xs text-violet-600 font-medium">
                              {(() => {
                                const [eh, em] = slot.endTime.split(":").map(Number);
                                const [ch, cm] = currentTimeStr.split(":").map(Number);
                                const remaining = eh * 60 + em - (ch * 60 + cm);
                                if (remaining <= 0) return "Ending soon";
                                const rh = Math.floor(remaining / 60);
                                const rm = remaining % 60;
                                return rh > 0
                                  ? `${rh}h ${rm}m remaining`
                                  : `${rm}m remaining`;
                              })()}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-violet-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-500 transition-all"
                              style={{
                                width: `${(() => {
                                  const [sh, sm] = slot.startTime.split(":").map(Number);
                                  const [eh, em] = slot.endTime.split(":").map(Number);
                                  const [ch, cm] = currentTimeStr.split(":").map(Number);
                                  const total = eh * 60 + em - (sh * 60 + sm);
                                  const elapsed = ch * 60 + cm - (sh * 60 + sm);
                                  if (total <= 0) return 100;
                                  return Math.min(
                                    100,
                                    Math.max(0, (elapsed / total) * 100),
                                  );
                                })()}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Period number badge */}
                    <div className="shrink-0">
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCurrentSlotActive
                            ? "bg-violet-600 text-white"
                            : isPastSlot
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                              : colorClass
                        }`}
                      >
                        {idx + 1}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
