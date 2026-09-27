"use client";

import { BookOpen, Calendar, Clock, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DAY_LABELS, DAY_FULL_LABELS } from "./constants";
import type { AvailableSubject, AvailableTeacher, FormSlot } from "./types";
import { useState } from "react";
import { TimePicker } from "@/components/ui/time-picker";

interface CreateTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentClass: { name: string; section: string } | undefined;
  workingDays: string[];
  daySlots: Record<string, FormSlot[]>;
  setDaySlots: (slots: any) => void;
  availableSubjects: AvailableSubject[];
  availableTeachers: AvailableTeacher[];
  onSave: () => void;
  saving: boolean;
  onCopyToDay: (source: string, target: string) => void;
  onCopyToAllDays: (source: string) => void;
}

export function CreateTimetableDialog({
  open,
  onOpenChange,
  currentClass,
  workingDays,
  daySlots,
  setDaySlots,
  availableSubjects,
  availableTeachers,
  onSave,
  saving,
  onCopyToDay,
  onCopyToAllDays,
}: CreateTimetableDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(workingDays[0] || "monday");
  const [copySourceDay, setCopySourceDay] = useState<string>(workingDays[0] || "monday");

  const currentTabPeriods = daySlots[activeTab] ?? [];
  const totalPeriodCount = Object.values(daySlots).reduce(
    (acc, list) => acc + (list?.length ?? 0),
    0,
  );

  const periodsByDay = Object.fromEntries(
    workingDays.map((d) => [d, daySlots[d]?.length ?? 0]),
  );

  const addPeriod = () => {
    const lastPeriod = currentTabPeriods[currentTabPeriods.length - 1];
    let startTime = "08:00";
    let endTime = "08:45";

    if (lastPeriod && lastPeriod.endTime) {
      startTime = lastPeriod.endTime;
      try {
        const [h, m] = lastPeriod.endTime.split(":").map(Number);
        const date = new Date();
        date.setHours(h);
        date.setMinutes(m + 45);
        endTime = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      } catch {
        endTime = "09:30";
      }
    }

    const newSlot: FormSlot = {
      id: crypto.randomUUID(),
      day: activeTab,
      subjectId: "",
      teacherId: "",
      startTime,
      endTime,
    };
    setDaySlots((prev: any) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] ?? []), newSlot],
    }));
  };

  const addBreak = () => {
    const lastPeriod = currentTabPeriods[currentTabPeriods.length - 1];
    let startTime = "11:00";
    let endTime = "11:30";

    if (lastPeriod && lastPeriod.endTime) {
      startTime = lastPeriod.endTime;
      try {
        const [h, m] = lastPeriod.endTime.split(":").map(Number);
        const date = new Date();
        date.setHours(h);
        date.setMinutes(m + 30);
        endTime = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      } catch {
        endTime = "11:30";
      }
    }

    const newSlot: FormSlot = {
      id: crypto.randomUUID(),
      day: activeTab,
      startTime,
      endTime,
      label: "Lunch Break",
    };
    setDaySlots((prev: any) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] ?? []), newSlot],
    }));
  };

  const removePeriod = (periodId: string) => {
    setDaySlots((prev: any) => ({
      ...prev,
      [activeTab]: (prev[activeTab] ?? []).filter((s: FormSlot) => s.id !== periodId),
    }));
  };

  const updatePeriod = (
    periodId: string,
    field: keyof FormSlot,
    value: string,
  ) => {
    if (field === "day" && value !== activeTab) {
      setDaySlots((prev: any) => {
        const currentList = prev[activeTab] ?? [];
        const period = currentList.find((s: FormSlot) => s.id === periodId);
        if (!period) return prev;
        const updated = { ...period, [field]: value };
        return {
          ...prev,
          [activeTab]: currentList.filter((s: FormSlot) => s.id !== periodId),
          [value]: [...(prev[value] ?? []), updated],
        };
      });
      return;
    }
    setDaySlots((prev: any) => ({
      ...prev,
      [activeTab]: (prev[activeTab] ?? []).map((s: FormSlot) =>
        s.id === periodId ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const handleSubjectChange = (periodId: string, subjectId: string) => {
    const selectedSubject = availableSubjects.find((s) => s.id === subjectId);
    setDaySlots((prev: any) => ({
      ...prev,
      [activeTab]: (prev[activeTab] ?? []).map((s: FormSlot) =>
        s.id === periodId 
          ? { 
              ...s, 
              subjectId, 
              teacherId: selectedSubject?.teacherId || s.teacherId 
            } 
          : s,
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="p-6 pb-0 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />
              Manage Timetable
            </DialogTitle>
            <DialogDescription>
              {totalPeriodCount > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {totalPeriodCount}
                  </span>{" "}
                  total periods for{" "}
                  <span className="font-medium text-foreground">
                    {currentClass
                      ? `${currentClass.name}-${currentClass.section}`
                      : ""}
                  </span>{" "}
                  : add, edit, or remove periods across all days.
                </>
              ) : (
                <>
                  Add time slots for{" "}
                  <span className="font-medium text-foreground">
                    {currentClass
                      ? `${currentClass.name}-${currentClass.section}`
                      : ""}
                  </span>{" "}
                  : select day, subject, teacher, and timing for each period.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            {/* Copy Feature */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <Copy className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Duplicate:</span>
              <Select value={copySourceDay} onValueChange={setCopySourceDay}>
                <SelectTrigger className="h-8 text-sm w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workingDays.map((day) => (
                    <SelectItem key={day} value={day}>
                      {DAY_FULL_LABELS[day]}{" "}
                      {periodsByDay[day] > 0 ? `(${periodsByDay[day]})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onCopyToDay(copySourceDay, activeTab)}>
                Copy {DAY_LABELS[activeTab]}
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onCopyToAllDays(copySourceDay)}>
                Copy All
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b shrink-0">
              {workingDays.map((day) => {
                const count = daySlots[day]?.length ?? 0;
                const isActive = day === activeTab;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveTab(day)}
                    className={`relative flex-1 px-3 py-2 text-sm font-medium transition-colors text-center border-b-2 -mb-px ${
                      isActive ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {DAY_LABELS[day]}
                    {count > 0 && (
                       <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                         {count}
                       </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Middle Container */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="py-4 space-y-4">
            {currentTabPeriods.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                <BookOpen className="size-10 mx-auto mb-2 opacity-25" />
                <p className="text-sm">No periods on {DAY_FULL_LABELS[activeTab]}</p>
              </div>
            ) : (
              currentTabPeriods.map((period, idx) => (
                <div key={period.id} className={`rounded-lg border p-4 ${period.label ? "bg-amber-50/30 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" : "bg-muted/20"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${period.label ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                      {period.label ? <Clock className="size-3" /> : <BookOpen className="size-3" />}
                      {period.label ? "BREAK / EVENT" : `Period ${idx + 1}`}
                    </span>
                    <Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground hover:text-red-600" onClick={() => removePeriod(period.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {period.label !== undefined && period.label !== null ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Label</label>
                          <Input 
                            value={period.label ?? ""} 
                            onChange={(e) => updatePeriod(period.id, "label", e.target.value)} 
                            placeholder="Lunch Break, Assembly, etc."
                            className="h-9 text-xs"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase text-muted-foreground">Start</label>
                             <TimePicker value={period.startTime ?? ""} onChange={(v) => updatePeriod(period.id, "startTime", v)} className="h-9 text-xs [&_button]:h-9 [&_button]:text-[10px]" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase text-muted-foreground">End</label>
                             <TimePicker value={period.endTime ?? ""} onChange={(v) => updatePeriod(period.id, "endTime", v)} className="h-9 text-xs [&_button]:h-9 [&_button]:text-[10px]" />
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Subject</label>
                        <Select value={period.subjectId ?? ""} onValueChange={(v) => handleSubjectChange(period.id, v)}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
                          <SelectContent>{availableSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Teacher</label>
                        <Select value={period.teacherId ?? ""} onValueChange={(v) => updatePeriod(period.id, "teacherId", v)}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Teacher" /></SelectTrigger>
                          <SelectContent>{availableTeachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                          <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Start</label>
                                <TimePicker value={period.startTime ?? ""} onChange={(v) => updatePeriod(period.id, "startTime", v)} className="h-9 text-xs [&_button]:h-9 [&_button]:text-[10px]" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">End</label>
                                <TimePicker value={period.endTime ?? ""} onChange={(v) => updatePeriod(period.id, "endTime", v)} className="h-9 text-xs [&_button]:h-9 [&_button]:text-[10px]" />
                             </div>
                          </div>
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <Button
                variant="outline"
                className="h-12 border-dashed border-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400"
                onClick={() => {
                  addPeriod();
                  setTimeout(() => {
                    const items = document.querySelectorAll(".overflow-y-auto");
                    const container = items[items.length - 1];
                    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                  }, 50);
                }}
              >
                <Plus className="size-4 mr-1.5" /> Add Period
              </Button>
              <Button
                variant="outline"
                className="h-12 border-dashed border-2 hover:bg-amber-50 dark:hover:bg-amber-900/10 text-amber-600 dark:text-amber-400"
                onClick={() => {
                  addBreak();
                  setTimeout(() => {
                    const items = document.querySelectorAll(".overflow-y-auto");
                    const container = items[items.length - 1];
                    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                  }, 50);
                }}
              >
                <Plus className="size-4 mr-1.5" /> Add Break
              </Button>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 border-t shrink-0 flex items-center justify-end gap-3 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={onSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]">
             {saving ? <><Loader2 className="size-4 mr-2 animate-spin" /> Saving...</> : `Save ${totalPeriodCount} Periods`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
