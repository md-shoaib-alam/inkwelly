import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { useReactToPrint } from 'react-to-print';
import { Printer, Loader2, Download } from 'lucide-react';
import { AdmitCardVisual } from './AdmitCardVisual';

interface AdmitCardPrintPreviewProps {
  admitCards: any[];
  classNameStr: string;
  classSection: string;
  onBack: () => void;
}

function AdmitCardPrintPreview({
  admitCards,
  classNameStr,
  classSection,
  onBack
}: AdmitCardPrintPreviewProps) {
  const [zoomScale, setZoomScale] = useState<number>(0.6);
  const [printing, setPrinting] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic_quad');
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Handle responsive zoom scaling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newScale = 0.6; // Default for desktop
      
      if (width < 640) {
        // Mobile: calculate scale to fit 794px width with some padding
        newScale = Math.max(0.3, (width - 40) / 794);
      } else if (width < 1024) {
        // Tablet
        newScale = Math.max(0.45, (width - 100) / 794);
      }
      
      // Update if significant change or initial load
      if (Math.abs(zoomScale - newScale) > 0.05) {
        setZoomScale(Number(newScale.toFixed(2)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomScale]);

  const handlePrintBase = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: `Admit_Cards_${classNameStr}_${classSection}`,
    onAfterPrint: () => setPrinting(false),
  });

  const handlePrint = () => {
    if (admitCards.length === 0) return;
    setPrinting(true);
    setTimeout(() => {
      handlePrintBase();
    }, 200);
  };

  const handleDownloadPDF = async () => {
    if (admitCards.length === 0) return;
    try {
      const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
      const filename = `Admit_Cards_${classNameStr}_${classSection}.pdf`;

      await downloadContainerAsPDF({
        containerRef: printContainerRef,
        pageClassName: 'admit-card-page',
        filename,
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

  const cardsPerPage = selectedTemplate === 'compact_dual' ? 2 : 4;
  const totalPages = Math.ceil(admitCards.length / cardsPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Custom Standalone Toolbar */}
      <div className="toolbar no-print">
        <div className="toolbar-title flex items-center gap-2">
          <span style={{ fontSize: "1.1rem" }}>🎫</span>
          <span className="font-bold tracking-tight text-white">Admit Card Workspace</span>
          <span className="toolbar-badge select-none">{classNameStr} - {classSection}</span>
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider ml-2 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
            {admitCards.length} Cards
          </span>
        </div>
        
        <div className="toolbar-actions flex items-center flex-wrap gap-3">
          {/* Template Switcher */}
          <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Style:</span>
            <select 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="bg-zinc-800 text-white text-xs font-bold border-none rounded px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-amber-500"
              style={{ colorScheme: 'dark' }}
            >
              <option value="classic_quad">Classic Quad (4 per A4)</option>
              <option value="premium_modern">Premium Modern (4 per A4)</option>
              <option value="compact_dual">Detailed Dual (2 per A4)</option>
              <option value="minimal_ticket">Minimalist Ticket (4 per A4)</option>
            </select>
          </div>

          {/* Zoom Controls */}
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
          
          <button type="button" className="action-btn bg-emerald-600 hover:bg-emerald-700 text-white hidden xl:inline-flex" onClick={handlePrint} disabled={printing || downloading}>
            {printing ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="size-3.5 mr-1.5" />
                Print Cards
              </>
            )}
          </button>

          <button type="button" className="action-btn action-btn-download text-white" onClick={handleDownloadPDF} disabled={printing || downloading}>
            {downloading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="size-3.5 mr-1.5" />
                Download PDF
              </>
            )}
          </button>
          
          <button type="button" className="action-btn action-btn-secondary" onClick={onBack}>
            Close Preview
          </button>
        </div>
      </div>
      
      {/* Scrollable grid pattern viewport */}
      <div className="viewer-container overflow-y-auto flex-1 flex flex-col items-center justify-start">
        <div className="flex flex-col items-center gap-8 py-10 w-full animate-in fade-in duration-300">
          {Array.from({ length: totalPages }).map((_, pageIdx) => (
            <div 
              key={`page-${pageIdx}`}
              className="shrink-0 transition-all duration-300 paper-shadow bg-white flex flex-col justify-start"
              style={{ 
                width: 794 * zoomScale, 
                height: 1123 * zoomScale, 
                overflow: 'hidden' 
              }}
            >
              <div 
                className={selectedTemplate === 'compact_dual' 
                  ? "grid grid-cols-1 gap-y-6 p-[12mm] content-start bg-white"
                  : "grid grid-cols-2 gap-x-4 gap-y-6 p-[8mm] content-start bg-white"
                }
                style={{ 
                  width: 794, 
                  height: 1123,
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top left'
                }}
              >
                {admitCards.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage).map((card) => (
                  <div 
                    key={card.cardNumber} 
                    className={selectedTemplate === 'compact_dual'
                      ? "flex items-center justify-center h-[12.8cm] p-1 border border-dashed border-zinc-200"
                      : "flex items-center justify-center h-[13.8cm] p-1 border border-dashed border-zinc-300"
                    }
                  >
                    <div className="size-full flex items-center justify-center p-1">
                      <AdmitCardVisual card={card} templateId={selectedTemplate} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden high-fidelity print container */}
      <div className="hidden">
        <div ref={printContainerRef} className="print:block p-0">
          <style type="text/css" media="print">
            {"@page { size: A4; margin: 0mm; } body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .admit-card-page { page-break-after: always; }"}
          </style>
          {Array.from({ length: totalPages }).map((_, pageIdx) => (
            <div 
              key={`page-print-${pageIdx}`} 
              className={selectedTemplate === 'compact_dual'
                ? "grid grid-cols-1 gap-y-6 p-[12mm] admit-card-page h-[29.7cm] content-start bg-white"
                : "grid grid-cols-2 gap-x-4 gap-y-6 p-[8mm] admit-card-page h-[29.7cm] content-start bg-white"
              }
            >
              {admitCards.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage).map((card) => (
                <div 
                  key={`print-${card.cardNumber}`} 
                  className={selectedTemplate === 'compact_dual'
                    ? "flex items-center justify-center h-[12.8cm] p-1 border border-dashed border-zinc-200"
                    : "flex items-center justify-center h-[13.8cm] p-1 border border-dashed border-zinc-300"
                  }
                  style={{ 
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  }}
                >
                  <div className="size-full flex items-center justify-center p-1">
                    <AdmitCardVisual card={card} templateId={selectedTemplate} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { AdmitCardPrintPreview };
