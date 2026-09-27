"use client";

import { useState, useMemo, useCallback, useReducer } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useModulePermissions } from "@/hooks/use-permissions";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { CalendarEvent, EventFormData, EMPTY_FORM, EVENT_TYPE_COLORS } from "./calendar/types";
import { formatDateISO, eventFallsOnDate, getDaysInMonth, getFirstDayOfWeek } from "./calendar/utils";
import { CalendarHeader } from "./calendar/calendar-header";
import { CalendarGrid } from "./calendar/calendar-grid";
import { CalendarAgenda } from "./calendar/calendar-agenda";
import { CalendarDialogs } from "./calendar/calendar-dialogs";
import { useCalendarEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "./calendar/calendar-hooks";

type State = {
  currentYear: number;
  currentMonth: number;
  selectedDate: string | null;
  typeFilter: string;
  dialogOpen: boolean;
  deleteConfirmOpen: boolean;
  eventToDelete: string | null;
  editingEvent: CalendarEvent | null;
  form: EventFormData;
};

type Action =
  | { type: 'SET_YEAR'; payload: number }
  | { type: 'SET_MONTH'; payload: number }
  | { type: 'SET_SELECTED_DATE'; payload: string | null }
  | { type: 'SET_TYPE_FILTER'; payload: string }
  | { type: 'OPEN_DIALOG'; payload: { editingEvent: CalendarEvent | null; form: EventFormData } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_DELETE_CONFIRM'; payload: { open: boolean; id: string | null } }
  | { type: 'UPDATE_FORM'; payload: Partial<EventFormData> }
  | { type: 'PREV_MONTH' }
  | { type: 'NEXT_MONTH' }
  | { type: 'GO_TO_TODAY' };

const today = new Date();
const initialState: State = {
  currentYear: today.getFullYear(),
  currentMonth: today.getMonth(),
  selectedDate: formatDateISO(today),
  typeFilter: "all",
  dialogOpen: false,
  deleteConfirmOpen: false,
  eventToDelete: null,
  editingEvent: null,
  form: { ...EMPTY_FORM },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_YEAR':
      return { ...state, currentYear: action.payload };
    case 'SET_MONTH':
      return { ...state, currentMonth: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_TYPE_FILTER':
      return { ...state, typeFilter: action.payload };
    case 'OPEN_DIALOG':
      return { ...state, dialogOpen: true, editingEvent: action.payload.editingEvent, form: action.payload.form };
    case 'CLOSE_DIALOG':
      return { ...state, dialogOpen: false, editingEvent: null, form: { ...EMPTY_FORM } };
    case 'SET_DELETE_CONFIRM':
      return { ...state, deleteConfirmOpen: action.payload.open, eventToDelete: action.payload.id };
    case 'UPDATE_FORM':
      return { ...state, form: { ...state.form, ...action.payload } };
    case 'PREV_MONTH': {
      const isJan = state.currentMonth === 0;
      return {
        ...state,
        currentMonth: isJan ? 11 : state.currentMonth - 1,
        currentYear: isJan ? state.currentYear - 1 : state.currentYear,
      };
    }
    case 'NEXT_MONTH': {
      const isDec = state.currentMonth === 11;
      return {
        ...state,
        currentMonth: isDec ? 0 : state.currentMonth + 1,
        currentYear: isDec ? state.currentYear + 1 : state.currentYear,
      };
    }
    case 'GO_TO_TODAY': {
      const n = new Date();
      return {
        ...state,
        currentYear: n.getFullYear(),
        currentMonth: n.getMonth(),
        selectedDate: formatDateISO(n),
      };
    }
    default:
      return state;
  }
}

export function AdminCalendar() {
  const { canCreate, canEdit, canDelete } = useModulePermissions("calendar");
  const currentTenantId = useAppStore((s) => s.currentTenantId);

  // --- State ---
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    currentYear,
    currentMonth,
    selectedDate,
    typeFilter,
    dialogOpen,
    deleteConfirmOpen,
    eventToDelete,
    editingEvent,
    form,
  } = state;

  // --- TanStack Query ---
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const { data: events = [], isLoading: loading } = useCalendarEvents(currentTenantId, monthKey);
  
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

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

  const filteredEvents = useMemo(() => (typeFilter === "all" ? events : events.filter((ev) => ev.type === typeFilter)), [events, typeFilter]);
  const selectedDayEvents = useMemo(() => (selectedDate ? filteredEvents.filter((ev) => eventFallsOnDate(ev, selectedDate)) : []), [selectedDate, filteredEvents]);

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
  const goToPrevMonth = () => dispatch({ type: 'PREV_MONTH' });
  const goToNextMonth = () => dispatch({ type: 'NEXT_MONTH' });
  const goToToday = () => dispatch({ type: 'GO_TO_TODAY' });

  // --- Handlers ---
  const openCreateDialog = () => {
    dispatch({
      type: 'OPEN_DIALOG',
      payload: {
        editingEvent: null,
        form: { ...EMPTY_FORM, date: selectedDate || formatDateISO(new Date()) }
      }
    });
  };
  const openEditDialog = (ev: CalendarEvent) => {
    dispatch({
      type: 'OPEN_DIALOG',
      payload: {
        editingEvent: ev,
        form: {
          title: ev.title,
          description: ev.description || "",
          date: ev.date,
          endDate: ev.endDate || "",
          type: ev.type,
          targetRole: ev.targetRole,
          color: ev.color,
          allDay: ev.allDay,
          location: ev.location || ""
        }
      }
    });
  };
  const closeDialog = () => dispatch({ type: 'CLOSE_DIALOG' });
  const updateForm = (key: keyof EventFormData, value: any) => dispatch({ type: 'UPDATE_FORM', payload: { [key]: value } });
  const handleTypeChange = (v: string) => {
    const colorUpdate = EVENT_TYPE_COLORS[v] ? { color: EVENT_TYPE_COLORS[v] } : {};
    dispatch({ type: 'UPDATE_FORM', payload: { type: v, ...colorUpdate } });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) return toast.error("Required fields missing");
    
    if (form.endDate && new Date(form.endDate) < new Date(form.date)) {
      return toast.error("End date cannot be before start date");
    }

    const payload = { ...form, tenantId: currentTenantId, id: editingEvent?.id };
    
    if (editingEvent) {
      const { tenantId: _, ...updateData } = payload;
      await updateMutation.mutateAsync(updateData);
    } else {
      const { id: _, tenantId: __, ...cleanData } = payload;
      await createMutation.mutateAsync(cleanData);
    }
    closeDialog();
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete || !currentTenantId) return;
    await deleteMutation.mutateAsync({ id: eventToDelete });
    dispatch({ type: 'SET_DELETE_CONFIRM', payload: { open: false, id: null } });
  };

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
      {!canCreate && !canEdit && !canDelete && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-sm shadow-amber-500/5 animate-in slide-in-from-top-2 duration-300">
          <div className="size-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Eye className="size-4 shrink-0" />
          </div>
          <div>
            <p className="text-sm text-amber-900 dark:text-amber-200 font-bold leading-none">Read-only Mode</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">You can view but not manage school events.</p>
          </div>
        </div>
      )}

      <CalendarHeader
        currentYear={currentYear} currentMonth={currentMonth} typeFilter={typeFilter}
        setTypeFilter={(v) => dispatch({ type: 'SET_TYPE_FILTER', payload: v })}
        goToPrevMonth={goToPrevMonth} goToNextMonth={goToNextMonth} goToToday={goToToday} canCreate={canCreate} openCreateDialog={openCreateDialog}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 h-full">
          <CalendarGrid
            loading={loading} calendarCells={calendarCells} eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            setSelectedDate={(v) => dispatch({ type: 'SET_SELECTED_DATE', payload: v })}
            isCurrentMonthDay={isCurrentMonthDay}
          />
        </div>

        <CalendarAgenda
          selectedDate={selectedDate}
          setSelectedDate={(v) => dispatch({ type: 'SET_SELECTED_DATE', payload: v })}
          loading={loading}
          selectedDayEvents={selectedDayEvents} getTypeBadgeStyle={getTypeBadgeStyle}
          allEvents={filteredEvents}
          canEdit={canEdit} canDelete={canDelete} openEditDialog={openEditDialog}
          openDeleteConfirm={(id) => dispatch({ type: 'SET_DELETE_CONFIRM', payload: { open: true, id } })}
        />
      </div>


      <CalendarDialogs
        dialogOpen={dialogOpen} closeDialog={closeDialog} editingEvent={editingEvent} form={form}
        updateForm={updateForm} handleTypeChange={handleTypeChange}
        submitting={createMutation.isPending || updateMutation.isPending}
        handleSubmit={handleSubmit}
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={(open) => dispatch({ type: 'SET_DELETE_CONFIRM', payload: { open, id: open ? eventToDelete : null } })}
        deleting={deleteMutation.isPending} handleConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}

