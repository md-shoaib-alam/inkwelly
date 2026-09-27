import React from 'react';
import { MarksheetTemplateProps } from './types';
import { ClientDate } from './ClientDate';

export const ClassicAcademy: React.FC<MarksheetTemplateProps> = ({
  sheet,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName,
}) => {
  return (
    <div 
      className="relative bg-white text-zinc-900 px-9 py-10 border-[6px] border-[#1e3a8a] rounded overflow-hidden select-none flex flex-col justify-between shrink-0 text-left h-[1123px] w-[794px] box-border"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Gold Inner Inset Border */}
      <div className="absolute inset-2 border border-[#d4af37] pointer-events-none rounded z-10" />

      {/* Decorative Corner Accents */}
      <div className="absolute top-4 left-4 size-3.5 border-t-2 border-l-2 border-[#d4af37] z-20" />
      <div className="absolute top-4 right-4 size-3.5 border-t-2 border-r-2 border-[#d4af37] z-20" />
      <div className="absolute bottom-4 left-4 size-3.5 border-b-2 border-l-2 border-[#d4af37] z-20" />
      <div className="absolute bottom-4 right-4 size-3.5 border-b-2 border-r-2 border-[#d4af37] z-20" />


      {/* Core Document Flow */}
      <div className="space-y-5 z-10">
        
        {/* Crest & Logo Letterhead */}
        <div className="text-center pb-1">
          <div className="flex justify-center mb-2">
            <div className="size-12 bg-[#1e3a8a] border-2 border-[#d4af37] rounded-full flex items-center justify-center shadow-md relative">
              <span className="text-xl filter drop-shadow">🎓</span>
              <span className="absolute bottom-0.5 text-[6px] text-[#d4af37] font-bold">★</span>
            </div>
          </div>

          <h3 className="font-semibold text-xl text-[#1e3a8a] tracking-wider leading-none uppercase font-serif">
            {sheet.schoolName.toUpperCase()}
          </h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 font-sans">
            Official Academic Transcript & Statement of Outcomes
          </p>
          <div className="w-16 h-0.5 bg-[#d4af37] mx-auto mt-2" />
        </div>

        {/* Title Box */}
        <div className="text-center">
          <h4 className="inline-block text-[11px] font-semibold uppercase text-[#1e3a8a] tracking-widest border border-[#1e3a8a] border-x-[4px] py-1.5 px-6 rounded bg-blue-50/50 font-sans">
            {examName ? `${examName} Marksheet` : (marksheetType === 'midterm' ? 'Midterm Marksheet' : marksheetType === 'final' ? 'Final Marksheet' : 'Consolidated Report Card')}
          </h4>
        </div>

        {/* Student Info Block */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs border border-zinc-200 p-4 rounded bg-zinc-50/70 font-sans">
          <div className="flex gap-2">
            <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Student Name:</span>
            <span className="font-bold text-zinc-900 truncate">{sheet.studentName}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Roll Number:</span>
            <span className="font-bold text-zinc-900 font-mono">{sheet.rollNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Class & Section:</span>
            <span className="font-bold text-zinc-900 truncate">{classNameStr} - {classSection}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Academic Cycle:</span>
            <span className="font-bold text-zinc-900">{academicYear}</span>
          </div>
        </div>

        {/* Subject Table */}
        <div className="rounded border border-zinc-200 overflow-hidden shadow-sm bg-white font-sans">
          <table className="w-full text-xs border-collapse table-fixed">
            <thead>
              <tr className="bg-[#1e3a8a] border-none text-white text-[10px]">
                <th className={`font-bold px-3 py-2.5 text-left whitespace-normal ${marksheetType === 'combined' ? 'w-[22%]' : 'w-[22%]'}`}>Subject Name</th>
                {marksheetType === 'combined' && <th className="font-bold px-3 py-2.5 text-center w-[12%]">Midterm</th>}
                {marksheetType === 'combined' && <th className="font-bold px-3 py-2.5 text-center w-[12%]">Final</th>}
                <th className={`font-bold px-3 py-2.5 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[15%]'}`}>Max Marks</th>
                <th className={`font-bold px-3 py-2.5 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[15%]'}`}>Passing Marks</th>
                <th className={`font-bold px-3 py-2.5 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[16%]'}`}>Obtained Marks</th>
                <th className={`font-bold px-3 py-2.5 text-center ${marksheetType === 'combined' ? 'w-[10%]' : 'w-[16%]'}`}>Percentage</th>
                <th className={`font-bold px-3 py-2.5 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[16%]'}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sheet.subjects.map((sub, sIdx) => (
                <tr key={sIdx} className="border-b border-zinc-150 hover:bg-zinc-50/50">
                  <td className="px-3 py-2.5 text-left font-bold text-zinc-800 truncate">{sub.subjectName}</td>
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-600">{sub.midtermMarks}</td>}
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-600">{sub.finalMarks}</td>}
                  <td className="px-3 py-2.5 text-center font-bold font-mono text-zinc-700">{sub.maxMarks ?? 100}</td>
                  <td className="px-3 py-2.5 text-center font-medium font-mono text-zinc-600">{sub.passingMarks ?? 33}</td>
                  <td className="px-3 py-2.5 text-center font-black font-mono text-[#1e3a8a]">{sub.obtainedMarks ?? 0}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-blue-900 font-mono">{sub.percentage}%</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      sub.status === 'pass' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : sub.status === 'fail'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-7 gap-1 border border-zinc-200 bg-zinc-50/70 rounded p-1.5 text-[8px] text-center font-bold text-zinc-500 font-sans">
          <div className="border-r border-zinc-200"><span className="text-[#1e3a8a] font-extrabold">A+</span> (90%+)</div>
          <div className="border-r border-zinc-200"><span className="text-[#1e3a8a] font-extrabold">A</span> (80-89%)</div>
          <div className="border-r border-zinc-200"><span className="text-[#1e3a8a] font-extrabold">B</span> (70-79%)</div>
          <div className="border-r border-zinc-200"><span className="text-[#1e3a8a] font-extrabold">C</span> (60-69%)</div>
          <div className="border-r border-zinc-200"><span className="text-[#1e3a8a] font-extrabold">D</span> (50-59%)</div>
          <div className="border-r border-zinc-200"><span className="text-[#1e3a8a] font-extrabold">E</span> (40-49%)</div>
          <div><span className="text-red-600 font-extrabold">F</span> (&lt;40%)</div>
        </div>

        {/* Remarks & Statistics */}
        <div className="grid grid-cols-12 gap-5 font-sans">
          <div className="col-span-7 border border-zinc-200 border-l-[4px] border-l-[#d4af37] rounded p-4 bg-zinc-50/40 text-xs">
            <h5 className="font-semibold text-[9px] uppercase tracking-wider text-[#1e3a8a] mb-1.5">Evaluation & Principal Remarks</h5>
            <p className="italic text-zinc-600 font-medium leading-relaxed">
              "{sheet.remarks}" The student has demonstrated {sheet.status === 'pass' ? 'satisfactory academic standards.' : 'need for core learning reinforcements.'}
            </p>
          </div>
          
          <div className="col-span-5 bg-white border border-zinc-200 rounded p-2.5">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-dashed border-zinc-200">
                  <td className="py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Aggregate</td>
                  <td className="py-2 text-right font-bold text-zinc-900 font-mono">{sheet.totalObtainedMarks} / {sheet.totalMaxMarks}</td>
                </tr>
                <tr className="border-b border-dashed border-zinc-200">
                  <td className="py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Percentage</td>
                  <td className="py-2 text-right font-black text-[#1e3a8a] font-mono">{sheet.overallPercentage}%</td>
                </tr>
                <tr className="border-b border-dashed border-zinc-200">
                  <td className="py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Letter Grade</td>
                  <td className={`py-2 text-right text-base font-black ${
                    sheet.status === 'pass' ? 'text-emerald-600' : 'text-red-600'
                  }`}>{sheet.grade}</td>
                </tr>
                <tr>
                  <td className="py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Standing</td>
                  <td className="py-2 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-wide ${
                      sheet.status === 'pass' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : sheet.status === 'fail'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {sheet.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Signature Area */}
      <div className="flex justify-between items-end text-[9.5px] font-semibold text-zinc-400 border-t border-dashed border-zinc-200 pt-4 mt-2 font-sans z-10">
        <div>Date of Issue: <ClientDate /></div>
        <div className="flex gap-10">
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-300 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold text-zinc-500">Class Teacher</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-zinc-300 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold text-zinc-500">Principal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
