"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FeeCategory, ClassOption } from "../types";

interface AddFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { feeCategoryId: string; classId: string; amount: string; academicYear: string };
  setForm: (v: any) => void;
  minCategories: FeeCategory[];
  classes: ClassOption[];
  onAdd: () => void;
  adding: boolean;
  academicYears: any[];
}

export function AddFeeStructureDialog({
  open,
  onOpenChange,
  form,
  setForm,
  minCategories,
  classes,
  onAdd,
  adding,
  academicYears,
}: AddFeeStructureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Fee Structure</DialogTitle>
          <DialogDescription>Define fee amount for a category and class</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Fee Category *</Label>
            <Select value={form.feeCategoryId} onValueChange={v => setForm((p: any) => ({ ...p, feeCategoryId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {minCategories
                  .filter(c => c.status !== 'inactive' && c.code !== 'TRANSPORT')
                  .map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Class *</Label>
              <Select value={form.classId} onValueChange={v => setForm((p: any) => ({ ...p, classId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}-{c.section} (Grade {c.grade})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Amount (₹) *</Label>
              <Input type="number" min="0" value={form.amount} onChange={e => setForm((p: any) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Academic Year *</Label>
            <Select value={form.academicYear} onValueChange={v => setForm((p: any) => ({ ...p, academicYear: v }))}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Select academic year" /></SelectTrigger>
              <SelectContent>
                {academicYears.map(y => (
                  <SelectItem key={y.id} value={y.name}>
                    {y.name} {y.isCurrent && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAdd} disabled={adding || !form.feeCategoryId || !form.classId || !form.amount || !form.academicYear}>
            {adding ? 'Adding...' : 'Add Structure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
