"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Loader2, Send, Sparkles, CheckCircle2, Star } from "lucide-react";
import type { AssignmentInfo } from "@/lib/types";

export type HomeworkStatus = "active" | "submitted" | "overdue";

export interface EnrichedHomework extends AssignmentInfo {
  status: HomeworkStatus;
  countdown: string;
  daysLeft: number;
  submitted: boolean;
  submissionId: string | null;
}

interface DailyDiaryPlannerProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  homeworkDays: Date[];
  selectedDateAssignments: EnrichedHomework[];
  dueSelectedDateAssignments: EnrichedHomework[];
  getStatusBadge: (status: HomeworkStatus) => React.ReactNode;
  getProgressValue: (status: HomeworkStatus) => number;
  getProgressColor: (status: HomeworkStatus) => string;
  onSubmit?: (homework: EnrichedHomework) => void;
  submittingId?: string | null;
  emptyMessage?: string;
}

export function DailyDiaryPlanner({
  selectedDate,
  setSelectedDate,
  homeworkDays,
  selectedDateAssignments,
  dueSelectedDateAssignments,
  getStatusBadge,
  getProgressValue,
  getProgressColor,
  onSubmit,
  submittingId = null,
  emptyMessage = "No homework assigned or due on this date.",
}: DailyDiaryPlannerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const totalEntries = selectedDateAssignments.length + dueSelectedDateAssignments.length;
  const completedCount = [...selectedDateAssignments, ...dueSelectedDateAssignments]
    .filter(a => a.status === "submitted").length;

  return (
    <div className="mt-0 lg:relative lg:p-4 lg:bg-linear-to-br lg:from-[#4a3622] lg:via-[#2c2014] lg:to-[#1a130c] lg:dark:from-zinc-950 lg:dark:to-stone-900 lg:rounded-[28px] lg:shadow-2xl lg:border-4 lg:border-[#3a2a1b] lg:dark:border-zinc-800/80">
      {/* Outer book cover leather shine overlay */}
      <div className="hidden lg:block absolute inset-0 bg-radial-gradient from-white/5 to-black/45 rounded-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative lg:bg-[#f7f5f0] lg:dark:bg-[#1a1917] lg:rounded-2xl lg:overflow-hidden lg:shadow-inner lg:border lg:border-amber-900/10 lg:dark:border-zinc-800 bg-transparent">
        
        {/* LEFT PAGE: Calendar Agenda (Warm Ivory Graph Paper) */}
        <div className="hidden lg:block p-3 md:p-6 lg:col-span-4 lg:border-r border-amber-900/15 dark:border-[#2f271f] relative bg-[#FAF8F4] dark:bg-[#1a1917] shadow-[inset_-10px_0_15px_-5px_rgba(0,0,0,0.06)] min-h-fit lg:min-h-145 pb-4 lg:pb-4">
          {/* Bullet/Grid paper background */}
          <div className="absolute inset-0 opacity-[0.25] dark:opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #5c4e37 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />

          {/* Page binder holes */}
          <div className="absolute right-0.5 top-0 bottom-0 w-4 hidden lg:flex flex-col justify-around items-center py-8 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="size-2 rounded-full bg-stone-950 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)] border border-stone-800/20" />
            ))}
          </div>

          <div className="space-y-3.5 pr-0 lg:pr-6 relative z-10">
            <div className="flex items-center justify-between border-b border-amber-900/15 dark:border-[#2f271f] pb-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest">Monthly Planner</span>
              <span className="text-[10px] bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                {homeworkDays.length} active
              </span>
            </div>

            {/* Mobile Date Picker Popover (Using custom Calendar component) */}
            <div className="block md:hidden bg-white/80 dark:bg-stone-900/60 rounded-xl p-3 border border-amber-900/10 dark:border-[#2f271f] shadow-inner">
              <label className="block text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider mb-1.5">
                Select Date
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button 
                    type="button"
                    className="w-full flex items-center justify-start text-left font-semibold text-xs h-9 px-3 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-amber-900/15 dark:border-zinc-800 hover:bg-amber-50/20 transition-colors"
                  >
                    <CalendarDays className="mr-2 h-3.5 w-3.5 text-amber-800 dark:text-amber-500" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-stone-950 border border-amber-900/15 dark:border-zinc-800" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    modifiers={{ hasHomework: homeworkDays }}
                    modifiersClassNames={{
                      hasHomework: "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:bg-amber-700 dark:after:bg-amber-500 after:rounded-full font-bold text-amber-900 dark:text-amber-400"
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Desktop Calendar (Hidden on Mobile) */}
            <div className="hidden md:flex justify-center bg-white/70 dark:bg-stone-900/40 rounded-xl p-2 border border-amber-900/10 dark:border-[#2f271f] shadow-inner">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border-0 bg-transparent w-full dark:text-stone-300"
                modifiers={{ hasHomework: homeworkDays }}
                modifiersClassNames={{
                  hasHomework: "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:bg-amber-700 dark:after:bg-amber-500 after:rounded-full font-bold text-amber-900 dark:text-amber-400"
                }}
              />
            </div>

            {/* Jump to Today button */}
            <button
              onClick={() => setSelectedDate(new Date())}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 bg-amber-50/60 dark:bg-stone-800/50 hover:bg-amber-100/80 dark:hover:bg-stone-800/80 border border-amber-900/10 dark:border-[#2f271f] rounded-lg py-2 transition-all duration-200 group/today"
            >
              <Sparkles className="size-3 transition-transform group-hover/today:rotate-12" />
              Jump to Today
            </button>

            {/* Quick Stats Strip */}
            {totalEntries > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-amber-50/60 dark:bg-stone-800/40 border border-amber-900/10 dark:border-[#2f271f] rounded-lg p-2.5 text-center">
                  <p className="text-lg font-extrabold text-amber-900 dark:text-amber-400 leading-none">{totalEntries}</p>
                  <p className="text-[9px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mt-1">Total Tasks</p>
                </div>
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-900/10 dark:border-emerald-900/20 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-400 leading-none">{completedCount}</p>
                  <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mt-1">Completed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BRASS/GOLD SPIRAL BINDER RINGS */}
        <div className="absolute left-[33.33%] top-0 bottom-0 w-8 -translate-x-1/2 hidden lg:flex flex-col justify-around items-center py-6 z-30 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="relative w-full h-8 flex items-center justify-center">
              <div className="absolute w-9 h-4 bg-stone-950/25 dark:bg-black/60 rounded-full blur-[1px] translate-y-0.75 -rotate-12" />
              <div 
                className="absolute w-9 h-4 border-[2.5px] border-amber-600/90 dark:border-amber-500/80 bg-linear-to-b from-amber-100 via-amber-300 to-amber-700 dark:from-amber-200 dark:via-amber-400 dark:to-amber-800 rounded-full" 
                style={{ transform: 'rotate(-12deg)' }} 
              />
            </div>
          ))}
        </div>

        {/* RIGHT PAGE: Diary Entries (Lined Ivory Paper) */}
        <div className="lg:col-span-8 relative lg:bg-[#FCFAF6] lg:dark:bg-[#171614] lg:min-h-145 lg:shadow-[inset_20px_0_25px_-10px_rgba(0,0,0,0.12)] lg:bg-card lg:border lg:border-zinc-200 lg:dark:border-zinc-850 lg:rounded-xl lg:p-6 px-4 py-3 sm:p-5">
          
          {/* Subtle notebook lines background */}
          <div className="hidden lg:block absolute inset-0 bg-linear-gradient-[#dedad0] dark:bg-linear-gradient-[#38332a] opacity-25 dark:opacity-35 pointer-events-none" style={{ backgroundImage: 'linear-gradient(transparent, transparent 31px, currentColor 31px, currentColor 32px)', backgroundSize: '100% 32px' }} />

          {/* Page binder holes */}
          <div className="absolute left-0.5 top-0 bottom-0 w-4 hidden lg:flex flex-col justify-around items-center py-8 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="size-2 rounded-full bg-stone-950 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)] border border-stone-800/20" />
            ))}
          </div>

          {/* Red Margin Line */}
          <div className="hidden lg:block absolute left-6 md:left-10 top-0 bottom-0 w-[1.5px] bg-red-500/40 dark:bg-red-800/40" />

          <div className="lg:pl-12 relative z-10">
            {/* Date Header */}
            <div className="h-14 sm:h-16 border-b border-amber-900/10 dark:border-[#2f271f] flex items-center justify-between gap-2 mb-0">
              <div className="text-left flex flex-col justify-center h-full min-w-0">
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-amber-950 dark:text-stone-100 leading-none truncate">
                  {selectedDate?.toLocaleDateString(undefined, { weekday: 'long' })}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-amber-800 dark:text-amber-500 font-bold uppercase tracking-wider mt-1.5 leading-none">
                  {selectedDate?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Mobile Date Picker Popover */}
              <div className="block lg:hidden shrink-0">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsCalendarOpen((prev) => !prev);
                      }}
                      className="h-8 text-[10px] sm:text-[11px] font-bold px-2.5 bg-amber-50/60 dark:bg-stone-800/80 border border-amber-900/15 dark:border-zinc-800 text-amber-950 dark:text-stone-100 hover:bg-amber-100/50 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <CalendarDays className="size-3.5 mr-1 text-amber-850 dark:text-amber-500" />
                      Date
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-stone-950 border border-amber-900/15 dark:border-zinc-800" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }}
                      modifiers={{ hasHomework: homeworkDays }}
                      modifiersClassNames={{
                        hasHomework: "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:bg-amber-700 dark:after:bg-amber-500 after:rounded-full font-bold text-amber-900 dark:text-amber-400"
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-100/40 dark:bg-stone-900/80 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-900/15 dark:border-[#2f271f] shrink-0">
                <CalendarDays className="size-3.5 text-amber-800 dark:text-amber-500 hidden sm:inline" />
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-900 dark:text-amber-400">
                  {totalEntries} {totalEntries === 1 ? 'Entry' : 'Entries'}
                </span>
              </div>
            </div>

            <ScrollArea className="max-h-120 pr-2 mt-1">
              {totalEntries === 0 ? (
                <div className="text-center py-16 border border-dashed border-amber-900/15 dark:border-[#2f271f] rounded-xl bg-amber-50/20 dark:bg-stone-900/5">
                  <div className="inline-flex items-center justify-center size-14 rounded-full bg-amber-100/50 dark:bg-stone-800/50 mb-3">
                    <CalendarDays className="size-7 text-amber-600/60 dark:text-amber-500/50" />
                  </div>
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-200">Empty Diary Page</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 px-8 leading-relaxed max-w-70 mx-auto">
                    {emptyMessage}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col pt-1 gap-1">
                  {selectedDateAssignments.length > 0 && (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 py-2">
                        <div className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-500" />
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 dark:text-amber-500">
                          Assigned Today
                        </h4>
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full">
                          {selectedDateAssignments.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {selectedDateAssignments.map((a) => (
                          <DiaryTaskCard
                            key={a.id}
                            a={a}
                            getStatusBadge={getStatusBadge}
                            getProgressValue={getProgressValue}
                            getProgressColor={getProgressColor}
                            onSubmit={onSubmit}
                            submittingId={submittingId}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDateAssignments.length > 0 && dueSelectedDateAssignments.length > 0 && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-amber-900/10 dark:bg-[#2f271f]" />
                      <span className="text-[8px] font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">~ ~ ~</span>
                      <div className="h-px flex-1 bg-amber-900/10 dark:bg-[#2f271f]" />
                    </div>
                  )}

                  {dueSelectedDateAssignments.length > 0 && (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 py-2">
                        <div className="size-1.5 rounded-full bg-rose-500" />
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-rose-900 dark:text-rose-400">
                          Due Today
                        </h4>
                        <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-full">
                          {dueSelectedDateAssignments.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {dueSelectedDateAssignments.map((a) => (
                          <DiaryTaskCard
                            key={a.id}
                            a={a}
                            getStatusBadge={getStatusBadge}
                            getProgressValue={getProgressValue}
                            getProgressColor={getProgressColor}
                            onSubmit={onSubmit}
                            submittingId={submittingId}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper Card for Daily Diary Tasks ─── */
interface DiaryTaskCardProps {
  a: EnrichedHomework;
  getStatusBadge: (s: HomeworkStatus) => React.ReactNode;
  getProgressValue: (s: HomeworkStatus) => number;
  getProgressColor: (s: HomeworkStatus) => string;
  onSubmit?: (homework: EnrichedHomework) => void;
  submittingId?: string | null;
}

const statusConfig = {
  submitted: { accent: "bg-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-900/40", badgeBg: "bg-emerald-100 dark:bg-emerald-950/60", badgeText: "text-emerald-800 dark:text-emerald-300", label: "Submitted" },
  active:    { accent: "bg-amber-400",   ring: "ring-amber-200 dark:ring-amber-900/40",  badgeBg: "bg-amber-100 dark:bg-amber-950/60",   badgeText: "text-amber-800 dark:text-amber-300",   label: "Pending" },
  overdue:   { accent: "bg-rose-500",    ring: "ring-rose-200 dark:ring-rose-900/40",    badgeBg: "bg-rose-100 dark:bg-rose-950/60",     badgeText: "text-rose-800 dark:text-rose-300",     label: "Overdue" },
} as const;

function DiaryTaskCard({ a, onSubmit, submittingId = null }: DiaryTaskCardProps) {
  const cfg = statusConfig[a.status];
  const isDone = a.status === "submitted";
  const progressPercent = a.status === "submitted" ? 100 : a.status === "overdue" ? 80 : 30;

  return (
    <div className={`
      group relative rounded-lg bg-white/50 dark:bg-stone-900/30 border border-amber-900/8 dark:border-[#2f271f]
      hover:bg-white/90 dark:hover:bg-stone-900/60 hover:shadow-md hover:border-amber-900/15 dark:hover:border-amber-700/30
      transition-all duration-200 ease-out overflow-hidden
    `}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.75 ${cfg.accent} rounded-l-lg`} />

      <div className="pl-3.5 pr-3 py-2.5">
        {/* Row 1: Title + Badges */}
        <div className="flex items-start justify-between gap-2">
          <h5 className="font-bold text-[13px] text-stone-900 dark:text-stone-50 leading-snug flex items-center gap-2 min-w-0">
            <span className={`mt-1 size-1.5 rounded-full shrink-0 ${cfg.accent}`} />
            <span className="truncate">{a.title}</span>
          </h5>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-[9px] text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider leading-none whitespace-nowrap">
              {a.subjectName}
            </span>
            <Badge className={`${cfg.badgeBg} hover:${cfg.badgeBg} ${cfg.badgeText} border-0 text-[9px] shadow-none rounded px-1.5 py-0.5 font-extrabold uppercase tracking-wider leading-none`}>
              {cfg.label}
            </Badge>
          </div>
        </div>

        {/* Row 2: Description */}
        {a.description && (
          <p className="text-[11px] text-stone-600 dark:text-stone-400 font-medium mt-1 pl-3.5 line-clamp-2 leading-relaxed">
            {a.description}
          </p>
        )}

        {/* Row 3: Countdown + Submit */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Countdown chip */}
            {a.countdown && !isDone && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                <Clock className="size-3 shrink-0" />
                <span className="truncate">{a.countdown}</span>
              </div>
            )}
            {/* Submitted check */}
            {a.status === "submitted" && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3 shrink-0" />
                Done
              </div>
            )}
          </div>

          {/* Submit Button */}
          {onSubmit && !isDone && (
            <Button
              onClick={() => onSubmit(a)}
              disabled={submittingId === a.id}
              className={`
                h-6 text-[10px] font-bold px-3 flex items-center gap-1.5 rounded-md transition-all duration-200 shadow-sm border
                ${a.status === "overdue"
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-700"
                  : "bg-amber-700 hover:bg-amber-800 text-white border-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 dark:border-amber-700"
                }
              `}
            >
              {submittingId === a.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Send className="size-2.5" />
              )}
              {a.status === "overdue" ? "Submit Late" : "Submit"}
            </Button>
          )}
        </div>

        {/* Progress bar at bottom */}
        <div className="mt-2 h-0.5 bg-amber-900/5 dark:bg-[#2f271f] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${cfg.accent}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
