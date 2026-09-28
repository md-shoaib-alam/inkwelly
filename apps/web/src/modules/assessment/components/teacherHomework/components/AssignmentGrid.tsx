import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, BookOpen, Users, Eye, Loader2, Check, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Assignment, Action } from "../reducer";

export interface AssignmentGridProps {
  assignments: Assignment[];
  completingId: string | null;
  dispatch: React.Dispatch<Action>;
  handleViewSubmissions: (assignment: Assignment) => void;
  showCompleted?: boolean;
}

export function AssignmentGrid({
  assignments,
  completingId,
  dispatch,
  handleViewSubmissions,
  showCompleted = false,
}: AssignmentGridProps) {
  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const getSubmissionPct = (a: Assignment) =>
    a.totalStudents > 0
      ? Math.round((a.submissions / a.totalStudents) * 100)
      : 0;

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
        <FileText className="size-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No homework yet</p>
        <p className="text-sm mt-1">Create your first homework</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {assignments.map((assignment) => {
        const pct = getSubmissionPct(assignment);
        const overdue = isOverdue(assignment.dueDate) && pct < 100;
        return (
          <Card
            key={assignment.id}
            className={`rounded-xl shadow-sm ${
              overdue ? "border-red-200 dark:border-red-800" : "border-zinc-100 dark:border-zinc-800"
            } hover:shadow-md transition-shadow`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {assignment.subjectName} • {assignment.className}
                  </p>
                </div>
                {overdue && (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px]"
                  >
                    Overdue
                  </Badge>
                )}
              </div>

              {assignment.description && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3 line-clamp-2">
                  {assignment.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> Due: {assignment.dueDate}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium px-2 py-0.5 flex items-center gap-1 border rounded-full ${
                    assignment.mode === "online"
                      ? "bg-violet-50 text-violet-700 border-violet-100/60 dark:bg-violet-950/20 dark:text-violet-300 dark:border-violet-900/50"
                      : "bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50"
                  }`}
                >
                  {assignment.mode === "online" ? (
                    <>
                      <Globe className="size-2.5" /> Online
                    </>
                  ) : (
                    <>
                      <BookOpen className="size-2.5" /> Offline
                    </>
                  )}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Submissions</span>
                  <span className="font-medium">
                    {assignment.submissions}/{assignment.totalStudents}
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <Users className="size-3" />
                  {assignment.totalStudents - assignment.submissions === 0 
                    ? "All students have submitted"
                    : `${assignment.totalStudents - assignment.submissions} students haven't submitted`}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => handleViewSubmissions(assignment)}
                >
                  <Eye className="size-3.5" />
                  View Submissions ({assignment.submissions})
                </Button>
                {!showCompleted && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/50"
                    onClick={() => dispatch({ type: "SET_CONFIRM_COMPLETE_ID", payload: assignment.id })}
                    disabled={completingId === assignment.id}
                  >
                    {completingId === assignment.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
