"use client";

import { useState } from "react";
import { Loader2, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  CLASS_LEVELS,
  CLASS_MEDIUMS,
  CLASS_SECTIONS,
  formatClassLevelLabel,
} from "@/lib/class-options";
import type { ClassInfo } from "@/lib/types";

export interface ClassFormPayload {
  id?: string;
  section: string;
  classLevel: string;
  medium: string;
  capacity: number;
  isVocational: boolean;
  isActive: boolean;
}

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent means create. The draft is seeded on mount, so remount per open. */
  initial?: ClassInfo | null;
  busy: boolean;
  onSubmit: (payload: ClassFormPayload) => void;
}

const emptyForm = {
  classLevel: "",
  section: "",
  medium: "English",
  capacity: "",
  isVocational: false,
  isActive: true,
};

export function ClassFormDialog({ open, onOpenChange, initial, busy, onSubmit }: ClassFormDialogProps) {
  const isEdit = !!initial;
  // The parent gives this dialog a fresh key on every open, so it remounts and the
  // draft is seeded here from `initial`. Copying the props into state from an
  // effect would instead re-run while the admin is typing and wipe their edits.
  // The server owns `name` and `slug` (derived from classLevel + section), so the
  // form no longer carries them and cannot disagree with that derivation.
  const [form, setForm] = useState(() => initial ? {
    classLevel: initial.classLevel,
    section: initial.section,
    medium: initial.medium || "English",
    capacity: String(initial.capacity ?? ""),
    isVocational: initial.isVocational,
    isActive: initial.isActive,
  } : emptyForm);

  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const onClassLevelChange = (classLevel: string) => set({ classLevel });
  const onSectionChange = (section: string) => set({ section });

  const capacity = form.capacity.trim() === "" ? 40 : Number(form.capacity);
  const valid =
    !!form.classLevel.trim() &&
    !!form.section.trim() &&
    Number.isFinite(capacity) && capacity >= 1;

  const submit = () => {
    if (!valid) return;
    onSubmit({
      id: initial?.id,
      section: form.section.trim(),
      classLevel: form.classLevel.trim(),
      medium: form.medium,
      capacity,
      isVocational: form.isVocational,
      isActive: form.isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
              <School className="size-5" />
            </span>
            <div>
              <DialogTitle>{isEdit ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>
                {isEdit ? "Update this class's details" : "Fill in the details to create a new class"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="class-level">
                Class level <span className="text-red-500">*</span>
              </Label>
              <Select value={form.classLevel || undefined} onValueChange={onClassLevelChange}>
                <SelectTrigger id="class-level">
                  <SelectValue placeholder="Select class level" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_LEVELS.map((classLevel) => (
                    <SelectItem key={classLevel} value={classLevel}>
                      {formatClassLevelLabel(classLevel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="class-section">
                Section <span className="text-red-500">*</span>
              </Label>
              <Select value={form.section || undefined} onValueChange={onSectionChange}>
                <SelectTrigger id="class-section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_SECTIONS.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="class-medium">Medium of instruction</Label>
              <Select value={form.medium} onValueChange={(v) => set({ medium: v })}>
                <SelectTrigger id="class-medium">
                  <SelectValue placeholder="English" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_MEDIUMS.map((medium) => (
                    <SelectItem key={medium} value={medium}>
                      {medium}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="class-capacity">Max capacity</Label>
              <Input
                id="class-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set({ capacity: e.target.value })}
                placeholder="e.g., 40"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Leave empty for 40. Drives the occupancy bar.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-zinc-50">Vocational Education</p>
                <p className="text-[12px] text-slate-500 dark:text-zinc-400">Does this class offer vocational courses?</p>
              </div>
              <Switch
                checked={form.isVocational}
                onCheckedChange={(v) => set({ isVocational: v })}
                aria-label="Vocational education"
              />
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-zinc-50">Active</p>
                <p className="text-[12px] text-slate-500 dark:text-zinc-400">Active classes can accept student enrollments</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => set({ isActive: v })}
                aria-label="Active"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={submit}
            disabled={busy || !valid}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
