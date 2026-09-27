import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Star } from "lucide-react";
import type { GradeDistributionItem } from "./types";

interface ExamsSummaryCardsProps {
  overallAvg: number;
  totalRecords: number;
  uniqueSubjectsCount: number;
  uniqueExamTypesCount: number;
  highGradesCount: number;
  gradeDistribution: GradeDistributionItem[];
  gradeColorMap: Record<string, string>;
}

export function ExamsSummaryCards({
  overallAvg,
  totalRecords,
  uniqueSubjectsCount,
  uniqueExamTypesCount,
  highGradesCount,
  gradeDistribution,
  gradeColorMap,
}: ExamsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <Card className="col-span-2 sm:col-span-1 rounded-xl shadow-sm border-violet-100 dark:border-violet-950/30 bg-gradient-to-tr from-white to-violet-50/20 dark:from-background dark:to-violet-950/10">
        <CardContent className="p-4 sm:p-5 text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-violet-600 dark:bg-violet-500 text-white mb-2 sm:mb-3">
            <TrendingUp className="size-4 sm:size-5" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {overallAvg}%
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Avg Score
          </p>
          <Progress value={overallAvg} className="mt-2 sm:mt-3 h-1.5" />
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-emerald-100 dark:border-emerald-950/30 bg-gradient-to-tr from-white to-emerald-50/20 dark:from-background dark:to-emerald-950/10">
        <CardContent className="p-4 sm:p-5 text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white mb-2 sm:mb-3">
            <Award className="size-4 sm:size-5" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalRecords}
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Total Results
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium line-clamp-1">
            <span>{uniqueSubjectsCount} Sub.</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-amber-100 dark:border-amber-950/30 bg-gradient-to-tr from-white to-amber-50/20 dark:from-background dark:to-amber-950/10">
        <CardContent className="p-4 sm:p-5 text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-amber-600 dark:bg-amber-500 text-white mb-2 sm:mb-3">
            <Star className="size-4 sm:size-5" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {highGradesCount}
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Top Grades
          </p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {gradeDistribution.slice(0, 2).map((g) => (
              <Badge
                key={g.grade}
                variant="secondary"
                className="text-[9px] px-1 py-0"
                style={{
                  backgroundColor: (gradeColorMap[g.grade] || "#9ca3af") + "20",
                  color: gradeColorMap[g.grade] || "#9ca3af",
                }}
              >
                {g.grade}:{g.count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
