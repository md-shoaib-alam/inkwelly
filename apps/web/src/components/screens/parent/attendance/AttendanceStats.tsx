"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface AttendanceStatsProps {
  percentage: number;
  present: number;
  absent: number;
}

export function AttendanceStats({ percentage, present, absent }: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {/* Percentage circle card */}
      <Card className="col-span-2 md:col-span-1 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/50 bg-white dark:bg-zinc-950/40 backdrop-blur-xl shadow-xs overflow-hidden group">
        <CardContent className="p-6 flex items-center justify-center min-h-[160px]">
          <div className="relative size-32 group-hover:scale-105 transition-transform duration-300">
            <svg className="size-32 -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64" cy="64" r="54"
                fill="none" stroke="#f4f4f5" strokeWidth="8"
                className="dark:stroke-zinc-800"
              />
              <circle
                cx="64" cy="64" r="54"
                fill="none"
                stroke={percentage >= 80 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8"
                strokeDasharray={`${(percentage / 100) * 339} 339`}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-left leading-none">
              <span className={`text-2xl font-black tracking-tight ${percentage >= 80 ? "text-emerald-600 dark:text-emerald-400" : percentage >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                {percentage}%
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider mt-1.5">Attendance</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Present days card */}
      <Card className="col-span-1 rounded-3xl border border-emerald-100/80 dark:border-emerald-950/40 bg-white dark:bg-zinc-950/40 backdrop-blur-xl shadow-xs hover:border-emerald-500/20 transition-all duration-300 group flex flex-col justify-between min-h-[120px] md:min-h-[160px]">
        <CardContent className="p-4 md:p-6 flex flex-col justify-between h-full w-full">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="size-4 md:size-5" />
            </div>
          </div>
          <div className="mt-3 md:mt-4 text-left leading-none">
            <span className="text-[9px] md:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block">Present Days</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight block mt-1.5 md:mt-2">
              {present}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Absent days card */}
      <Card className="col-span-1 rounded-3xl border border-red-100/80 dark:border-red-950/40 bg-white dark:bg-zinc-950/40 backdrop-blur-xl shadow-xs hover:border-red-500/20 transition-all duration-300 group flex flex-col justify-between min-h-[120px] md:min-h-[160px]">
        <CardContent className="p-4 md:p-6 flex flex-col justify-between h-full w-full">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-red-500/5 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
              <XCircle className="size-4 md:size-5" />
            </div>
          </div>
          <div className="mt-3 md:mt-4 text-left leading-none">
            <span className="text-[9px] md:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block">Absent Days</span>
            <span className="text-2xl md:text-3xl font-black text-red-650 dark:text-red-400 tracking-tight block mt-1.5 md:mt-2">
              {absent}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

