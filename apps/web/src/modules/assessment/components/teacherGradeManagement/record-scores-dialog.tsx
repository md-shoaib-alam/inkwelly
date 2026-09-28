"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Users, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Assessment, StudentInfo, GradeManagementAction } from "./types";

interface RecordScoresDialogProps {
  selectedAssessmentId: string;
  activeAssessment: Assessment | undefined;
  gradesLoading: boolean;
  students: StudentInfo[];
  marks: Record<string, string>;
  isDirty: boolean;
  canCreate: boolean;
  saving: boolean;
  dispatch: React.Dispatch<GradeManagementAction>;
  onSave: () => void;
}

export function RecordScoresDialog({
  selectedAssessmentId,
  activeAssessment,
  gradesLoading,
  students,
  marks,
  isDirty,
  canCreate,
  saving,
  dispatch,
  onSave,
}: RecordScoresDialogProps) {
  const maxMarks = activeAssessment?.totalMarks || 100;
  const passingMarks = activeAssessment?.passingMarks || 40;
  const isActiveAssocCompleted = activeAssessment?.status === "completed";

  const getGrade = (m: number, max: number) => {
    const pct = (m / max) * 100;
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    return "D";
  };

  const getGradeColor = (g: string) => {
    if (g === "A+" || g === "A")
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30";
    if (g === "B+" || g === "B")
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30";
    if (g === "C")
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30";
  };

  return (
    <Dialog 
      open={!!selectedAssessmentId} 
      onOpenChange={(open) => {
        if (!open) {
          dispatch({ type: "SET_SELECTED_ASSESSMENT_ID", id: "" });
          dispatch({ type: "SET_MARKS", marks: {} });
          dispatch({ type: "SET_IS_DIRTY", value: false });
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-blue-600" />
            {activeAssessment?.title || "Record Scores"}
          </DialogTitle>
          <DialogDescription>
            Max: {maxMarks} • Passing: {passingMarks} • Students without marks are considered "Pending"
          </DialogDescription>
        </DialogHeader>

        {gradesLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
            <Users className="size-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No students found</p>
            <p className="text-xs mt-1">
              There are no students in this class.
            </p>
          </div>
        ) : (
          <div className="flex flex-col max-h-[75vh]">
            <div className="overflow-y-auto pr-2 space-y-3 py-2 custom-scrollbar flex-1">
              {students.map((student) => {
                const m = parseFloat(marks[student.id] || "0");
                const hasMark = marks[student.id] && marks[student.id].trim() !== "";
                const grade = hasMark ? getGrade(m, maxMarks) : "-";
                const isPass = hasMark && m >= passingMarks;
                const pct = hasMark ? (m / maxMarks) * 100 : 0;

                return (
                  <div
                    key={student.id}
                    className={`p-4 rounded-lg border transition-all ${
                      hasMark
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${!hasMark ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                            {student.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] flex items-center gap-1 ${
                              hasMark
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
                            }`}
                          >
                            {hasMark ? "✓ Graded" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          Roll No: {student.rollNumber}
                        </p>
                      </div>
                      {hasMark && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`${getGradeColor(grade)} font-bold font-mono`}
                          >
                            Grade: {grade}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-[150px]">
                        <div>
                          <Label className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                            Marks Obtained
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max={maxMarks}
                              placeholder="0"
                              value={marks[student.id] || ""}
                              disabled={gradesLoading || isActiveAssocCompleted}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  const newMarks = { ...marks };
                                  delete newMarks[student.id];
                                  dispatch({ type: "SET_MARKS", marks: newMarks });
                                  dispatch({ type: "SET_IS_DIRTY", value: true });
                                  return;
                                }
                                const num = parseFloat(val);
                                if (num < 0) return;
                                if (num > maxMarks) {
                                  toast.error(`Max marks for this test is ${maxMarks}!`);
                                  return;
                                }
                                dispatch({
                                  type: "SET_MARKS",
                                  marks: {
                                    ...marks,
                                    [student.id]: val,
                                  }
                                });
                                dispatch({ type: "SET_IS_DIRTY", value: true });
                              }}
                              className={`h-8 text-xs w-28 text-center font-semibold ${
                                hasMark && !isPass ? "border-red-300 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10" : "focus:border-blue-500"
                              }`}
                            />
                            <span className="text-[11px] text-muted-foreground">/ {maxMarks}</span>
                          </div>
                        </div>
                      </div>

                      {hasMark && (
                        <div className="w-full sm:w-48 flex flex-col gap-1.5 justify-center self-end pb-1">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                            <span className={isPass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                              {isPass ? "Pass" : "Fail"}
                            </span>
                            <span className="text-muted-foreground">{pct.toFixed(2).replace(/\.00$/, "")}%</span>
                          </div>
                          <Progress
                            value={Math.min(pct, 100)}
                            className={`h-1.5 [&>div]:transition-all ${
                              isPass ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-500"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isDirty && canCreate && !isActiveAssocCompleted && (
              <div className="mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-background sticky bottom-0 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-md py-5 text-sm transition-all flex items-center justify-center"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving grades…
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-1" />
                      Save All Entered Grades
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
