import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, Clock } from "lucide-react";
import type { TimetableSlot } from "@/lib/types";
import { DAY_FULL_LABELS, formatTime } from "./types";

interface TimetableSummaryProps {
  todayKey: string;
  todayDateString: string;
  todaySlots: TimetableSlot[];
  nextPeriod: TimetableSlot | null;
}

export function TimetableSummary({
  todayKey,
  todayDateString,
  todaySlots,
  nextPeriod,
}: TimetableSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Calendar className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {todayKey ? DAY_FULL_LABELS[todayKey] : "Weekend"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400" suppressHydrationWarning>
              {todayDateString}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {todaySlots.length} Classes
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Scheduled for today
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {nextPeriod
                ? `Next: ${nextPeriod.subjectName}`
                : todaySlots.length > 0
                  ? "No more classes"
                  : "No classes today"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {nextPeriod
                ? `At ${formatTime(nextPeriod.startTime)}`
                : todaySlots.length > 0
                  ? "All done for today"
                  : "Enjoy your day off"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
