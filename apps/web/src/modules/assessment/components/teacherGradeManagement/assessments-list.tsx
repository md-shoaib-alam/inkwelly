"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Eye,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  Users,
} from "lucide-react";
import { ClassInfo, SubjectInfo, Assessment, GradeManagementAction } from "./types";

interface AssessmentsListProps {
  assessments: Assessment[];
  listLoading: boolean;
  selectedAssessmentId: string;
  marks: Record<string, string>;
  classes: ClassInfo[];
  subjects: SubjectInfo[];
  completingId: string | null;
  dispatch: React.Dispatch<GradeManagementAction>;
}

export function AssessmentsList({
  assessments,
  listLoading,
  selectedAssessmentId,
  marks,
  classes,
  subjects,
  completingId,
  dispatch,
}: AssessmentsListProps) {
  if (listLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-5 space-y-4 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
              </div>
              <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/6" />
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="h-9 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  if (assessments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assessments.map((a) => {
        const isCompleted = a.status === "completed";
        // Count actual grades or use backend count if available. For now, filter local state if this is the active assessment,
        // or if not, use the eager-loaded grades array length.
        const gradedCount = selectedAssessmentId === a.id 
          ? Object.entries(marks).filter(([_, v]) => v && v.trim() !== "").length
          : (a.grades?.length || 0);
        const totalStudents = a.class?.students?.length || 0;
        const total = totalStudents || 1; // avoid division by zero
        const pct = (gradedCount / total) * 100;

        const selectedClassObj = classes.find(c => c.id === a.classId);
        const selectedSubjectObj = subjects.find(s => s.id === a.subjectId);

        return (
          <Card
            key={a.id}
            className={`rounded-xl shadow-sm ${isCompleted ? "border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50/5 dark:bg-emerald-900/5" : "border-zinc-100 dark:border-zinc-800"} hover:shadow-md transition-shadow`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm truncate">
                    {a.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {selectedSubjectObj?.name} • {selectedClassObj?.name} {selectedClassObj?.section}
                  </p>
                </div>
                {isCompleted && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50 font-medium px-2 py-0.5 flex items-center gap-1 border rounded-full shrink-0"
                  >
                    <CheckCircle2 className="size-2.5" />
                    Completed
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                <span className="flex items-center gap-1">
                  <FileText className="size-3" /> {a.type}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium px-2 py-0.5 flex items-center gap-1 border rounded-full bg-violet-50 text-violet-700 border-violet-100/60 dark:bg-violet-950/20 dark:text-violet-300 dark:border-violet-900/50`}
                >
                  <Globe className="size-2.5" /> Offline
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Submissions
                  </span>
                  <span className="font-medium">
                    {gradedCount}/{totalStudents}
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <Users className="size-3" />
                  {totalStudents - gradedCount === 0 
                    ? "All students have submitted"
                    : `${totalStudents - gradedCount} students haven't submitted`}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => dispatch({ type: "SET_SELECTED_ASSESSMENT_ID", id: a.id })}
                >
                  <Eye className="size-3.5" />
                  {isCompleted ? "View Final Scores" : "View Submissions"} ({gradedCount})
                </Button>
                <Button
                  variant={isCompleted ? "outline" : "secondary"}
                  size="sm"
                  className={`w-full text-xs gap-1.5 ${
                    isCompleted
                      ? "text-zinc-400 dark:text-zinc-500 border-zinc-200/50 dark:border-zinc-800/50 bg-transparent cursor-not-allowed opacity-60"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/50"
                  }`}
                  onClick={() => !isCompleted && dispatch({ type: "SET_CONFIRM_COMPLETE_ID", id: a.id })}
                  disabled={isCompleted || completingId === a.id}
                >
                  {completingId === a.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  {isCompleted ? "Finalized / Completed" : "Mark Complete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
