import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Users, CalendarDays } from "lucide-react";
import { ExamRecord, formatDate } from "./types";

interface ExamDetailsBannerProps {
  exam: ExamRecord;
}

export function ExamDetailsBanner({ exam }: ExamDetailsBannerProps) {
  return (
    <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              {exam.name}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" />
                {exam.subjectName}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {exam.className} - {exam.classSection}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {formatDate(exam.date)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {exam.examType.replace("_", " ")}
            </Badge>
            {exam.status === "completed" ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                Completed
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                Draft
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
          <span className="font-medium">
            Total Marks:{" "}
            <span className="text-blue-600 font-bold">{exam.totalMarks}</span>
          </span>
          <span className="font-medium">
            Passing Marks:{" "}
            <span className="text-emerald-600 font-bold">{exam.passingMarks}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
