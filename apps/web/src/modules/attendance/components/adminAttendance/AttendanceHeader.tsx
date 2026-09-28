"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Filter, Eye, Lock } from "lucide-react";
import { parseISO } from "date-fns";

interface AttendanceHeaderProps {
  selectedClass: string;
  onClassChange: (val: string) => void;
  classes: any[];
  selectedDate: string;
  onDateChange: (d: Date | undefined) => void;
  isDatePickerDisabled: (date: Date) => boolean;
  isHistoryMode: boolean;
  onToggleHistory: () => void;
  isPremiumOrEnterprise: boolean;
}

export function AttendanceHeader({
  selectedClass,
  onClassChange,
  classes,
  selectedDate,
  onDateChange,
  isDatePickerDisabled,
  isHistoryMode,
  onToggleHistory,
  isPremiumOrEnterprise,
}: AttendanceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Attendance Management
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Class-wise attendance tracking and insights
        </p>
      </div>
      <div className="flex items-center gap-3" suppressHydrationWarning>
        <Select value={selectedClass} onValueChange={onClassChange}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-950 border-zinc-200">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-bold text-emerald-600 italic">
              <span className="flex items-center gap-2 italic">
                <Filter className="size-4" />
                All Classes
              </span>
            </SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} - {cls.section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          disabled={isDatePickerDisabled}
          date={!isHistoryMode && selectedDate ? parseISO(selectedDate) : undefined}
          onChange={onDateChange}
          align="end"
          className="w-[180px] bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        />
        <Button 
          variant={isHistoryMode ? "default" : "outline"} 
          className={`hidden md:flex gap-2 ${!isPremiumOrEnterprise ? 'bg-amber-50/30 border-amber-200/60 opacity-85 cursor-not-allowed text-amber-600 dark:bg-amber-900/10 dark:text-amber-400' : ''}`}
          onClick={onToggleHistory}
          disabled={!isPremiumOrEnterprise}
          title={!isPremiumOrEnterprise ? "Full History requires a Premium subscription" : ""}
        >
          {!isPremiumOrEnterprise ? (
            <Lock className="size-4 text-amber-500" />
          ) : (
            <Eye className="size-4" />
          )}
          {isHistoryMode ? "Exit History" : "Full History"}
          {!isPremiumOrEnterprise && (
            <Badge className="ml-1 bg-amber-100 hover:bg-amber-100 text-amber-700 border-amber-200 text-[9px] uppercase h-4 py-0 px-1 rounded-sm">Premium</Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
