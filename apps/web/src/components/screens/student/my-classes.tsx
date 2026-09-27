"use client";


import { apiFetch } from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, GraduationCap, User, Hash, ArrowRight } from "lucide-react";
import type { StudentInfo, SubjectInfo } from "@/lib/types";

const subjectColors = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-blue-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-green-600",
];

const subjectIconNames = ["BookOpen", "GraduationCap", "Hash", "User"] as const;

export function StudentClasses() {
  const { currentUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);

  const student = students.find((s) => s.email === currentUser?.email) || null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsData, subjectsData] = await Promise.all([
        apiFetch("/api/students").then((res) => res.json()),
        apiFetch("/api/subjects").then((res) => res.json()),
      ]);
      
      setStudents(Array.isArray(studentsData?.items) ? studentsData.items : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mySubjects = student
    ? subjects.filter((s) => s.className === student.className)
    : [];

  const firstName = currentUser?.name?.split(" ")[0] || "Student";

  if (loading) return <ClassesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            My Classes
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {mySubjects.length} subjects enrolled in{" "}
            {student?.className || "your class"}
          </p>
        </div>
        {student && (
          <Badge
            variant="secondary"
            className="text-sm px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800"
          >
            <GraduationCap className="size-3.5 mr-1.5" />
            {student.className} • Roll {student.rollNumber}
          </Badge>
        )}
      </div>

      {/* Class Info Banner */}
      {student && (
        <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800 p-4 lg:p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              <GraduationCap className="size-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Welcome, {firstName}!
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Class {student.className} • {mySubjects.length} Subjects
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-center">
              <div>
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {mySubjects.length}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Subjects
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      {mySubjects.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-16 text-center">
            <BookOpen className="size-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              No subjects found
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Your class subjects will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mySubjects.map((subject, i) => (
            <div
              key={subject.id}
              className="group relative rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:border-violet-200 dark:border-violet-800 dark:hover:border-violet-800"
            >
              {/* Color Accent */}
              <div
                className={`h-1.5 bg-gradient-to-r ${subjectColors[i % subjectColors.length]}`}
              />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-2.5 rounded-lg bg-gradient-to-br ${subjectColors[i % subjectColors.length]} text-white shadow-sm`}
                  >
                    <BookOpen className="size-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  >
                    {subject.code}
                  </Badge>
                </div>

                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-3 line-clamp-1">
                  {subject.name}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <User className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span className="truncate">{subject.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <GraduationCap className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span>{subject.className}</span>
                  </div>
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="size-4 text-violet-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
