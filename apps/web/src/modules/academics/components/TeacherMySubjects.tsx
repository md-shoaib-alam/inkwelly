"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  LayoutGrid,
  List,
  School,
  Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  className: string;
  classId: string;
  teacherName: string;
  teacherId: string;
}

interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0", 10);
  const min = m ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${min} ${ampm}`;
}

function getShortDay(day: string) {
  const map: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };
  return map[day.toLowerCase()] || day.substring(0, 3);
}

const DAY_ORDER: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
};

function getNowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function getCurrentDayKey() {
  const d = new Date().getDay(); // 0 Sun
  return d === 0 ? 7 : d; // 1 Mon -> 7 Sun
}

function isSlotToday(slot: TimetableSlot): boolean {
  const curDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  return slot.day.toLowerCase() === curDay;
}

function isSlotLive(slot: TimetableSlot): boolean {
  if (!isSlotToday(slot)) return false;

  const [sH, sM] = slot.startTime.split(":").map(Number);
  const [eH, eM] = slot.endTime.split(":").map(Number);
  const start = (sH ?? 0) * 60 + (sM ?? 0);
  const end = (eH ?? 0) * 60 + (eM ?? 0);
  const now = getNowMinutes();
  return now >= start && now < end;
}

function getNextOccurrenceRank(slots: TimetableSlot[]): number {
  if (slots.length === 0) return 999999; // Bottom
  const curDay = getCurrentDayKey();
  const nowMin = getNowMinutes();
  let best = Infinity;

  for (const s of slots) {
    const sDayNum = DAY_ORDER[s.day.toLowerCase()] || 7;
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    const sStart = (sh ?? 0) * 60 + (sm ?? 0);
    const sEnd = (eh ?? 0) * 60 + (em ?? 0);

    let diff = sDayNum - curDay;
    if (diff < 0) {
      diff += 7;
    } else if (diff === 0 && nowMin > sEnd) {
      // Already passed today, wraps next week
      diff += 7;
    }
    
    // Calculate exact priority score
    const score = diff * 1440 + sStart;
    if (score < best) best = score;
  }
  return best;
}

function sortSlots(a: TimetableSlot, b: TimetableSlot) {
  const dayA = DAY_ORDER[a.day.toLowerCase()] || 9;
  const dayB = DAY_ORDER[b.day.toLowerCase()] || 9;
  if (dayA !== dayB) return dayA - dayB;
  return a.startTime.localeCompare(b.startTime);
}

// ─── Cookie helpers ───────────────────────────────────────────

const VIEW_COOKIE = "teacher_subjects_view";

function getViewCookie(): "grid" | "table" {
  if (typeof document === "undefined") return "grid";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${VIEW_COOKIE}=`));
  const val = match?.split("=")[1];
  return val === "table" ? "table" : "grid";
}

