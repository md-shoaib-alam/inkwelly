"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptNumber: string;
  amount: number;
}

export function SuccessDialog({
  open,
  onOpenChange,
  receiptNumber,
  amount,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="size-6" />
            Payment Successful!
          </DialogTitle>
          <DialogDescription>Payment has been recorded successfully.</DialogDescription>
        </DialogHeader>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Receipt Number</p>
          <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">{receiptNumber}</p>
          <p className="text-2xl font-bold">₹{amount.toLocaleString()}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Finish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
