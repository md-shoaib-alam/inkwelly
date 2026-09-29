"use client";

import { useMemo, useState } from "react";
import { Crown, Loader2, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClassInfo, ClassTeacherRef, TeacherInfo } from "@/lib/types";

interface ClassTeachersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls: ClassInfo | null;
  /** Every teacher in the school; the ones already assigned are filtered out. */
  teachers: TeacherInfo[];
  teachersLoading: boolean;
  busy: boolean;
  /** The whole set, committed at once — see PUT /classes/teachers. */
  onSave: (classId: string, teachers: ClassTeacherRef[]) => void;
}

export function ClassTeachersDialog({
  open, onOpenChange, cls, teachers, teachersLoading, busy, onSave,
}: ClassTeachersDialogProps) {
  // The parent gives this dialog a fresh key on every open, so it remounts and the
  // assignment draft is seeded here from the class. Copying `cls` into state from
  // an effect would re-run whenever the teacher list refreshed and discard edits.
  const [assigned, setAssigned] = useState<ClassTeacherRef[]>(() => cls?.teachers ?? []);
  const [search, setSearch] = useState("");
  const [asPrimary, setAsPrimary] = useState(false);

  const assignedIds = useMemo(() => new Set(assigned.map((t) => t.id)), [assigned]);

  const candidates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return teachers
      .filter((t) => !assignedIds.has(t.id))
      .filter((t) =>
        !needle ||
        t.name.toLowerCase().includes(needle) ||
        (t.email || "").toLowerCase().includes(needle))
      .slice(0, 8);
  }, [teachers, assignedIds, search]);

  if (!cls) return null;

  const setPrimary = (teacherId: string) =>
    setAssigned((prev) => prev.map((t) => ({ ...t, isPrimary: t.id === teacherId })));

  const remove = (teacherId: string) =>
    setAssigned((prev) => {
      const next = prev.filter((t) => t.id !== teacherId);
      // Removing the only primary would leave the class with no name in the table.
      if (prev.length > 0 && !next.some((t) => t.isPrimary) && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });

  const add = (teacher: TeacherInfo) =>
    setAssigned((prev) => {
      const becomesPrimary = asPrimary || prev.length === 0;
      return [
        ...prev.map((t) => (becomesPrimary ? { ...t, isPrimary: false } : t)),
        { id: teacher.id, name: teacher.name, isPrimary: becomesPrimary },
      ];
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Users className="size-5" />
            </span>
            <div>
              <DialogTitle>{cls.name} - {cls.section}</DialogTitle>
              <DialogDescription>Manage class teachers</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Current teachers
            </p>
            {assigned.length === 0 ? (
              <p className="rounded-lg border border-dashed px-4 py-6 text-center text-[13px] text-slate-500 dark:text-zinc-400">
                No teacher is assigned to this class yet.
              </p>
            ) : (
              <div className="space-y-2">
                {assigned.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {teacher.name.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-slate-900 dark:text-zinc-50">
                          {teacher.name}
                        </span>
                        {teacher.isPrimary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <Crown className="size-3" /> Primary
                          </span>
                        )}
                      </div>
                    </div>
                    {!teacher.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setPrimary(teacher.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-400 hover:text-red-600"
                      onClick={() => remove(teacher.id)}
                      aria-label={`Remove ${teacher.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Add teacher
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>

            <label className="flex items-center gap-2 pt-1 text-[13px] text-slate-600 dark:text-zinc-400">
              <Checkbox checked={asPrimary} onCheckedChange={(v) => setAsPrimary(v === true)} />
              Assign as primary teacher
            </label>

            {teachersLoading ? (
              <div className="space-y-2 pt-1">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : candidates.length === 0 ? (
              <p className="pt-1 text-[12px] text-slate-500 dark:text-zinc-400">
                {search.trim()
                  ? "No matching teacher left to add."
                  : "Every teacher in this school is already assigned."}
              </p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto pt-1">
                {candidates.map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => add(teacher)}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {teacher.name.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-900 dark:text-zinc-50">
                        {teacher.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                        {teacher.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={busy}
            onClick={() => onSave(cls.id, assigned)}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
