'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Printer, Loader2, Award, FileText, User, Search, ArrowLeft, Layout, Download
} from 'lucide-react';
import { ExamRecord } from '../types';
import { MARKSHEET_TEMPLATES } from '../marksheet-templates';

interface MarksheetControlsProps {
  classNameStr: string;
  classSection: string;
  onBack: () => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  marksheetType: 'midterm' | 'final';
  setMarksheetType: (type: 'midterm' | 'final') => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  zoomScale: number;
  setZoomScale: (scale: number) => void;
  handlePrint: () => void;
  students: any[];
  exams: ExamRecord[];
  loading: boolean;
  printing: boolean;
  downloading: boolean;
  handleDownloadPDF: () => void;
}

export function MarksheetControls({
  classNameStr,
  classSection,
  onBack,
  selectedStudentId,
  setSelectedStudentId,
  marksheetType,
  setMarksheetType,
  selectedTemplateId,
  setSelectedTemplateId,
  zoomScale,
  setZoomScale,
  handlePrint,
  students,
  exams,
  loading,
  printing,
  downloading,
  handleDownloadPDF,
}: MarksheetControlsProps) {
  return (
    <div className="bg-card border border-zinc-150 dark:border-zinc-800/80 p-3 sm:px-4 rounded-xl shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center gap-3 justify-between">
      {/* Left Side: Back & Class Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onBack}
          className="group flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground h-8 px-2 rounded-lg transition-colors border border-zinc-100 dark:border-zinc-800"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5 leading-none">
            <Award className="size-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
            <span className="truncate">{classNameStr} - {classSection}</span>
          </h2>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">Marksheet Preview</span>
        </div>
      </div>

      {/* Center/Right controls row */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full xl:w-auto">
        {/* Dropdowns Group */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Select Student */}
          <div className="w-full sm:w-[150px]">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={loading || students.length === 0}>
              <SelectTrigger className="w-full h-8 rounded-lg text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 py-1">
                <div className="flex items-center gap-1.5 min-w-0 w-full text-left">
                  <User className="size-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate flex-1">
                    <SelectValue placeholder="All Students" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl">
                <SelectItem value="all" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">All Students</SelectItem>
                {students.map((s: any) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs font-medium">
                    Roll {s.rollNumber || '-'}: {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Marks Type */}
          <div className="w-full sm:w-[110px]">
            <Select value={marksheetType} onValueChange={(v: any) => setMarksheetType(v)} disabled={loading || exams.length === 0}>
              <SelectTrigger className="w-full h-8 rounded-lg text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 py-1">
                <div className="flex items-center gap-1.5 min-w-0 w-full text-left">
                  <FileText className="size-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate flex-1">
                    <SelectValue placeholder="Select Type" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="midterm" className="text-xs font-medium">Midterm</SelectItem>
                <SelectItem value="final" className="text-xs font-medium">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select Template Design */}
          <div className="w-full sm:w-[150px]">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="w-full h-8 rounded-lg text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 py-1">
                <div className="flex items-center gap-1.5 min-w-0 w-full text-left">
                  <Layout className="size-3.5 text-violet-500 shrink-0" />
                  <span className="truncate flex-1">
                    <SelectValue placeholder="Select Design" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MARKSHEET_TEMPLATES.map(tmpl => (
                  <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs font-medium">
                    {tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Zoom */}
          <div className="w-full sm:w-[100px]">
            <Select value={zoomScale.toString()} onValueChange={(v) => setZoomScale(parseFloat(v))}>
              <SelectTrigger className="w-full h-8 rounded-lg text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 py-1">
                <div className="flex items-center gap-1.5 min-w-0 w-full text-left">
                  <Search className="size-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate flex-1">
                    {Math.round(zoomScale * 100)}%
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="0.5" className="text-xs font-medium">50%</SelectItem>
                <SelectItem value="0.6" className="text-xs font-medium">60%</SelectItem>
                <SelectItem value="0.75" className="text-xs font-medium">75%</SelectItem>
                <SelectItem value="1" className="text-xs font-medium">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print button - Hidden on mobile/tablet/small desktop */}
          <Button 
            onClick={handlePrint}
            disabled={loading || printing || downloading || students.length === 0}
            size="sm"
            className="hidden xl:inline-flex w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5 shadow-sm rounded-lg h-8 px-4 font-bold text-xs transition-all duration-300 transform active:scale-95 justify-center"
          >
            {printing ? <Loader2 className="size-3.5 animate-spin" /> : <Printer className="size-3.5" />}
            <span>Print {selectedStudentId === 'all' ? 'All' : 'Student'}</span>
          </Button>

          {/* Download PDF button */}
          <Button 
            onClick={handleDownloadPDF}
            disabled={loading || printing || downloading || students.length === 0}
            size="sm"
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shrink-0 gap-1.5 shadow-sm rounded-lg h-8 px-4 font-bold text-xs transition-all duration-300 transform active:scale-95 justify-center"
          >
            {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            <span>Download PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
