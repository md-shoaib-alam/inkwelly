"use client";

import { BookOpen, Pencil, ChevronUp, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TeacherInfo } from "./types";

interface SubjectsCardProps {
  currentTeacher: TeacherInfo;
  formData: any;
  setFormData: (data: any) => void;
  canEdit?: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}

export function TeacherSubjectsCard({
  currentTeacher,
  formData,
  setFormData,
  canEdit,
  isEditing,
  isSaving,
  isCollapsed,
  onToggleCollapse,
  onStartEdit,
  onCancelEdit,
  onSave,
}: SubjectsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
          <BookOpen className="size-4 text-emerald-600" />
          Assigned Subjects ({currentTeacher.subjects?.length || 0})
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelEdit}
                disabled={isSaving}
                className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
              >
                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                Save
              </Button>
            </div>
          ) : (
            canEdit && (
              <button
                onClick={onStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="Toggle section"
          >
            {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        isEditing ? (
          /* EDIT SUBJECTS */
          <div className="space-y-3 pt-1">
            <div className="flex gap-2">
              <Input
                value={formData.newSubjectInput}
                onChange={(e) => setFormData({ ...formData, newSubjectInput: e.target.value })}
                placeholder="Add subject (e.g. Mathematics)"
                className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formData.newSubjectInput.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      subjects: [...formData.subjects, formData.newSubjectInput.trim()],
                      newSubjectInput: "",
                    });
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (formData.newSubjectInput.trim()) {
                    setFormData({
                      ...formData,
                      subjects: [...formData.subjects, formData.newSubjectInput.trim()],
                      newSubjectInput: "",
                    });
                  }
                }}
                className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {formData.subjects.map((subj: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60"
                >
                  {subj}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        subjects: formData.subjects.filter((_: any, i: number) => i !== idx),
                      });
                    }}
                    className="hover:text-red-500 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* VIEW SUBJECTS */
          !currentTeacher.subjects || currentTeacher.subjects.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No subjects assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentTeacher.subjects.map((subj, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60"
                >
                  {subj}
                </span>
              ))}
            </div>
          )
        )
      )}
    </div>
  );
}
