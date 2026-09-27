"use client";

import { Loader2, Pencil } from "lucide-react";
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
import { DAY_FULL_LABELS } from "./constants";
import type { AvailableSubject, AvailableTeacher } from "./types";
import { TimePicker } from "@/components/ui/time-picker";

interface EditSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    subjectId: string;
    teacherId: string;
    startTime: string;
    endTime: string;
    day: string;
    label: string;
  };
  setForm: (form: any) => void;
  onSave: () => void;
  saving: boolean;
  availableSubjects: AvailableSubject[];
  availableTeachers: AvailableTeacher[];
  workingDays: string[];
  isBreak?: boolean;
}

export function EditSlotDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  availableSubjects,
  availableTeachers,
  workingDays,
  isBreak = false,
}: EditSlotDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-emerald-600 dark:text-emerald-400" />
            Edit Timetable Slot
          </DialogTitle>
          <DialogDescription>
            Update the subject, teacher, timing, or day for this period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isBreak ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Break Label
              </label>
              <Input
                value={form.label ?? ""}
                onChange={(e) =>
                  setForm((prev: any) => ({ ...prev, label: e.target.value }))
                }
                placeholder="e.g. Lunch Break"
                className="h-10"
              />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <Select
                  value={form.subjectId ?? ""}
                  onValueChange={(v) => {
                    const sub = availableSubjects.find((s) => s.id === v);
                    setForm((prev: any) => ({
                      ...prev,
                      subjectId: v,
                      teacherId: sub?.teacherId || prev.teacherId,
                    }));
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Teacher
                </label>
                <Select
                  value={form.teacherId ?? ""}
                  onValueChange={(v) =>
                    setForm((prev: any) => ({ ...prev, teacherId: v }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Day
            </label>
            <Select
              value={form.day ?? ""}
              onValueChange={(v) =>
                setForm((prev: any) => ({ ...prev, day: v }))
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {workingDays.map((day) => (
                  <SelectItem key={day} value={day}>
                    {DAY_FULL_LABELS[day]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Start Time
              </label>
              <TimePicker
                value={form.startTime ?? ""}
                onChange={(v) =>
                  setForm((prev: any) => ({
                    ...prev,
                    startTime: v,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                End Time
              </label>
              <TimePicker
                value={form.endTime ?? ""}
                onChange={(v) =>
                  setForm((prev: any) => ({
                    ...prev,
                    endTime: v,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={
              saving ||
              (!form.label && (!form.subjectId || !form.teacherId)) ||
              !form.day ||
              !form.startTime ||
              !form.endTime
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving && (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
