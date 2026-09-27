"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { GraduationCap } from "lucide-react";

interface ChildPerformance {
  id: string;
  name: string;
  className: string;
  rollNumber: string;
  gender: string;
  dateOfBirth?: string;
  attendancePct: number;
  avgPct: number;
  grade: string;
}

interface ChildrenOverviewProps {
  childrenList: ChildPerformance[];
}

const formatDob = (dob: string | null | undefined) => {
  if (!dob) return "";
  try {
    return new Date(dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return dob;
  }
};

export function ChildrenOverview({ childrenList }: ChildrenOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
          Your Children
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {childrenList.map((student) => (
          <Card key={student.id} className="rounded-xl shadow-sm hover:shadow-md transition-shadow shadow-none">
            <CardContent className="p-5 text-left">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-sm">
                    {student.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
                      {student.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{student.className}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-none">
                  Roll {student.rollNumber}
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className={`font-medium ${student.attendancePct >= 80 ? "text-emerald-600" : student.attendancePct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                      {student.attendancePct}%
                    </span>
                  </div>
                  <Progress value={student.attendancePct} className="h-2 [&>div]:bg-amber-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Average Score</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {student.avgPct}% ({student.grade})
                    </span>
                  </div>
                  <Progress value={student.avgPct} className="h-2 [&>div]:bg-blue-500" />
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {student.gender === "male" ? "👦" : "👧"}{" "}
                  {student.gender === "male" ? "Male" : "Female"}
                </span>
                {student.dateOfBirth && (
                  <span suppressHydrationWarning>
                    DOB: {formatDob(student.dateOfBirth)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
