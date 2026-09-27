"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target, Award, Star, BookOpen } from "lucide-react";

interface GradesSummaryProps {
  avg: number;
  grade: string;
  highestSubject: string;
  highestPct: number;
  totalExams: number;
}

export function GradesSummary({
  avg,
  grade,
  highestSubject,
  highestPct,
  totalExams,
}: GradesSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <Card className="rounded-xl shadow-sm shadow-none border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-3 sm:p-4 text-center">
          <Target className="size-4 mx-auto text-amber-600 mb-1.5" />
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{avg}%</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-1">Avg Score</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm shadow-none border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-3 sm:p-4 text-center">
          <Award className="size-4 mx-auto text-amber-600 mb-1.5" />
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{grade}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-1">Overall Grade</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm shadow-none border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-3 sm:p-4 text-center">
          <Star className="size-4 mx-auto text-emerald-600 mb-1.5" />
          <p className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate px-1">{highestSubject}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-1">
            Best ({Math.round(highestPct)}%)
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm shadow-none border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-3 sm:p-4 text-center">
          <BookOpen className="size-4 mx-auto text-blue-600 mb-1.5" />
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalExams}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-1">Total Exams</p>
        </CardContent>
      </Card>
    </div>
  );
}
