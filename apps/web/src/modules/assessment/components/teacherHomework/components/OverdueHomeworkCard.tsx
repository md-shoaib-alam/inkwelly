import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Assignment } from "../reducer";

export interface OverdueHomeworkCardProps {
  assignments: Assignment[];
}

export function OverdueHomeworkCard({ assignments }: OverdueHomeworkCardProps) {
  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const overdueAssignments = assignments.filter(
    (a) => isOverdue(a.dueDate) && a.ungradedSubmissions > 0,
  );

  if (overdueAssignments.length === 0) return null;

  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="size-5" /> Overdue Homework
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {overdueAssignments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-lg"
          >
            <div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {a.className} • {a.subjectName}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            >
              {a.ungradedSubmissions} pending
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
