import React from 'react';
import { LedgerTemplateProps } from './types';

export const ModernMinimalist: React.FC<LedgerTemplateProps> = ({ data }) => {
  return (
    <div 
      className="p-[6mm] bg-white text-zinc-900 font-sans print:p-0 min-h-screen"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <style type="text/css" media="print">
        {`
          @page { 
            size: landscape; 
            margin: 8mm 6mm 8mm 6mm; 
          } 
          body { 
            margin: 0; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        `}
      </style>

      {/* Header Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-violet-500 to-emerald-500 rounded-full mb-4" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-zinc-150 pb-3 mb-4">
        <div>
          <h1 className="font-semibold text-xl tracking-tight text-zinc-900 uppercase">{data.schoolName}</h1>
          <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wider mt-0.5">{data.ledgerTitle}</p>
        </div>
        <div className="flex gap-6 text-[10px] font-bold text-zinc-500 mt-2 sm:mt-0">
          <div>CLASS: <span className="text-zinc-800">{data.className} - {data.classSection}</span></div>
          <div>CYCLE: <span className="text-zinc-800">{data.academicYear}</span></div>
          <div>DATE: <span className="text-zinc-800" suppressHydrationWarning>{new Date().toLocaleDateString()}</span></div>
        </div>
      </div>

      {/* Class Statistics grid cards */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2 flex flex-col justify-center">
          <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">Total Students</span>
          <span className="text-xs font-black text-zinc-900 font-mono mt-0.5">{data.totalStudents}</span>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-lg p-2 flex flex-col justify-center">
          <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider block">Passed</span>
          <span className="text-xs font-black text-emerald-800 font-mono mt-0.5">{data.passCount}</span>
        </div>
        <div className="bg-red-50/50 border border-red-100/60 rounded-lg p-2 flex flex-col justify-center">
          <span className="text-[8px] text-red-600 font-bold uppercase tracking-wider block">Failed</span>
          <span className="text-xs font-black text-red-800 font-mono mt-0.5">{data.failCount}</span>
        </div>
        {data.pendingCount > 0 ? (
          <div className="bg-amber-50/50 border border-amber-100/60 rounded-lg p-2 flex flex-col justify-center">
            <span className="text-[8px] text-amber-600 font-bold uppercase tracking-wider block">Pending</span>
            <span className="text-xs font-black text-amber-800 font-mono mt-0.5">{data.pendingCount}</span>
          </div>
        ) : (
          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2 flex flex-col justify-center">
            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">Incomplete</span>
            <span className="text-xs font-black text-zinc-900 font-mono mt-0.5">0</span>
          </div>
        )}
        <div className="bg-violet-50/50 border border-violet-100/60 rounded-lg p-2 flex flex-col justify-center">
          <span className="text-[8px] text-violet-600 font-bold uppercase tracking-wider block">Pass Rate</span>
          <span className="text-xs font-black text-violet-850 font-mono mt-0.5">{data.totalStudents > 0 ? ((data.passCount / data.totalStudents) * 100).toFixed(1) + '%' : '0%'}</span>
        </div>
        <div className="bg-blue-50/50 border border-blue-100/60 rounded-lg p-2 flex flex-col justify-center">
          <span className="text-[8px] text-blue-600 font-bold uppercase tracking-wider block">Class Avg %</span>
          <span className="text-xs font-black text-blue-850 font-mono mt-0.5">{data.classAverage}</span>
        </div>
      </div>

      {/* Modern Minimal Table */}
      <div className="overflow-hidden border border-zinc-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-[9.5px] border-collapse table-fixed">
          <thead>
            <tr className="bg-zinc-900 text-white font-bold text-center border-b border-zinc-200">
              <th className="p-2 w-[40px] text-center font-bold">S.NO</th>
              <th className="p-2 w-[60px] text-center font-bold">ROLL</th>
              <th className="p-2 text-left font-bold w-[18%]">STUDENT NAME</th>
              {data.subjectsList.map(sub => (
                <th key={sub} className="p-2 text-center font-bold">
                  <div className="truncate">{sub}</div>
                  <span className="text-[7px] text-zinc-400 font-normal">({data.subjectMaxMarks[sub] || 100})</span>
                </th>
              ))}
              <th className="p-2 text-center w-[70px] font-bold">TOTAL</th>
              <th className="p-2 text-center w-[85px] font-bold">PERCENTAGE</th>
              <th className="p-2 text-center w-[55px] font-bold">GRADE</th>
              <th className="p-2 text-center w-[75px] font-bold">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {data.studentsTabulation.map((student, idx) => (
              <tr 
                key={student.rollNumber} 
                className={`border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors ${
                  idx % 2 === 1 ? 'bg-zinc-50/30' : ''
                }`}
              >
                <td className="p-2 text-center font-mono text-zinc-500">{idx + 1}</td>
                <td className="p-2 text-center font-mono font-bold text-zinc-800">{student.rollNumber}</td>
                <td className="p-2 text-left font-bold text-zinc-900 truncate">{student.name}</td>
                {data.subjectsList.map(sub => {
                  const marks = student.subjectMarks[sub];
                  if (!marks) return <td key={sub} className="p-2 text-center text-zinc-300 font-medium">-</td>;
                  if (marks.status === 'pending') {
                    return (
                      <td key={sub} className="p-2 text-center text-zinc-400 italic text-[9px]">
                        Pending
                      </td>
                    );
                  }
                  if (marks.status === 'absent') {
                    return (
                      <td key={sub} className="p-2 text-center text-red-500 font-bold italic">
                        ABS
                      </td>
                    );
                  }
                  const isFailed = marks.status === 'fail';
                  return (
                    <td key={sub} className={`p-2 text-center font-medium ${isFailed ? 'text-red-550 font-semibold' : 'text-zinc-700'}`}>
                      {marks.marksObtained}
                      <span className="text-[7.5px] text-zinc-450 font-normal">/{marks.totalMarks}</span>
                    </td>
                  );
                })}
                <td className="p-2 text-center font-mono font-bold text-violet-905">{student.totalObtained}/{student.totalMax}</td>
                <td className="p-2 text-center font-mono font-black text-zinc-800">{student.percentage}</td>
                <td className="p-2 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold font-mono ${
                    student.grade === 'A+' || student.grade === 'A'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : student.grade === 'F'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-zinc-50 text-zinc-700 border border-zinc-150'
                  }`}>
                    {student.grade}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wide ${
                    student.status === 'PASS' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : student.status === 'FAIL'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end mt-12 px-8 text-[9px] font-semibold text-zinc-400 pt-3 border-t border-zinc-100">
        <div>Official Consolidated Academic Statement</div>
        <div className="flex gap-10">
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-200 mb-1" />
            <span className="text-[8px] font-black tracking-wider uppercase text-zinc-450">Tutor</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-200 mb-1" />
            <span className="text-[8px] font-black tracking-wider uppercase text-zinc-450">Controller</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-200 mb-1" />
            <span className="text-[8px] font-black tracking-wider uppercase text-zinc-450">Principal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
