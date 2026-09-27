import React from 'react';
import { LedgerTemplateProps } from './types';

export const VintageLedger: React.FC<LedgerTemplateProps> = ({ data }) => {
  return (
    <div 
      className="p-[6mm] bg-[#fdfcf7] text-[#2c241e] font-serif print:p-0 min-h-screen"
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
            background-color: #fdfcf7 !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        `}
      </style>

      {/* Ornate Header */}
      <div className="border border-[#8a7355] p-4 text-center mb-4 bg-[#fcf9f2] shadow-sm relative">
        {/* Corner decorations */}
        <div className="absolute top-1 left-1 border-t border-l border-[#8a7355] size-3"></div>
        <div className="absolute top-1 right-1 border-t border-r border-[#8a7355] size-3"></div>
        <div className="absolute bottom-1 left-1 border-b border-l border-[#8a7355] size-3"></div>
        <div className="absolute bottom-1 right-1 border-b border-r border-[#8a7355] size-3"></div>
        
        <h1 className="font-semibold text-2xl tracking-widest text-[#5c4028] uppercase font-serif">
          {data.schoolName}
        </h1>
        <div className="text-[10px] italic text-[#8a7355] my-0.5 font-serif font-semibold tracking-wide">
          Official Tabulation Registry
        </div>
        <h2 className="text-[11px] font-semibold text-[#2c241e] uppercase tracking-wider mt-1 border-b border-dashed border-[#8a7355]/40 pb-1.5 max-w-lg mx-auto">
          {data.ledgerTitle}
        </h2>
        <div className="flex justify-center gap-12 mt-2 text-[9.5px] font-semibold text-[#5c4028] font-serif">
          <div>Class Standing: <span className="underline decoration-[#8a7355] underline-offset-2">{data.className} - {data.classSection}</span></div>
          <div>Academic Session: <span className="underline decoration-[#8a7355] underline-offset-2">{data.academicYear}</span></div>
          <div>Recorded Date: <span className="underline decoration-[#8a7355] underline-offset-2" suppressHydrationWarning>{new Date().toLocaleDateString()}</span></div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="flex justify-around items-center border border-[#8a7355]/60 bg-[#faf6ed] py-2 mb-4 text-[9px] text-[#5c4028] font-bold uppercase tracking-wider">
        <div>Enrollment: <span>{data.totalStudents}</span></div>
        <div>Promoted: <span className="text-green-800">{data.passCount}</span></div>
        <div>Retained: <span className="text-red-800">{data.failCount}</span></div>
        {data.pendingCount > 0 && <div>Deferred: <span className="text-amber-800">{data.pendingCount}</span></div>}
        <div>Class Promotion Rate: <span>{data.totalStudents > 0 ? ((data.passCount / data.totalStudents) * 100).toFixed(1) + '%' : '0%'}</span></div>
        <div>Class Average: <span>{data.classAverage}</span></div>
      </div>

      {/* Ledger Table */}
      <table className="w-full border-collapse border border-[#8a7355] text-[9.5px]">
        <thead>
          <tr className="bg-[#f2ece2] text-[#5c4028] font-bold border-b border-[#8a7355]">
            <th className="border border-[#8a7355] p-1.5 text-center w-[40px] font-serif font-bold">S.No</th>
            <th className="border border-[#8a7355] p-1.5 text-center w-[65px] font-serif font-bold">Roll No.</th>
            <th className="border border-[#8a7355] p-1.5 text-left font-serif font-bold">Candidate Name</th>
            {data.subjectsList.map(sub => (
              <th key={sub} className="border border-[#8a7355] p-1.5 text-center font-serif font-bold">
                {sub.toUpperCase()} <br />
                <span className="text-[7.5px] text-[#8a7355]/90 font-normal">({data.subjectMaxMarks[sub] || 100})</span>
              </th>
            ))}
            <th className="border border-[#8a7355] p-1.5 text-center w-[75px] font-serif font-bold bg-[#ebdccb]">Total</th>
            <th className="border border-[#8a7355] p-1.5 text-center w-[85px] font-serif font-bold bg-[#ebdccb]">Percentage</th>
            <th className="border border-[#8a7355] p-1.5 text-center w-[50px] font-serif font-bold">Grade</th>
            <th className="border border-[#8a7355] p-1.5 text-center w-[80px] font-serif font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.studentsTabulation.map((student, idx) => (
            <tr 
              key={student.rollNumber} 
              className={`hover:bg-[#f6f0e4] border-b border-[#8a7355]/30 ${
                idx % 2 === 1 ? 'bg-[#faf6ed]/50' : 'bg-white'
              }`}
            >
              <td className="border border-[#8a7355]/40 p-1 text-center font-serif font-bold text-[#5c4028]">{idx + 1}</td>
              <td className="border border-[#8a7355]/40 p-1 text-center font-serif text-[#2c241e]">{student.rollNumber}</td>
              <td className="border border-[#8a7355]/40 p-1 text-left font-serif font-bold text-[#2c241e]">{student.name}</td>
              {data.subjectsList.map(sub => {
                const marks = student.subjectMarks[sub];
                if (!marks) return <td key={sub} className="border border-[#8a7355]/40 p-1 text-center text-[#8a7355]/60">-</td>;
                if (marks.status === 'pending') {
                  return (
                    <td key={sub} className="border border-[#8a7355]/40 p-1 text-center text-amber-700 italic text-[9px] font-semibold">
                      DEFERRED
                    </td>
                  );
                }
                if (marks.status === 'absent') {
                  return (
                    <td key={sub} className="border border-[#8a7355]/40 p-1 text-center text-red-800 italic font-bold">
                      ABSENT
                    </td>
                  );
                }
                const isFailed = marks.status === 'fail';
                return (
                  <td key={sub} className={`border border-[#8a7355]/40 p-1 text-center ${isFailed ? 'text-red-850 font-bold bg-red-50/10' : 'text-[#2c241e]'}`}>
                    {marks.marksObtained}
                    <span className="text-[7.5px] text-[#8a7355]/70">/{marks.totalMarks}</span>
                  </td>
                );
              })}
              <td className="border border-[#8a7355]/40 p-1 text-center font-serif font-bold bg-[#f7eedc]/30 text-[#2c241e]">{student.totalObtained}/{student.totalMax}</td>
              <td className="border border-[#8a7355]/40 p-1 text-center font-serif font-bold bg-[#f7eedc]/30 text-[#2c241e]">{student.percentage}</td>
              <td className={`border border-[#8a7355]/40 p-1 text-center font-serif font-black ${
                student.grade === 'A+' || student.grade === 'A' ? 'text-[#8a7355]' : student.grade === 'F' ? 'text-red-850' : 'text-[#5c4028]'
              }`}>
                {student.grade}
              </td>
              <td className="border border-[#8a7355]/40 p-1 text-center">
                <span className={`font-serif text-[8.5px] font-bold tracking-wider uppercase ${
                  student.status === 'PASS' ? 'text-green-800' : student.status === 'FAIL' ? 'text-red-800' : 'text-amber-800'
                }`}>
                  {student.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature Area */}
      <div className="flex justify-between mt-16 px-10 text-[9px] font-serif italic text-[#5c4028]">
        <div className="flex flex-col items-center">
          <div className="w-[140px] border-b border-[#8a7355] mb-1"></div>
          <span>Registrar / Class Preceptor</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[140px] border-b border-[#8a7355] mb-1"></div>
          <span>Board Examiner</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[140px] border-b border-[#8a7355] mb-1"></div>
          <span>Headmaster Signatory</span>
        </div>
      </div>
    </div>
  );
};
