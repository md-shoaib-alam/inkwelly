'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, Users, CheckCircle2, XCircle, AlertCircle, 
  Printer, BookOpen, GraduationCap, Calendar, Clock, Loader2, Download
} from 'lucide-react';
import { ExamRecord } from './types';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ViewResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamRecord | null;
  results: any[];
  loading: boolean;
  formatDate: (date: string) => string;
  formatTime: (time: string | null | undefined) => string;
}

export function ViewResultsDialog({
  open,
  onOpenChange,
  exam,
  results,
  loading,
  formatDate,
  formatTime
}: ViewResultsDialogProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const stats = useMemo(() => {
    if (!results || results.length === 0) return { total: 0, passed: 0, failed: 0, pending: 0, passRate: 0 };
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const pending = results.filter(r => r.status === 'pending').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, pending, passRate };
  }, [results]);

  const handleDownloadPDF = async () => {
    if (!exam || !results.length) return;
    
    setDownloading(true);
    try {
      const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
      await downloadContainerAsPDF({
        containerRef: printAreaRef,
        pageClassName: 'tabulation-sheet-page', // We'll add this class to the container
        filename: `Tabulation_${exam.name}_${exam.className}_${exam.classSection}.pdf`,
        onStart: () => toast.info("Generating PDF..."),
        onComplete: () => {
          setDownloading(false);
          toast.success("PDF Downloaded!");
        },
        onError: (err) => {
          setDownloading(false);
          toast.error("Failed to generate PDF");
          console.error(err);
        }
      });
    } catch (err) {
      setDownloading(false);
      toast.error("Error generating PDF");
    }
  };

  const handlePrint = () => {
    if (!exam) return;

    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: none;';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) return;

    iframeDoc.write(`
      <html>
        <head>
          <title>Tabulation Sheet - ${exam.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; padding: 20px; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; }
            .school-title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; color: #1e3a8a; }
            .sheet-title { font-size: 14px; color: #4b5563; font-weight: 500; margin: 0; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
            .meta-item { font-size: 13px; }
            .meta-label { font-weight: 600; color: #374151; }
            .stats-row { display: flex; gap: 15px; margin-bottom: 20px; }
            .stat-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; text-align: center; background: #fff; }
            .stat-val { font-size: 18px; font-weight: bold; margin-top: 3px; color: #111827; }
            .stat-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f3f4f6; font-weight: 600; color: #374151; }
            .badge { display: inline-flex; align-items: center; padding: 2px 6px; font-size: 10px; font-weight: 600; border-radius: 9999px; }
            .badge-pass { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
            .badge-fail { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
            .badge-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="school-title">School ERP Portal</h1>
            <h2 class="sheet-title">OFFICIAL EXAM TABULATION SHEET</h2>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Exam Name:</span> ${exam.name}</div>
            <div class="meta-item"><span class="meta-label">Subject:</span> ${exam.subjectName}</div>
            <div class="meta-item"><span class="meta-label">Class:</span> ${exam.className} - ${exam.classSection}</div>
            <div class="meta-item"><span class="meta-label">Date & Time:</span> ${formatDate(exam.date)} (${exam.startTime ? formatTime(exam.startTime) + ' - ' + formatTime(exam.endTime) : 'N/A'})</div>
            <div class="meta-item"><span class="meta-label">Total Marks:</span> ${exam.totalMarks}</div>
            <div class="meta-item"><span class="meta-label">Passing Marks:</span> ${exam.passingMarks}</div>
          </div>

          <div class="stats-row">
            <div class="stat-box"><div class="stat-val">${stats.total}</div><div class="stat-lbl">Total Students</div></div>
            <div class="stat-box"><div class="stat-val" style="color: #059669;">${stats.passed}</div><div class="stat-lbl">Passed</div></div>
            <div class="stat-box"><div class="stat-val" style="color: #dc2626;">${stats.failed}</div><div class="stat-lbl">Failed</div></div>
            <div class="stat-box"><div class="stat-val" style="color: #2563eb;">${stats.passRate}%</div><div class="stat-lbl">Pass Percentage</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Roll No</th>
                <th>Student Name</th>
                <th style="width: 100px;">Marks Obtained</th>
                <th style="width: 100px;">Outcome</th>
              </tr>
            </thead>
            <tbody>
              ${results.map((r) => `
                <tr>
                  <td>${r.rollNumber || '-'}</td>
                  <td><strong>${r.studentName}</strong></td>
                  <td>${r.marksObtained} / ${exam.totalMarks}</td>
                  <td>
                    <span class="badge ${
                      r.status === 'pass' ? 'badge-pass' : r.status === 'fail' ? 'badge-fail' : 'badge-pending'
                    }">
                      ${r.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
            <div>Prepared By: ___________________</div>
            <div>Approved By (Principal): ___________________</div>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();
    
    // Wait for content/styles inside the iframe to load, then trigger print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Clean up the temporary iframe
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Trophy className="size-5 text-emerald-600 dark:text-emerald-500" />
                View Published Results
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Official marks statement and outcomes for finalized exams.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {exam && !loading && (
                <>
                  <Button 
                    onClick={handlePrint}
                    size="sm"
                    className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5 shadow-sm rounded-lg h-8 px-3 font-bold text-xs"
                  >
                    <Printer className="size-3.5" />
                    Print
                  </Button>
                  <Button 
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5 shadow-sm rounded-lg h-8 px-3 font-bold text-xs"
                  >
                    {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
              <Skeleton className="h-6 w-1/3 rounded" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
              </div>
            </div>
          ) : !exam ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="size-10 mx-auto mb-2 opacity-30" />
              <p>No exam selected</p>
            </div>
          ) : (
            <div className="space-y-5 tabulation-sheet-page bg-white p-4" ref={printAreaRef}>
              {/* Exam Info Summary Banner */}
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-card/50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <BookOpen className="size-4 text-blue-500" />
                    {exam.name} – {exam.subjectName}
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="size-3.5 text-zinc-400" />
                      {exam.className} - {exam.classSection}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5 text-zinc-400" />
                      {formatDate(exam.date)}
                    </span>
                    {exam.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5 text-zinc-400" />
                        {formatTime(exam.startTime)} – {formatTime(exam.endTime)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 border-zinc-100 dark:border-zinc-800 font-semibold">
                  <span className="text-muted-foreground">
                    Total Marks: <span className="text-foreground">{exam.totalMarks}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Passing Marks: <span className="text-emerald-600 dark:text-emerald-500">{exam.passingMarks}</span>
                  </span>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 text-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Students</p>
                  <p className="text-xl font-extrabold mt-1 text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 text-center rounded-xl bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 shadow-sm">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Passed</p>
                  <p className="text-xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{stats.passed}</p>
                </div>
                <div className="p-3 text-center rounded-xl bg-red-50/40 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 shadow-sm">
                  <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold tracking-wider">Failed</p>
                  <p className="text-xl font-extrabold mt-1 text-red-600 dark:text-red-400">{stats.failed}</p>
                </div>
                <div className="p-3 text-center rounded-xl bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 shadow-sm">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Pass Rate</p>
                  <p className="text-xl font-extrabold mt-1 text-blue-600 dark:text-blue-400">{stats.passRate}%</p>
                </div>
              </div>

              {/* Student Results Table */}
              <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-transparent">
                      <TableHead className="w-16 text-center font-bold">Roll No</TableHead>
                      <TableHead className="font-bold">Student Name</TableHead>
                      <TableHead className="w-36 text-center font-bold">Marks Obtained</TableHead>
                      <TableHead className="w-24 text-center font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm font-medium">
                          No student records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      results.map((row) => (
                        <TableRow key={row.studentId} className="hover:bg-transparent border-b border-zinc-100 dark:border-zinc-800/80">
                          <TableCell className="text-center text-xs font-semibold text-muted-foreground font-mono">
                            {row.rollNumber || '–'}
                          </TableCell>
                          <TableCell className="font-semibold text-sm text-foreground">
                            {row.studentName}
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm text-foreground">
                            {row.marksObtained} <span className="text-xs text-muted-foreground font-normal">/ {exam.totalMarks}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {row.status === 'pass' && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2.5 py-0.5 h-5 font-bold rounded-full text-[10px]">
                                <CheckCircle2 className="size-3 mr-1" /> Pass
                              </Badge>
                            )}
                            {row.status === 'fail' && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2.5 py-0.5 h-5 font-bold rounded-full text-[10px]">
                                <XCircle className="size-3 mr-1" /> Fail
                              </Badge>
                            )}
                            {row.status === 'pending' && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2.5 py-0.5 h-5 font-bold rounded-full text-[10px]">
                                <AlertCircle className="size-3 mr-1" /> Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
