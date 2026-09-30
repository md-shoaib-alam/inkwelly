"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  UserCheck,
  UserX,
  RotateCcw,
  MessageSquare,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, fetchAllStudents } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type DailyAttendanceStatus = "present" | "absent" | "late" | "halfDay" | "leave" | "none";

export interface StudentDailyRow {
  id: string;
  name: string;
  rollNumber: string | number;
  admissionNo: string;
}

// 25 default seed students matching Image 2 & 3
const DEFAULT_SEED_TODAY_STUDENTS: StudentDailyRow[] = [
  { id: "std-1", name: "Ayaan Pillai", rollNumber: "#1", admissionNo: "ADM2026101" },
  { id: "std-2", name: "Ishita Bose", rollNumber: "#3", admissionNo: "ADM2026102" },
  { id: "std-3", name: "Ananya Sharma", rollNumber: "#4", admissionNo: "ADM2026103" },
  { id: "std-4", name: "Aryan Sharma", rollNumber: "#5", admissionNo: "ADM2026104" },
  { id: "std-5", name: "Riya Sheikh", rollNumber: "#6", admissionNo: "ADM2026105" },
  { id: "std-6", name: "Saanvi Das", rollNumber: "#7", admissionNo: "ADM2026106" },
  { id: "std-7", name: "Aanya Bhat", rollNumber: "#8", admissionNo: "ADM2026107" },
  { id: "std-8", name: "Ibrahim Menon", rollNumber: "#9", admissionNo: "ADM2026108" },
  { id: "std-9", name: "Aadhya Ansari", rollNumber: "#10", admissionNo: "ADM2026109" },
  { id: "std-10", name: "Aarush Mukherjee", rollNumber: "#11", admissionNo: "ADM2026110" },
  { id: "std-11", name: "Aditya Tiwari", rollNumber: "#12", admissionNo: "ADM2026111" },
  { id: "std-12", name: "Anika Ansari", rollNumber: "#13", admissionNo: "ADM2026112" },
  { id: "std-13", name: "Anvi Mishra", rollNumber: "#14", admissionNo: "ADM2026113" },
  { id: "std-14", name: "Atharv Kumar", rollNumber: "#15", admissionNo: "ADM2026114" },
  { id: "std-15", name: "Avni Sharma", rollNumber: "#16", admissionNo: "ADM2026115" },
  { id: "std-16", name: "Dev Yadav", rollNumber: "#17", admissionNo: "ADM2026116" },
  { id: "std-17", name: "Farhan Gupta", rollNumber: "#18", admissionNo: "ADM2026117" },
  { id: "std-18", name: "Harsh Sharma", rollNumber: "#19", admissionNo: "ADM2026118" },
  { id: "std-19", name: "Diya Patel", rollNumber: "#20", admissionNo: "ADM2026119" },
  { id: "std-20", name: "Ishaan Gupta", rollNumber: "#21", admissionNo: "ADM2026120" },
  { id: "std-21", name: "Kabir Verma", rollNumber: "#22", admissionNo: "ADM2026121" },
  { id: "std-22", name: "Kavya Singh", rollNumber: "#23", admissionNo: "ADM2026122" },
  { id: "std-23", name: "Meera Reddy", rollNumber: "#24", admissionNo: "ADM2026123" },
  { id: "std-24", name: "Navya Nair", rollNumber: "#25", admissionNo: "ADM2026124" },
  { id: "std-25", name: "Pranav Rao", rollNumber: "#26", admissionNo: "ADM2026125" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || "ST").toUpperCase();
}

interface ClassDailyAttendanceViewProps {
  classId: string;
  className: string;
  section: string;
  selectedDate: Date;
  onBack: () => void;
  onSaved?: () => void;
}

