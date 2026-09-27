"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { PromotionRecord } from "./types";

interface RejectPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectingPromotion: PromotionRecord | null;
  rejectRemarks: string;
  setRejectRemarks: (remarks: string) => void;
  handleReject: () => void;
  rejecting: boolean;
}

export function RejectPromotionDialog({
  open,
  onOpenChange,
  rejectingPromotion,
  rejectRemarks,
  setRejectRemarks,
  handleReject,
  rejecting,
}: RejectPromotionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            Reject Promotion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to reject the promotion for{" "}
            <span className="font-semibold text-foreground">
              {rejectingPromotion?.studentName}
            </span>{" "}
            from {rejectingPromotion?.fromClassName} to{" "}
            {rejectingPromotion?.toClassName}?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <label className="text-sm font-medium">
            Reason for rejection (optional)
          </label>
          <Textarea
            placeholder="Provide reason..."
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleReject}
            disabled={rejecting}
          >
            {rejecting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Confirm Reject"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
