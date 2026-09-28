"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { AttendanceRecord } from "@/lib/types";
import { getTodayAttendance } from "./utils";

interface TodayAttendanceCardProps {
  records: AttendanceRecord[];
}

export function TodayAttendanceCard({ records }: TodayAttendanceCardProps) {
  const todayData = getTodayAttendance(records);

  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return { label: "Present", color: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30" };
      case "absent":
        return { label: "Absent", color: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/30" };
      default:
        return { label: "Not Marked", color: "text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900" };
    }
  };

  const statusInfo = formatStatus(todayData.status);

  return (
    <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <CardContent className="p-2.5 sm:p-3.5 flex flex-row items-center justify-between gap-2.5 sm:gap-4">
        <div className="text-left min-w-0 flex-1">
          <h3 className="text-xs sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            Today Attendance
          </h3>
        </div>

        <div className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-semibold tracking-wide transition-all shadow-xs shrink-0 whitespace-nowrap ${statusInfo.color}`}>
          {statusInfo.label}
        </div>
      </CardContent>
    </Card>
  );
}
