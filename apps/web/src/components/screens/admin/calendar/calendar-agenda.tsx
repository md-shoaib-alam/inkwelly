"use client";

import { useState, useMemo } from "react";
import { CalendarEvent } from "./types";
import { formatDateISO } from "./utils";

// Sub-components
import { ActiveEventsCard } from "./agenda/ActiveEventsCard";
import { UpcomingEventsCard } from "./agenda/UpcomingEventsCard";
import { CategoriesLegend } from "./agenda/CategoriesLegend";
import { EventDetailDialog } from "./agenda/EventDetailDialog";

const EMPTY_EVENTS: CalendarEvent[] = [];

interface CalendarAgendaProps {
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
  loading: boolean;
  selectedDayEvents: CalendarEvent[];
  getTypeBadgeStyle: (type: string, color: string) => any;
  allEvents: CalendarEvent[];
  canEdit: boolean;
  canDelete: boolean;
  openEditDialog: (ev: CalendarEvent) => void;
  openDeleteConfirm: (id: string) => void;
}

export function CalendarAgenda({
  selectedDate,
  setSelectedDate,
  loading,
  selectedDayEvents,
  getTypeBadgeStyle,
  allEvents = EMPTY_EVENTS,
  canEdit,
  canDelete,
  openEditDialog,
  openDeleteConfirm,
}: CalendarAgendaProps) {
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  
  const todayStr = useMemo(() => formatDateISO(new Date()), []);

  // Determine date string for top view
  const displayDate = selectedDate || todayStr;
  const isViewingToday = displayDate === todayStr;

  // Compute the top events (fallback to today if nothing selected)
  const activeEventsList = useMemo(() => {
    if (selectedDate) return selectedDayEvents;
    return allEvents.filter(ev => ev.date === todayStr || (ev.endDate && ev.endDate >= todayStr && ev.date <= todayStr));
  }, [selectedDate, selectedDayEvents, allEvents, todayStr]);

  // Compute Upcoming Events (strictly tomorrow up to the end of the current month)
  const upcomingEventsList = useMemo(() => {
    const todayObj = new Date();
    const endOfMonth = new Date(todayObj.getFullYear(), todayObj.getMonth() + 1, 0);
    const maxDateStr = formatDateISO(endOfMonth);

    return allEvents
      .filter(ev => ev.date > todayStr && ev.date <= maxDateStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4); // Limit to 4 upcoming items for compact display
  }, [allEvents, todayStr]);

  // Formats date to "13 May 2026"
  const getFormattedDatePill = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="lg:col-span-4 flex flex-col gap-5 h-full">
      <ActiveEventsCard 
        isViewingToday={isViewingToday}
        selectedDate={selectedDate}
        onClearSelection={() => setSelectedDate(null)}
        formattedDatePill={getFormattedDatePill(displayDate)}
        loading={loading}
        activeEventsList={activeEventsList}
        onDetailClick={setDetailEvent}
        getTypeBadgeStyle={getTypeBadgeStyle}
        canEdit={canEdit}
        canDelete={canDelete}
        openEditDialog={openEditDialog}
        openDeleteConfirm={openDeleteConfirm}
      />

      <UpcomingEventsCard 
        loading={loading}
        upcomingEventsList={upcomingEventsList}
        onDetailClick={setDetailEvent}
        getFormattedDatePill={getFormattedDatePill}
        getTypeBadgeStyle={getTypeBadgeStyle}
      />

      <CategoriesLegend />

      <EventDetailDialog 
        event={detailEvent}
        onOpenChange={(open) => !open && setDetailEvent(null)}
        getTypeBadgeStyle={getTypeBadgeStyle}
        getFormattedDatePill={getFormattedDatePill}
      />
    </div>
  );
}