function setViewCookie(view: "grid" | "table") {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${VIEW_COOKIE}=${view}; expires=${expires.toUTCString()}; path=/`;
}

// ─── Colour palette per subject (deterministic by name) ──────

const PALETTES = [
  { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "bg-blue-500/10 text-blue-500", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { bg: "bg-violet-50 dark:bg-violet-900/20", icon: "bg-violet-500/10 text-violet-500", badge: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "bg-emerald-500/10 text-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "bg-amber-500/10 text-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { bg: "bg-rose-50 dark:bg-rose-900/20", icon: "bg-rose-500/10 text-rose-500", badge: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  { bg: "bg-cyan-50 dark:bg-cyan-900/20", icon: "bg-cyan-500/10 text-cyan-500", badge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
];

function palette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

// ─── Component ────────────────────────────────────────────────

export function TeacherSubjects() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const { currentUser: user } = useAppStore();

  // Hydrate from cookie after mount
  useEffect(() => {
    const saved = getViewCookie();
    if (saved !== view) {
      const timer = setTimeout(() => {
        setView(saved);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [view]);

  const switchView = (v: "grid" | "table") => {
    setView(v);
    setViewCookie(v);
  };

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<SubjectInfo[]>({
    queryKey: ["teacher-subjects-mine-v2", user?.id, user?.role],
    queryFn: async () => {
      const data = await api.get<any>("/subjects?mine=true");
      let items = Array.isArray(data) ? data : (data?.items || data?.data || []);
      if (items.length === 0 && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'staff')) {
        const fallback = await api.get<any>("/subjects");
        items = Array.isArray(fallback) ? fallback : (fallback?.items || fallback?.data || []);
      }
      return items as SubjectInfo[];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: timetable = [], isLoading: timetableLoading } = useQuery<any[]>({
    queryKey: ["teacher-timetable-summary-mine", user?.id],
    queryFn: () => api.get<any[]>("/timetable?mine=true"),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = subjectsLoading || timetableLoading;

  const timetableSubjects = useMemo(() => {
    const list: SubjectInfo[] = [];
    const seen = new Set<string>();
    timetable.forEach((t) => {
      if (t.subjectId && t.subjectName) {
        const key = `${t.subjectId}-${t.classId}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: t.subjectId,
            name: t.subjectName,
            code: t.subjectCode || "",
            className: t.className || "Class",
            classId: t.classId || "",
            teacherName: t.teacherName || "",
            teacherId: t.teacherId || "",
          });
        }
      }
    });
    return list;
  }, [timetable]);

  const combinedSubjects = useMemo(() => {
    const list = [...subjects];
    const seen = new Set(subjects.map(s => `${s.id}-${s.classId}`));
    timetableSubjects.forEach((ts) => {
      const key = `${ts.id}-${ts.classId}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(ts);
      }
    });
    return list;
  }, [subjects, timetableSubjects]);

  const slotsBySubject = useMemo(() => {
    const map = new Map<string, TimetableSlot[]>();
    if (!timetable.length) return map;
    
    timetable.forEach((t) => {
      if (t.subjectId) {
        if (!map.has(t.subjectId)) map.set(t.subjectId, []);
        map.get(t.subjectId)!.push(t);
      }
    });

    // Pre-sort each subject array exactly once
    map.forEach((list) => list.sort(sortSlots));
    return map;
  }, [timetable]);

  const sortedSubjects = useMemo(() => {
    if (!combinedSubjects.length) return [];
    const list = [...combinedSubjects];
    
    list.sort((a, b) => {
      const slotsA = slotsBySubject.get(a.id) || [];
      const slotsB = slotsBySubject.get(b.id) || [];
      
      // Check if currently live (super high priority)
      const liveA = slotsA.some(isSlotLive);
      const liveB = slotsB.some(isSlotLive);
      if (liveA && !liveB) return -1;
      if (!liveA && liveB) return 1;

      // Fallback to chronological upcoming priority
      return getNextOccurrenceRank(slotsA) - getNextOccurrenceRank(slotsB);
    });

    return list;
  }, [combinedSubjects, slotsBySubject]);

  // ── Loading ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────

  if (sortedSubjects.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <Header subjects={combinedSubjects} view={view} switchView={switchView} />
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <BookOpen className="size-16 text-zinc-400 dark:text-zinc-700 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-300">No Subjects Assigned</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs mx-auto">
            You don't have any subjects assigned yet. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header subjects={subjects} view={view} switchView={switchView} />

      {view === "grid" ? (
        <GridView subjects={sortedSubjects} slotsBySubject={slotsBySubject} />
      ) : (
        <TableView subjects={sortedSubjects} slotsBySubject={slotsBySubject} />
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────

function Header({
  subjects,
  view,
  switchView,
}: {
  subjects: SubjectInfo[];
  view: "grid" | "table";
  switchView: (v: "grid" | "table") => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          My Subjects
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {subjects.length} subject{subjects.length !== 1 ? "s" : ""} assigned
          to you across{" "}
          {new Set(subjects.map((s) => s.classId)).size} class
          {new Set(subjects.map((s) => s.classId)).size !== 1 ? "es" : ""}.
        </p>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/50 shrink-0">
        <button
          type="button"
          onClick={() => switchView("grid")}
          className={`p-1.5 rounded-lg transition-all ${
            view === "grid"
              ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
          title="Grid view"
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => switchView("table")}
          className={`p-1.5 rounded-lg transition-all ${
            view === "table"
              ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
          title="Table view"
        >
          <List className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Grid View ────────────────────────────────────────────────

function GridView({ subjects, slotsBySubject }: { subjects: SubjectInfo[], slotsBySubject: Map<string, TimetableSlot[]> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => {
        const p = palette(subject.name);
        const relevantSlots = slotsBySubject.get(subject.id) || [];
        const todaySlots = relevantSlots.filter(isSlotToday);
        const isLiveNow = todaySlots.some(isSlotLive);
        const isHappeningToday = todaySlots.length > 0;

        return (
          <Card
            key={`${subject.id}-${subject.classId || ""}`}
            className={`rounded-xl border hover:shadow-md transition-all group overflow-hidden flex flex-col ${
              isLiveNow 
                ? "ring-2 ring-emerald-500 shadow-emerald-100 dark:shadow-emerald-900/20 border-emerald-200 dark:border-emerald-800 bg-emerald-50/10 dark:bg-emerald-900/5"
                : isHappeningToday
                ? "border-blue-100 dark:border-blue-900/50 bg-blue-50/10 dark:bg-blue-900/5 shadow-sm"
                : "border-transparent shadow-sm"
            }`}
          >
            <CardContent className="p-5 flex-1 flex flex-col">
              {/* Icon + name */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 overflow-hidden">
                  <div
                    className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${p.icon}`}
                  >
                    <BookOpen className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">
                      {subject.code}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isLiveNow ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold tracking-wide animate-pulse px-2 py-0.5 h-auto shadow-sm">
                      LIVE
                    </Badge>
                  ) : isHappeningToday ? (
                    <Badge variant="outline" className="border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 text-[10px] font-semibold px-2 py-0.5 h-auto">
                      TODAY
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* Class – prominent */}
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${p.bg} border border-current/10 mb-auto`}>
                <School className={`size-4 shrink-0 ${p.icon.split(" ")[1]} dark:text-white/80`} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-white/50 leading-none mb-0.5">
                    Class
                  </p>
                  <p className={`text-sm font-bold truncate ${p.icon.split(" ")[1]} dark:text-white`}>
                    {subject.className}
                  </p>
                </div>
              </div>

              {/* Subject Timings, if available TODAY */}
              {todaySlots.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
                    <Clock className="size-3.5" />
                    Today's Timing
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {todaySlots.map((slot) => {
                      const active = isSlotLive(slot);
                      return (
                        <Badge 
                          key={slot.id} 
                          variant="secondary" 
                          className={`text-xs font-semibold px-2.5 py-1 border rounded-md shadow-sm h-auto flex items-center transition-all ${
                            active 
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100 animate-pulse scale-105" 
                              : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {active && <span className="size-1.5 rounded-full bg-white mr-1.5" />}
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────

function TableView({ subjects, slotsBySubject }: { subjects: SubjectInfo[], slotsBySubject: Map<string, TimetableSlot[]> }) {
  return (
    <>
      {/* Mobile View for List Mode */}
      <div className="block md:hidden space-y-3">
        {subjects.map((subject) => {
          const p = palette(subject.name);
          const relevantSlots = slotsBySubject.get(subject.id) || [];
          const todaySlots = relevantSlots.filter(isSlotToday);
          const isLiveNow = todaySlots.some(isSlotLive);
          const isHappeningToday = todaySlots.length > 0;

          return (
            <div
              key={`${subject.id}-${subject.classId || ""}`}
              className={`p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card shadow-sm space-y-3 transition-all ${
                isLiveNow
                  ? "bg-emerald-50/30 dark:bg-emerald-950/10 ring-1 ring-emerald-500/20"
                  : isHappeningToday
                  ? "bg-blue-50/20 dark:bg-blue-950/5 ring-1 ring-blue-500/10"
                  : ""
              }`}
            >
              {/* Row 1: Icon, Subject Name, Code, Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${p.icon}`}>
                    <BookOpen className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold truncate leading-tight ${
                      isLiveNow ? "text-emerald-700 dark:text-emerald-400" :
                      isHappeningToday ? "text-blue-700 dark:text-blue-400" :
                      "text-zinc-900 dark:text-zinc-100"
                    }`}>
                      {subject.name}
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 block">
                      {subject.code}
                    </span>
                  </div>
                </div>
                
                <div className="shrink-0">
                  {isLiveNow ? (
                    <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 h-auto font-bold uppercase animate-pulse">Live</Badge>
                  ) : isHappeningToday ? (
                    <Badge variant="outline" className="border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400 text-[9px] px-1.5 py-0.5 h-auto bg-blue-50/50 dark:bg-blue-900/20 font-semibold">Today</Badge>
                  ) : null}
                </div>
              </div>

              {/* Row 2: Class & Timings */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${p.bg} text-xs font-semibold`}>
                  <School className={`size-3.5 shrink-0 ${p.icon.split(" ")[1]} dark:text-white/80`} />
                  <span className={`${p.icon.split(" ")[1]} dark:text-white`}>{subject.className}</span>
                </div>

                {todaySlots.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end flex-1">
                    {todaySlots.map((slot) => {
                      const active = isSlotLive(slot);
                      return (
                        <Badge
                          key={slot.id}
                          variant="secondary"
                          className={`text-[10px] font-semibold px-2 py-0.5 border rounded-md whitespace-nowrap ${
                            active
                              ? "bg-emerald-600 text-white border-emerald-600 animate-pulse"
                              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View (HTML Table) */}
      <div className="hidden md:block rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto bg-card">
        <table className="w-full min-w-200">
          <colgroup>
            <col className="w-16" />
            <col />
            <col className="w-[15%]" />
            <col className="w-[22%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-left py-3 pl-6 pr-2">
                #
              </th>
              <th className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-left p-3">
                Subject
              </th>
              <th className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-left p-3">
                Code
              </th>
              <th className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-left p-3">
                Class
              </th>
              <th className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-left py-3 pl-3 pr-6">
                Timings
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {subjects.map((subject, index) => {
              const p = palette(subject.name);
              const relevantSlots = slotsBySubject.get(subject.id) || [];
              const todaySlots = relevantSlots.filter(isSlotToday);
              const isLiveNow = todaySlots.some(isSlotLive);
              const isHappeningToday = todaySlots.length > 0;

              return (
                <tr
                  key={`${subject.id}-${subject.classId || ""}`}
                  className={`transition-colors ${
                    isLiveNow 
                      ? "bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" 
                      : isHappeningToday
                      ? "bg-blue-50/30 dark:bg-blue-900/5 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      : "hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                  }`}
                >
                  <td className="py-3 pl-6 pr-2 text-xs font-mono">
                    {isLiveNow ? (
                      <span className="relative flex size-2.5">
                        <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">{index + 1}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${p.icon}`}>
                        <BookOpen className="size-3.5" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-semibold truncate ${
                          isLiveNow ? "text-emerald-700 dark:text-emerald-400" : 
                          isHappeningToday ? "text-blue-800 dark:text-blue-300" : 
                          "text-zinc-800 dark:text-zinc-200"
                        }`}>
                          {subject.name}
                        </span>
                        {isLiveNow ? (
                           <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 h-4 font-bold uppercase tracking-tighter shrink-0">Live</Badge>
                        ) : isHappeningToday ? (
                           <Badge variant="outline" className="border-blue-200 text-blue-600 text-[9px] px-1 py-0 h-4 font-semibold tracking-tighter shrink-0 bg-blue-50">Today</Badge>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block">
                      {subject.code}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${p.bg} max-w-full`}>
                      <School className={`size-3.5 shrink-0 ${p.icon.split(" ")[1]} dark:text-white/80`} />
                      <span className={`text-xs font-bold truncate ${p.icon.split(" ")[1]} dark:text-white`}>
                        {subject.className}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pl-3 pr-6">
                    <div className="flex flex-wrap gap-1.5">
                      {todaySlots.length > 0 ? (
                        todaySlots.map((slot) => {
                          const active = isSlotLive(slot);
                          return (
                            <Badge 
                              key={slot.id} 
                              variant="secondary" 
                              className={`text-[11px] font-semibold px-2 py-0.5 h-auto border whitespace-nowrap shadow-sm ${
                                active
                                  ? "bg-emerald-600 text-white border-emerald-600 animate-pulse"
                                  : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                              }`}
                            >
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">–</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
