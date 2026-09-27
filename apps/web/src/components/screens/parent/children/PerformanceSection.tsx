"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award } from "lucide-react";

interface SubjectPerf {
  subject: string;
  avgPct: number;
  bestGrade: string;
  exams: number;
}

interface PerformanceSectionProps {
  data: SubjectPerf[];
}

export function PerformanceSection({ data }: PerformanceSectionProps) {
  return (
    <Card className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white dark:bg-zinc-950 hover:shadow-md transition-all duration-300">
      <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2.5 text-left">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <TrendingUp className="size-4" />
          </div>
          <CardTitle className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Subject-wise Performance
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {data.map((sp) => (
            <div key={sp.subject} className="space-y-2 text-left group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-500 transition-colors">
                  {sp.subject}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
                    {sp.exams} {sp.exams === 1 ? "exam" : "exams"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-semibold shadow-none rounded-md px-1.5 border-0 ${
                      sp.bestGrade.startsWith("A")
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                        : sp.bestGrade.startsWith("B")
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                          : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    Best: {sp.bestGrade}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress
                  value={sp.avgPct}
                  className="h-2 flex-1 bg-zinc-100 dark:bg-zinc-900 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500"
                />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-10 text-right">
                  {sp.avgPct}%
                </span>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Award className="size-8 mb-2 opacity-30" />
              <p className="text-xs font-semibold">No grade data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