export function ClassDailyAttendanceView({
  classId,
  className,
  section,
  selectedDate,
  onBack,
  onSaved,
}: ClassDailyAttendanceViewProps) {
  const queryClient = useQueryClient();
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const formattedSubtitleDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isToday = dateStr === todayStr;
  const dayLabel = isToday ? "Today" : format(selectedDate, "EEEE");

  // Only treat the classId as a real DB id if it looks like a UUID.
  // Mock / slug fallback ids (e.g. "cls-1", "class-1st-a") are not UUIDs.
  const isRealClassId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);

  const [search, setSearch] = useState("");
  // Staged edits: studentId -> DailyAttendanceStatus
  const [unsavedEdits, setUnsavedEdits] = useState<Record<string, DailyAttendanceStatus>>({});
  // Saved edits commit state
  const [savedEdits, setSavedEdits] = useState<Record<string, DailyAttendanceStatus>>({});
  // Optional notes per student: studentId -> string
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const saveLockRef = useRef(false);

  // 1. Fetch Students for this class
  const { data: serverStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: async () => {
      try {
        const list = await fetchAllStudents({ classId });
        return list;
      } catch {
        return [];
      }
    },
    enabled: isRealClassId,
  });

  const studentsList: StudentDailyRow[] = useMemo(() => {
    if (serverStudents && serverStudents.length > 0) {
      return serverStudents.map((s: any, idx: number) => ({
        id: s.id,
        name: s.name || s.user?.name || `Student ${idx + 1}`,
        rollNumber: s.rollNumber ? `#${s.rollNumber}` : `#${idx + 1}`,
        admissionNo: s.admissionNo || `ADM${2026100 + idx + 1}`,
      }));
    }
    return DEFAULT_SEED_TODAY_STUDENTS;
  }, [serverStudents]);

  // 2. Fetch existing attendance for this date
  const { data: attendanceData } = useQuery({
    queryKey: ["class-attendance-day", classId, dateStr],
    queryFn: async () => {
      try {
        const res = await apiFetch(
          `/api/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(
            dateStr
          )}&limit=1000`
        );
        if (!res.ok) return { records: [] };
        return res.json();
      } catch {
        return { records: [] };
      }
    },
    enabled: isRealClassId,
  });

  // Base map from server records
  const serverStatusMap = useMemo(() => {
    const map = new Map<string, DailyAttendanceStatus>();
    const records = (attendanceData?.records || []) as any[];
    for (const r of records) {
      if (r.studentId) {
        map.set(r.studentId, r.status as DailyAttendanceStatus);
      }
    }
    return map;
  }, [attendanceData]);

  // Helper to get active status for student
  const getStudentStatus = useCallback(
    (studentId: string): DailyAttendanceStatus => {
      if (unsavedEdits[studentId] !== undefined) {
        return unsavedEdits[studentId];
      }
      if (savedEdits[studentId] !== undefined) {
        return savedEdits[studentId];
      }
      return serverStatusMap.get(studentId) ?? "none";
    },
    [unsavedEdits, savedEdits, serverStatusMap]
  );

  // Check if a student has an unsaved status change
  const isStudentUnsaved = useCallback(
    (studentId: string): boolean => {
      if (unsavedEdits[studentId] === undefined) return false;
      const current = unsavedEdits[studentId];
      const baseline = savedEdits[studentId] ?? serverStatusMap.get(studentId) ?? "none";
      return current !== baseline;
    },
    [unsavedEdits, savedEdits, serverStatusMap]
  );

  // Number of unsaved students
  const unsavedCount = useMemo(() => {
    let count = 0;
    for (const student of studentsList) {
      if (isStudentUnsaved(student.id)) count++;
    }
    return count;
  }, [studentsList, isStudentUnsaved]);

  // Tally counts across all students
  const tallies = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let leave = 0;
    let unmarked = 0;

    for (const s of studentsList) {
      const st = getStudentStatus(s.id);
      if (st === "present") present++;
      else if (st === "absent") absent++;
      else if (st === "late") late++;
      else if (st === "halfDay") halfDay++;
      else if (st === "leave") leave++;
      else unmarked++;
    }

    const marked = present + absent + late + halfDay + leave;
    return {
      present,
      absent,
      late,
      halfDay,
      leave,
      unmarked,
      marked,
      total: studentsList.length,
    };
  }, [studentsList, getStudentStatus]);

  // Handle single student status selection
  const handleSelectStatus = (studentId: string, status: DailyAttendanceStatus) => {
    setUnsavedEdits((prev) => {
      const current = getStudentStatus(studentId);
      // Toggle off if clicking the currently selected status
      const next = current === status ? "none" : status;
      return {
        ...prev,
        [studentId]: next,
      };
    });
  };

  // Quick Action: Mark all present
  const handleMarkAllPresent = () => {
    const edits: Record<string, DailyAttendanceStatus> = {};
    for (const s of studentsList) {
      edits[s.id] = "present";
    }
    setUnsavedEdits(edits);
    toast.info("Marked all students as Present");
  };

  // Quick Action: Mark all absent
  const handleMarkAllAbsent = () => {
    const edits: Record<string, DailyAttendanceStatus> = {};
    for (const s of studentsList) {
      edits[s.id] = "absent";
    }
    setUnsavedEdits(edits);
    toast.info("Marked all students as Absent");
  };

  // Quick Action: Reset
  const handleReset = () => {
    setUnsavedEdits({});
    toast.info("Reset attendance changes");
  };

  // Save all changes with transition lock (matching Image 3)
  const handleSaveAll = useCallback(async () => {
    if (saveLockRef.current || isSaving || unsavedCount === 0) return;
    saveLockRef.current = true;
    setIsSaving(true);

    try {
      const recordsToSave: Array<{ studentId: string; status: string; note?: string }> = [];
      for (const [studentId, status] of Object.entries(unsavedEdits)) {
        if (status !== "none") {
          recordsToSave.push({
            studentId,
            status,
            note: studentNotes[studentId] || undefined,
          });
        }
      }

      if (isRealClassId) {
        await apiFetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId,
            date: dateStr,
            records: recordsToSave,
          }),
        });
      }

      // Commit to local saved state
      setSavedEdits((prev) => ({
        ...prev,
        ...unsavedEdits,
      }));
      setUnsavedEdits({});

      toast.success(`Successfully saved ${recordsToSave.length} attendance records`);

      // Invalidate queries so dashboard and Today screen update
      queryClient.invalidateQueries({ queryKey: ["class-attendance-day", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-register-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-command-center"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });

      onSaved?.();
    } catch (err) {
      console.error("Save daily attendance error:", err);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
  }, [classId, dateStr, unsavedEdits, studentNotes, unsavedCount, isSaving, queryClient, onSaved]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentsList;
    const q = search.toLowerCase().trim();
    return studentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.rollNumber).toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q)
    );
  }, [studentsList, search]);

  const classTitle = `${className}${section ? ` - ${section}` : ""}`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-32px)] lg:min-h-[calc(100vh-56px-48px)] space-y-4">
      {/* Upper content */}
      <div className="space-y-4 flex-1">
        {/* 1. Header with Back button matching Image 2 & 3 */}
        <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 pt-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {classTitle}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span>
              {formattedSubtitleDate} · {dayLabel} · {tallies.marked} of {tallies.total} marked
            </span>
            {unsavedCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {unsavedCount} unsaved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls Row: Mark all present, Mark all absent, Reset & Search matching Image 2 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Left Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mark all present */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllPresent}
            className="h-8.5 px-3 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-medium gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
            <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Mark all present
          </Button>

          {/* Mark all absent */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllAbsent}
            className="h-8.5 px-3 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-medium gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-rose-500 inline-block" />
            <UserX className="size-3.5 text-rose-600 dark:text-rose-400" />
            Mark all absent
          </Button>

          {/* Reset */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8.5 px-3 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-medium gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-slate-400 inline-block" />
            <RotateCcw className="size-3 text-slate-500 dark:text-zinc-400" />
            Reset
          </Button>
        </div>

        {/* Right Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, roll, or admission no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-8.5 rounded-lg bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-xs focus-visible:ring-[#0d9488]"
          />
        </div>
      </div>

      {/* 3. Students Daily Attendance Table matching Image 2 & 3 */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto relative" style={{ scrollbarWidth: "thin" }}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/95 dark:bg-zinc-900/95 backdrop-blur-xs">
                <th className="pl-6 py-3.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase w-2/5">
                  STUDENT
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase w-24">
                  ROLL
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                  STATUS
                </th>
                <th className="pr-6 py-3.5 text-right text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase w-20">
                  NOTE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-500 dark:text-zinc-400">
                    No students found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const currentStatus = getStudentStatus(student.id);
                  const isUnsaved = isStudentUnsaved(student.id);
                  const initials = getInitials(student.name);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      {/* STUDENT: Avatar + Name + Dot + Admission */}
                      <td className="pl-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-900/60 text-[#0d9488] font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                                {student.name}
                              </span>
                              {isUnsaved && (
                                <span
                                  className="size-2 rounded-full bg-amber-500 shrink-0 inline-block shadow-xs"
                                  title="Unsaved change"
                                />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                              {student.admissionNo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ROLL */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-zinc-400">
                        {student.rollNumber}
                      </td>

                      {/* STATUS: Separate boxed buttons with gaps [P] [A] [L] [½] [LV] matching user image */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* P (Present) */}
                          <button
                            type="button"
                            onClick={() => handleSelectStatus(student.id, "present")}
                            className={cn(
                              "size-8 rounded-lg text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center select-none shadow-2xs",
                              currentStatus === "present"
                                ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-500/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500"
                                : "bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-slate-300"
                            )}
                            title="Present"
                          >
                            P
                          </button>

                          {/* A (Absent) */}
                          <button
                            type="button"
                            onClick={() => handleSelectStatus(student.id, "absent")}
                            className={cn(
                              "size-8 rounded-lg text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center select-none shadow-2xs",
                              currentStatus === "absent"
                                ? "bg-rose-50 text-rose-700 border-2 border-rose-500/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500"
                                : "bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-slate-300"
                            )}
                            title="Absent"
                          >
                            A
                          </button>

                          {/* L (Late) */}
                          <button
                            type="button"
                            onClick={() => handleSelectStatus(student.id, "late")}
                            className={cn(
                              "size-8 rounded-lg text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center select-none shadow-2xs",
                              currentStatus === "late"
                                ? "bg-amber-50 text-amber-700 border-2 border-amber-500/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500"
                                : "bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-slate-300"
                            )}
                            title="Late"
                          >
                            L
                          </button>

                          {/* ½ (Half Day) */}
                          <button
                            type="button"
                            onClick={() => handleSelectStatus(student.id, "halfDay")}
                            className={cn(
                              "size-8 rounded-lg text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center select-none shadow-2xs",
                              currentStatus === "halfDay"
                                ? "bg-blue-50 text-blue-700 border-2 border-blue-500/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500"
                                : "bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-slate-300"
                            )}
                            title="Half Day"
                          >
                            ½
                          </button>

                          {/* LV (Leave) */}
                          <button
                            type="button"
                            onClick={() => handleSelectStatus(student.id, "leave")}
                            className={cn(
                              "h-8 px-2.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer flex items-center justify-center select-none shadow-2xs",
                              currentStatus === "leave"
                                ? "bg-purple-50 text-purple-700 border-2 border-purple-500/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500"
                                : "bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-slate-300"
                            )}
                            title="Leave"
                          >
                            LV
                          </button>
                        </div>
                      </td>

                      {/* NOTE: Note icon button with Popover */}
                      <td className="pr-6 py-3 whitespace-nowrap text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "size-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer",
                                studentNotes[student.id] && "text-[#0d9488] dark:text-[#0d9488]"
                              )}
                              title={studentNotes[student.id] ? "View/edit note" : "Add note"}
                            >
                              <MessageSquare className="size-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-64 p-3 space-y-2">
                            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                              Note for {student.name}
                            </span>
                            <textarea
                              rows={3}
                              value={studentNotes[student.id] || ""}
                              onChange={(e) =>
                                setStudentNotes((prev) => ({
                                  ...prev,
                                  [student.id]: e.target.value,
                                }))
                              }
                              placeholder="Reason for absence or remark..."
                              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* 4. Bottom bar docked flush to the screen container bottom matching top header */}
      <div className="sticky bottom-0 z-30 -mx-4 lg:-mx-6 -mb-4 lg:-mb-6 flex items-center justify-between border-t border-border bg-background/95 backdrop-blur-md px-6 py-3">
        {/* Left Status counts */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* If all unmarked */}
          {tallies.marked === 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-500 dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-slate-400 inline-block" />
              <span>— {tallies.unmarked}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-600 dark:text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                <span className="font-semibold text-slate-700 dark:text-zinc-200">Present {tallies.present}</span>
              </div>

              {tallies.absent > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-rose-500 inline-block" />
                  <span>Absent {tallies.absent}</span>
                </div>
              )}

              {tallies.late > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                  <span>Late {tallies.late}</span>
                </div>
              )}

              {tallies.leave > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-purple-500 inline-block" />
                  <span>Leave {tallies.leave}</span>
                </div>
              )}

              {tallies.unmarked > 0 && (
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                  <span className="size-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block" />
                  <span>— {tallies.unmarked}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Save / Saved button */}
        <div>
          {unsavedCount === 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4ca69a] text-white select-none cursor-default shadow-xs">
              <Check className="size-3.5" />
              <span>All saved</span>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={handleSaveAll}
              className="h-8.5 px-4 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Check className="size-3.5" />
              <span>{isSaving ? "Saving..." : `Save ${unsavedCount} ${unsavedCount === 1 ? "change" : "changes"}`}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
