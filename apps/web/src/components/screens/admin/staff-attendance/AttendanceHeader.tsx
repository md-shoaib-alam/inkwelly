"use client";

import { GraduationCap, Briefcase } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

interface AttendanceHeaderProps {
  activeTab: string;
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  onOpenQR?: () => void;
}

export function AttendanceHeader({
  activeTab,
  selectedDate,
  onDateChange,
  onOpenQR,
}: AttendanceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          {activeTab === "teacher" ? (
            <GraduationCap className="size-7 text-emerald-600" />
          ) : (
            <Briefcase className="size-7 text-blue-600" />
          )}
          {activeTab === "teacher"
            ? "Teacher Attendance"
            : "Staff Attendance"}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {activeTab === "teacher"
            ? "Manage daily attendance logs for all teachers."
            : "Manage daily attendance logs for staff members."}
        </p>
      </div>
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {onOpenQR && (
          <button
            type="button"
            onClick={onOpenQR}
            className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 hover:bg-blue-100 text-blue-700 dark:text-blue-300 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 px-3.5 h-10 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live QR Attendance</span>
          </button>
        )}

        <DatePicker
          date={selectedDate ? parseISO(selectedDate) : undefined}
          onChange={(d) => {
            if (d) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              onDateChange(`${yyyy}-${mm}-${dd}`);
            }
          }}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date > today;
          }}
          align="end"
          className="rounded-xl dark:[color-scheme:dark] w-fit bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        />
      </div>
    </div>
  );
}
