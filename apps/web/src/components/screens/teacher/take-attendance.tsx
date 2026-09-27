"use client";

import { api, fetchAllStudents } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClassSelect } from "@/components/ui/class-select";
import {
  CalendarDays,
  Save,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

// ─── Types ────────────────────────────────────────────────────

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  studentCount: number;
}

interface StudentInfo {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  classId: string;
  gender: string;
}

type AttendanceStatus = "present" | "absent";

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

// ─── Helpers ──────────────────────────────────────────────────

const getStatusBg = (status: AttendanceStatus) => {
  switch (status) {
    case "present":
      return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
    case "absent":
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  }
};

const getStatusIcon = (status: AttendanceStatus) => {
  switch (status) {
    case "present":
      return <UserCheck className="size-3.5" />;
    case "absent":
      return <UserX className="size-3.5" />;
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─── Query keys ───────────────────────────────────────────────

const classesKey = () => ["teacher-classes"] as const;
const studentsKey = (classId: string) => ["teacher-students", classId] as const;
const attendanceKey = (classId: string, date: string) =>
  ["teacher-attendance", classId, date] as const;

// ─── Component ────────────────────────────────────────────────

export function TeacherAttendance() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const disableFutureDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (candidate: Date) => {
      const day = new Date(candidate);
      day.setHours(0, 0, 0, 0);
      return day > today;
    };
  }, []);

  // ── Fetch classes ──────────────────────────────────────────

  const { data: rawClasses, isLoading: classesLoading } = useQuery({
    queryKey: classesKey(),
    queryFn: async () => {
      const data = await api.get<any>("/classes?all=true");
      return (Array.isArray(data) ? data : (data?.items ?? [])) as ClassInfo[];
    },
    staleTime: 5 * 60 * 1000,
    select: (data) => data,
  });

  const classes = useMemo(() => (Array.isArray(rawClasses) ? rawClasses : (rawClasses as any)?.items ?? []), [rawClasses]);
  const activeClassId = selectedClassId || classes[0]?.id || "";

  // ── Fetch students for selected class ─────────────────────

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: studentsKey(activeClassId),
    queryFn: async () => {
      // Paginates internally — the server caps a page at 100 students.
      const data = await fetchAllStudents({ classId: activeClassId });
      return data as StudentInfo[];
    },
    enabled: !!activeClassId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Fetch existing attendance for class + date ─────────────

  const { data: existingAttendance = [] } = useQuery({
    queryKey: attendanceKey(activeClassId, date),
    queryFn: async () => {
      const res = await api.get<any>(`/attendance?classId=${activeClassId}&date=${date}&limit=1000`);
      return Array.isArray(res?.records) ? res.records : [];
    },
    enabled: !!activeClassId,
    staleTime: 30 * 1000, // 30 s - background refresh keeps it fresh
  });

  // ── Derive records from students + existing attendance ─────
  // This is the "source of truth" for display; mutations optimistically patch it.
  
  // Memoize the heavy work of merging datasets (only recalculates on network sync)
  const serverRecords = useMemo((): AttendanceRecord[] => {
    const list = Array.isArray(existingAttendance) ? existingAttendance : [];
    // Build O(1) lookup map for maximum scaling
    const statusMap = new Map<string, string>();
    list.forEach((a) => {
      if (a?.studentId) statusMap.set(a.studentId, a.status);
    });

    return students.map((s) => ({
      studentId: s.id,
      status: (statusMap.get(s.id) as AttendanceStatus) || "present",
    }));
  }, [students, existingAttendance]);

  // Local overrides - applied on top of server data for instant feel
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [saved, setSaved] = useState(false);

  // Adjust/Reset overrides when class or date changes during rendering (prevents set-state-in-effect and extra cycles)
  const [prevClassAndDate, setPrevClassAndDate] = useState({ classId: activeClassId, date });
  if (prevClassAndDate.classId !== activeClassId || prevClassAndDate.date !== date) {
    setLocalOverrides({});
    setSaved(false);
    setPrevClassAndDate({ classId: activeClassId, date });
  }

  // Combine server record truth with user pending interactions
  const records = useMemo((): AttendanceRecord[] => {
    return serverRecords.map((r) => ({
      ...r,
      status: localOverrides[r.studentId] ?? r.status,
    }));
  }, [serverRecords, localOverrides]);

  // ── Update a single student ────────────────────────────────

  const updateRecord = (studentId: string, status: AttendanceStatus) => {
    setLocalOverrides((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
    const overrides: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (overrides[s.id] = status));
    setLocalOverrides(overrides);
    setSaved(false);
  };

  // ── Save mutation ──────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post("/attendance", {
        classId: activeClassId,
        date,
        records,
      }),
    onMutate: async () => {
      // Optimistically update the cache so the UI reflects saved state instantly
      await queryClient.cancelQueries({
        queryKey: attendanceKey(activeClassId, date),
      });

      const snapshot = queryClient.getQueryData<any[]>(
        attendanceKey(activeClassId, date)
      );

      queryClient.setQueryData(
        attendanceKey(activeClassId, date),
        records.map((r) => ({ studentId: r.studentId, status: r.status }))
      );

      return { snapshot };
    },
    onSuccess: () => {
      setSaved(true);
      setLocalOverrides({});
      toast.success("Attendance saved!");

      // Background refetch to sync with server truth
      queryClient.invalidateQueries({
        queryKey: attendanceKey(activeClassId, date),
      });
    },
    onError: (_err, _vars, ctx) => {
      // Roll back optimistic update
      if (ctx?.snapshot) {
        queryClient.setQueryData(
          attendanceKey(activeClassId, date),
          ctx.snapshot
        );
      }
      toast.error("Failed to save attendance. Please try again.");
    },
  });

  // ── Stats ──────────────────────────────────────────────────

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const totalCount = records.length;

  const selectedClass = classes.find((c) => c.id === activeClassId);
  
  const hasExistingAttendance = existingAttendance.length > 0;
  const hasUnsavedChanges = Object.keys(localOverrides).length > 0;
  
  // It ONLY needs saving if user toggled something, OR if it has never been submitted to the DB yet.
  const canSave = hasUnsavedChanges || (!hasExistingAttendance && !saved);

  // ── Loading skeleton ───────────────────────────────────────

  if (classesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-6 sm:pb-20">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Take Attendance
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Record daily attendance for your classes.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <ClassSelect
            value={activeClassId}
            onValueChange={(v) => {
              setSelectedClassId(v);
              setLocalOverrides({});
              setSaved(false);
            }}
            placeholder="Select Class"
            className="w-full rounded-xl"
            classes={classes}
            isLoading={classesLoading}
          />
        </div>
        <div className="flex-1 max-w-[200px]">
          <DatePicker
            date={date ? new Date(date) : undefined}
            disabled={disableFutureDates}
            onChange={(d) => {
              if (d) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setDate(`${y}-${m}-${day}`);
                setLocalOverrides({});
                setSaved(false);
              }
            }}
            className="w-full rounded-xl"
          />
        </div>
      </div>

      {/* Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total",
              value: totalCount,
              icon: <Users className="size-5 text-blue-500 dark:text-blue-400" />,
              bg: "bg-blue-50 dark:bg-blue-900/30",
              text: "text-zinc-900 dark:text-zinc-100",
            },
            {
              label: "Present",
              value: presentCount,
              icon: <UserCheck className="size-5 text-emerald-500 dark:text-emerald-400" />,
              bg: "bg-emerald-50 dark:bg-emerald-900/30",
              text: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Absent",
              value: absentCount,
              icon: <UserX className="size-5 text-red-500 dark:text-red-400" />,
              bg: "bg-red-50 dark:bg-red-900/30",
              text: "text-red-600 dark:text-red-400",
            },
          ].map(({ label, value, icon, bg, text }) => (
            <Card key={label} className="rounded-xl shadow-sm border-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl ${bg} flex items-center justify-center`}
                >
                  {icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    {label}
                  </p>
                  <p className={`text-xl font-bold ${text}`}>{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attendance list */}
      <Card className="rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-zinc-900/80 backdrop-blur-md z-10 border-b border-zinc-200 dark:border-zinc-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start sm:gap-4 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <CalendarDays className="size-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100 leading-none">
                    {selectedClass
                      ? `${selectedClass.name} - ${selectedClass.section}`
                      : "Select a class"}
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                    Attendance Registry
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-[10px] h-6 px-2 rounded-md font-bold"
              >
                {students.length} students
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800/50 rounded-xl sm:w-auto">
              <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 italic">
                Quick:
              </div>
              <button
                type="button"
                className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95"
                onClick={() => markAll("present")}
              >
                All Present
              </button>
              <button
                type="button"
                className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-95"
                onClick={() => markAll("absent")}
              >
                All Absent
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 overflow-hidden">
          {studentsLoading ? (
            <div className="space-y-3 pt-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : students.length > 0 ? (
            <>
              <div className="space-y-2 pt-4">
                {students.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm italic">No students match your search.</p>
                  </div>
                ) : (
                  students.map((student, index) => {
                    const record = records.find((r) => r.studentId === student.id);
                    const currentStatus = record?.status ?? "present";
                    return (
                      <div
                        key={student.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border transition-all ${getStatusBg(currentStatus)}`}
                      >
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono w-6 text-center">
                            {index + 1}
                          </span>
                          <Avatar className="size-8 flex-shrink-0">
                            <AvatarFallback className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {student.name}
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              {student.rollNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-auto">
                          {(["present", "absent"] as AttendanceStatus[]).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateRecord(student.id, status)}
                              className={`flex flex-1 sm:flex-none items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                currentStatus === status
                                  ? `${getStatusBg(status)} ${
                                      status === "present"
                                        ? "bg-emerald-500 dark:bg-emerald-500 text-white"
                                        : "bg-red-500 dark:bg-red-500 text-white"
                                    } border-transparent shadow-sm ring-1 ring-white/10`
                                  : "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-950"
                              }`}
                            >
                              {getStatusIcon(status)}
                              <span className="capitalize">{status}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Users className="size-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                {activeClassId ? "No students in this class" : "Select a class to begin"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating save bar */}
      {students.length > 0 && (
        <div className="fixed bottom-1 sm:bottom-4 left-[50%] lg:left-[calc(50%+140px)] -translate-x-1/2 w-[calc(100%-2.5rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-360px)] max-w-4xl z-50 px-3 py-1.5 sm:px-6 sm:py-3 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-2xl border border-zinc-200 dark:border-white/5 rounded-xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6">
              <div
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-full text-[9px] sm:text-[10px] font-black tracking-tighter sm:tracking-widest uppercase italic transition-all duration-300 ${
                  saved && !hasUnsavedChanges
                    ? "text-zinc-600 bg-zinc-800/20"
                    : "text-amber-500 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                }`}
              >
                {saved && !hasUnsavedChanges ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="size-3 sm:size-3.5" />
                    <span>Synchronized</span>
                  </span>
                ) : (
                  "Unsaved Changes"
                )}
              </div>
              {saved && !hasUnsavedChanges && (
                <div className="hidden md:flex items-center gap-1.5 text-emerald-500 text-[10px] sm:text-xs font-medium animate-in fade-in slide-in-from-left-1">
                  <div className="size-1 sm:size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Live</span>
                </div>
              )}
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !canSave || students.length === 0}
              className={`rounded-lg sm:rounded-xl px-4 py-1.5 sm:px-8 sm:py-5 h-8 sm:h-auto text-[11px] sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 sm:gap-3 shadow-lg ${
                !canSave && students.length > 0
                  ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-zinc-700/30"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-[0.96] hover:shadow-blue-500/40"
              }`}
            >
              {saveMutation.isPending ? (
                <div className="size-3 sm:size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save
                  className={`size-3 sm:size-4 ${
                    !(saved && !hasUnsavedChanges) && "animate-bounce"
                  }`}
                />
              )}
              <span>
                {!canSave && students.length > 0 ? "Synchronized" : "Save Attendance"}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
