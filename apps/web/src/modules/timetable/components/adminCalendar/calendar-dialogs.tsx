"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarEvent, EventFormData, ALL_EVENT_TYPES, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, TARGET_ROLE_LABELS } from "./types";
import { formatDateISO } from "./utils";

interface CalendarDialogsProps {
  dialogOpen: boolean;
  closeDialog: () => void;
  editingEvent: CalendarEvent | null;
  form: EventFormData;
  updateForm: (k: keyof EventFormData, v: any) => void;
  handleTypeChange: (v: string) => void;
  submitting: boolean;
  handleSubmit: () => void;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (b: boolean) => void;
  deleting: boolean;
  handleConfirmDelete: () => void;
}

export function CalendarDialogs({
  dialogOpen,
  closeDialog,
  editingEvent,
  form,
  updateForm,
  handleTypeChange,
  submitting,
  handleSubmit,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  deleting,
  handleConfirmDelete,
}: CalendarDialogsProps) {
  const startDateVal = form.date ? new Date(form.date + "T00:00:00") : undefined;
  const endDateVal = form.endDate ? new Date(form.endDate + "T00:00:00") : undefined;

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="w-[92%] sm:w-full max-w-[550px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-0 overflow-hidden mx-auto">
          <DialogHeader className="p-6 border-b border-zinc-100 dark:border-white/[0.05]">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
              {editingEvent ? "Update Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {editingEvent ? "Modify the existing schedule details below." : "Add a new holiday, exam, or school event to the calendar."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">Event Title</Label>
              <Input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g. Annual Sports Meet 2024"
                className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent h-10 text-sm"
              />
            </div>

             <div className="grid grid-cols-2 gap-4" suppressHydrationWarning>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">Start Date</Label>
                 <DatePicker 
                   date={startDateVal} 
                   onChange={(d) => {
                     const formatted = d ? formatDateISO(d) : "";
                     const newEnd = d && endDateVal && d > endDateVal ? formatted : form.endDate;
                     updateForm("date", formatted);
                     updateForm("endDate", newEnd);
                   }}
                   className="h-10 text-sm w-full"
                 />
               </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">End Date</Label>
                 <DatePicker 
                   date={endDateVal} 
                   onChange={(d) => updateForm("endDate", d ? formatDateISO(d) : "")}
                   className="h-10 text-sm w-full"
                   placeholder="Optional"
                   disabled={(d) => startDateVal ? d < startDateVal : false}
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">Category</Label>
                 <Select value={form.type} onValueChange={handleTypeChange}>
                   <SelectTrigger className="h-10 text-sm font-normal">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {ALL_EVENT_TYPES.map((t) => (
                       <SelectItem key={t} value={t} className="text-sm">
                         {EVENT_TYPE_LABELS[t]}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">Visible To</Label>
                 <Select value={form.targetRole} onValueChange={(v) => updateForm("targetRole", v)}>
                   <SelectTrigger className="h-10 text-sm font-normal">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {Object.entries(TARGET_ROLE_LABELS).map(([val, lbl]) => (
                       <SelectItem key={val} value={val} className="text-xs uppercase font-normal">{lbl}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">Location</Label>
              <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="e.g. Main Auditorium" className="h-10 text-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">Description</Label>
              <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Add more details about this event..." className="min-h-[80px] text-sm" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="flex flex-col gap-0.5">
                <Label className="text-xs font-bold text-zinc-900 dark:text-white">Full Day Event</Label>
                <span className="text-[10px] text-zinc-400">Mark if this event lasts the entire day</span>
              </div>
              <Switch checked={form.allDay} onCheckedChange={(v) => updateForm("allDay", v)} />
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50/50 dark:bg-white/[0.01] border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={closeDialog} className="rounded-xl font-semibold text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.03]" disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-500 dark:bg-rose-600 dark:hover:bg-rose-500 text-white shadow-sm rounded-xl px-5 h-10 font-bold text-sm transition-all duration-200 active:scale-95" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {editingEvent ? "Update Schedule" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="w-[92%] sm:w-full max-w-[400px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">Delete Event?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-500 mt-2">
              This action is permanent and cannot be undone. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3">
            <AlertDialogCancel className="rounded-lg border-zinc-200 dark:border-zinc-700 font-bold h-10 px-4">Discard</AlertDialogCancel>
            <AlertDialogAction className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
