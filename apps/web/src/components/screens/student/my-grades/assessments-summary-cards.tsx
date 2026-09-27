import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award, CheckCircle2 } from "lucide-react";

interface AssessmentsSummaryCardsProps {
  assessmentAvg: number;
  totalGraded: number;
  uniqueSubjectsCount: number;
  passedCount: number;
}

export function AssessmentsSummaryCards({
  assessmentAvg,
  totalGraded,
  uniqueSubjectsCount,
  passedCount,
}: AssessmentsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
      <Card className="col-span-2 sm:col-span-1 rounded-xl shadow-sm border-violet-100 dark:border-violet-950/30 bg-white dark:bg-background">
        <CardContent className="p-3 sm:p-5 text-center">
          <div className="inline-flex p-2 sm:p-3 rounded-xl bg-violet-600 dark:bg-violet-500 text-white mb-2 sm:mb-3">
            <TrendingUp className="size-4 sm:size-5" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {assessmentAvg}%
          </p>
          <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Assessment Average
          </p>
          <p className="sm:hidden text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Average
          </p>
          <Progress value={assessmentAvg} className="mt-2 sm:mt-3 h-1 sm:h-2" />
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-blue-100 dark:border-blue-950/30 bg-white dark:bg-background">
        <CardContent className="p-3 sm:p-5 text-center">
          <div className="inline-flex p-2 sm:p-3 rounded-xl bg-blue-600 dark:bg-blue-500 text-white mb-2 sm:mb-3">
            <Award className="size-4 sm:size-5" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalGraded}
          </p>
          <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Total Graded
          </p>
          <p className="sm:hidden text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Graded
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 sm:mt-3 text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
            <span>{uniqueSubjectsCount} subjects</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-teal-100 dark:border-teal-950/30 bg-white dark:bg-background">
        <CardContent className="p-3 sm:p-5 text-center">
          <div className="inline-flex p-2 sm:p-3 rounded-xl bg-teal-600 dark:bg-teal-500 text-white mb-2 sm:mb-3">
            <CheckCircle2 className="size-4 sm:size-5" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {passedCount}
          </p>
          <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Subjects Passed
          </p>
          <p className="sm:hidden text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Passed
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 sm:mt-3 text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 font-semibold">
            <span>Keep it up! ✨</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
