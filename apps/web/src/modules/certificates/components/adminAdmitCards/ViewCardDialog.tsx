"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer, FileText, Download, Loader2 } from "lucide-react";
import { AdmitCardVisual } from "./AdmitCardVisual";

interface ViewCardDialogProps {
  card: any | null;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
  onDownload: () => void;
  downloading: boolean;
  templateId?: string;
}

export function ViewCardDialog({
  card,
  onOpenChange,
  onPrint,
  onDownload,
  downloading,
  templateId = 'classic_quad',
}: ViewCardDialogProps) {
  return (
    <Dialog open={!!card} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[850px] max-h-[95vh] overflow-y-auto bg-zinc-950 border-zinc-800 p-0">
        <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="size-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <span>Admit Card, <span className="text-amber-400">{card?.student.name}</span></span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview and print student admit card.
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="size-5" />
          </Button>
        </div>

        {card && (
          <div className="p-8 flex flex-col items-center gap-6 bg-zinc-950/50">
            <div className="scale-[0.8] sm:scale-100 origin-top shadow-2xl shadow-black/50">
              <div className="bg-white p-4 rounded-lg">
                <AdmitCardVisual card={card} templateId={templateId} />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
              <Button
                onClick={onPrint}
                className="hidden lg:inline-flex flex-1 gap-2 bg-zinc-800 hover:bg-zinc-900 text-white shadow-lg border border-zinc-700 px-6 h-12 text-base font-semibold justify-center items-center"
              >
                <Printer className="size-5" />
                Print
              </Button>
              
              <Button
                onClick={onDownload}
                disabled={downloading}
                className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20 px-6 h-12 text-base font-semibold"
              >
                {downloading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Download className="size-5" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
