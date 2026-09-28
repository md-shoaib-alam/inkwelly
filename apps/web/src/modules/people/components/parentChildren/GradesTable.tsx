"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import type { GradeRecord } from "@/lib/types";

interface GradesTableProps {
  grades: GradeRecord[];
}

export function GradesTable({ grades }: GradesTableProps) {
  return (
    <Card className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white dark:bg-zinc-950 hover:shadow-md transition-all duration-300">
      <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2.5 text-left">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award className="size-4" />
          </div>
          <CardTitle className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Recent Grades
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-3">
          {grades.map((g) => {
            const isA = g.grade?.startsWith("A");
            const isB = g.grade?.startsWith("B");
            const accentClass = isA 
              ? "border-l-emerald-500" 
              : isB 
                 ? "border-l-blue-500" 
                 : "border-l-amber-500";
            
            const badgeClass = isA
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : isB
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400";

            return (
              <div 
                key={g.id} 
                className={`flex items-center justify-between p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-900 border-l-4 ${accentClass} bg-zinc-50/20 dark:bg-zinc-900/10 hover:shadow-xs hover:border-zinc-200 dark:hover:border-zinc-800 hover:scale-[1.01] transition-all duration-200 group text-left`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 group-hover:bg-amber-500/10 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                      {g.subjectName}
                    </h5>
                    <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-tight mt-0.5">
                      {g.examType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      {Number(g.marks).toFixed(2).replace(/\.00$/, "")}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block">
                      /{g.maxMarks} max
                    </span>
                  </div>
                  <Badge className={`text-[10px] font-semibold shadow-none rounded-full px-2 py-0.5 border-none ${badgeClass}`}>
                    {g.grade || "N/A"}
                  </Badge>
                  <ChevronRight className="size-3.5 text-zinc-300 dark:text-zinc-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
          {grades.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="size-10 mb-2 opacity-30" />
              <p className="text-sm font-bold">No grades available</p>
              <p className="text-xs mt-1">Academics marks will show here once entered by teachers</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
