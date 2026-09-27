import React from 'react';
import { MarksheetTemplateProps } from './types';
import { getDeterministicId } from './mockUtils';

export const ICSESemester: React.FC<MarksheetTemplateProps> = ({
  sheet,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName,
}) => {
  const getICSEGrade = (pct: number) => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    if (pct >= 40) return 'E';
    return 'F';
  };

  return (
    <div 
      className="relative bg-white text-[#1e293b] p-10 border-[6px] border-double border-violet-900 rounded overflow-hidden select-none flex flex-col justify-between shrink-0 text-left h-[1123px] w-[794px] box-border font-serif"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* ICSE Elegant Layout */}
      <div className="space-y-5">
        
        {/* Crest & Header */}
        <div className="text-center pb-2 border-b-2 border-violet-900">
          <h2 className="font-semibold text-2xl text-violet-950 tracking-wider uppercase font-serif">
            {sheet.schoolName.toUpperCase()}
          </h2>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[2px] mt-1.5 font-sans">
            Affiliated to Council for the Indian School Certificate Examinations (CISCE), New Delhi
            <br />
            School Code: IN-{getDeterministicId(sheet.schoolName + 'code', 100, 999)}
          </p>
          <p className="text-[11px] text-violet-900 font-extrabold tracking-widest mt-2 uppercase font-serif">
            {examName ? examName : `PROGRESS STATEMENT: SEMESTER TERM ${marksheetType === 'midterm' ? 'I' : marksheetType === 'final' ? 'II' : 'CUMULATIVE'}`} ({academicYear})
          </p>
        </div>

        {/* Student ICSE Index & Admission Matrix */}
        <div className="grid grid-cols-3 gap-4 text-xs font-sans bg-zinc-55/40 p-3 rounded border border-zinc-200">
          <div>
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block mb-0.5">Scholastic Candidate</span>
            <span className="font-bold text-zinc-800 truncate block">{sheet.studentName}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block mb-0.5">Unique ID / SRN</span>
            <span className="font-bold text-zinc-800 font-mono block">UID-{getDeterministicId(sheet.studentName + 'uid', 5000000, 9999999)}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block mb-0.5">Class & Section</span>
            <span className="font-bold text-zinc-800 block">{classNameStr} - {classSection}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block mb-0.5">Attendance Tracker</span>
            <span className="font-bold text-zinc-800 block">93.5% / 210 Days</span>
          </div>
          <div>
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block mb-0.5">National Rank Index</span>
            <span className="font-bold text-violet-900 block font-mono">IND-{sheet.rollNumber}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block mb-0.5">Registrar Ledger No</span>
            <span className="font-bold text-zinc-800 block font-mono">REG-2026/A</span>
          </div>
        </div>

        {/* Academic Marks Scoreboard */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-semibold uppercase text-violet-950 tracking-wider">
            SCHOLASTIC OUTCOMES & SEMESTER STANDINGS
          </h4>
          <div className="rounded border border-violet-900 overflow-hidden bg-white">
            <table className="w-full text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-violet-955 text-white text-[9.5px]">
                  <th className="font-bold px-3 py-2 text-left w-[24%]">PRESCRIBED SUBJECTS</th>
                  {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">HALF YEARLY</th>}
                  {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">YEAR END</th>}
                  <th className="font-bold px-3 py-2 text-center w-[18%]">MAX MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[18%]">PASSING MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[18%]">OBTAINED MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[22%]">FINAL GRADE</th>
                </tr>
              </thead>
              <tbody>
                {sheet.subjects.map((sub, sIdx) => (
                  <tr key={sIdx} className="border-b border-zinc-200 hover:bg-zinc-50/50">
                    <td className="px-3 py-2.5 text-left font-bold text-zinc-800 truncate font-serif">{sub.subjectName}</td>
                    {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.midtermMarks}</td>}
                    {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.finalMarks}</td>}
                    <td className="px-3 py-2.5 text-center font-bold font-mono text-zinc-700">{sub.maxMarks ?? 100}</td>
                    <td className="px-3 py-2.5 text-center font-medium font-mono text-zinc-600">{sub.passingMarks ?? 33}</td>
                    <td className="px-3 py-2.5 text-center font-black font-mono text-violet-950">{sub.obtainedMarks ?? 0}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-black text-violet-950 font-sans text-[10px]">
                        {getICSEGrade(sub.percentage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Descriptive ICSE Grid Summary */}
        <div className="grid grid-cols-12 gap-5 text-xs font-sans">
          
          <div className="col-span-7 border border-zinc-200 rounded p-4 bg-zinc-50/20">
            <h5 className="font-semibold text-[9px] uppercase tracking-wider text-violet-950 mb-1.5">REGISTRAR CONVOCATION VERDICT</h5>
            <p className="italic text-zinc-600 font-medium leading-relaxed">
              "{sheet.remarks}" The student is certified to have acquired standard scholastic outcomes prescribed under the Council rules.
            </p>
          </div>

          <div className="col-span-5 bg-white border border-zinc-200 rounded p-3 space-y-1.5">
            <div className="flex justify-between border-b border-dashed border-zinc-200 pb-1 text-zinc-500 font-semibold">
              <span className="text-[8px] uppercase tracking-wider">CUMULATIVE SCORE</span>
              <span className="text-zinc-950 font-bold font-mono">{sheet.totalObtainedMarks} / {sheet.totalMaxMarks}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-zinc-200 pb-1 text-zinc-500 font-semibold">
              <span className="text-[8px] uppercase tracking-wider">HONOR PERCENTAGE</span>
              <span className="text-violet-900 font-black font-mono">{sheet.overallPercentage}%</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-zinc-200 pb-1 text-zinc-500 font-semibold">
              <span className="text-[8px] uppercase tracking-wider">OUTCOME GRADE</span>
              <span className="text-violet-950 font-black">{sheet.grade}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-500 font-semibold">
              <span className="text-[8px] uppercase tracking-wider">SCHOLASTIC VERDICT</span>
              <span className="text-violet-900 font-black text-[9px]">{sheet.status === 'pass' ? 'HONORABLY PASSED' : 'RETAINED'}</span>
            </div>
          </div>

        </div>

      </div>

      {/* ICSE Formal Sign-off segment */}
      <div className="flex justify-between items-end text-[9.5px] font-bold text-zinc-400 border-t-2 border-violet-900 pt-4 mt-2 font-sans z-10">
        <div>COUNCIL REGISTRY STATEMENT: CISCE SYSTEM</div>
        <div className="flex gap-10">
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-300 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Class Tutor</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-300 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Headmistress</span>
          </div>
        </div>
      </div>
    </div>
  );
};
