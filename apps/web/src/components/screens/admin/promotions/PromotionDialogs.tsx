"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ClassOption, StudentOption, PromotionFormData } from "./types";
import { getNumericGrade } from "./utils";

interface NewPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PromotionFormData;
  setForm: (form: PromotionFormData) => void;
  students: StudentOption[];
  classes: ClassOption[];
  submitting: boolean;
  handleCreatePromotion: () => void;
  handleStudentChange: (studentId: string) => void;
  academicYearOptions?: string[];
}

export function NewPromotionDialog({
  open,
  onOpenChange,
  form,
  setForm,
  students,
  classes,
  submitting,
  handleCreatePromotion,
  handleStudentChange,
  academicYearOptions = [],
}: NewPromotionDialogProps) {
  const yearOptions = academicYearOptions.length > 0
    ? academicYearOptions
    : (form.academicYear ? [form.academicYear] : []);

  const selectedYear = yearOptions.includes(form.academicYear)
    ? form.academicYear
    : (yearOptions[0] || "");

  useEffect(() => {
    if (open && selectedYear && form.academicYear !== selectedYear) {
      setForm({ ...form, academicYear: selectedYear });
    }
  }, [open, selectedYear, form.academicYear]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Promotion</DialogTitle>
          <DialogDescription>
            Create a promotion request for a single student. The student will be
            moved to the target class once approved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Filter by Class</label>
              <Select 
                value={form.fromClassId} 
                onValueChange={(v) => setForm({ ...form, fromClassId: v, studentId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes
                    .sort((a, b) => getNumericGrade(a.grade) - getNumericGrade(b.grade))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}-{c.section}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Student *</label>
              <Select value={form.studentId} onValueChange={handleStudentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {students.reduce<React.ReactNode[]>((acc, s) => {
                    if (!form.fromClassId || form.fromClassId === "all" || s.classId === form.fromClassId) {
                      acc.push(
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} (#{s.rollNumber})
                        </SelectItem>
                      );
                    }
                    return acc;
                  }, [])}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 opacity-60">
              <label className="text-sm font-medium">Current Class</label>
              <div className="px-3 py-2 rounded-md border bg-muted text-sm truncate">
                {students.find(s => s.id === form.studentId)?.className || "Select a student"}
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">To Class *</label>
              <Select
                value={form.toClassId}
                onValueChange={(v) => setForm({ ...form, toClassId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter((c) => c.id !== form.fromClassId)
                    .sort((a, b) => getNumericGrade(a.grade) - getNumericGrade(b.grade))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}-{c.section} (Grade {c.grade})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Academic Year *</label>
            <Select
              value={selectedYear}
              onValueChange={(val) =>
                setForm({ ...form, academicYear: val })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Remarks</label>
            <Textarea
              placeholder="Optional remarks..."
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-medium cursor-pointer"
            onClick={handleCreatePromotion}
            disabled={
              submitting ||
              !form.studentId ||
              !form.fromClassId ||
              !form.toClassId ||
              !form.academicYear
            }
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Promotion"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
