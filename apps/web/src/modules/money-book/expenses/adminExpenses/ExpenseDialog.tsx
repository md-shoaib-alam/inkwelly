"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatLocalDate, parseLocalDate } from "@/lib/utils";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: any;
  categories: any[];
  onSubmit: (form: {
    categoryId: string;
    amount: string;
    date: string;
    description: string;
    paymentMethod: string;
    referenceNo: string;
    status: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  editingExpense,
  categories,
  onSubmit,
  isSaving
}: ExpenseDialogProps) {
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    date: formatLocalDate(new Date()),
    description: "",
    paymentMethod: "cash",
    referenceNo: "",
    status: "paid"
  });

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEditingExpense, setPrevEditingExpense] = useState(editingExpense);

  if (open !== prevOpen || editingExpense !== prevEditingExpense) {
    setPrevOpen(open);
    setPrevEditingExpense(editingExpense);
    if (open) {
      setForm(editingExpense ? {
        categoryId: editingExpense.categoryId,
        amount: editingExpense.amount.toString(),
        date: editingExpense.date,
        description: editingExpense.description || "",
        paymentMethod: editingExpense.paymentMethod,
        referenceNo: editingExpense.referenceNo || "",
        status: editingExpense.status
      } : {
        categoryId: categories[0]?.id || "",
        amount: "",
        date: formatLocalDate(new Date()),
        description: "",
        paymentMethod: "cash",
        referenceNo: "",
        status: "paid"
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={form.categoryId} 
                onValueChange={v => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={form.amount} 
                onChange={e => setForm({ ...form, amount: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker 
                date={parseLocalDate(form.date)}
                onChange={(d) => setForm({ ...form, date: formatLocalDate(d) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select 
                value={form.paymentMethod} 
                onValueChange={v => setForm({ ...form, paymentMethod: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              placeholder="e.g. Paid electricity bill for March" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reference No.</Label>
              <Input 
                value={form.referenceNo} 
                onChange={e => setForm({ ...form, referenceNo: e.target.value })} 
                placeholder="Optional" 
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={form.status} 
                onValueChange={v => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-rose-600" disabled={isSaving}>
              {isSaving ? "Saving..." : (editingExpense ? "Update Expense" : "Add Expense")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
