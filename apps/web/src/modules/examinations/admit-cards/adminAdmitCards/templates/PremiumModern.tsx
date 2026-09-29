"use client";

import React, { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { AdmitCard, formatDate, formatTime } from "./types";

export const PremiumModernAdmitCard = memo(function PremiumModernAdmitCard({ card }: { card: AdmitCard }) {
  const schoolName = card.school?.name || 'Global Academy';
  const schoolAddress = card.school?.address || 'School Address';
  const todayDateString = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div 
      className="w-[100%] h-[13cm] bg-gradient-to-br from-white via-zinc-50 to-white rounded-xl border border-zinc-200 p-4 flex flex-col justify-between relative overflow-hidden h-[13cm] print:h-[13.5cm] print:w-[9.6cm]"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
    >
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 size-36 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 size-36 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
      
      <div>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            {card.school?.logo ? (
              <img src={card.school.logo} alt="Logo" className="size-10 object-contain rounded" />
            ) : (
              <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-500/20 select-none">
                {schoolName[0].toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xs font-semibold text-zinc-800 tracking-wide uppercase leading-tight">{schoolName}</h2>
              <p className="text-[8px] text-zinc-400 max-w-[150px] truncate">{schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 text-[7px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full select-none hover:bg-emerald-50">
              VERIFIED
            </Badge>
            <p className="text-[9px] font-mono text-zinc-500 mt-1 font-semibold">{card.cardNumber}</p>
          </div>
        </div>

        {/* Student Details Grid */}
        <div className="flex items-center gap-4 my-2.5 bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-100/80">
          <div className="relative">
            <div className="size-16 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-700 flex items-center justify-center font-bold text-lg border-2 border-emerald-500/20 shadow-inner">
              {card.student.initials}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white size-5 rounded-full flex items-center justify-center text-[7px] border border-white font-bold select-none">
              ✓
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div>
              <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider block">Student</span>
              <span className="font-bold text-zinc-800 truncate block">{card.student.name}</span>
            </div>
            <div>
              <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider block">Roll Number</span>
              <span className="font-mono font-bold text-zinc-800 block">{card.student.rollNumber}</span>
            </div>
            <div>
              <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider block">Class & Sec</span>
              <span className="font-semibold text-zinc-700 block">{card.class.grade} - {card.class.name} ({card.class.section})</span>
            </div>
            <div>
              <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider block">Guardian</span>
              <span className="font-semibold text-zinc-700 truncate block">{card.student.parentName || '–'}</span>
            </div>
          </div>
        </div>

        {/* Timetable */}
        <div className="mt-2.5 space-y-1">
          <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider px-1">Exam Timetable</div>
          <div className="border border-zinc-100 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-[8px] font-semibold">
                  <th className="text-left py-1.5 px-3 text-zinc-500">Date & Time</th>
                  <th className="text-left py-1.5 px-3 text-zinc-500">Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {card.exams.reduce<React.ReactNode[]>((acc, exam) => {
                  const isScheduled = exam.status?.trim().toLowerCase() === 'scheduled';
                  const isUpcoming = exam.date >= todayDateString;
                  if ((isScheduled || isUpcoming) && !exam.resultPublished) {
                    acc.push(
                      <tr key={exam.id} className="hover:bg-zinc-50/30">
                        <td className="py-1.5 px-3 font-medium text-zinc-700">
                          <div className="font-semibold text-[9px]" suppressHydrationWarning>{formatDate(exam.date)}</div>
                          <div className="text-[7.5px] text-zinc-400 font-mono mt-0.5">{formatTime(exam.startTime)} - {formatTime(exam.endTime)}</div>
                        </td>
                        <td className="py-1.5 px-3 font-bold text-zinc-800 text-[9px]">
                          <span>{exam.subjectName}</span>
                          <span className="text-[7px] font-mono text-zinc-400 ml-1 font-normal bg-zinc-100 px-1 py-0.5 rounded">{exam.subjectCode}</span>
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
      </div>

      {/* Signatures */}
      <div className="flex items-end justify-between border-t border-zinc-100 pt-3">
        <div className="text-center w-24">
          <div className="h-6 border-b border-zinc-200 flex items-end justify-center pb-0.5">
            <span className="text-[7px] text-zinc-300 font-mono">STAMP</span>
          </div>
          <p className="text-[8px] text-zinc-400 uppercase tracking-wider font-semibold mt-1">Invigilator</p>
        </div>
        <div className="text-center w-28">
          <div className="h-6 flex items-end justify-center pb-0.5">
            <span className="font-mono text-zinc-800 text-[9px] italic font-bold">Principal Office</span>
          </div>
          <div className="border-t border-zinc-300 w-full" />
          <p className="text-[8px] text-zinc-800 uppercase tracking-wider font-bold mt-1">Principal</p>
        </div>
      </div>
    </div>
  );
});
