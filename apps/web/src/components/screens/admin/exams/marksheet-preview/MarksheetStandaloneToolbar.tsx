'use client';

import React from 'react';
import { Loader2, Printer, Download } from 'lucide-react';
import { MARKSHEET_TEMPLATES } from '../marksheet-templates';

interface MarksheetStandaloneToolbarProps {
  classNameStr: string;
  classSection: string;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  students: any[];
  loading: boolean;
  marksheetType: 'midterm' | 'final';
  setMarksheetType: (type: 'midterm' | 'final') => void;
  exams: any[];
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  zoomScale: number;
  setZoomScale: (scale: number) => void;
  printing: boolean;
  handlePrint: () => void;
  onBack: () => void;
  downloading: boolean;
  handleDownloadPDF: () => void;
}

export function MarksheetStandaloneToolbar({
  classNameStr,
  classSection,
  selectedStudentId,
  setSelectedStudentId,
  students,
  loading,
  marksheetType,
  setMarksheetType,
  exams,
  selectedTemplateId,
  setSelectedTemplateId,
  zoomScale,
  setZoomScale,
  printing,
  handlePrint,
  onBack,
  downloading,
  handleDownloadPDF,
}: MarksheetStandaloneToolbarProps) {
  return (
    <div className="toolbar no-print">
      <div className="toolbar-title">
        <span style={{ fontSize: "1.1rem" }}>📄</span>
        <span>Marksheet Preview</span>
        <span className="toolbar-badge select-none">{classNameStr} - {classSection}</span>
        
        {/* Student Dropdown Selector */}
        <select 
          value={selectedStudentId} 
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={loading || students.length === 0}
          className="ml-4 bg-slate-900 text-white border border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none hover:bg-slate-800 transition-colors"
        >
          <option value="all">All Students</option>
          {students.map((s: any) => (
            <option key={s.id} value={s.id}>
              Roll {s.rollNumber || '-'}: {s.name}
            </option>
          ))}
        </select>

        {/* Marksheet Type Dropdown Selector */}
        <select 
          value={marksheetType} 
          onChange={(e) => setMarksheetType(e.target.value as any)}
          disabled={loading || exams.length === 0}
          className="ml-2 bg-slate-900 text-white border border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none hover:bg-slate-800 transition-colors"
        >
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
        </select>

        {/* Template Dropdown Selector */}
        <select 
          value={selectedTemplateId} 
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="ml-2 bg-slate-900 text-white border border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none hover:bg-slate-800 transition-colors"
        >
          {MARKSHEET_TEMPLATES.map(tmpl => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="toolbar-actions">
        <div className="zoom-controls">
          <button 
            type="button"
            className="zoom-btn" 
            onClick={() => setZoomScale(Math.max(zoomScale - 0.1, 0.4))}
            title="Zoom Out"
          >
            −
          </button>
          <span className="zoom-btn active" style={{ cursor: "default" }}>
            {Math.round(zoomScale * 100)}%
          </span>
          <button 
            type="button"
            className="zoom-btn" 
            onClick={() => setZoomScale(Math.min(zoomScale + 0.1, 1.5))}
            title="Zoom In"
          >
            +
          </button>
        </div>
        
        <button type="button" className="action-btn hidden lg:inline-flex" onClick={handlePrint} disabled={loading || printing || downloading}>
          {printing ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1" />
              Printing…
            </>
          ) : (
            <>
              <Printer className="size-3.5 mr-1" />
              Print
            </>
          )}
        </button>

        <button type="button" className="action-btn action-btn-download" onClick={handleDownloadPDF} disabled={loading || printing || downloading}>
          {downloading ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1" />
              Downloading…
            </>
          ) : (
            <>
              <Download className="size-3.5 mr-1" />
              Download PDF
            </>
          )}
        </button>
        
        <button type="button" className="action-btn action-btn-secondary" onClick={onBack}>
          Close Preview
        </button>
      </div>
    </div>
  );
}
