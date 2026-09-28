"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award } from "lucide-react";
import { gradeBadgeClasses } from "./utils";
import type { GradeRecord } from "@/lib/types";

interface GradesTableProps {
  studentName: string;
  grades: GradeRecord[];
}

export function GradesTable({ studentName, grades }: GradesTableProps) {
  return (
    <Card className="rounded-xl shadow-sm shadow-none border-zinc-100 dark:border-zinc-800 h-full">
      <CardHeader className="p-4 pb-2 text-left">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Award className="size-4 text-amber-600" />
          Detailed Grades
        </CardTitle>
        <CardDescription>
          All exam results for {studentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="max-h-[340px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-left">Subject</TableHead>
                <TableHead className="text-xs text-left">Exam Type</TableHead>
                <TableHead className="text-xs text-right">Marks</TableHead>
                <TableHead className="text-xs text-center">Score</TableHead>
                <TableHead className="text-xs text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((g, i) => {
                const pct = Math.round((g.marks / g.maxMarks) * 100);
                return (
                  <TableRow key={`${g.id}-${i}`}>
                    <TableCell className="text-sm py-2 font-medium text-left">
                      {g.subjectName}
                    </TableCell>
                    <TableCell className="text-sm py-2 text-muted-foreground capitalize text-left">
                      <Badge variant="outline" className="text-[10px] mr-1 shadow-none">
                        {g.examType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm py-2 text-right font-medium">
                      {Number(g.marks).toFixed(2).replace(/\.00$/, "")}
                      <span className="text-muted-foreground">/{g.maxMarks}</span>
                    </TableCell>
                    <TableCell className="text-sm py-2 text-center">
                      <span className={`font-semibold ${pct >= 80 ? "text-emerald-600 dark:text-emerald-400" : pct >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                        {pct}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold shadow-none ${gradeBadgeClasses(g.grade)}`}
                      >
                        {g.grade || "N/A"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {grades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    No grades available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
