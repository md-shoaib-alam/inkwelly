import React from 'react';
import { MarksheetTemplateProps } from './types';
import { ClientDate } from './ClientDate';

export const ModernMinimalist: React.FC<MarksheetTemplateProps> = ({
  sheet,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName,
}) => {
  return (
    <div 
      className="relative bg-white text-zinc-900 p-10 rounded overflow-hidden select-none flex flex-col justify-between shrink-0 text-left h-[1123px] w-[794px] box-border border border-zinc-200"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Sleek Asymmetric Side Bar Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-blue-600 via-violet-600 to-emerald-500 z-10" />

      {/* Core Document Flow */}
      <div className="space-y-6 z-10 ml-2">
        
        {/* Modern Header */}
        <div className="flex justify-between items-start border-b border-zinc-150 pb-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-2xl text-zinc-900 tracking-tight leading-none font-sans">
              {sheet.schoolName.toUpperCase()}
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-sans">
              Official Statement of Academic Achievements
            </p>
          </div>
          <div className="text-right space-y-1 font-sans">
            <span className="text-[10px] bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              {marksheetType === 'combined' ? 'Combined Cycle' : marksheetType.toUpperCase() + ' CYCLE'}
            </span>
            <p className="text-[9px] text-zinc-400 font-semibold">{academicYear}</p>
          </div>
        </div>

        {/* Title Box */}
        <div className="flex justify-between items-center bg-zinc-50/50 border border-zinc-100 rounded-lg p-3 font-sans">
          <div>
            <h4 className="text-xs font-semibold uppercase text-zinc-700 tracking-wider">
              {examName ? `${examName} Marksheet` : (marksheetType === 'midterm' ? 'Midterm Marksheet' : marksheetType === 'final' ? 'Final Marksheet' : 'Consolidated Report Card')}
            </h4>
            <p className="text-[9px] text-zinc-400 font-medium">Class Performance Summary</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
            <span>Result:</span>
            <span>{sheet.status}</span>
          </div>
        </div>

        {/* Student Info Block */}
        <div className="grid grid-cols-4 gap-4 text-xs font-sans">
          <div className="bg-zinc-50/50 border border-zinc-100 p-2.5 rounded-lg">
            <span className="text-zinc-400 font-bold uppercase text-[8px] tracking-wider block mb-1">Student Name</span>
            <span className="font-bold text-zinc-900 truncate block">{sheet.studentName}</span>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 p-2.5 rounded-lg">
            <span className="text-zinc-400 font-bold uppercase text-[8px] tracking-wider block mb-1">Roll Number</span>
            <span className="font-bold text-zinc-900 font-mono block">{sheet.rollNumber}</span>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 p-2.5 rounded-lg">
            <span className="text-zinc-400 font-bold uppercase text-[8px] tracking-wider block mb-1">Class & Section</span>
            <span className="font-bold text-zinc-900 truncate block">{classNameStr} - {classSection}</span>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 p-2.5 rounded-lg">
            <span className="text-zinc-400 font-bold uppercase text-[8px] tracking-wider block mb-1">Generated On</span>
            <span className="font-bold text-zinc-900 block"><ClientDate /></span>
          </div>
        </div>

        {/* Subject Table */}
        <div className="overflow-hidden border border-zinc-150 rounded-lg bg-white font-sans">
          <table className="w-full text-xs border-collapse table-fixed">
            <thead>
              <tr className="bg-zinc-900 text-white text-[9.5px]">
                <th className={`font-bold px-3 py-2 text-left whitespace-normal ${marksheetType === 'combined' ? 'w-[22%]' : 'w-[22%]'}`}>Subject Name</th>
                {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">Midterm</th>}
                {marksheetType === 'combined' && <th className="font-bold px-3 py-2 text-center w-[12%]">Final</th>}
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[15%]'}`}>Max Marks</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[15%]'}`}>Passing Marks</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[16%]'}`}>Obtained Marks</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[10%]' : 'w-[16%]'}`}>Percentage</th>
                <th className={`font-bold px-3 py-2 text-center ${marksheetType === 'combined' ? 'w-[11%]' : 'w-[16%]'}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sheet.subjects.map((sub, sIdx) => (
                <tr key={sIdx} className="border-b border-zinc-100 hover:bg-zinc-50/40">
                  <td className="px-3 py-2.5 text-left font-bold text-zinc-800 truncate">{sub.subjectName}</td>
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.midtermMarks}</td>}
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.finalMarks}</td>}
                  <td className="px-3 py-2.5 text-center font-bold font-mono text-zinc-700">{sub.maxMarks ?? 100}</td>
                  <td className="px-3 py-2.5 text-center font-medium font-mono text-zinc-600">{sub.passingMarks ?? 33}</td>
                  <td className="px-3 py-2.5 text-center font-black font-mono text-blue-900">{sub.obtainedMarks ?? 0}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="font-black text-zinc-900 font-mono">{sub.percentage}%</span>
                      <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${sub.status === 'pass' ? 'bg-emerald-500' : 'bg-red-500'}`} 
                          style={{ width: `${Math.min(sub.percentage, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                      sub.status === 'pass' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : sub.status === 'fail'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modern Statistics Cards Grid */}
        <div className="grid grid-cols-4 gap-4 font-sans">
          <div className="bg-zinc-50/50 border border-zinc-100 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Aggregate Marks</span>
            <span className="font-black text-zinc-900 font-mono text-base mt-2">{sheet.totalObtainedMarks} <span className="text-zinc-400 text-xs">/ {sheet.totalMaxMarks}</span></span>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Percentage Rate</span>
            <span className="font-black text-blue-600 font-mono text-base mt-2">{sheet.overallPercentage}%</span>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Letter Grade</span>
            <span className={`font-black text-lg mt-2 ${
              sheet.status === 'pass' ? 'text-emerald-600' : 'text-red-600'
            }`}>{sheet.grade}</span>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Standing</span>
            <span className={`inline-block text-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider mt-2 ${
              sheet.status === 'pass' 
                ? 'bg-emerald-500 text-white' 
                : sheet.status === 'fail'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-500 text-white'
            }`}>
              {sheet.status}
            </span>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="border border-zinc-150 rounded-lg p-4 bg-zinc-50/20 font-sans text-xs">
          <h5 className="font-semibold text-[9px] uppercase tracking-wider text-zinc-800 mb-1">Academic Assessment & Evaluation Remarks</h5>
          <p className="italic text-zinc-600 font-medium leading-relaxed">
            "{sheet.remarks}" {sheet.status === 'pass' ? 'The student continues to demonstrate high diligence and rigorous understanding.' : 'Targeted learning pathways and core feedback support are recommended.'}
          </p>
        </div>

      </div>

      {/* Signature Area */}
      <div className="flex justify-between items-end text-[9px] font-semibold text-zinc-400 border-t border-zinc-150 pt-4 mt-2 font-sans z-10 ml-2">
        <div>Official Record: Academic Transcript</div>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <div className="w-[90px] border-b border-zinc-200 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold text-zinc-400">Instructor</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[90px] border-b border-zinc-200 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold text-zinc-400">Headmaster</span>
          </div>
        </div>
      </div>
    </div>
  );
};
