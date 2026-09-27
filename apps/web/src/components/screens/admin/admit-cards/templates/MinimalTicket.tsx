"use client";

import React, { memo, useMemo } from "react";
import { AdmitCard, formatDate, formatTime } from "./types";

export const MinimalTicketAdmitCard = memo(function MinimalTicketAdmitCard({ card }: { card: AdmitCard }) {
  const schoolName = card.school?.name || 'Global Academy';
  const todayDateString = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div 
      className="w-[100%] h-[13cm] bg-white rounded-lg border border-zinc-300 overflow-hidden shadow-sm flex relative h-[13cm] print:h-[13.5cm] print:w-[9.6cm]"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
    >
      {/* LEFT SECTION (72%) */}
      <div className="w-[72%] p-3 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🎫</span>
              <h2 className="text-[10px] font-semibold tracking-wide text-zinc-800 uppercase truncate max-w-[150px]">{schoolName}</h2>
            </div>
            <span className="text-[7.5px] uppercase font-mono tracking-widest text-zinc-400 font-bold bg-zinc-50 border px-1.5 py-0.5 rounded">
              ADMIT CARD
            </span>
          </div>

          {/* Student details block */}
          <div className="grid grid-cols-3 gap-2 my-2 text-[9px]">
            <div>
              <span className="text-[7px] text-zinc-400 uppercase font-semibold block">CANDIDATE</span>
              <span className="font-bold text-zinc-800 truncate block">{card.student.name}</span>
            </div>
            <div>
              <span className="text-[7px] text-zinc-400 uppercase font-semibold block">ROLL NUMBER</span>
              <span className="font-mono font-bold text-zinc-800 block">{card.student.rollNumber}</span>
            </div>
            <div>
              <span className="text-[7px] text-zinc-400 uppercase font-semibold block">CLASS & SEC</span>
              <span className="font-bold text-zinc-700 block truncate">{card.class.grade} - {card.class.section}</span>
            </div>
          </div>

          {/* Timetable table */}
          <div className="mt-2 space-y-1">
            <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider block">SUBJECT TIMETABLE</span>
            <table className="w-full text-[8.5px] border border-zinc-100 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-[7px] font-bold">
                  <th className="text-left py-1 px-2 text-zinc-500">Date</th>
                  <th className="text-left py-1 px-2 text-zinc-500">Subject</th>
                  <th className="text-center py-1 px-2 text-zinc-500">Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {card.exams.reduce<React.ReactNode[]>((acc, exam) => {
                  const isScheduled = exam.status?.trim().toLowerCase() === 'scheduled';
                  const isUpcoming = exam.date >= todayDateString;
                  if ((isScheduled || isUpcoming) && !exam.resultPublished) {
                    acc.push(
                      <tr key={exam.id}>
                        <td className="py-1 px-2 font-medium text-zinc-700" suppressHydrationWarning>{formatDate(exam.date)}</td>
                        <td className="py-1 px-2 font-bold text-zinc-800">{exam.subjectName}</td>
                        <td className="py-1 px-2 text-center font-mono text-zinc-500">
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

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[7.5px] text-zinc-400">
          <p suppressHydrationWarning>Date: {new Date(card.generatedAt).toLocaleDateString()}</p>
          <div className="size-fit font-mono font-bold text-zinc-800 bg-zinc-100 px-1 rounded select-none">
            {card.cardNumber.split('-').pop()}
          </div>
        </div>
      </div>

      {/* DASHED SEPARATOR LINE */}
      <div className="absolute top-0 bottom-0 left-[72%] w-0 border-l border-dashed border-zinc-300 flex flex-col justify-around items-center z-10 select-none no-print">
        <span className="text-[5.5px] text-zinc-300 font-bold tracking-widest uppercase origin-center -rotate-90">TEAR HERE</span>
      </div>

      {/* RIGHT SECTION: DESK SLIP / TEAR-OFF (28%) */}
      <div className="w-[28%] bg-zinc-50/80 p-3 flex flex-col justify-between h-full border-l border-zinc-100 relative">
        <div className="space-y-3">
          <div className="text-center border-b border-zinc-200/80 pb-2">
            <span className="text-[7.5px] font-black tracking-widest text-zinc-800 uppercase block">DESK SLIP</span>
            <span className="text-[6.5px] text-zinc-400 block">Invigilator Copy</span>
          </div>

          <div className="space-y-2 text-[8px]">
            <div>
              <span className="text-[6.5px] text-zinc-400 uppercase font-semibold block">CANDIDATE</span>
              <span className="font-bold text-zinc-700 truncate block">{card.student.name.split(' ')[0]}</span>
            </div>
            <div>
              <span className="text-[6.5px] text-zinc-400 uppercase font-semibold block">ROLL NUMBER</span>
              <span className="font-mono font-extrabold text-zinc-800 block">{card.student.rollNumber}</span>
            </div>
            <div>
              <span className="text-[6.5px] text-zinc-400 uppercase font-semibold block">CLASS & SEC</span>
              <span className="font-bold text-zinc-600 block">{card.class.grade} - {card.class.section}</span>
            </div>
          </div>
        </div>

        {/* Verification Barcode */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-[1px] h-5 bg-white border border-zinc-200 p-0.5 rounded select-none">
            {[1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1].map((w, idx) => (
              <div key={idx} className="bg-zinc-800 h-full" style={{ width: `${w}px` }} />
            ))}
          </div>
          <div className="text-center">
            <span className="text-[6px] font-mono text-zinc-400">{card.cardNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
