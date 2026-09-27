"use client";

import { apiFetch } from "@/lib/api";
import { useReducer, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useModulePermissions } from "@/hooks/use-permissions";
import { useAppStore } from "@/store/use-app-store";
import type { ClassInfo } from "@/lib/types";

// Sub-components
import { GridView } from "./timetable/GridView";
import { ListView } from "./timetable/ListView";
import { DayView } from "./timetable/DayView";
import { TimetableSkeleton } from "./timetable/TimetableSkeleton";
import { CreateTimetableDialog } from "./timetable/CreateTimetableDialog";
import { EditSlotDialog } from "./timetable/EditSlotDialog";
import { WorkingDaysDialog } from "./timetable/WorkingDaysDialog";
import { TimetableHeader } from "./timetable/TimetableHeader";
import { EmptyTimetableState } from "./timetable/EmptyTimetableState";

// Constants & Helpers
import {
  DEFAULT_DAYS,
  ALL_DAYS,
  DAY_LABELS,
} from "./timetable/constants";
import { getCurrentDayIndex } from "./timetable/helpers";
import type { ViewMode, TimetableSlot, FormSlot } from "./timetable/types";

type State = {
  selectedClass: string;
  viewMode: ViewMode;
  selectedDay: string;
  createDialogOpen: boolean;
  daySlots: Record<string, FormSlot[]>;
  saving: boolean;
  editDialogOpen: boolean;
  editingSlot: TimetableSlot | null;
  editForm: {
    subjectId: string; teacherId: string; startTime: string; endTime: string; day: string; label: string;
  };
  editSaving: boolean;
  daysConfigOpen: boolean;
  daysConfigSaving: boolean;
  daysConfigDraft: string[];
};

type Action =
  | { type: 'SET_SELECTED_CLASS'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SELECTED_DAY'; payload: string }
  | { type: 'SET_CREATE_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_DAY_SLOTS'; payload: Record<string, FormSlot[]> | ((prev: Record<string, FormSlot[]>) => Record<string, FormSlot[]>) }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'OPEN_MANAGE'; payload: Record<string, FormSlot[]> }
  | { type: 'OPEN_EDIT_SLOT'; payload: TimetableSlot }
  | { type: 'SET_EDIT_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_EDIT_FORM'; payload: Partial<State['editForm']> }
  | { type: 'SET_EDIT_SAVING'; payload: boolean }
  | { type: 'SET_DAYS_CONFIG_OPEN'; payload: { open: boolean; draft?: string[] } }
  | { type: 'SET_DAYS_CONFIG_SAVING'; payload: boolean }
  | { type: 'SET_DAYS_CONFIG_DRAFT'; payload: string[] };

const initialState: State = {
  selectedClass: "",
  viewMode: "grid",
  selectedDay: "",
  createDialogOpen: false,
  daySlots: {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
  },
  saving: false,
  editDialogOpen: false,
  editingSlot: null,
  editForm: {
    subjectId: "", teacherId: "", startTime: "", endTime: "", day: "", label: "",
  },
  editSaving: false,
  daysConfigOpen: false,
  daysConfigSaving: false,
  daysConfigDraft: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SELECTED_CLASS': return { ...state, selectedClass: action.payload };
    case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };
    case 'SET_SELECTED_DAY': return { ...state, selectedDay: action.payload };
    case 'SET_CREATE_DIALOG_OPEN': return { ...state, createDialogOpen: action.payload };
    case 'SET_DAY_SLOTS':
      return {
        ...state,
        daySlots: typeof action.payload === 'function' ? action.payload(state.daySlots) : action.payload
      };
    case 'SET_SAVING': return { ...state, saving: action.payload };
    case 'OPEN_MANAGE':
      return { ...state, daySlots: action.payload, createDialogOpen: true };
    case 'OPEN_EDIT_SLOT':
      return {
        ...state,
        editingSlot: action.payload,
        editForm: {
          subjectId: action.payload.subjectId ?? "",
          teacherId: action.payload.teacherId ?? "",
          startTime: action.payload.startTime ?? "",
          endTime: action.payload.endTime ?? "",
          day: action.payload.day ?? "",
          label: (action.payload as any).label ?? "",
        },
        editDialogOpen: true
      };
    case 'SET_EDIT_DIALOG_OPEN': return { ...state, editDialogOpen: action.payload };
    case 'SET_EDIT_FORM': return { ...state, editForm: { ...state.editForm, ...action.payload } };
    case 'SET_EDIT_SAVING': return { ...state, editSaving: action.payload };
    case 'SET_DAYS_CONFIG_OPEN':
      return {
        ...state,
        daysConfigOpen: action.payload.open,
        daysConfigDraft: action.payload.draft ?? state.daysConfigDraft
      };
    case 'SET_DAYS_CONFIG_SAVING': return { ...state, daysConfigSaving: action.payload };
    case 'SET_DAYS_CONFIG_DRAFT': return { ...state, daysConfigDraft: action.payload };
    default: return state;
  }
}

