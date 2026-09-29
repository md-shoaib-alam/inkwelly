"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Pencil, Trash2, Users } from "lucide-react";
import {
  GradeBadge,
  MediumBadge,
  SectionChip,
  StatusBadge,
  TeacherStack,
  YesNoBadge,
} from "@/components/shared/classes/ClassBadges";
import { formatGradeLabel } from "@/lib/class-options";
import type { ClassInfo } from "@/lib/types";

interface ClassesTableViewProps {
  classes: ClassInfo[];
  canEdit: boolean;
  canDelete: boolean;
  canManageTeachers: boolean;
  onViewStudents: (cls: ClassInfo) => void;
  onManageTeachers: (cls: ClassInfo) => void;
  onEdit: (cls: ClassInfo) => void;
  onDelete: (cls: ClassInfo) => void;
}

export function ClassesTableView({
  classes,
  canEdit,
  canDelete,
  canManageTeachers,
  onViewStudents,
  onManageTeachers,
  onEdit,
  onDelete,
}: ClassesTableViewProps) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] dark:bg-zinc-800/40 border-b border-slate-200/70 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="pl-6 pr-4 py-3.5">Class</th>
              <th className="px-4 py-3.5">Grade</th>
              <th className="px-4 py-3.5">Section</th>
              <th className="px-4 py-3.5">Class teacher</th>
              <th className="px-4 py-3.5">Medium</th>
              <th className="px-4 py-3.5">Capacity</th>
              <th className="px-4 py-3.5">Vocational</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="pr-6 pl-4 py-3.5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {classes.map((cls) => (
              <tr key={cls.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="pl-6 pr-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                      <GraduationCap className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onViewStudents(cls)}
                        className="block truncate text-left font-semibold text-slate-900 hover:text-teal-700 dark:text-zinc-100 dark:hover:text-teal-400 text-sm cursor-pointer"
                      >
                        {cls.name} - {cls.section}
                      </button>
                      {cls.slug && (
                        <p className="truncate text-[11px] text-slate-400 dark:text-zinc-500">{cls.slug}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5"><GradeBadge grade={formatGradeLabel(cls.grade)} /></td>
                <td className="px-4 py-3.5"><SectionChip section={cls.section} /></td>
                <td className="px-4 py-3.5"><TeacherStack cls={cls} /></td>
                <td className="px-4 py-3.5"><MediumBadge medium={cls.medium} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                    <Users className="size-3.5 text-slate-400" />
                    <span className="tabular-nums text-sm font-medium">{cls.capacity}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5"><YesNoBadge value={cls.isVocational} /></td>
                <td className="px-4 py-3.5"><StatusBadge isActive={cls.isActive} /></td>
                <td className="pr-6 pl-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canManageTeachers && (
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        onClick={() => onManageTeachers(cls)}
                        title="Manage teachers"
                        aria-label="Manage class teachers"
                      >
                        <Users className="size-3.5" />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        onClick={() => onEdit(cls)}
                        title="Edit class"
                        aria-label="Edit class"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        onClick={() => onDelete(cls)}
                        title="Delete class"
                        aria-label="Delete class"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
