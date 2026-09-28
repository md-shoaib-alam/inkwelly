"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, AlignLeft } from "lucide-react";
import { CalendarEvent, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, TARGET_ROLE_LABELS } from "../types";

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
  getTypeBadgeStyle: (type: string, color: string) => any;
  getFormattedDatePill: (date: string) => string;
}

export function EventDetailDialog({
  event,
  onOpenChange,
  getTypeBadgeStyle,
  getFormattedDatePill,
}: EventDetailDialogProps) {
  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92%] sm:w-full max-w-[425px] sm:max-w-[450px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden mx-auto">
        {event && (
          <>
            <div className="h-1.5" style={{ backgroundColor: event.color || EVENT_TYPE_COLORS[event.type] || "#3b82f6" }} />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span 
                  className="px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider shadow-sm bg-white dark:bg-zinc-900" 
                  style={getTypeBadgeStyle(event.type, event.color)}
                >
                  {EVENT_TYPE_LABELS[event.type] || event.type}
                </span>
                {event.allDay && (
                  <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 dark:bg-white/[0.05] px-2 py-0.5 rounded uppercase tracking-wider border border-zinc-200/40 dark:border-white/[0.05]">
                    All Day
                  </span>
                )}
              </div>

              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
                {event.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Event information and visual timeline details
              </DialogDescription>

              <div className="mt-5 space-y-4">
                {/* Date Segment */}
                <div className="flex items-start gap-3.5 text-sm">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100/30 dark:border-blue-900/20">
                    <Calendar className="size-4" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Schedule Date</p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-semibold mt-0.5 text-[13px]">
                      {getFormattedDatePill(event.date)}
                      {event.endDate && event.endDate !== event.date && (
                        <span className="text-zinc-400 font-medium"> to {getFormattedDatePill(event.endDate)}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Location Segment */}
                {event.location && (
                  <div className="flex items-start gap-3.5 text-sm">
                    <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 shrink-0 border border-violet-100/30 dark:border-violet-900/20">
                      <MapPin className="size-4" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Location</p>
                      <p className="text-zinc-700 dark:text-zinc-300 font-semibold mt-0.5 text-[13px]">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Visibility Target Role Segment */}
                <div className="flex items-start gap-3.5 text-sm">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100/30 dark:border-amber-900/20">
                    <Users className="size-4" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Event Audience</p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-semibold mt-0.5 text-[13px]">
                      {TARGET_ROLE_LABELS[event.targetRole] || event.targetRole}
                    </p>
                  </div>
                </div>

                {/* Description Segment */}
                {event.description && (
                  <div className="flex items-start gap-3.5 text-sm pt-4 border-t border-zinc-100 dark:border-white/[0.04] mt-4">
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 shrink-0 border border-zinc-100/50 dark:border-white/[0.02]">
                      <AlignLeft className="size-4" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Description</p>
                      <div className="text-zinc-600 dark:text-zinc-400 font-medium text-[13px] leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto no-scrollbar bg-zinc-50/50 dark:bg-white/[0.01] border border-zinc-100 dark:border-white/[0.02] p-3 rounded-xl">
                        {event.description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
