'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cinzel, Montserrat, Inter } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Printer, ArrowLeft, Search, Layout, AlertCircle, Loader2, Award, Download
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from "sonner";
import { TabularLedgerPrint } from './tabulationLedgerPrinter';
import { compileTabularLedgerData, LedgerData } from './ledger-utils';
import { LEDGER_TEMPLATES } from './ledger-templates';

interface TabulationLedgerPreviewPageProps {
  classId: string;
  classNameStr: string;
  classSection: string;
  academicYear: string;
  initialTemplateId?: string;
  examName?: string;
  onBack: () => void;
}

export function TabulationLedgerPreviewPage({
  classId,
  classNameStr,
  classSection,
  academicYear,
  initialTemplateId = 'classic',
  examName,
  onBack
}: TabulationLedgerPreviewPageProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => initialTemplateId);
  const [state, setState] = useState<{
    loading: boolean;
    ledgerData: LedgerData | null;
  }>({
    loading: false,
    ledgerData: null,
  });
  const { loading, ledgerData } = state;
  const [printing, setPrinting] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(0.65); // Default to 65% zoom for landscape preview
  const [hasManuallySetZoom, setHasManuallySetZoom] = useState<boolean>(false);
  const [unscaledHeight, setUnscaledHeight] = useState<number>(794);

  const printContainerRef = useRef<HTMLDivElement>(null);
  const contentMeasureRef = useRef<HTMLDivElement>(null);

  // Handle responsive zoom scaling
  useEffect(() => {
    if (hasManuallySetZoom) return;

    const handleResize = () => {
      const width = window.innerWidth;
      let newScale = 0.65; // Default for desktop landscape
      
      if (width < 640) {
        // Mobile: calculate scale to fit 1123px (Landscape A4) width with some padding
        newScale = Math.max(0.25, (width - 40) / 1123);
      } else if (width < 1024) {
        // Tablet
        newScale = Math.max(0.4, (width - 100) / 1123);
      }
      
      // Update if significant change or initial load
      if (Math.abs(zoomScale - newScale) > 0.05) {
        setZoomScale(Number(newScale.toFixed(2)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomScale, hasManuallySetZoom]);

  // Load tabulation ledger data
  useEffect(() => {
    if (!classId) return;

    const loadData = async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const compiled = await compileTabularLedgerData({
          classId,
          className: classNameStr,
          classSection,
          academicYear,
          examName
        });
        if (compiled) {
          setState({ loading: false, ledgerData: compiled });
        } else {
          toast.error("Failed to compile tabulation ledger data");
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error("Failed to load tabulation data:", err);
        toast.error("An error occurred while compiling tabulation data");
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadData();
  }, [classId, classNameStr, classSection, academicYear, examName]);

  // Measure the unscaled height of the printed component dynamically to prevent visual clipping
  useEffect(() => {
    if (!ledgerData || !contentMeasureRef.current) return;
    
    const updateHeight = () => {
      if (contentMeasureRef.current) {
        setUnscaledHeight(contentMeasureRef.current.scrollHeight || contentMeasureRef.current.offsetHeight || 794);
      }
    };

    updateHeight();
    
    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(contentMeasureRef.current);
    return () => observer.disconnect();
  }, [ledgerData, selectedTemplateId]);

  // react-to-print handler
  const handlePrintBase = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: `Tabulation_Ledger_${classNameStr}_${classSection}`,
    onAfterPrint: () => setPrinting(false),
  });

  const handlePrint = () => {
    if (!ledgerData) return;
    setPrinting(true);
    setTimeout(() => {
      handlePrintBase();
    }, 200);
  };

  const handleDownloadPDF = async () => {
    if (!ledgerData) return;
    try {
      const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
      const filename = `Tabulation_Ledger_${classNameStr}_${classSection}.pdf`;

      await downloadContainerAsPDF({
        containerRef: printContainerRef,
        pageClassName: 'ledger-print-page',
        filename,
        orientation: 'landscape',
        width: 1123,
        height: unscaledHeight,
        onStart: () => {
          setDownloading(true);
          toast.info("Generating PDF, please wait...", { id: 'pdf-progress' });
        },
        onProgress: (current, total) => {
          toast.info(`Generating page ${current} of ${total}...`, { id: 'pdf-progress' });
        },
        onComplete: () => {
          setDownloading(false);
          toast.success("PDF downloaded successfully!", { id: 'pdf-progress' });
        },
        onError: (err: any) => {
          setDownloading(false);
          toast.error("Failed to generate PDF: " + err.message, { id: 'pdf-progress' });
        }
      });
    } catch (err: any) {
      console.error(err);
      setDownloading(false);
      toast.error("An error occurred during PDF generation.", { id: 'pdf-progress' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* toolbar */}
      <div className="bg-card border border-zinc-150 dark:border-zinc-800/80 p-3 sm:px-4 rounded-xl shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center gap-3 justify-between">
        
        {/* Left Side: Back button and details */}
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
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">
              Tabulation Ledger Preview {examName ? `(${examName})` : ''}
            </span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full xl:w-auto">
          
          {/* Select Template Design */}
          <div className="w-full sm:w-[170px]">
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
                {LEDGER_TEMPLATES.map(tmpl => (
                  <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs font-medium">
                    {tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Zoom */}
          <div className="w-full sm:w-[100px]">
            <Select 
              value={zoomScale.toString()} 
              onValueChange={(v) => {
                setZoomScale(parseFloat(v));
                setHasManuallySetZoom(true);
              }}
            >
              <SelectTrigger className="w-full h-8 rounded-lg text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 py-1">
                <div className="flex items-center gap-1.5 min-w-0 w-full text-left">
                  <Search className="size-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate flex-1">
                    {Math.round(zoomScale * 100)}%
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="0.25" className="text-xs font-medium">25%</SelectItem>
                <SelectItem value="0.4" className="text-xs font-medium">40%</SelectItem>
                <SelectItem value="0.5" className="text-xs font-medium">50%</SelectItem>
                <SelectItem value="0.65" className="text-xs font-medium">65%</SelectItem>
                <SelectItem value="0.8" className="text-xs font-medium">80%</SelectItem>
                <SelectItem value="1" className="text-xs font-medium">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Print button */}
          <Button 
            onClick={handlePrint}
            disabled={loading || printing || downloading || !ledgerData}
            size="sm"
            className="hidden lg:inline-flex w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5 shadow-sm rounded-lg h-8 px-4 font-bold text-xs transition-all duration-300 transform active:scale-95 justify-center"
          >
            {printing ? <Loader2 className="size-3.5 animate-spin" /> : <Printer className="size-3.5" />}
            <span>Print Ledger</span>
          </Button>

          {/* Download button */}
          <Button 
            onClick={handleDownloadPDF}
            disabled={loading || printing || downloading || !ledgerData}
            size="sm"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5 shadow-sm rounded-lg h-8 px-4 font-bold text-xs transition-all duration-300 transform active:scale-95 justify-center"
          >
            {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="bg-card border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px] items-center justify-center">
        {loading ? (
          <div className="w-full space-y-6 py-10 animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <Skeleton className="h-[450px] w-full rounded-2xl" />
          </div>
        ) : !ledgerData ? (
          <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground max-w-md mx-auto animate-in fade-in duration-300">
            <div className="size-16 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="size-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Ledger Compiled</h3>
            <p className="text-xs mt-1">
              Could not compile academic ledger data for this class. Make sure exams are completed and results are loaded properly.
            </p>
          </div>
        ) : (
          <div className={`w-full flex flex-col items-center ${cinzel.className} ${montserrat.className} ${inter.className}`}>
            {/* A4 Landscape parchment layout sheets preview container */}
            <div className="w-full max-h-[70vh] overflow-y-auto overflow-x-auto pb-6 flex flex-col items-center gap-8 bg-zinc-50 dark:bg-zinc-950/20 p-4 sm:p-6 rounded-2xl border border-zinc-150 dark:border-zinc-800/50 shadow-inner">
              <div 
                className="shrink-0 transition-all duration-300 shadow-2xl rounded-lg bg-white overflow-hidden"
                style={{ 
                  width: 1123 * zoomScale, 
                  height: unscaledHeight * zoomScale, 
                }}
              >
                <div 
                  ref={contentMeasureRef}
                  style={{ 
                    width: 1123, 
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left'
                  }}
                >
                  <TabularLedgerPrint data={ledgerData} templateId={selectedTemplateId} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Print Wrapper */}
      {ledgerData && (
        <div className="hidden">
          <div ref={printContainerRef} className="print:block bg-white min-h-screen">
            <style type="text/css" media="print">
              {`
                @page { 
                  size: landscape; 
                  margin: 0mm; 
                } 
                body { 
                  margin: 0; 
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                }
                .ledger-print-page {
                  page-break-after: always;
                  break-after: page;
                  width: 1123px !important;
                  height: auto !important;
                  min-height: 794px;
                  overflow: visible !important;
                  box-sizing: border-box !important;
                  background: white !important;
                }
                .ledger-print-page:last-child {
                  page-break-after: avoid;
                  break-after: avoid;
                }
              `}
            </style>
            <TabularLedgerPrint data={ledgerData} templateId={selectedTemplateId} />
          </div>
        </div>
      )}
    </div>
  );
}
