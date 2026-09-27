'use client';

import { RefObject } from 'react';

interface MarksheetPrintContainerProps {
  printContainerRef: RefObject<HTMLDivElement | null>;
  previewStudents: any[];
  SelectedTemplate: React.ComponentType<any>;
  classNameStr: string;
  classSection: string;
  academicYear: string;
  marksheetType: 'midterm' | 'final' | 'combined';
  examName?: string;
}

export function MarksheetPrintContainer({
  printContainerRef,
  previewStudents,
  SelectedTemplate,
  classNameStr,
  classSection,
  academicYear,
  marksheetType,
  examName
}: MarksheetPrintContainerProps) {
  return (
    <div className="hidden">
      <div ref={printContainerRef} className="print:block bg-white min-h-screen">
        <style type="text/css" media="print">
          {`
            @page { 
              size: portrait; 
              margin: 0mm; 
            } 
            body { 
              margin: 0; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .marksheet-page-break {
              page-break-after: always;
              break-after: page;
              width: 794px !important;
              height: 1123px !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .marksheet-page-break:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
          `}
        </style>
        {previewStudents.map((sheet) => (
          <div key={sheet.id} className="marksheet-page-break">
            <SelectedTemplate 
              sheet={sheet}
              classNameStr={classNameStr}
              classSection={classSection}
              academicYear={academicYear}
              marksheetType={marksheetType}
              examName={examName}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