export function AdminTimetable() {
  const queryClient = useQueryClient();
  const { currentTenantId } = useAppStore();

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    selectedClass, viewMode, selectedDay, createDialogOpen, daySlots,
    saving, editDialogOpen, editingSlot, editForm, editSaving,
    daysConfigOpen, daysConfigSaving, daysConfigDraft
  } = state;

  const { canCreate, canEdit, canDelete } = useModulePermissions("timetable");

  // ── Queries ──

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery<ClassInfo[]>({
    queryKey: ["classes", currentTenantId, "min"],
    queryFn: async () => {
      const res = await apiFetch("/api/classes?mode=min");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: workingDays = DEFAULT_DAYS } = useQuery<string[]>({
    queryKey: ["working-days", currentTenantId],
    queryFn: async () => {
      const res = await apiFetch(`/api/tenant-settings?tenantId=${currentTenantId}`);
      if (res.ok) {
        const data = await res.json();
        return data.workingDays || DEFAULT_DAYS;
      }
      return DEFAULT_DAYS;
    },
    enabled: !!currentTenantId,
  });

  const { data: slots = [], isLoading: isLoadingTimetable } = useQuery<TimetableSlot[]>({
    queryKey: ["timetable", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const res = await apiFetch(`/api/timetable?classId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch timetable");
      return await res.json();
    },
    enabled: !!selectedClass,
  });

  const { data: availableSubjects = [] } = useQuery({
    queryKey: ["subjects", currentTenantId, "min"],
    queryFn: async () => {
      const res = await apiFetch("/api/subjects?mode=min");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: createDialogOpen || editDialogOpen,
  });

  const { data: availableTeachers = [] } = useQuery({
    queryKey: ["teachers", currentTenantId, "min"],
    queryFn: async () => {
      const res = await apiFetch("/api/teachers?mode=min");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: createDialogOpen || editDialogOpen,
  });

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return availableSubjects;
    return availableSubjects.filter((s: any) => s.classId === selectedClass);
  }, [availableSubjects, selectedClass]);

  // ── Mutations ──

  const bulkSaveMutation = useMutation({
    mutationFn: async (payload: { slots: any[]; classId: string }) => {
      const res = await apiFetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      const currentClassInfo = classes.find((c) => c.id === selectedClass);
      const className = currentClassInfo ? `${currentClassInfo.name}-${currentClassInfo.section}` : "";
      const updatedSlots = variables.slots.map((s) => {
        const sub = availableSubjects.find((sub: any) => sub.id === s.subjectId);
        const teach = availableTeachers.find((t: any) => t.id === s.teacherId);
        return { ...s, subjectName: sub?.name || "", teacherName: teach?.name || "", className: className };
      });
      queryClient.setQueryData(["timetable", selectedClass], updatedSlots);
      toast.success("Timetable updated");
      dispatch({ type: 'SET_CREATE_DIALOG_OPEN', payload: false });
      queryClient.invalidateQueries({ queryKey: ["timetable", selectedClass] });
    },
    onError: () => toast.error("Failed to save timetable"),
    onSettled: () => dispatch({ type: 'SET_SAVING', payload: false }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/timetable?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData(["timetable", selectedClass], (old: any[] | undefined) => old ? old.filter((s) => s.id !== deletedId) : []);
      toast.success("Slot deleted");
      queryClient.invalidateQueries({ queryKey: ["timetable", selectedClass] });
    },
    onError: () => toast.error("Failed to delete slot"),
  });

  // ── Handlers ──

  const handleOpenManage = useCallback(async () => {
    const initial: Record<string, FormSlot[]> = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
    slots.forEach((slot: any) => {
      const dayLower = slot.day.toLowerCase();
      if (initial[dayLower]) {
        initial[dayLower].push({
          ...slot,
          subjectId: slot.subjectId ?? "",
          teacherId: slot.teacherId ?? "",
          label: slot.label ?? undefined
        });
      }
    });
    ALL_DAYS.forEach((day) => { initial[day]?.sort((a, b) => a.startTime.localeCompare(b.startTime)); });
    dispatch({ type: 'OPEN_MANAGE', payload: initial });
  }, [slots]);

  const handleBulkSave = () => {
    if (!selectedClass) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    const allFlatSlots = workingDays.flatMap((day) => daySlots[day] ?? []);
    const validSlots = allFlatSlots.filter((p) => (p.subjectId && p.teacherId) || p.label);
    if (validSlots.length === 0) { toast.error("Please add at least one valid period."); dispatch({ type: 'SET_SAVING', payload: false }); return; }
    bulkSaveMutation.mutate({ slots: validSlots.map((p) => ({ classId: selectedClass, ...p })), classId: selectedClass });
  };

  const handleEditSlot = (slot: TimetableSlot) => {
    dispatch({ type: 'OPEN_EDIT_SLOT', payload: slot });
  };

  const handleEditSave = async () => {
    if (!editingSlot) return;
    dispatch({ type: 'SET_EDIT_SAVING', payload: true });
    try {
      const res = await apiFetch(`/api/timetable?id=${editingSlot.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (res.ok) {
        const sub = availableSubjects.find((s: any) => s.id === editForm.subjectId);
        const teach = availableTeachers.find((t: any) => t.id === editForm.teacherId);
        queryClient.setQueryData(["timetable", selectedClass], (old: any[] | undefined) => {
          if (!old) return [];
          return old.map((s) => s.id === editingSlot.id ? { ...s, ...editForm, subjectName: sub?.name || s.subjectName, teacherName: teach?.name || s.teacherName } : s);
        });
        toast.success("Slot updated");
        dispatch({ type: 'SET_EDIT_DIALOG_OPEN', payload: false });
        queryClient.invalidateQueries({ queryKey: ["timetable", selectedClass] });
      } else { toast.error("Failed to update slot"); }
    } finally { dispatch({ type: 'SET_EDIT_SAVING', payload: false }); }
  };

  const handleWorkingDaysSave = async () => {
    dispatch({ type: 'SET_DAYS_CONFIG_SAVING', payload: true });
    try {
      const res = await apiFetch("/api/tenant-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: currentTenantId, settings: { workingDays: daysConfigDraft } }) });
      if (res.ok) { queryClient.invalidateQueries({ queryKey: ["working-days", currentTenantId] }); dispatch({ type: 'SET_DAYS_CONFIG_OPEN', payload: { open: false } }); toast.success("Working days updated"); }
    } finally { dispatch({ type: 'SET_DAYS_CONFIG_SAVING', payload: false }); }
  };

  const currentClass = useMemo(() => classes.find((c) => c.id === selectedClass), [classes, selectedClass]);
  const uniqueSubjects = useMemo(() => Array.from(new Set(slots.map((s) => s.subjectName))), [slots]);
  const currentDayIndex = useMemo(() => getCurrentDayIndex(workingDays), [workingDays]);

  const timeSlots = useMemo(() => {
    const unique = new Map<string, { start: string; end: string }>();
    slots.forEach((s) => unique.set(`${s.startTime}-${s.endTime}`, { start: s.startTime, end: s.endTime }));
    return Array.from(unique.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [slots]);

  const gridData = useMemo(() => {
    const data = new Map<string, Map<string, TimetableSlot[]>>();
    slots.forEach((slot) => {
      const dayLower = slot.day.toLowerCase();
      if (!data.has(dayLower)) data.set(dayLower, new Map());
      const dayMap = data.get(dayLower)!;
      const timeKey = `${slot.startTime}-${slot.endTime}`;
      if (!dayMap.has(timeKey)) dayMap.set(timeKey, []);
      dayMap.get(timeKey)!.push(slot);
    });
    return data;
  }, [slots]);

  const slotsByDay = useMemo(() => {
    const data = new Map<string, TimetableSlot[]>();
    slots.forEach((slot) => {
      const dayLower = slot.day.toLowerCase();
      if (!data.has(dayLower)) data.set(dayLower, []);
      data.get(dayLower)!.push(slot);
    });
    data.forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return data;
  }, [slots]);

  const effectiveDay = workingDays.includes(selectedDay) ? selectedDay : workingDays[currentDayIndex] || workingDays[0];
  const selectedDaySlots = useMemo(() => {
    return timeSlots.map(({ start, end }) => { const key = `${start}-${end}`; return gridData.get(effectiveDay)?.get(key) || []; });
  }, [effectiveDay, timeSlots, gridData]);

  return (
    <div className="space-y-6">
      <TimetableHeader 
        currentClass={currentClass}
        viewMode={viewMode}
        setViewMode={(v) => dispatch({ type: 'SET_VIEW_MODE', payload: v })}
        selectedClass={selectedClass}
        onClassChange={(v) => dispatch({ type: 'SET_SELECTED_CLASS', payload: v })}
        canEdit={canEdit}
        canCreate={canCreate}
        onSettingsClick={() => { dispatch({ type: 'SET_DAYS_CONFIG_OPEN', payload: { open: true, draft: [...workingDays] } }); }}
        onManageClick={handleOpenManage}
      />

      <Card className="border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoadingTimetable || isLoadingClasses ? (
            <TimetableSkeleton viewMode={viewMode} />
          ) : slots.length === 0 ? (
            <EmptyTimetableState 
              selectedClass={selectedClass}
              classes={classes}
              onClassSelect={(v) => dispatch({ type: 'SET_SELECTED_CLASS', payload: v })}
              onManageClick={handleOpenManage}
              canCreate={canCreate}
            />
          ) : viewMode === "grid" ? (
            <GridView timeSlots={timeSlots} gridData={gridData} uniqueSubjects={uniqueSubjects} workingDays={workingDays} currentDayIndex={currentDayIndex} onDeleteSlot={(id) => deleteMutation.mutate(id)} onEditSlot={handleEditSlot} canEdit={canEdit} canDelete={canDelete} />
          ) : viewMode === "list" ? (
            <ListView slotsByDay={slotsByDay} uniqueSubjects={uniqueSubjects} workingDays={workingDays} currentDayIndex={currentDayIndex} onDeleteSlot={(id) => deleteMutation.mutate(id)} onEditSlot={handleEditSlot} canEdit={canEdit} canDelete={canDelete} />
          ) : (
            <DayView selectedDay={effectiveDay} selectedDaySlots={selectedDaySlots} timeSlots={timeSlots} uniqueSubjects={uniqueSubjects} workingDays={workingDays} currentDayIndex={currentDayIndex} onSelectDay={(v) => dispatch({ type: 'SET_SELECTED_DAY', payload: v })} onDeleteSlot={(id) => deleteMutation.mutate(id)} onEditSlot={handleEditSlot} canEdit={canEdit} canDelete={canDelete} />
          )}
        </CardContent>
      </Card>

      <WorkingDaysDialog open={daysConfigOpen} onOpenChange={(v) => dispatch({ type: 'SET_DAYS_CONFIG_OPEN', payload: { open: v } })} draft={daysConfigDraft} setDraft={(v) => dispatch({ type: 'SET_DAYS_CONFIG_DRAFT', payload: v })} onSave={handleWorkingDaysSave} saving={daysConfigSaving} />
      <EditSlotDialog open={editDialogOpen} onOpenChange={(v) => dispatch({ type: 'SET_EDIT_DIALOG_OPEN', payload: v })} form={editForm} setForm={(v) => dispatch({ type: 'SET_EDIT_FORM', payload: v })} onSave={handleEditSave} saving={editSaving} availableSubjects={filteredSubjects} availableTeachers={availableTeachers} workingDays={workingDays} isBreak={!!(editingSlot as any)?.label} />
      <CreateTimetableDialog 
        open={createDialogOpen} 
        onOpenChange={(v) => dispatch({ type: 'SET_CREATE_DIALOG_OPEN', payload: v })} 
        currentClass={currentClass} 
        workingDays={workingDays} 
        daySlots={daySlots} 
        setDaySlots={(v) => dispatch({ type: 'SET_DAY_SLOTS', payload: v })} 
        availableSubjects={filteredSubjects} 
        availableTeachers={availableTeachers} 
        onSave={handleBulkSave} 
        saving={saving} 
        onCopyToDay={(src, tar) => {
          const sourcePeriods = daySlots[src] ?? [];
          if (sourcePeriods.length === 0) return;
          const copied = sourcePeriods.map((slot) => ({ ...slot, id: typeof window !== "undefined" ? window.crypto.randomUUID() : "", day: tar }));
          dispatch({ type: 'SET_DAY_SLOTS', payload: (prev) => ({ ...prev, [tar]: copied }) });
          toast.success(`Copied to ${DAY_LABELS[tar]}`);
        }}
        onCopyToAllDays={(src) => {
          const sourcePeriods = daySlots[src] ?? [];
          if (sourcePeriods.length === 0) return;
          const updated = { ...daySlots };
          workingDays.forEach((day) => { if (day === src) return; const copied = sourcePeriods.map((slot) => ({ ...slot, id: typeof window !== "undefined" ? window.crypto.randomUUID() : "", day })); updated[day] = copied; });
          dispatch({ type: 'SET_DAY_SLOTS', payload: updated });
          toast.success("Copied to all days");
        }}
      />
    </div>
  );
}
