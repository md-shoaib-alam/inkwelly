'use client';

import React from 'react';
import { Zap, UserCheck, FilePlus, ClipboardList, Calendar, ChevronRight, QrCode } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (screen: string) => void;
  onOpenQRScan?: () => void;
}

const actions = [
  {
    label: 'Scan Attendance QR',
    subtitle: 'Punch in with live school QR',
    screen: 'scan-qr',
    icon: <QrCode className="size-4" />,
    iconBox: 'bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400',
    cardBg: 'bg-indigo-50/40 hover:bg-indigo-50/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/40',
  },
  {
    label: 'Take Attendance',
    subtitle: 'Mark student attendance',
    screen: 'take-attendance',
    icon: <UserCheck className="size-4" />,
    iconBox: 'bg-blue-100/70 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    cardBg: 'bg-blue-50/30 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border-blue-100/70 dark:border-blue-900/40',
  },
  {
    label: 'Create Homework',
    subtitle: 'Assign new homework',
    screen: 'homework',
    icon: <FilePlus className="size-4" />,
    iconBox: 'bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    cardBg: 'bg-emerald-50/30 hover:bg-emerald-50/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border-emerald-100/70 dark:border-emerald-900/40',
  },
  {
    label: 'Assessments',
    subtitle: 'Create & manage tests',
    screen: 'assessments',
    icon: <ClipboardList className="size-4" />,
    iconBox: 'bg-rose-100/70 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
    cardBg: 'bg-rose-50/30 hover:bg-rose-50/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border-rose-100/70 dark:border-rose-900/40',
  },
  {
    label: 'View Timetable',
    subtitle: 'Check your schedule',
    screen: 'timetable',
    icon: <Calendar className="size-4" />,
    iconBox: 'bg-purple-100/70 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    cardBg: 'bg-purple-50/30 hover:bg-purple-50/70 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 border-purple-100/70 dark:border-purple-900/40',
  },
];

export function QuickActions({ onNavigate, onOpenQRScan }: QuickActionsProps) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <Zap className="size-4 sm:size-4.5 text-blue-600 dark:text-blue-400 fill-blue-600/20" />
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50">
          Quick Actions
        </h2>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
        {actions.map((act) => (
          <div
            key={act.screen}
            onClick={() => {
              if (act.screen === 'scan-qr' && onOpenQRScan) {
                onOpenQRScan();
              } else if (act.screen === 'scan-qr') {
                onNavigate('my-attendance');
              } else {
                onNavigate(act.screen);
              }
            }}
            className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border flex items-center justify-between transition-all group cursor-pointer shadow-2xs hover:shadow-xs ${act.cardBg}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`size-8 sm:size-8.5 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${act.iconBox}`}
              >
                {act.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {act.label}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {act.subtitle}
                </p>
              </div>
            </div>

            <ChevronRight className="size-3.5 text-zinc-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
