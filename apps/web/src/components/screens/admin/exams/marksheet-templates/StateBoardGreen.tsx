import React from 'react';
import { MarksheetTemplateProps } from './types';
import { getDeterministicId } from './mockUtils';

export const StateBoardGreen: React.FC<MarksheetTemplateProps> = ({
  sheet,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName,
}) => {
  const getStateBoardGrade = (pct: number) => {
    if (pct >= 75) return 'A+';
    if (pct >= 60) return 'A';
    if (pct >= 50) return 'B';
    if (pct >= 35) return 'C';
    return 'D';
  };

  return (
    <div 
      className="relative bg-white text-zinc-800 px-9 py-8 border-[5px] border-emerald-700 rounded overflow-hidden select-none flex flex-col justify-between shrink-0 text-left h-[1123px] w-[794px] box-border font-sans"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Traditional Indian State Board Format */}
      <div className="space-y-4">
        
        {/* State Board Style Header */}
        <div className="text-center pb-2 border-b-2 border-emerald-700">
          <div className="flex justify-center items-center gap-3">
            <span className="text-3xl">🇮🇳</span>
            <div>
              <h2 className="font-semibold text-lg text-emerald-800 leading-none tracking-wide uppercase">
                {sheet.schoolName.toUpperCase()}
              </h2>
              <p className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                Recognised by State Department of School Education & Literacy
              </p>
              <p className="text-[10px] text-zinc-700 font-extrabold tracking-widest mt-1 uppercase">
                {examName ? `${examName} REPORT CARD` : 'REPORT CARD & STATEMENT OF SCHOLASTIC MARKS'} ({academicYear})
              </p>
            </div>
          </div>
        </div>

        {/* Traditional Student Details Grid (Fields typical in State Board mark sheets) */}
        <div className="grid grid-cols-12 gap-y-2 gap-x-4 text-xs border border-zinc-200 p-3 rounded-lg bg-zinc-55/30">
          <div className="col-span-6 flex">
            <span className="text-emerald-900 font-bold text-[8.5px] w-28 shrink-0">ROLL NUMBER:</span>
            <span className="font-bold text-zinc-800 font-mono">{sheet.rollNumber}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-emerald-900 font-bold text-[8.5px] w-28 shrink-0">SCHOLASTIC NO (SNo):</span>
            <span className="font-bold text-zinc-800 font-mono">SNo-{getDeterministicId(sheet.studentName + 'scholastic', 10000, 99999)}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-emerald-900 font-bold text-[8.5px] w-28 shrink-0">NAME OF STUDENT:</span>
            <span className="font-bold text-zinc-800 truncate">{sheet.studentName}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-emerald-900 font-bold text-[8.5px] w-28 shrink-0">CLASS & SECTION:</span>
            <span className="font-bold text-zinc-800">{classNameStr} - {classSection}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-emerald-900 font-bold text-[8.5px] w-28 shrink-0">FATHER'S NAME:</span>
            <span className="font-bold text-zinc-800 truncate">Shri. Anand {sheet.studentName.split(' ').pop()}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-emerald-900 font-bold text-[8.5px] w-28 shrink-0">BOARD REGISTRATION:</span>
            <span className="font-bold text-zinc-800 font-mono">BRN-2026-{getDeterministicId(sheet.studentName + 'board', 100, 999)}</span>
          </div>
        </div>

        {/* State Board Scholastic Table */}
        <div className="space-y-1">
          <div className="rounded border border-emerald-700 overflow-hidden bg-white">
            <table className="w-full text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-emerald-700 text-white text-[9.5px]">
                  <th className="font-bold px-3 py-2 text-left w-[24%]">SUBJECT NAME</th>
                  {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">PRE-BOARD I</th>}
                  {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">PRE-BOARD II</th>}
                  <th className="font-bold px-3 py-2 text-center w-[18%]">MAX MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[18%]">PASSING MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[18%]">AGGREGATE OBTAINED</th>
                  <th className="font-bold px-3 py-2 text-center w-[22%]">GRADE</th>
                </tr>
              </thead>
              <tbody>
                {sheet.subjects.map((sub, sIdx) => (
                  <tr key={sIdx} className="border-b border-zinc-150 hover:bg-zinc-50/50">
                    <td className="px-3 py-2.5 text-left font-extrabold text-zinc-800 truncate">{sub.subjectName}</td>
                    {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.midtermMarks}</td>}
                    {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.finalMarks}</td>}
                    <td className="px-3 py-2.5 text-center font-bold font-mono text-zinc-700">{sub.maxMarks ?? 100}</td>
                    <td className="px-3 py-2.5 text-center font-medium font-mono text-zinc-600">{sub.passingMarks ?? 33}</td>
                    <td className="px-3 py-2.5 text-center font-black font-mono text-emerald-800">{sub.obtainedMarks ?? 0}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-black text-emerald-800 font-mono text-[10px]">
                        {getStateBoardGrade(sub.percentage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State Board Legend */}
        <div className="border border-zinc-200 bg-zinc-50 rounded p-1.5 text-[7.5px] text-center font-semibold text-zinc-500">
          <span className="text-emerald-800 uppercase tracking-wider block font-bold mb-0.5">STATE BOARD SCHOLASTIC CLASSIFICATION MATRIX</span>
          <div className="grid grid-cols-6 gap-0.5 mt-0.5 font-mono">
            <div>DISTINCTION (75%+)</div>
            <div>FIRST CLASS (60-74%)</div>
            <div>SECOND CLASS (50-59%)</div>
            <div>THIRD CLASS (35-49%)</div>
            <div className="text-red-700">FAILED (&lt;35%)</div>
            <div>ABS (Absent)</div>
          </div>
        </div>

      </div>

      {/* Indian Verdict & Bottom Signature segment */}
      <div className="space-y-4">
        
        {/* Class Teacher Verdict Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-emerald-800 uppercase text-[9.5px]">PROMOTION VERDICT DECISION:</span>
            <span className="px-3 py-0.5 rounded bg-emerald-700 text-white font-extrabold text-[9.5px]">
              {sheet.status === 'pass' ? 'PASSED & PROMOTED TO NEXT STANDARD' : 'HELD BACK / DETAINED'}
            </span>
          </div>
          <p className="italic text-zinc-700 font-medium leading-relaxed mt-1">
            <strong>Headmaster Appraisal Remarks:</strong> "{sheet.remarks}"
          </p>
        </div>

        {/* Three signature areas typical in State Board report packets */}
        <div className="flex justify-between items-end text-[9.5px] font-bold text-zinc-400 pt-3 border-t border-dashed border-zinc-200">
          <div className="flex flex-col items-center">
            <div className="w-[90px] border-b border-zinc-300 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Guardian</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[90px] border-b border-zinc-300 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Evaluator</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[90px] border-b border-zinc-300 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Headmaster</span>
          </div>
        </div>
      </div>
    </div>
  );
};
