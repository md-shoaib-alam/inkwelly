import React from 'react';
import { LedgerTemplateProps } from './types';

export const RoyalExecutive: React.FC<LedgerTemplateProps> = ({ data }) => {
  return (
    <div 
      className="p-[6mm] bg-[#fefcf8] text-stone-800 font-serif print:p-0 min-h-screen"
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

      {/* Ornate Double Border Box for School Branding */}
      <div className="border-4 border-double border-amber-600 p-3 text-center mb-4 bg-stone-50/50">
        <h1 className="font-semibold text-2xl tracking-widest text-amber-900 uppercase font-serif">
          {data.schoolName}
        </h1>
        <div className="w-[120px] h-[1px] bg-amber-600 mx-auto my-1.5" />
        <h2 className="text-[11px] font-semibold text-stone-600 uppercase tracking-widest leading-none">
          {data.ledgerTitle}
        </h2>
        <div className="flex justify-center gap-12 mt-2.5 text-[10px] font-bold text-stone-600 tracking-wide font-sans">
          <div>CLASS & SECTION: <span className="text-amber-800 font-bold border-b border-stone-200 pb-0.5">{data.className} - {data.classSection}</span></div>
          <div>ACADEMIC CYCLE: <span className="text-amber-800 font-bold border-b border-stone-200 pb-0.5">{data.academicYear}</span></div>
          <div>GEN DATE: <span className="text-amber-800 font-bold border-b border-stone-200 pb-0.5" suppressHydrationWarning>{new Date().toLocaleDateString()}</span></div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="flex justify-around items-center bg-stone-100/80 border-y-2 border-stone-300 py-1.5 mb-4 text-[9.5px] text-stone-700 font-semibold tracking-wide font-sans">
        <div>TOTAL ENROLLMENT: <span className="text-amber-900 font-bold">{data.totalStudents}</span></div>
        <div className="size-1.5 rounded-full bg-amber-600"></div>
        <div>PASSED: <span className="text-green-700 font-bold">{data.passCount}</span></div>
        <div className="size-1.5 rounded-full bg-amber-600"></div>
        <div>FAILED: <span className="text-red-700 font-bold">{data.failCount}</span></div>
        {data.pendingCount > 0 && (
          <>
            <div className="size-1.5 rounded-full bg-amber-600"></div>
            <div>INCOMPLETE: <span className="text-amber-700 font-bold">{data.pendingCount}</span></div>
          </>
        )}
        <div className="size-1.5 rounded-full bg-amber-600"></div>
        <div>PASS RATE: <span className="text-amber-900 font-bold">{data.totalStudents > 0 ? ((data.passCount / data.totalStudents) * 100).toFixed(1) + '%' : '0%'}</span></div>
        <div className="size-1.5 rounded-full bg-amber-600"></div>
        <div>CLASS MEAN AVG: <span className="text-amber-900 font-bold">{data.classAverage}</span></div>
      </div>

      {/* Table with Classic Executive Theme */}
      <table className="w-full border-collapse border-2 border-stone-800 text-[9.5px] font-sans">
        <thead>
          <tr className="bg-amber-950 text-amber-100 font-bold border-b-2 border-stone-800">
            <th className="border border-stone-400 p-1.5 text-center w-[40px] font-serif uppercase tracking-wider">S.No</th>
            <th className="border border-stone-400 p-1.5 text-center w-[60px] font-serif uppercase tracking-wider">Roll</th>
            <th className="border border-stone-400 p-1.5 text-left font-serif uppercase tracking-wider">Student Name</th>
            {data.subjectsList.map(sub => (
              <th key={sub} className="border border-stone-400 p-1.5 text-center font-serif tracking-tight">
                {sub.toUpperCase()} <br />
                <span className="text-[7.5px] text-amber-200/80 font-normal">({data.subjectMaxMarks[sub] || 100})</span>
              </th>
            ))}
            <th className="border border-stone-400 p-1.5 text-center w-[70px] font-serif uppercase tracking-wider bg-amber-900 text-white">Total</th>
            <th className="border border-stone-400 p-1.5 text-center w-[80px] font-serif uppercase tracking-wider bg-amber-900 text-white">Agg %</th>
            <th className="border border-stone-400 p-1.5 text-center w-[50px] font-serif uppercase tracking-wider">Grade</th>
            <th className="border border-stone-400 p-1.5 text-center w-[75px] font-serif uppercase tracking-wider">Result</th>
          </tr>
        </thead>
        <tbody>
          {data.studentsTabulation.map((student, idx) => (
            <tr 
              key={student.rollNumber} 
              className={`hover:bg-amber-50/30 border-b border-stone-300 ${
                idx % 2 === 1 ? 'bg-stone-50/40' : ''
              }`}
            >
              <td className="border border-stone-300 p-1 text-center font-mono font-bold text-stone-800">{idx + 1}</td>
              <td className="border border-stone-300 p-1 text-center font-mono font-bold text-amber-950">{student.rollNumber}</td>
              <td className="border border-stone-300 p-1 text-left font-serif font-bold text-stone-900">{student.name}</td>
              {data.subjectsList.map(sub => {
                const marks = student.subjectMarks[sub];
                if (!marks) return <td key={sub} className="border border-stone-300 p-1 text-center text-stone-400 font-normal">-</td>;
                if (marks.status === 'pending') {
                  return (
                    <td key={sub} className="border border-stone-300 p-1 text-center text-amber-600/70 italic text-[9px] font-semibold">
                      PEND
                    </td>
                  );
                }
                if (marks.status === 'absent') {
                  return (
                    <td key={sub} className="border border-stone-300 p-1 text-center text-red-700 italic font-bold">
                      ABS
                    </td>
                  );
                }
                const isFailed = marks.status === 'fail';
                return (
                  <td key={sub} className={`border border-stone-300 p-1 text-center font-medium ${isFailed ? 'text-red-700 font-bold bg-red-50/20' : 'text-stone-800'}`}>
                    {marks.marksObtained}
                    <span className="text-[7.5px] text-stone-400 font-normal">/{marks.totalMarks}</span>
                  </td>
                );
              })}
              <td className="border border-stone-300 p-1 text-center font-mono font-bold bg-amber-50/30 text-amber-950">{student.totalObtained}/{student.totalMax}</td>
              <td className="border border-stone-300 p-1 text-center font-mono font-bold bg-amber-50/30 text-amber-950">{student.percentage}</td>
              <td className={`border border-stone-300 p-1 text-center font-serif font-black ${
                student.grade === 'A+' || student.grade === 'A' ? 'text-amber-700' : student.grade === 'F' ? 'text-red-700' : 'text-stone-700'
              }`}>
                {student.grade}
              </td>
              <td className="border border-stone-300 p-1 text-center">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase font-sans ${
                  student.status === 'PASS' 
                    ? 'text-green-800 bg-green-50 border border-green-200' 
                    : student.status === 'FAIL'
                      ? 'text-red-800 bg-red-50 border border-red-200'
                      : 'text-amber-800 bg-amber-50 border border-amber-200'
                }`}>
                  {student.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ornate Footer */}
      <div className="flex justify-between mt-12 px-10 text-[9.5px] font-serif font-semibold text-stone-600">
        <div className="flex flex-col items-center">
          <div className="w-[130px] border-b-2 border-amber-600/50 mb-1"></div>
          <span>CLASS PRECEPTOR</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[130px] border-b-2 border-amber-600/50 mb-1"></div>
          <span>ACADEMIC COMPTROLLER</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[130px] border-b-2 border-amber-600/50 mb-1"></div>
          <span>THE HEADMASTER</span>
        </div>
      </div>
    </div>
  );
};
