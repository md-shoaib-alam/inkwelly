"use client";


import { apiFetch } from "@/lib/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useParentDashboard } from "@/lib/graphql/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, BookOpen, CalendarDays, User, MapPin } from "lucide-react";
import type { StudentInfo, TimetableSlot } from "@/lib/types";
import { ChildSelector } from "./ChildSelector";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

const DAY_FULL_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const SUBJECT_COLORS = [
  "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function ParentTimetable() {
  const { currentUser } = useAppStore();
  const { data: parentData, isLoading: parentLoading } = useParentDashboard(currentUser?.name || "");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState("monday");

  const children = parentData?.children ?? [];

  const fetchTimetable = useCallback(async (classId: string) => {
    if (!classId) return;
    try {
      const res = await apiFetch(`/api/timetable?classId=${classId}`);
      const data = await res.json();
      setTimetable(Array.isArray(data) ? data : []);
    } catch {
      setTimetable([]);
    }
  }, []);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  useEffect(() => {
    if (!selectedChildId || parentLoading) return;
    const child = children.find((c) => c.id === selectedChildId);
    if (child) fetchTimetable(child.classId);
  }, [selectedChildId, children, fetchTimetable, parentLoading]);

  const subjectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const seen = new Set<string>();
    let idx = 0;
    timetable.forEach((t) => {
      if (!seen.has(t.subjectName)) {
        seen.add(t.subjectName);
        map[t.subjectName] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
        idx++;
      }
    });
    return map;
  }, [timetable]);

  const timeSlots = useMemo(() => {
    const slots = new Map<string, { start: string; end: string }>();
    timetable.forEach((t) => {
      if (!slots.has(t.startTime)) {
        slots.set(t.startTime, { start: t.startTime, end: t.endTime });
      }
    });
    return Array.from(slots.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [timetable]);

  const slotLookup = useMemo(() => {
    const map: Record<string, TimetableSlot> = {};
    timetable.forEach((t) => {
      map[`${t.day.toLowerCase()}-${t.startTime}`] = t;
    });
    return map;
  }, [timetable]);

  const selectedDaySlots = useMemo(
    () =>
      timeSlots.flatMap((ts) => {
        const slot = slotLookup[`${selectedDay}-${ts.start}`];
        return slot ? [slot] : [];
      }),
    [timeSlots, selectedDay, slotLookup],
  );

  if (parentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-16 text-center">
          <BookOpen className="size-12 mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            No children found
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            No students are linked to your account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 select-none animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5">
        <div className="space-y-3.5 text-left">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Class Timetable
            </h2>
          </div>
          {/* Children Selector */}
          <ChildSelector 
            students={children} 
            selectedStudentId={selectedChildId} 
            onSelect={setSelectedChildId} 
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {children.find((c) => c.id === selectedChildId)?.name || "–"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {children.find((c) => c.id === selectedChildId)?.className ||
                  "–"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {selectedDaySlots.length} Periods
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {DAY_FULL_LABELS[selectedDay]}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {selectedDaySlots.length > 0
                  ? `${formatTime(selectedDaySlots[0].startTime)} – ${formatTime(selectedDaySlots[selectedDaySlots.length - 1].endTime)}`
                  : "No classes"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                School hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DAYS.map((day) => (
          <Button
            key={day}
            size="sm"
            variant={selectedDay === day ? "default" : "outline"}
            onClick={() => setSelectedDay(day)}
            className={`rounded-full px-4 shrink-0 ${
              selectedDay === day
                ? "bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {DAY_LABELS[day]}
          </Button>
        ))}
      </div>

      {/* Day Schedule */}
      {timeSlots.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-16 text-center">
            <BookOpen className="size-12 mx-auto text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No timetable configured
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Contact the school administrator
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="size-4 text-amber-500" />
              {DAY_FULL_LABELS[selectedDay]} Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {timeSlots.map((ts) => {
                  const slot = slotLookup[`${selectedDay}-${ts.start}`] || null;
                  if (!slot) {
                    return (
                      <div
                        key={`${selectedDay}-${ts.start}`}
                        className="flex items-center gap-4 p-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30"
                      >
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium min-w-[90px]">
                          {formatTime(ts.start)} – {formatTime(ts.end)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                          <Clock className="size-3.5" />
                          <span className="text-xs font-medium">
                            Free Period
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const colorClass =
                    subjectColorMap[slot.subjectName] ||
                    "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";

                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-sm transition-all"
                    >
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium min-w-[90px]">
                        {formatTime(slot.startTime)} –{" "}
                        {formatTime(slot.endTime)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${colorClass}`}
                          >
                            {slot.subjectName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {slot.teacherName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {slot.className}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Subject Legend */}
      {Object.keys(subjectColorMap).length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="size-4 text-amber-500" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(subjectColorMap).map(([subject, colorClass]) => (
                <div
                  key={subject}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${colorClass}`}
                >
                  <div className="size-2 rounded-full bg-current opacity-60" />
                  {subject}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
