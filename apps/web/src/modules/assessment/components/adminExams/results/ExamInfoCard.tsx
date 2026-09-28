"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, BookOpen, Users, CalendarDays, Clock } from "lucide-react";
import type { ExamRecord } from "../types";

interface ExamInfoCardProps {
  selectedExam: ExamRecord;
  formatDate: (date: string) => string;
  formatTime: (time: string | null | undefined) => string;
  getExamTypeBadge: (type: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function ExamInfoCard({
  selectedExam,
  formatDate,
  formatTime,
  getExamTypeBadge,
  getStatusBadge,
}: ExamInfoCardProps) {
  return (
    <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              {selectedExam.name}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" />
                {selectedExam.subjectName}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {selectedExam.className} - {selectedExam.classSection}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {formatDate(selectedExam.date)}
              </span>
              {selectedExam.startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatTime(selectedExam.startTime)} – {formatTime(selectedExam.endTime)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getExamTypeBadge(selectedExam.examType)}
            {getStatusBadge(selectedExam.status)}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
          <span className="font-medium">
            Total Marks: <span className="text-blue-600">{selectedExam.totalMarks}</span>
          </span>
          <span className="font-medium">
            Passing Marks: <span className="text-emerald-600">{selectedExam.passingMarks}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
