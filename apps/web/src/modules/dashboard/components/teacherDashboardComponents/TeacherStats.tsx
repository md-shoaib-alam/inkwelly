'use client';

import React from 'react';
import { BookOpen, Users, FileText, UserCheck, ArrowRight } from 'lucide-react';

interface TeacherStatsProps {
  totalClasses: number;
  totalStudents: number;
  pendingAssignments: number;
  todayAttendanceLabel: string;
  onNavigate?: (screen: string) => void;
}

export function TeacherStats({
  totalClasses,
  totalStudents,
  pendingAssignments,
  todayAttendanceLabel,
  onNavigate,
}: TeacherStatsProps) {
  const cards = [
    {
      title: 'My Classes',
      value: totalClasses,
      screen: 'my-classes',
      icon: <BookOpen className="size-4.5" />,
      iconBox: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
      arrowBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60',
      bottomWave: 'from-blue-100/40 dark:from-blue-950/20 to-transparent',
    },
    {
      title: 'Total Students',
      value: totalStudents,
      screen: 'my-classes',
      icon: <Users className="size-4.5" />,
      iconBox: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
      arrowBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      bottomWave: 'from-emerald-100/40 dark:from-emerald-950/20 to-transparent',
    },
    {
      title: 'Pending Homework',
      value: pendingAssignments,
      screen: 'homework',
      icon: <FileText className="size-4.5" />,
      iconBox: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
      arrowBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60',
      bottomWave: 'from-amber-100/40 dark:from-amber-950/20 to-transparent',
    },
    {
      title: "Today's Attendance",
      value: todayAttendanceLabel,
      screen: 'my-attendance',
      icon: <UserCheck className="size-4.5" />,
      iconBox: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40',
      arrowBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60',
      bottomWave: 'from-purple-100/40 dark:from-purple-950/20 to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {cards.map((card) => (
        <div
          key={card.title}
          onClick={() => onNavigate?.(card.screen)}
          className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
        >
          {/* Subtle bottom curved gradient wave */}
          <div
            className={`absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t ${card.bottomWave} pointer-events-none rounded-b-2xl`}
          />

          <div className="relative z-10">
            {/* Top row: Icon, Title & Arrow */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`size-8 sm:size-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${card.iconBox}`}
                >
                  {card.icon}
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {card.title}
                </span>
              </div>

              <div
                className={`size-6 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${card.arrowBg}`}
              >
                <ArrowRight className="size-3" />
              </div>
            </div>

            {/* Bottom stat value */}
            <div className="mt-2.5 sm:mt-3 pl-0.5">
              <span className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {card.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
