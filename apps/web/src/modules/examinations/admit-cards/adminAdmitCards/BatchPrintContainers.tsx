"use client";

import { AdmitCardVisual } from "./AdmitCardVisual";

interface BatchPrintContainersProps {
  preparingPrint: boolean;
  allCardsRef: React.RefObject<HTMLDivElement | null>;
  singleCardRef: React.RefObject<HTMLDivElement | null>;
  admitCards: any[];
  viewCard: any | null;
  selectedClassId: string;
  templateId?: string;
}

export function BatchPrintContainers({
  preparingPrint,
  allCardsRef,
  singleCardRef,
  admitCards,
  viewCard,
  templateId = 'classic_quad',
}: BatchPrintContainersProps) {
  // 2 per page for compact_dual (Detailed Dual), 4 per page for others
  const cardsPerPage = (templateId === 'compact_dual') ? 2 : 4;
  const isDualTemplate = cardsPerPage === 2;

  return (
    <>
      {/* Hidden Batch Print Container */}
      {preparingPrint && (
        <div className="hidden">
          <div ref={allCardsRef} className="print:block p-0 bg-white">
            <style type="text/css" media="print">
              {"@page { size: A4 portrait; margin: 0mm; } body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .admit-card-page { page-break-after: always; break-after: page; }"}
            </style>
            {Array.from({ length: Math.ceil(admitCards.length / cardsPerPage) }).map((_, pageIdx) => (
              <div 
                key={`page-${pageIdx}`} 
                className="admit-card-page h-[297mm] w-[210mm] bg-white overflow-hidden flex flex-col items-center justify-center"
                style={{ boxSizing: 'border-box' }}
              >
                <div 
                  className={isDualTemplate
                    ? "flex flex-col items-center gap-y-[10mm] pt-[10mm] pb-[5mm] px-[10mm] h-full w-full bg-white"
                    : "grid grid-cols-2 gap-x-[8mm] gap-y-[12mm] p-[12mm] content-start bg-white h-full w-full"
                  }
                  style={{ boxSizing: 'border-box' }}
                >
                  {admitCards.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage).map((card) => (
                    <div 
                      key={card.cardNumber} 
                      className={isDualTemplate
                        ? "flex items-center justify-center h-[130mm] w-full p-[2mm] border border-dashed border-zinc-200 shrink-0"
                        : "flex items-center justify-center h-[130mm] w-[90mm] p-[1.5mm] border border-dashed border-zinc-300 print:border-zinc-400 shrink-0"
                      }
                      style={{ 
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div className="size-full flex items-center justify-center">
                        <AdmitCardVisual card={card} templateId={templateId} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Single Print Container */}
      <div className="hidden">
        <div ref={singleCardRef} className="print:block p-0 bg-white">
          <style type="text/css" media="print">
            {"@page { size: A4 portrait; margin: 0mm; } body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }"}
          </style>
          {viewCard && (
            <div className="w-[210mm] h-[297mm] p-[10mm] flex flex-col items-center justify-start single-card-page">
              <div 
                className={templateId === 'compact_dual'
                  ? "flex items-center justify-center h-[128mm] w-full p-[2mm] border border-dashed border-zinc-300 print:border-zinc-400"
                  : "flex items-center justify-center h-[138mm] w-[130mm] p-[2mm] border border-dashed border-zinc-300 print:border-zinc-400"
                }
              >
                <div className="size-full flex items-center justify-center p-[1mm]">
                  <AdmitCardVisual card={viewCard} templateId={templateId} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
