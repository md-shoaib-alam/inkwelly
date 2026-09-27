"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { FeeStructure } from "../types";

interface EditFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FeeStructure | null;
  amount: string;
  setAmount: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function EditFeeStructureDialog({
  open,
  onOpenChange,
  item,
  amount,
  setAmount,
  onSave,
  saving,
}: EditFeeStructureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Amount</DialogTitle>
          <DialogDescription>{item?.feeCategoryName}, {item?.className}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label>Amount (₹)</Label>
          <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
