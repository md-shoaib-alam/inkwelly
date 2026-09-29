"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClassSelect } from "@/components/ui/class-select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import {
  CLASS_CHANGE_REASONS,
  validateChangeClassForm,
  type ChangeClassForm,
  type ChangeClassTarget,
} from "../class-change.request";

const emptyForm: ChangeClassForm = {
  targetClassId: "",
  newRollNumber: "",
  effectiveDate: "",
  reason: "",
  remarks: "",
};

interface ChangeClassDialogProps {
  open: boolean;
  targets: ChangeClassTarget[];
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: ChangeClassForm) => void;
}

export function ChangeClassDialog({
  open,
  targets,
  submitting,
  onOpenChange,
  onSubmit,
}: ChangeClassDialogProps) {
  const [form, setForm] = useState<ChangeClassForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  // DatePicker hands over a Date; the wire format the server validates is the
  // text below it, so the pick is kept as state and formatted only for the API.
  const [effectiveDateValue, setEffectiveDateValue] = useState<Date | undefined>(undefined);

  const isBulk = targets.length > 1;
  const single = targets.length === 1 ? targets[0] : undefined;

  const patch = (next: Partial<ChangeClassForm>) => {
    setForm((current) => ({ ...current, ...next }));
    setError(null);
  };

  // Every open starts from a blank form: the parent keeps this dialog mounted, so
  // without it the second student's move would inherit the first one's choices.
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setEffectiveDateValue(undefined);
      setError(null);
    }
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  const handleSubmit = () => {
    const problem = validateChangeClassForm(targets, form);
    if (problem) {
      setError(problem);
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Change student class</DialogTitle>
          <DialogDescription className="text-[13px]">
            {isBulk
              ? `Move ${targets.length} selected students to another class.`
              : "Move a student to another class in this school."}
          </DialogDescription>
        </DialogHeader>

        {/* Student summary — who is about to move, and out of what. */}
        <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
          {single ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{single.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Roll {single.rollNumber} · currently {single.className}
                </p>
              </div>
              <Users className="size-4 text-muted-foreground shrink-0" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {targets.length} students selected
              </p>
              <div data-lenis-prevent className="max-h-28 overflow-y-auto overscroll-contain">
                {targets.map((target) => (
                  <p key={target.id} className="text-[11px] text-muted-foreground truncate">
                    {target.name} · Roll {target.rollNumber}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target class <span className="text-red-500">*</span>
            </Label>
            <ClassSelect
              value={form.targetClassId}
              onValueChange={(v) => patch({ targetClassId: v === "all" ? "" : v })}
              className="w-full h-10"
              placeholder="Select the class to move to"
            />
          </div>

          {!isBulk && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                New roll number <span className="normal-case font-normal">(optional)</span>
              </Label>
              <Input
                value={form.newRollNumber}
                onChange={(e) => patch({ newRollNumber: e.target.value })}
                placeholder={single?.rollNumber}
                className="h-10"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Effective date <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              date={effectiveDateValue}
              onChange={(d) => {
                setEffectiveDateValue(d);
                patch({ effectiveDate: d ? format(d, "yyyy-MM-dd") : "" });
              }}
              placeholder="Pick the date"
              className="w-full h-10"
            />
            <p className="text-[11px] text-muted-foreground">
              The move is applied as soon as you confirm; this date is what gets
              recorded with it.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.reason}
              onValueChange={(v) => patch({ reason: v })}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_CHANGE_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason} className="cursor-pointer">
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Remarks <span className="normal-case font-normal">(optional)</span>
            </Label>
            <Textarea
              value={form.remarks}
              onChange={(e) => patch({ remarks: e.target.value })}
              placeholder="Anything the office should know"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {isBulk ? `Change ${targets.length} classes` : "Change class"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
