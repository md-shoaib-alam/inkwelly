"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Coins, Calendar, NotebookPen, CreditCard } from "lucide-react";
import { useFeeCategories } from "@/hooks/use-fees";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { StudentOption } from "../types";
import { DatePicker } from "@/components/ui/date-picker";
import { formatLocalDate, parseLocalDate } from "@/lib/utils";

interface AddManualFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOption;
  onSuccess: () => void;
}

export function AddManualFeeDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: AddManualFeeDialogProps) {
  const { data: categories = [] } = useFeeCategories("min");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("custom");
  const [customType, setCustomType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(
    formatLocalDate(new Date())
  );
  const [remarks, setRemarks] = useState<string>("");
  const [markPaid, setMarkPaid] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    const feeAmount = Number(amount);
    if (isNaN(feeAmount) || feeAmount <= 0) {
      toast.error("Please enter a valid amount greater than zero");
      return;
    }

    let feeType = customType.trim();
    if (selectedCategoryId !== "custom") {
      const matched = categories.find((c: any) => c.id === selectedCategoryId);
      feeType = matched ? matched.name : "School Fee";
    }

    if (!feeType) {
      toast.error("Please select a category or enter a description");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the fee entry via POST /api/fees
      const feeRes = await apiFetch("/api/fees", {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          feeCategoryId: selectedCategoryId === "custom" ? null : selectedCategoryId,
          amount: feeAmount,
          type: feeType,
          dueDate,
          remarks: remarks.trim() || "Manual payment entry",
        }),
      });

      if (!feeRes.ok) {
        const err = await feeRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create fee record");
      }

      const newFee = await feeRes.json();

      // 2. If markPaid is checked, immediately record a payment receipt
      if (markPaid) {
        const receiptRes = await apiFetch("/api/fee-receipts", {
          method: "POST",
          body: JSON.stringify({
            studentId: student.id,
            feeIds: [newFee.id],
            totalAmount: feeAmount,
            paidAmount: feeAmount,
            concessionTotal: 0,
            paymentMethod,
          }),
        });

        if (!receiptRes.ok) {
          const err = await receiptRes.json().catch(() => ({}));
          throw new Error(err.error || "Fee created, but payment recording failed");
        }

        toast.success("Payment recorded successfully!");
      } else {
        toast.success("Pending fee entry created successfully!");
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedCategoryId("custom");
      setCustomType("");
      setAmount("");
      setRemarks("");
      setMarkPaid(true);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-none bg-card rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Coins className="size-5 text-emerald-600" />
            Add Manual Payment Entry
          </DialogTitle>
          <DialogDescription>
            Record a direct or pending payment for <strong>{student.name}</strong> ({student.className})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Category Selector */}
          <div className="grid gap-1.5">
            <Label htmlFor="category" className="text-xs font-semibold">Fee Category</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select fee category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Description...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Description (if custom category selected) */}
          {selectedCategoryId === "custom" && (
            <div className="grid gap-1.5 animate-in slide-in-from-top-2 duration-200">
              <Label htmlFor="customType" className="text-xs font-semibold">Fee Description *</Label>
              <Input
                id="customType"
                placeholder="e.g. Uniform Fee, Field Trip"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
            </div>
          )}

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Amount in ₹"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dueDate" className="text-xs font-semibold">Due Date</Label>
              <DatePicker
                date={parseLocalDate(dueDate)}
                onChange={(d) => setDueDate(formatLocalDate(d))}
                className="w-full bg-background"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="grid gap-1.5">
            <Label htmlFor="remarks" className="text-xs font-semibold">Remarks / Notes</Label>
            <Input
              id="remarks"
              placeholder="e.g. Manual entry by Admin"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* Instant Payment Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-secondary bg-secondary/10 mt-2">
            <div className="space-y-0.5">
              <Label htmlFor="markPaid" className="text-sm font-bold flex items-center gap-1.5">
                <CreditCard className="size-4 text-emerald-600" />
                Record Payment Instantly
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Mark as paid immediately and generate a receipt
              </p>
            </div>
            <Switch
              id="markPaid"
              checked={markPaid}
              onCheckedChange={setMarkPaid}
            />
          </div>

          {/* Payment Method Selector (if instant payment enabled) */}
          {markPaid && (
            <div className="grid gap-1.5 p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 animate-in slide-in-from-top-2 duration-200">
              <Label htmlFor="method" className="text-xs font-semibold">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="method" className="bg-card">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI / Online Transfer</SelectItem>
                  <SelectItem value="bank_transfer">Bank Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={handleSubmit}
            disabled={submitting || !amount || (selectedCategoryId === "custom" && !customType)}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : markPaid ? (
              "Record Payment"
            ) : (
              "Add Pending Fee"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
