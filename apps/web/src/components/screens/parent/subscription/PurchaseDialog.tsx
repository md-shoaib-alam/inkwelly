"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { Plan } from "./types";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  cycle: "monthly" | "quarterly" | "yearly";
  processing: boolean;
  onConfirm: () => void;
  userName?: string;
}

export function PurchaseDialog({
  open,
  onOpenChange,
  plan,
  cycle,
  processing,
  onConfirm,
  userName,
}: PurchaseDialogProps) {
  const currentPricing = plan?.pricing[cycle];
  const price = currentPricing?.price ?? 0;
  const originalPrice = currentPricing?.originalPrice;

  const cycleLabels = {
    monthly: "Billed Monthly",
    quarterly: "Billed Quarterly",
    yearly: "Billed Yearly",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-amber-500" />
            Confirm Purchase
          </DialogTitle>
          <DialogDescription>
            You are about to subscribe to the {plan?.name} plan.
          </DialogDescription>
        </DialogHeader>

        {plan && (
          <div className="space-y-4 py-2">
            <Card className="border-zinc-200 dark:border-zinc-700 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {plan.name} Plan
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {cycleLabels[cycle]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {price === 0
                        ? "Free"
                        : `₹${price}`}
                    </p>
                    {originalPrice && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
                        ₹{originalPrice}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You will be redirected to our secure payment gateway to complete your subscription.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/20"
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₹${price}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
