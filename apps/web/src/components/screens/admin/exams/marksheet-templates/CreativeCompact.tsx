import React from 'react';
import { MarksheetTemplateProps } from './types';
import { ClientDate } from './ClientDate';

export const CreativeCompact: React.FC<MarksheetTemplateProps> = ({
  sheet,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName,
}) => {
  return (
    <div 
      className="relative bg-white text-zinc-800 p-10 rounded overflow-hidden select-none flex flex-col justify-between shrink-0 text-left h-[1123px] w-[794px] box-border border-4 border-dashed border-violet-200"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Dynamic Colorful Accent Elements */}
      <div className="absolute -top-12 -right-12 size-24 bg-gradient-to-br from-violet-400 to-purple-400 rounded-full blur-xl opacity-20 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 size-32 bg-gradient-to-tr from-emerald-300 to-cyan-300 rounded-full blur-xl opacity-20 pointer-events-none" />

      {/* Core Document Flow */}
      <div className="space-y-6 z-10">
        
        {/* Creative Header */}
        <div className="flex justify-between items-center bg-gradient-to-r from-violet-50 via-purple-50/30 to-white border border-violet-100 rounded-2xl p-4 font-sans">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-violet-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-violet-200">
              🚀
            </div>
            <div>
              <h3 className="font-semibold text-lg text-violet-955 tracking-tight leading-none uppercase">
                {sheet.schoolName}
              </h3>
              <p className="text-[9px] text-purple-600 font-bold uppercase tracking-wider mt-1">
                Student Performance & Achievement Report
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-[8px] bg-violet-600 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
              {examName ? examName : (marksheetType === 'combined' ? 'Combined Term' : marksheetType.toUpperCase() + ' TERM')}
            </span>
            <p className="text-[9px] text-zinc-400 font-black mt-1">{academicYear}</p>
          </div>
        </div>

        {/* Student Info Block */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans">
          <div className="flex items-center gap-3 bg-zinc-50/70 border border-zinc-100 p-3 rounded-xl">
            <div className="size-8 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">👤</div>
            <div className="min-w-0">
              <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Student</span>
              <span className="font-extrabold text-zinc-800 truncate block">{sheet.studentName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-50/70 border border-zinc-100 p-3 rounded-xl">
            <div className="size-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">🔢</div>
            <div className="min-w-0">
              <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Roll Number</span>
              <span className="font-extrabold text-zinc-800 font-mono block">{sheet.rollNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-50/70 border border-zinc-100 p-3 rounded-xl">
            <div className="size-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">🏫</div>
            <div className="min-w-0">
              <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Grade Form</span>
              <span className="font-extrabold text-zinc-800 truncate block">{classNameStr} - {classSection}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-50/70 border border-zinc-100 p-3 rounded-xl">
            <div className="size-8 bg-cyan-100 text-cyan-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">📅</div>
            <div className="min-w-0">
              <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Issue Date</span>
              <span className="font-extrabold text-zinc-800 block"><ClientDate /></span>
            </div>
          </div>
        </div>

        {/* Subject Table */}
        <div className="overflow-hidden border border-zinc-150 rounded-xl bg-white font-sans shadow-sm">
          <table className="w-full text-xs border-collapse table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-violet-950 to-violet-900 text-white text-[9.5px]">
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
                <tr key={sIdx} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                  <td className="px-3 py-2.5 text-left font-black text-violet-950 truncate">{sub.subjectName}</td>
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.midtermMarks}</td>}
                  {marksheetType === 'combined' && <td className="px-3 py-2.5 text-center font-mono text-zinc-500">{sub.finalMarks}</td>}
                  <td className="px-3 py-2.5 text-center font-bold font-mono text-zinc-700">{sub.maxMarks ?? 100}</td>
                  <td className="px-3 py-2.5 text-center font-medium font-mono text-zinc-600">{sub.passingMarks ?? 33}</td>
                  <td className="px-3 py-2.5 text-center font-black font-mono text-violet-600">{sub.obtainedMarks ?? 0}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-black text-violet-950 font-mono block mb-0.5">{sub.percentage}%</span>
                    <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden mx-auto">
                      <div 
                        className={`h-full rounded-full ${sub.status === 'pass' ? 'bg-violet-500' : 'bg-rose-500'}`} 
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }} 
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                      sub.status === 'pass' 
                        ? 'bg-emerald-55/10 text-emerald-700' 
                        : sub.status === 'fail'
                          ? 'bg-rose-55/10 text-rose-700'
                          : 'bg-amber-55/10 text-amber-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Creative Circular Summary Scorecard */}
        <div className="grid grid-cols-12 gap-4 font-sans">
          
          <div className="col-span-5 bg-gradient-to-br from-violet-900 to-violet-950 text-white p-4 rounded-2xl flex flex-col justify-between shadow-md shadow-violet-100">
            <div>
              <span className="text-violet-200 font-bold uppercase text-[7.5px] tracking-wider block">Aggregate Marks</span>
              <span className="font-black text-2xl font-mono block mt-1">{sheet.totalObtainedMarks} <span className="text-violet-300 text-xs">/ {sheet.totalMaxMarks}</span></span>
            </div>
            <div className="border-t border-violet-850 pt-2 mt-4 flex justify-between items-center text-[9px] font-bold text-violet-200 uppercase tracking-wider">
              <span>Overall Standing</span>
              <span className={`px-2 py-0.5 rounded text-white ${
                sheet.status === 'pass' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}>{sheet.status}</span>
            </div>
          </div>

          <div className="col-span-3 bg-zinc-50/70 border border-zinc-100 p-4 rounded-2xl flex flex-col items-center justify-between text-center">
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Final Grade</span>
            <div className="size-14 bg-violet-50 border-4 border-violet-500 rounded-full flex items-center justify-center font-black text-violet-700 text-xl shadow-inner my-2">
              {sheet.grade}
            </div>
            <span className="text-[8px] text-violet-500 font-bold uppercase tracking-wider">Scholastic Standing</span>
          </div>

          <div className="col-span-4 bg-zinc-50/70 border border-zinc-100 p-4 rounded-2xl flex flex-col items-center justify-between text-center">
            <span className="text-zinc-400 font-bold uppercase text-[7.5px] tracking-wider block">Total Percentage</span>
            <div className="size-14 bg-purple-50 border-4 border-purple-500 rounded-full flex items-center justify-center font-black text-purple-700 text-md font-mono shadow-inner my-2">
              {sheet.overallPercentage}%
            </div>
            <span className="text-[8px] text-purple-500 font-bold uppercase tracking-wider">Success Rate</span>
          </div>

        </div>

        {/* Remarks Section */}
        <div className="border border-violet-100 rounded-xl p-4 bg-gradient-to-r from-violet-50/30 to-purple-50/10 font-sans text-xs">
          <h5 className="font-semibold text-[9px] uppercase tracking-wider text-violet-950 mb-1">Assessor Feedback Summary</h5>
          <p className="italic text-zinc-600 font-medium leading-relaxed">
            "{sheet.remarks}" {sheet.status === 'pass' ? 'The student has displayed amazing academic growth and solid dedication.' : 'Extra tutorial assistance and concept strengthening are advised.'}
          </p>
        </div>

      </div>

      {/* Signature Area */}
      <div className="flex justify-between items-end text-[9px] font-semibold text-zinc-400 border-t border-zinc-150 pt-4 mt-2 font-sans z-10">
        <div>Registry Convocation Record: <ClientDate /></div>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <div className="w-[90px] border-b border-zinc-200 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold text-zinc-400">Class Advisor</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-[90px] border-b border-zinc-200 mb-1" />
            <span className="text-[7.5px] tracking-wider uppercase font-bold text-zinc-400">Dean of Students</span>
          </div>
        </div>
      </div>
    </div>
  );
};
