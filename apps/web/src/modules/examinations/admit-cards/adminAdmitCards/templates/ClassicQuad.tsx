"use client";

import React, { memo, useMemo } from "react";
import { GraduationCap, School, Calendar } from "lucide-react";
import { AdmitCard, formatDate, formatTime } from "./types";

export const ClassicQuadAdmitCard = memo(function ClassicQuadAdmitCard({ card }: { card: AdmitCard }) {
  const schoolName = card.school?.name || 'Global Academy';
  const schoolAddress = card.school?.address || 'School Address';
  const todayDateString = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div 
      className="w-[100%] bg-white rounded-lg border border-zinc-200 overflow-hidden flex flex-col justify-between h-[13cm] print:h-[13.5cm] print:w-[9.6cm]"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
    >
      <div>
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 text-white px-5 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-full bg-white/15 flex items-center justify-center border-2 border-white/20">
                <GraduationCap className="size-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-wide leading-tight">{schoolName.toUpperCase()}</h2>
                <p className="text-[9px] text-zinc-300 truncate max-w-[300px]">{schoolAddress}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-400 font-medium">Examination</p>
              <p className="text-lg font-bold text-amber-300 leading-tight">ADMIT CARD</p>
              <p className="text-[9px] text-zinc-400 font-mono">{card.cardNumber}</p>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="bg-amber-500/5 border-b border-amber-400/20 px-5 py-1 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-500">
            <School className="size-2.5 inline mr-1" />
            Class: {card.class.grade}, {card.class.name} ({card.class.section})
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="size-2.5" />
            Session 2024-25
          </p>
        </div>

        {/* Student Info */}
        <div className="px-5 py-2">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="h-20 w-16 rounded border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-zinc-300">{card.student.initials}</span>
                <span className="text-[7px] text-zinc-300 mt-0.5">PHOTO</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-medium">Student Name</p>
                <p className="font-bold text-zinc-900 truncate">{card.student.name}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-medium">Roll Number</p>
                <p className="font-bold text-zinc-900">{card.student.rollNumber}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-medium">Guardian Name</p>
                <p className="font-medium text-zinc-800 truncate">{card.student.parentName || '–'}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-medium">Class</p>
                <p className="font-bold text-zinc-900">{card.class.grade} - {card.class.name}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-medium">D.O.B</p>
                <p className="font-medium text-zinc-800" suppressHydrationWarning>{formatDate(card.student.dateOfBirth || '')}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-medium">Section</p>
                <p className="font-medium text-zinc-800">{card.class.section}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Schedule */}
        <div className="px-5 py-1">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-zinc-50 border-y border-zinc-200">
                <th className="text-left py-1 px-1.5 font-bold text-zinc-700 w-[110px]">Date</th>
                <th className="text-left py-1 px-1.5 font-bold text-zinc-700">Subject</th>
                <th className="text-center py-1 px-1.5 font-bold text-zinc-700 w-[140px]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100" suppressHydrationWarning>
              {card.exams.reduce<React.ReactNode[]>((acc, exam) => {
                const isScheduled = exam.status?.trim().toLowerCase() === 'scheduled';
                const isUpcoming = exam.date >= todayDateString;
                if ((isScheduled || isUpcoming) && !exam.resultPublished) {
                  acc.push(
                    <tr key={exam.id}>
                      <td className="py-1 px-1.5 font-medium text-zinc-800">
                        {formatDate(exam.date)}
                      </td>
                      <td className="py-1 px-1.5">
                        <span className="font-bold text-zinc-800">{exam.subjectName}</span>
                        <span className="text-[8px] text-zinc-400 ml-1">({exam.subjectCode})</span>
                      </td>
                      <td className="py-1 px-1.5 text-center font-mono text-zinc-600">
                        {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                      </td>
                    </tr>
                  );
                }
                return acc;
              }, [])}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        {/* Footer */}
        <div className="px-5 py-2 border-t border-dashed border-zinc-200">
          <div className="flex items-end justify-between gap-4">
            <div className="text-center border-t border-zinc-300 pt-0.5 mt-4 flex-1">
              <p className="text-[8px] text-zinc-500">Teacher</p>
            </div>
            <div className="text-center border-t border-zinc-300 pt-0.5 mt-4 flex-1">
              <p className="text-[8px] text-zinc-500">Parent</p>
            </div>
            <div className="text-center border-t-2 border-zinc-800 pt-0.5 mt-4 flex-1">
              <p className="text-[9px] text-zinc-800 font-bold">Principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
