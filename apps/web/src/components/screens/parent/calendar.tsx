"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";

import { CalendarEvent, EVENT_TYPE_COLORS } from "../admin/calendar/types";
import { formatDateISO, eventFallsOnDate, getDaysInMonth, getFirstDayOfWeek } from "../admin/calendar/utils";
import { CalendarHeader } from "../admin/calendar/calendar-header";
import { CalendarGrid } from "../admin/calendar/calendar-grid";
import { CalendarAgenda } from "../admin/calendar/calendar-agenda";
import { useCalendarEvents } from "../admin/calendar/calendar-hooks";

export function ParentCalendar() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);

  // --- State ---
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    formatDateISO(new Date()),
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // --- TanStack Query ---
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const { data: allEvents = [], isLoading: loading } = useCalendarEvents(currentTenantId, monthKey);
  
  // Client-side Role Filtering
  const filteredByRole = useMemo(() => {
    const allowedRoles = new Set(["all", "parent"]);
    return allEvents.filter((ev: CalendarEvent) => allowedRoles.has(ev.targetRole));
  }, [allEvents]);

  // --- Derived data ---
  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);
  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(currentYear, currentMonth), [currentYear, currentMonth]);

  const calendarCells = useMemo(() => {
    const cells: (string | null)[] = [];
    const prevMonthDays = getDaysInMonth(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      cells.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      cells.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek]);

  const filteredEvents = useMemo(() => (typeFilter === "all" ? filteredByRole : filteredByRole.filter((ev: CalendarEvent) => ev.type === typeFilter)), [filteredByRole, typeFilter]);
  const selectedDayEvents = useMemo(() => (selectedDate ? filteredEvents.filter((ev: CalendarEvent) => eventFallsOnDate(ev, selectedDate)) : []), [selectedDate, filteredEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of filteredEvents) {
      let cursor = ev.date;
      const end = ev.endDate || ev.date;
      while (cursor <= end) {
        const existing = map.get(cursor) || [];
        existing.push(ev);
        map.set(cursor, existing);
        const d = new Date(cursor + "T00:00:00");
        d.setDate(d.getDate() + 1);
        cursor = formatDateISO(d);
      }
    }
    return map;
  }, [filteredEvents]);

  // --- Navigation ---
  const goToPrevMonth = () => setCurrentMonth(prev => prev === 0 ? (setCurrentYear(y => y-1), 11) : prev - 1);
  const goToNextMonth = () => setCurrentMonth(prev => prev === 11 ? (setCurrentYear(y => y+1), 0) : prev + 1);
  const goToToday = () => { const n = new Date(); setCurrentYear(n.getFullYear()); setCurrentMonth(n.getMonth()); setSelectedDate(formatDateISO(n)); };

  const isCurrentMonthDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const getTypeBadgeStyle = (type: string, color: string) => {
    const c = color || EVENT_TYPE_COLORS[type] || "#6b7280";
    return { backgroundColor: `${c}18`, color: c, borderColor: `${c}40` };
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 overflow-hidden pb-8">
      <CalendarHeader
        currentYear={currentYear}
        currentMonth={currentMonth}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        goToPrevMonth={goToPrevMonth}
        goToNextMonth={goToNextMonth}
        goToToday={goToToday}
        canCreate={false}
        openCreateDialog={() => {}}
        title="Parent Calendar"
        description="Home Portal"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 h-full">
          <CalendarGrid
            loading={loading}
            calendarCells={calendarCells}
            eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isCurrentMonthDay={isCurrentMonthDay}
          />
        </div>

        <CalendarAgenda
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          loading={loading}
          selectedDayEvents={selectedDayEvents}
          getTypeBadgeStyle={getTypeBadgeStyle}
          allEvents={filteredEvents}
          canEdit={false}
          canDelete={false}
          openEditDialog={() => {}}
          openDeleteConfirm={() => {}}
        />
      </div>
    </div>
  );
}
