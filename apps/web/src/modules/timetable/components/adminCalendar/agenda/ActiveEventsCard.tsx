"use client";

import { Button } from "@/components/ui/button";
import { X, CalendarCheck2, Clock, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarEvent, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "../types";

interface ActiveEventsCardProps {
  isViewingToday: boolean;
  selectedDate: string | null;
  onClearSelection: () => void;
  formattedDatePill: string;
  loading: boolean;
  activeEventsList: CalendarEvent[];
  onDetailClick: (ev: CalendarEvent) => void;
  getTypeBadgeStyle: (type: string, color: string) => any;
  canEdit: boolean;
  canDelete: boolean;
  openEditDialog: (ev: CalendarEvent) => void;
  openDeleteConfirm: (id: string) => void;
}

export function ActiveEventsCard({
  isViewingToday,
  selectedDate,
  onClearSelection,
  formattedDatePill,
  loading,
  activeEventsList,
  onDetailClick,
  getTypeBadgeStyle,
  canEdit,
  canDelete,
  openEditDialog,
  openDeleteConfirm,
}: ActiveEventsCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900/40 border border-zinc-200/60 dark:border-white/[0.06] shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
            {isViewingToday ? "Today's Events" : "Selected Day"}
          </h3>
          {selectedDate && !isViewingToday && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-6 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 ml-0.5 rounded-full" 
              onClick={onClearSelection}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
        
        <div className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold tracking-tight border border-blue-100/50 dark:border-blue-900/20 shadow-sm shadow-blue-500/5 shrink-0">
          {formattedDatePill}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar min-h-[120px] max-h-[260px] flex flex-col">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-xl bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-100/50 dark:border-white/[0.03]" />
          </div>
        ) : activeEventsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 border border-zinc-100 dark:border-white/[0.04] bg-zinc-50/30 dark:bg-white/[0.01] rounded-xl text-center">
            <CalendarCheck2 className="size-8 text-zinc-300 dark:text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              No events scheduled for this day
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeEventsList.map((ev) => (
              <div 
                key={ev.id} 
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
                
                <div className="flex items-start justify-between pl-3.5">
                  <div className="space-y-2 min-w-0 flex-1">
                    <h4 className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-100 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate pr-2">
                      {ev.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-wider border uppercase shadow-sm bg-white/80 dark:bg-neutral-900/50" style={getTypeBadgeStyle(ev.type, ev.color)}>
                        {EVENT_TYPE_LABELS[ev.type] || ev.type}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-semibold">
                        <Clock className="size-3 shrink-0 opacity-70" />
                        {ev.allDay ? "All Day" : "Scheduled"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 ml-2">
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="size-7 rounded-lg hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-zinc-200/60 dark:hover:border-white/[0.08]" onClick={(e) => { e.stopPropagation(); openEditDialog(ev); }}>
                        <Pencil className="size-3 text-zinc-500 hover:text-blue-600 dark:hover:text-rose-400" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="size-7 rounded-lg hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-zinc-200/60 dark:hover:border-white/[0.08]" onClick={(e) => { e.stopPropagation(); openDeleteConfirm(ev.id); }}>
                        <Trash2 className="size-3 text-zinc-500 hover:text-rose-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
