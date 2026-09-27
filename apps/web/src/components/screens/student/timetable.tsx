"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import type { TimetableSlot } from "@/lib/types";

import { ViewMode, DAYS, getNow, SUBJECT_COLORS } from "./timetable/types";
import { TimetableSkeleton } from "./timetable/timetable-skeleton";
import { TimetableHeader } from "./timetable/timetable-header";
import { TimetableSummary } from "./timetable/timetable-summary";
import { TimetableGrid } from "./timetable/timetable-grid";
import { TimetableList } from "./timetable/timetable-list";
import { TimetableDay } from "./timetable/timetable-day";
import { SubjectLegend } from "./timetable/subject-legend";

export function StudentTimetable() {
  const todayDateString = useMemo(() => {
    try {
      return new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedDay, setSelectedDay] = useState(
    () => getNow().dayKey || "monday",
  );

  const { data: targetStudent, isLoading: studentsLoading } = useQuery({
    queryKey: ["student-profile-me"],
    queryFn: async () => {
      const res = await api.get<any>("/students/me");
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });

  const student = targetStudent || null;
  const classId = student?.classId;

  const { data: timetable = [], isLoading: timetableLoading } = useQuery({
    queryKey: ["student-timetable", classId],
    queryFn: async () => {
      const res = await api.get<any>(`/timetable?classId=${classId}`);
      return (Array.isArray(res) ? res : []) as TimetableSlot[];
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });

  const loading = studentsLoading || timetableLoading;

  /* ─── Computed data ─── */

  const { timeStr: currentTimeStr, dayKey: todayKey } = useMemo(() => getNow(), []);

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

  const subjectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const seen = new Set<string>();
    let colorIdx = 0;
    timetable.forEach((t) => {
      if (!seen.has(t.subjectName)) {
        seen.add(t.subjectName);
        map[t.subjectName] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
        colorIdx++;
      }
    });
    return map;
  }, [timetable]);

  const slotLookup = useMemo(() => {
    const map: Record<string, TimetableSlot> = {};
    timetable.forEach((t) => {
      map[`${t.day.toLowerCase()}-${t.startTime}`] = t;
    });
    return map;
  }, [timetable]);

  const slotsByDay = useMemo(() => {
    const map: Record<string, TimetableSlot[]> = {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
    };
    
    DAYS.forEach(day => {
      map[day] = timeSlots.flatMap((ts) => {
        const slot = slotLookup[`${day}-${ts.start}`];
        return slot ? [slot] : [];
      });
    });
    
    return map;
  }, [timeSlots, slotLookup]);

  const todaySlots = useMemo(
    () => slotsByDay[todayKey] || [],
    [slotsByDay, todayKey],
  );

  const isCurrentSlot = useCallback(
    (start: string, end: string) =>
      currentTimeStr >= start && currentTimeStr <= end,
    [currentTimeStr],
  );

  const isSlotPast = useCallback(
    (start: string) => currentTimeStr > start,
    [currentTimeStr],
  );

  const nextPeriod = useMemo(() => {
    return todaySlots.find((s) => s.startTime > currentTimeStr) || null;
  }, [todaySlots, currentTimeStr]);

  /* ─── Render ─── */

  if (loading) return <TimetableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header + View Toggle */}
      <TimetableHeader viewMode={viewMode} setViewMode={setViewMode} />

      {/* Today's Summary */}
      <TimetableSummary
        todayKey={todayKey}
        todayDateString={todayDateString}
        todaySlots={todaySlots}
        nextPeriod={nextPeriod}
      />

      {/* Empty State / Schedule Views */}
      {timeSlots.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-16 text-center">
            <BookOpen className="size-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No timetable configured
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Contact your school administrator
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <TimetableGrid
              todayKey={todayKey}
              timeSlots={timeSlots}
              slotLookup={slotLookup}
              subjectColorMap={subjectColorMap}
              isCurrentSlot={isCurrentSlot}
              isSlotPast={isSlotPast}
            />
          )}

          {/* List View */}
          {viewMode === "list" && (
            <TimetableList
              todayKey={todayKey}
              slotsByDay={slotsByDay}
              subjectColorMap={subjectColorMap}
              isCurrentSlot={isCurrentSlot}
              isSlotPast={isSlotPast}
            />
          )}

          {/* Day View */}
          {viewMode === "day" && (
            <TimetableDay
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              todayKey={todayKey}
              slotsByDay={slotsByDay}
              timeSlots={timeSlots}
              slotLookup={slotLookup}
              subjectColorMap={subjectColorMap}
              currentTimeStr={currentTimeStr}
              isCurrentSlot={isCurrentSlot}
              isSlotPast={isSlotPast}
            />
          )}

          {/* Subject Legend (Grid and List views) */}
          {viewMode !== "day" && (
            <SubjectLegend subjectColorMap={subjectColorMap} />
          )}
        </>
      )}
    </div>
  );
}
