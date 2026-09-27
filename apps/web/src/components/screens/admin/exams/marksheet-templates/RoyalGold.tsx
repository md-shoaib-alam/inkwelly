import React from 'react';
import { MarksheetTemplateProps } from './types';
import { ClientDate } from './ClientDate';

export const RoyalGold: React.FC<MarksheetTemplateProps> = ({
  sheet,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName,
}) => {
  return (
    <div 
      className="relative bg-[#faf7f0] text-zinc-800 p-10 rounded overflow-hidden select-none flex flex-col justify-between shrink-0 text-left h-[1123px] w-[794px] box-border border-8 border-double border-[#b38f36]"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Decorative Ornate Corners */}
      <div className="absolute top-2 left-2 size-8 border-t-2 border-l-2 border-[#b38f36] z-20 pointer-events-none" />
      <div className="absolute top-2 right-2 size-8 border-t-2 border-r-2 border-[#b38f36] z-20 pointer-events-none" />
      <div className="absolute bottom-2 left-2 size-8 border-b-2 border-l-2 border-[#b38f36] z-20 pointer-events-none" />
      <div className="absolute bottom-2 right-2 size-8 border-b-2 border-r-2 border-[#b38f36] z-20 pointer-events-none" />

      {/* Core Document Flow */}
      <div className="space-y-5 z-10">
        
        {/* Royal Crest */}
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <div className="size-14 bg-gradient-to-br from-[#d4af37] to-[#b38f36] border-2 border-white rounded-full flex items-center justify-center shadow-lg relative">
              <span className="text-2xl filter drop-shadow">🏛️</span>
            </div>
          </div>

          <h3 className="font-semibold text-2xl text-[#8c6b23] tracking-widest leading-none font-serif uppercase">
            {sheet.schoolName.toUpperCase()}
          </h3>
          <p className="text-[8.5px] text-amber-800 font-bold uppercase tracking-[3px] mt-1.5 font-serif">
            ESTABLISHED ACADEMIC FELLOWSHIP
          </p>
          <div className="w-24 h-0.5 bg-[#b38f36] mx-auto mt-2" />
        </div>

        {/* Title Box */}
        <div className="text-center mt-2">
          <h4 className="inline-block text-[11px] font-semibold uppercase text-[#8c6b23] tracking-[3px] border-b border-t border-[#b38f36] py-1 px-8 font-serif">
            {examName ? `${examName} Convocation` : (marksheetType === 'midterm' ? 'Midterm Convocation' : marksheetType === 'final' ? 'Final Convocation' : 'Consolidated Statement of Honors')}
          </h4>
        </div>

        {/* Student Info Block */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs border border-[#e3d7b8] p-4 rounded bg-[#f2ecdb]/50 font-serif">
          <div className="flex gap-2">
            <span className="text-amber-900/60 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Scholastic Name:</span>
            <span className="font-bold text-zinc-800 truncate">{sheet.studentName}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-900/60 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Roll Number:</span>
            <span className="font-bold text-zinc-800 font-mono">{sheet.rollNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-900/60 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Class & Form:</span>
            <span className="font-bold text-zinc-800 truncate">{classNameStr} - {classSection}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-900/60 font-bold uppercase text-[9px] tracking-wider w-24 flex items-center shrink-0">Academic Year:</span>
            <span className="font-bold text-zinc-800">{academicYear}</span>
          </div>
        </div>

        {/* Subject Table */}
        <div className="rounded overflow-hidden border border-[#e3d7b8] bg-[#fbfaf7] font-serif shadow-sm">
          <table className="w-full text-xs border-collapse table-fixed">
            <thead>
              <tr className="bg-[#8c6b23] text-white text-[10px]">
                <th className={`font-bold px-3 py-2 text-left whitespace-normal ${marksheetType === 'combined' ? 'w-[22%]' : 'w-[22%]'}`}>Scholastic Disciplines</th>
                {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">Midterm</th>}
                {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">Final</th>}
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[15%]'}`}>Max Marks</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[15%]'}`}>Passing Marks</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[16%]'}`}>Obtained Marks</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[10%]' : 'w-[16%]'}`}>Percentage</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[16%]'}`}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {sheet.subjects.map((sub, sIdx) => (
                <tr key={sIdx} className="border-b border-[#ebdcb3] hover:bg-[#f6ecd3]/30">
                  <td className="px-3 py-2.5 text-left font-bold text-zinc-700 truncate">{sub.subjectName}</td>
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.midtermMarks}</td>}
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.finalMarks}</td>}
                  <td className="px-3 py-2.5 text-center font-bold font-mono text-zinc-700">{sub.maxMarks ?? 100}</td>
                  <td className="px-3 py-2.5 text-center font-medium font-mono text-zinc-600">{sub.passingMarks ?? 33}</td>
                  <td className="px-3 py-2.5 text-center font-black font-mono text-amber-900">{sub.obtainedMarks ?? 0}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-zinc-800 font-mono">{sub.percentage}%</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      sub.status === 'pass' 
                        ? 'bg-[#f4ebd0] text-[#8c6b23]' 
                        : sub.status === 'fail'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {sub.status === 'pass' ? 'HONORS' : sub.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-7 gap-1 border border-[#e3d7b8] bg-[#f2ecdb]/30 rounded p-1.5 text-[8px] text-center font-bold text-amber-900 font-serif">
          <div className="border-r border-[#ebdcb3]"><span className="text-[#8c6b23] font-black">A+</span> (90%+)</div>
          <div className="border-r border-[#ebdcb3]"><span className="text-[#8c6b23] font-black">A</span> (80-89%)</div>
          <div className="border-r border-[#ebdcb3]"><span className="text-[#8c6b23] font-black">B</span> (70-79%)</div>
          <div className="border-r border-[#ebdcb3]"><span className="text-[#8c6b23] font-black">C</span> (60-69%)</div>
          <div className="border-r border-[#ebdcb3]"><span className="text-[#8c6b23] font-black">D</span> (50-59%)</div>
          <div className="border-r border-[#ebdcb3]"><span className="text-[#8c6b23] font-black">E</span> (40-49%)</div>
          <div><span className="text-red-700 font-black">F</span> (&lt;40%)</div>
        </div>

        {/* Remarks & Statistics */}
        <div className="grid grid-cols-12 gap-5 font-serif">
          <div className="col-span-7 border border-[#e3d7b8] border-l-[4px] border-l-[#b38f36] rounded p-4 bg-[#f2ecdb]/20 text-xs">
            <h5 className="font-semibold text-[9.5px] uppercase tracking-wider text-amber-900 mb-1.5">Academic Assessor Summary</h5>
            <p className="italic text-zinc-700 leading-relaxed font-medium">
              "{sheet.remarks}" The candidate stands in {sheet.status === 'pass' ? 'excellent scholastic repute.' : 'need of supportive educational coaching.'}
            </p>
          </div>
          
          <div className="col-span-5 bg-white border border-[#e3d7b8] rounded p-2.5">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-dashed border-[#e3d7b8]">
                  <td className="py-2 text-[9px] font-bold text-amber-800 uppercase tracking-wider">Scholastic Marks</td>
                  <td className="py-2 text-right font-bold text-zinc-800 font-mono">{sheet.totalObtainedMarks} / {sheet.totalMaxMarks}</td>
                </tr>
                <tr className="border-b border-dashed border-[#e3d7b8]">
                  <td className="py-2 text-[9px] font-bold text-amber-800 uppercase tracking-wider">Honor Score</td>
                  <td className="py-2 text-right font-black text-amber-900 font-mono">{sheet.overallPercentage}%</td>
                </tr>
                <tr className="border-b border-dashed border-[#e3d7b8]">
                  <td className="py-2 text-[9px] font-bold text-amber-800 uppercase tracking-wider">Form Grade</td>
                  <td className="py-2 text-right text-base font-black text-[#8c6b23]">{sheet.grade}</td>
                </tr>
                <tr>
                  <td className="py-2 text-[9px] font-bold text-amber-800 uppercase tracking-wider">Standing</td>
                  <td className="py-2 text-right font-black text-[#8c6b23] text-[9.5px] tracking-wider">
                    {sheet.status === 'pass' ? 'SUMMA CUM LAUDE' : sheet.status.toUpperCase()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Signature Area */}
      <div className="flex justify-between items-end text-[9.5px] font-bold text-amber-900/60 border-t border-dashed border-[#ebdcb3] pt-4 mt-2 font-serif z-10">
        <div>Registry Convocation Record: <ClientDate /></div>
        <div className="flex gap-10">
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-[#b38f36] mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold">Assessor</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[100px] border-b border-[#b38f36] mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold">Registrar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
