"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, User, Hash, Calendar, ShieldCheck, BookOpen } from "lucide-react";
import type { StudentInfo } from "@/lib/types";

interface StudentProfileCardProps {
  student: StudentInfo;
}

const formatDob = (dob: string | null | undefined) => {
  if (!dob) return "N/A";
  try {
    return new Date(dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch (e) {
    return dob;
  }
};

export function StudentProfileCard({ student }: StudentProfileCardProps) {
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-xs hover:shadow-sm transition-all duration-300">
      {/* Unified Top Banner - Minimal height */}
      <div className="h-4 sm:h-5 bg-white dark:bg-zinc-950 relative" />

      <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 -mt-2 sm:-mt-3 relative text-center">
        <div className="max-w-md mx-auto">
          {/* Avatar: Rounded circle with soft gradient and outline */}
          <div className="size-20 sm:size-24 rounded-full bg-linear-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-white text-2xl font-semibold shadow-md border-4 border-white dark:border-zinc-950 mx-auto transition-transform duration-300 hover:scale-105">
            {initials}
          </div>

          {/* Identity Details */}
          <div className="mt-2 space-y-0.5">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {student.name}
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-500" />
              Verified Profile
            </p>
          </div>

          {/* Vertical Profile Fields - Modern Clean Row Design */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3.5 text-left">
            {/* Class Row - Moved here from top */}
            <div className="flex items-center justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-900/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-zinc-400 dark:text-zinc-500" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Class / Grade</span>
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{student.className}</span>
            </div>

            {/* Roll Number */}
            <div className="flex items-center justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-900/50">
              <div className="flex items-center gap-2">
                <Hash className="size-4 text-zinc-400 dark:text-zinc-500" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Roll Number</span>
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{student.rollNumber || "N/A"}</span>
            </div>

            {/* Gender */}
            <div className="flex items-center justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-900/50">
              <div className="flex items-center gap-2">
                <User className="size-4 text-zinc-400 dark:text-zinc-500" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Gender</span>
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 capitalize">{student.gender || "N/A"}</span>
            </div>

            {/* DOB */}
            <div className="flex items-center justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-900/50">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-zinc-400 dark:text-zinc-500" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Date of Birth</span>
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200" suppressHydrationWarning>{formatDob(student.dateOfBirth)}</span>
            </div>

            {/* Academic Year */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-zinc-400 dark:text-zinc-500" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Academic Session</span>
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{student.academicYear || "N/A"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
