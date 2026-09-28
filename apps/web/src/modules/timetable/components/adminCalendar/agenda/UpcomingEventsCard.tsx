"use client";

import { Button } from "@/components/ui/button";
import { RotateCw, CalendarDays, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarEvent, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "../types";

interface UpcomingEventsCardProps {
  loading: boolean;
  upcomingEventsList: CalendarEvent[];
  onDetailClick: (ev: CalendarEvent) => void;
  getFormattedDatePill: (date: string) => string;
  getTypeBadgeStyle: (type: string, color: string) => any;
}

export function UpcomingEventsCard({
  loading,
  upcomingEventsList,
  onDetailClick,
  getFormattedDatePill,
  getTypeBadgeStyle,
}: UpcomingEventsCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900/40 border border-zinc-200/60 dark:border-white/[0.06] shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
          Upcoming Events
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-7 text-blue-500 hover:text-blue-600 dark:text-blue-400 rounded-full transition-transform duration-500 active:rotate-180"
          onClick={() => window.location.reload()}
        >
          <RotateCw className="size-3.5 stroke-[2]" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar min-h-[160px] flex flex-col">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={`upcoming-skel-${i}`} className="h-14 w-full rounded-xl bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-100/50 dark:border-white/[0.03]" />
            ))}
          </div>
        ) : upcomingEventsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 border border-zinc-100 dark:border-white/[0.04] bg-zinc-50/30 dark:bg-white/[0.01] rounded-xl text-center">
            <CalendarDays className="size-7 text-zinc-300 dark:text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              No upcoming events schedule
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingEventsList.map((ev) => (
              <button 
                key={ev.id} 
                type="button"
                onClick={() => onDetailClick(ev)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDetailClick(ev);
                  }
                }}
                className="w-full text-left group relative p-3.5 bg-zinc-50/30 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] border border-zinc-100 dark:border-white/[0.05] hover:border-zinc-200/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] rounded-2xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-transform duration-300 group-hover:scale-y-125" style={{ backgroundColor: ev.color || EVENT_TYPE_COLORS[ev.type] || "#3b82f6" }} />
                
                <div className="flex justify-between items-center pl-3.5">
                  <div className="space-y-1.5 min-w-0 flex-1 pr-3">
                    <h4 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                      {ev.title}
                    </h4>
                    <div className="flex items-center gap-2.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                      <span className="font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/50 dark:border-white/[0.02] px-1.5 py-0.5 rounded shrink-0 text-[9px]">
                        {getFormattedDatePill(ev.date).split(" ").slice(0,2).join(" ")}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1 truncate font-semibold">
                          <MapPin className="size-2.5 shrink-0 opacity-70" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black tracking-wider border uppercase shadow-sm bg-white/80 dark:bg-neutral-900/50 shrink-0" style={getTypeBadgeStyle(ev.type, ev.color)}>
                    {EVENT_TYPE_LABELS[ev.type] || ev.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
