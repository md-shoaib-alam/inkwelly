import React from 'react';
import { MarksheetTemplateProps } from './types';
import { getDeterministicId } from './mockUtils';

export const CBSEStandard: React.FC<MarksheetTemplateProps> = ({
  sheet,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName,
}) => {
  // Mock co-scholastic & discipline grades common in CBSE
  const coScholastic = [
    { area: 'Work Education (or Pre-Vocational Education)', grade: 'A' },
    { area: 'Art Education', grade: 'A' },
    { area: 'Health & Physical Education', grade: 'B' },
  ];

  const discipline = [
    { area: 'Regularity & Punctuality', grade: 'A' },
    { area: 'Sincerity & Behaviour', grade: 'A' },
    { area: 'Respect for Rules & Values', grade: 'A' },
  ];

  const getCBSEGrade = (pct: number) => {
    if (pct >= 91) return 'A1';
    if (pct >= 81) return 'A2';
    if (pct >= 71) return 'B1';
    if (pct >= 61) return 'B2';
    if (pct >= 51) return 'C1';
    if (pct >= 41) return 'C2';
    if (pct >= 33) return 'D';
    return 'E';
  };

  return (
    <div 
      className="relative bg-white text-zinc-900 px-9 py-8 border-[5px] border-emerald-800 rounded overflow-hidden select-none flex flex-col justify-between shrink-0 text-left h-[1123px] w-[794px] box-border font-sans"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Dynamic Header */}
      <div className="space-y-4">
        
        {/* CBSE Authentic Header */}
        <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-3">
          <div className="size-14 bg-emerald-50 border border-emerald-800 rounded-full flex items-center justify-center shrink-0">
            <span className="text-2xl">🏫</span>
          </div>
          <div className="text-center flex-1 px-4">
            <h2 className="font-semibold text-xl text-emerald-900 leading-none tracking-wide uppercase">
              {sheet.schoolName.toUpperCase()}
            </h2>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5">
              Affiliated to Central Board of Secondary Education (CBSE), New Delhi
            </p>
            <p className="text-[10px] text-emerald-800 font-bold tracking-wider mt-1 uppercase">
              {examName ? `${examName} REPORT CARD` : 'ACADEMIC ASSESSMENT REPORT CARD'}: {academicYear}
            </p>
          </div>
          <div className="size-14 border border-zinc-200 rounded flex flex-col items-center justify-center text-[7px] font-bold text-zinc-400">
            <span>STUDENT</span>
            <span>PHOTO</span>
          </div>
        </div>

        {/* Indian / CBSE Student Info Matrix */}
        <div className="grid grid-cols-12 gap-y-2.5 gap-x-4 text-xs border border-zinc-200 p-3 rounded-lg bg-zinc-55/30">
          <div className="col-span-6 flex">
            <span className="text-zinc-500 font-bold uppercase text-[8.5px] w-32 shrink-0">Student's Name:</span>
            <span className="font-bold text-zinc-900 truncate">{sheet.studentName}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-zinc-500 font-bold uppercase text-[8.5px] w-32 shrink-0">Class / Section:</span>
            <span className="font-bold text-zinc-900">{classNameStr}, {classSection}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-zinc-500 font-bold uppercase text-[8.5px] w-32 shrink-0">Roll Number:</span>
            <span className="font-bold text-zinc-900 font-mono">{sheet.rollNumber}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-zinc-500 font-bold uppercase text-[8.5px] w-32 shrink-0">Admission No. (SRN):</span>
            <span className="font-bold text-zinc-900 font-mono">SRN-{getDeterministicId(sheet.studentName + 'admission', 1000, 9999)}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-zinc-500 font-bold uppercase text-[8.5px] w-32 shrink-0">Father's Name:</span>
            <span className="font-bold text-zinc-900 truncate">Shri. R. K. {sheet.studentName.split(' ').pop()}</span>
          </div>
          <div className="col-span-6 flex">
            <span className="text-zinc-500 font-bold uppercase text-[8.5px] w-32 shrink-0">Mother's Name:</span>
            <span className="font-bold text-zinc-900 truncate">Smt. Sunita {sheet.studentName.split(' ').pop()}</span>
          </div>
        </div>

        {/* Scholastic Areas Table */}
        <div className="space-y-1">
          <h4 className="text-[9px] font-semibold uppercase text-emerald-900 tracking-wider">
            PART 1: SCHOLASTIC AREAS
          </h4>
          <div className="rounded border border-zinc-200 overflow-hidden bg-white">
            <table className="w-full text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-emerald-800 border-none text-white text-[9.5px]">
                  <th className="font-bold px-3 py-2 text-left w-[24%]">SUBJECT NAME</th>
                  {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">TERM I (100)</th>}
                  {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">TERM II (100)</th>}
                  <th className="font-bold px-3 py-2 text-center w-[18%]">MAX MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[18%]">PASSING MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[18%]">OBTAINED MARKS</th>
                  <th className="font-bold px-3 py-2 text-center w-[22%]">GRADE</th>
                </tr>
              </thead>
              <tbody>
                {sheet.subjects.map((sub, sIdx) => (
                  <tr key={sIdx} className="border-b border-zinc-150 hover:bg-zinc-50/50">
                    <td className="px-3 py-2 text-left font-bold text-zinc-800 truncate">{sub.subjectName}</td>
                    {marksheetType === 'combined' && <td className="px-3 py-2 text-center font-mono text-zinc-600">{sub.midtermMarks}</td>}
                    {marksheetType === 'combined' && <td className="px-3 py-2 text-center font-mono text-zinc-600">{sub.finalMarks}</td>}
                    <td className="px-3 py-2 text-center font-bold font-mono text-zinc-700">{sub.maxMarks ?? 100}</td>
                    <td className="px-3 py-2 text-center font-medium font-mono text-zinc-600">{sub.passingMarks ?? 33}</td>
                    <td className="px-3 py-2 text-center font-black font-mono text-emerald-800">{sub.obtainedMarks ?? 0}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-black text-emerald-900 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded text-[10px]">
                        {getCBSEGrade(sub.percentage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CBSE PART 2 & 3: Co-Scholastic & Discipline */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-[9px] font-semibold uppercase text-emerald-900 tracking-wider">
              PART 2: CO-SCHOLASTIC AREAS (3-Point Scale A-C)
            </h4>
            <div className="rounded border border-zinc-200 overflow-hidden bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-emerald-900/10 text-emerald-900 text-[8.5px] border-b border-zinc-200">
                    <th className="font-bold px-3 py-1.5 text-left">ACTIVITY / DOMAIN</th>
                    <th className="font-bold px-3 py-1.5 text-center w-[60px]">GRADE</th>
                  </tr>
                </thead>
                <tbody>
                  {coScholastic.map((cs, cIdx) => (
                    <tr key={cIdx} className="border-b border-zinc-100 last:border-none">
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-700 text-[10px]">{cs.area}</td>
                      <td className="px-3 py-1.5 text-center font-black text-emerald-800 text-[10px]">{cs.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[9px] font-semibold uppercase text-emerald-900 tracking-wider">
              PART 3: DISCIPLINE (3-Point Scale A-C)
            </h4>
            <div className="rounded border border-zinc-200 overflow-hidden bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-emerald-900/10 text-emerald-900 text-[8.5px] border-b border-zinc-200">
                    <th className="font-bold px-3 py-1.5 text-left">DISCIPLINARY ASPECT</th>
                    <th className="font-bold px-3 py-1.5 text-center w-[60px]">GRADE</th>
                  </tr>
                </thead>
                <tbody>
                  {discipline.map((ds, dIdx) => (
                    <tr key={dIdx} className="border-b border-zinc-100 last:border-none">
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-700 text-[10px]">{ds.area}</td>
                      <td className="px-3 py-1.5 text-center font-black text-emerald-800 text-[10px]">{ds.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CBSE Grade Legend */}
        <div className="border border-zinc-200 bg-zinc-50 rounded p-2 text-[8px] text-center font-bold text-zinc-500">
          <span className="text-emerald-900 uppercase tracking-wider block mb-1">CBSE SCHOLASTIC GRADING SCALE</span>
          <div className="grid grid-cols-8 gap-0.5 mt-1 font-mono">
            <div>A1 (91-100)</div>
            <div>A2 (81-90)</div>
            <div>B1 (71-80)</div>
            <div>B2 (61-70)</div>
            <div>C1 (51-60)</div>
            <div>C2 (41-50)</div>
            <div>D (33-40)</div>
            <div className="text-red-650">E (Needs Improvement)</div>
          </div>
        </div>

      </div>

      {/* Indian Verdict & Bottom Signature segment */}
      <div className="space-y-4">
        
        {/* Class Teacher Verdict Box */}
        <div className="border-2 border-emerald-800 rounded-xl p-3 bg-emerald-50/20 text-xs">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-black text-emerald-900 text-[10px] uppercase tracking-wider">Promotion Status / Verdict:</span>
            <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
              {sheet.status === 'pass' ? 'PROMOTED TO NEXT HIGHER CLASS' : 'RETAINED IN CURRENT CLASS'}
            </span>
          </div>
          <p className="italic text-zinc-600 font-medium leading-relaxed">
            <strong>Class Teacher Remarks:</strong> "{sheet.remarks}"
          </p>
        </div>

        {/* Signature lines typical in Indian Schools */}
        <div className="flex justify-between items-end text-[10px] font-bold text-zinc-500 pt-3 border-t border-dashed border-zinc-200">
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-400 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Parent Signature</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-400 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Class Teacher</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-400 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase">Principal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
