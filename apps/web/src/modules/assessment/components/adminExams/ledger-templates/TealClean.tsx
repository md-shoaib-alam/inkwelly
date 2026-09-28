import React from 'react';
import { LedgerTemplateProps } from './types';

export const TealClean: React.FC<LedgerTemplateProps> = ({ data }) => {
  return (
    <div 
      className="p-[6mm] bg-white text-zinc-800 font-sans print:p-0 min-h-screen"
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
            background-color: #ffffff;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        `}
      </style>

      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-700 p-4 rounded-xl text-white text-center mb-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 size-32 bg-white/5 rounded-full -mr-8 -mt-8"></div>
        <div className="absolute bottom-0 left-0 size-24 bg-white/5 rounded-full -ml-8 -mb-8"></div>
        
        <h1 className="font-semibold text-xl tracking-wider uppercase leading-none">
          {data.schoolName}
        </h1>
        <h2 className="text-[10px] font-medium text-teal-100 uppercase tracking-widest mt-1.5 leading-none">
          {data.ledgerTitle}
        </h2>
        <div className="flex justify-center gap-10 mt-3 text-[9.5px] font-semibold text-teal-50">
          <div>CLASS: <span className="text-white border-b border-teal-400 pb-0.5">{data.className} - {data.classSection}</span></div>
          <div>CYCLE: <span className="text-white border-b border-teal-400 pb-0.5">{data.academicYear}</span></div>
          <div>DATE: <span className="text-white border-b border-teal-400 pb-0.5" suppressHydrationWarning>{new Date().toLocaleDateString()}</span></div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex justify-between items-center bg-teal-50/50 border border-teal-100 rounded-lg p-2 mb-4 text-[9px] text-teal-800 font-semibold shadow-inner">
        <div>TOTAL ENROLLED: <span className="text-teal-900 font-bold">{data.totalStudents}</span></div>
        <div>PROMOTED: <span className="text-teal-700 font-bold">{data.passCount}</span></div>
        <div>RETAINED: <span className="text-red-650 font-bold">{data.failCount}</span></div>
        {data.pendingCount > 0 && <div>PENDING: <span className="text-amber-600 font-bold">{data.pendingCount}</span></div>}
        <div>PASS RATE: <span className="text-teal-950 font-bold">{data.totalStudents > 0 ? ((data.passCount / data.totalStudents) * 100).toFixed(1) + '%' : '0%'}</span></div>
        <div>CLASS AVERAGE: <span className="text-teal-950 font-bold">{data.classAverage}</span></div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-zinc-200 text-[9.5px]">
        <thead>
          <tr className="bg-teal-900 text-white font-semibold border-b border-teal-950">
            <th className="border border-zinc-200 p-1.5 text-center w-[40px]">S.No</th>
            <th className="border border-zinc-200 p-1.5 text-center w-[60px]">Roll No</th>
            <th className="border border-zinc-200 p-1.5 text-left">Student Candidate</th>
            {data.subjectsList.map(sub => (
              <th key={sub} className="border border-zinc-200 p-1.5 text-center font-medium">
                {sub} <br />
                <span className="text-[7.5px] text-teal-200/90 font-normal">({data.subjectMaxMarks[sub] || 100})</span>
              </th>
            ))}
            <th className="border border-zinc-200 p-1.5 text-center w-[70px] bg-teal-800 text-white">Total</th>
            <th className="border border-zinc-200 p-1.5 text-center w-[80px] bg-teal-800 text-white">Percentage</th>
            <th className="border border-zinc-200 p-1.5 text-center w-[50px]">Grade</th>
            <th className="border border-zinc-200 p-1.5 text-center w-[75px]">Result</th>
          </tr>
        </thead>
        <tbody>
          {data.studentsTabulation.map((student, idx) => (
            <tr 
              key={student.rollNumber} 
              className={`hover:bg-teal-50/20 border-b border-zinc-100 ${
                idx % 2 === 1 ? 'bg-teal-50/10' : ''
              }`}
            >
              <td className="border border-zinc-200 p-1 text-center font-bold text-teal-800">{idx + 1}</td>
              <td className="border border-zinc-200 p-1 text-center font-mono text-zinc-600">{student.rollNumber}</td>
              <td className="border border-zinc-200 p-1 text-left font-semibold text-zinc-800">{student.name}</td>
              {data.subjectsList.map(sub => {
                const marks = student.subjectMarks[sub];
                if (!marks) return <td key={sub} className="border border-zinc-200 p-1 text-center text-zinc-400 font-normal">-</td>;
                if (marks.status === 'pending') {
                  return (
                    <td key={sub} className="border border-zinc-200 p-1 text-center text-amber-500 italic text-[9px] font-medium">
                      PENDING
                    </td>
                  );
                }
                if (marks.status === 'absent') {
                  return (
                    <td key={sub} className="border border-zinc-200 p-1 text-center text-red-500 italic font-bold">
                      ABSENT
                    </td>
                  );
                }
                const isFailed = marks.status === 'fail';
                return (
                  <td key={sub} className={`border border-zinc-200 p-1 text-center ${isFailed ? 'text-red-500 font-semibold bg-red-50/10' : 'text-zinc-700'}`}>
                    {marks.marksObtained}/{marks.totalMarks}
                  </td>
                );
              })}
              <td className="border border-zinc-200 p-1 text-center font-semibold bg-teal-50/25 text-teal-900">{student.totalObtained}/{student.totalMax}</td>
              <td className="border border-zinc-200 p-1 text-center font-semibold bg-teal-50/25 text-teal-900">{student.percentage}</td>
              <td className={`border border-zinc-200 p-1 text-center font-bold ${
                student.grade === 'A+' || student.grade === 'A' ? 'text-teal-650' : student.grade === 'F' ? 'text-red-500' : 'text-zinc-750'
              }`}>
                {student.grade}
              </td>
              <td className="border border-zinc-200 p-1 text-center">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                  student.status === 'PASS' 
                    ? 'text-teal-800 bg-teal-100/50' 
                    : student.status === 'FAIL'
                      ? 'text-red-800 bg-red-100/50'
                      : 'text-amber-800 bg-amber-100/50'
                }`}>
                  {student.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature blocks */}
      <div className="flex justify-between mt-12 px-8 text-[9px] font-semibold text-zinc-500">
        <div className="flex flex-col items-center">
          <div className="w-[120px] border-b border-zinc-200 mb-1"></div>
          <span>CLASS ADVISOR</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[120px] border-b border-zinc-200 mb-1"></div>
          <span>CONTROLLER OF EXAMS</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[120px] border-b border-zinc-200 mb-1"></div>
          <span>PRINCIPAL</span>
        </div>
      </div>
    </div>
  );
};
