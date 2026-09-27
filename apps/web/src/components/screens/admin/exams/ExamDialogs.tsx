'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Layers, Zap, Loader2, Plus, Save } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { formatLocalDate, parseLocalDate } from '@/lib/utils';
import { ExamFormData, ClassOption, SubjectOption } from './types';
import { EditExamDialog } from './EditExamDialog';

interface ExamDialogsProps {
  // Add Dialog
  addOpen: boolean;
  setAddOpen: (o: boolean) => void;
  addForm: ExamFormData;
  setAddForm: (f: ExamFormData) => void;
  adding: boolean;
  onAdd: () => void;
  
  // Edit Dialog
  editOpen: boolean;
  setEditOpen: (o: boolean) => void;
  editForm: any;
  setEditForm: (f: any) => void;
  saving: boolean;
  onSave: (payload?: any) => void;
  
  // Metadata
  classes: ClassOption[];
  subjects: SubjectOption[];
  subjectsForClass: SubjectOption[];
  editSubjectsForClass: SubjectOption[];
  
  // Bulk helpers
  bulkRows: any[];
  selectedBulkCount: number;
  toggleAllBulk: (checked: boolean) => void;
  toggleBulkSubject: (id: string) => void;
  updateBulkField: (id: string, field: string, value: string) => void;
  academicYears: any[];
  currentAcademicYear: string;
}

export function ExamDialogs({
  addOpen, setAddOpen, addForm, setAddForm, adding, onAdd,
  editOpen, setEditOpen, editForm, setEditForm, saving, onSave,
  classes, subjects, subjectsForClass, editSubjectsForClass,
  bulkRows, selectedBulkCount, toggleAllBulk, toggleBulkSubject, updateBulkField,
  academicYears, currentAcademicYear
}: ExamDialogsProps) {
  const hasMissingDates = bulkRows.some(row => row.selected && !row.date);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isPastDate = useMemo(() => (date: Date) => {
    return date < today;
  }, [today]);

  return (
    <>
      {/* NEW EXAM DIALOG */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
            <DialogDescription>Schedule a new exam for your students.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Class *</Label>
                <Select value={addForm.classId} onValueChange={(v) => setAddForm({ ...addForm, classId: v, subjectId: '' })}>
                  <SelectTrigger className="w-full text-left font-medium">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Exam Type *</Label>
                <Select value={addForm.examType} onValueChange={(v) => setAddForm({ ...addForm, examType: v })}>
                  <SelectTrigger className="w-full text-left font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Academic Year *</Label>
                <Select 
                  value={addForm.academicYear || currentAcademicYear} 
                  onValueChange={(v) => setAddForm({ ...addForm, academicYear: v })}
                >
                  <SelectTrigger className="w-full text-left font-medium">
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((ay) => (
                      <SelectItem key={ay.id} value={ay.name}>
                        {ay.name} {ay.isCurrent && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Base Exam Name * <span className="text-xs text-muted-foreground font-normal">(e.g. "Final 2025")</span></Label>
              <Input placeholder="e.g. Final 2025" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>

            <div className="border rounded-lg overflow-x-auto mt-2">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-10 px-2 sm:px-4"><Checkbox checked={selectedBulkCount === bulkRows.length && bulkRows.length > 0} onCheckedChange={(c) => toggleAllBulk(!!c)} /></TableHead>
                      <TableHead className="px-2 sm:px-4">Subject</TableHead>
                      <TableHead className="w-[140px] px-2 sm:px-4">Date *</TableHead>
                      <TableHead className="text-center w-[100px] px-2 sm:px-4">Start</TableHead>
                      <TableHead className="text-center w-[100px] px-2 sm:px-4">End</TableHead>
                      <TableHead className="text-center w-[80px] px-2 sm:px-4">Total</TableHead>
                      <TableHead className="text-center w-[80px] px-2 sm:px-4">Pass</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkRows.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Select a class first</TableCell></TableRow>
                    ) : (
                      bulkRows.map((row) => (
                        <TableRow key={row.subjectId} className={row.selected ? 'bg-blue-50/30' : ''}>
                          <TableCell className="px-2 sm:px-4"><Checkbox checked={row.selected} onCheckedChange={() => toggleBulkSubject(row.subjectId)} /></TableCell>
                          <TableCell className="font-medium px-2 sm:px-4 whitespace-nowrap">{row.subjectName}</TableCell>
                          <TableCell className="px-2 sm:px-4" suppressHydrationWarning><DatePicker date={parseLocalDate(row.date)} onChange={(d) => updateBulkField(row.subjectId, 'date', formatLocalDate(d))} disabled={isPastDate} /></TableCell>
                          <TableCell className="px-2 sm:px-4"><TimePicker value={row.startTime} onChange={(v) => updateBulkField(row.subjectId, 'startTime', v)} /></TableCell>
                          <TableCell className="px-2 sm:px-4"><TimePicker value={row.endTime} onChange={(v) => updateBulkField(row.subjectId, 'endTime', v)} /></TableCell>
                          <TableCell className="px-2 sm:px-4"><Input type="text" inputMode="numeric" pattern="[0-9]*" className="w-16 sm:w-20 h-8 text-center px-1" value={row.totalMarks} onChange={(e) => updateBulkField(row.subjectId, 'totalMarks', e.target.value)} /></TableCell>
                          <TableCell className="px-2 sm:px-4"><Input type="text" inputMode="numeric" pattern="[0-9]*" className="w-16 sm:w-20 h-8 text-center px-1" value={row.passingMarks} onChange={(e) => updateBulkField(row.subjectId, 'passingMarks', e.target.value)} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          {hasMissingDates && (
            <div className="text-right text-xs text-rose-500 font-semibold mt-2 animate-pulse">
              * Please assign a date to all selected subjects before scheduling.
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button disabled={adding || selectedBulkCount === 0 || !addForm.name || hasMissingDates} onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
              {adding ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
              Create {selectedBulkCount} Exam{selectedBulkCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT EXAM DIALOG */}
      <EditExamDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        form={editForm}
        setForm={setEditForm}
        saving={saving}
        onSave={onSave}
        classes={classes}
        academicYears={academicYears}
        currentAcademicYear={currentAcademicYear}
      />
    </>
  );
}


