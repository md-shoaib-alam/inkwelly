"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeeStructure } from "../types";

interface AssignFeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  struct: FeeStructure | null;
  loading: boolean;
  data: any;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectTransport: () => void;
  search: string;
  setSearch: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  debouncedSearch: string;
}

export function AssignFeesDialog({
  open,
  onOpenChange,
  struct,
  loading,
  data,
  selectedIds,
  onToggle,
  onSelectAll,
  onSelectTransport,
  search,
  setSearch,
  onSave,
  saving,
  debouncedSearch,
}: AssignFeesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Assign <span className="text-emerald-600">{struct?.feeCategoryName}</span> to Students</DialogTitle>
          <DialogDescription>
            {struct?.className}, {struct?.academicYear} · ₹{struct?.amount?.toLocaleString()}/student
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-8 flex justify-center"><div className="animate-spin size-6 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>
        ) : data && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">{data.totalStudents} students</span>
              <span className="text-emerald-600 font-medium">{selectedIds.size} selected</span>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onSelectAll}>
                  {selectedIds.size === data.students.filter((s: any) => !s.isPaid).length ? 'Deselect All' : 'Select All'}
                </Button>
                {(struct?.feeCategoryCode === 'TRAN' || struct?.feeCategoryName?.toLowerCase().includes('transport')) && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onSelectTransport}>
                    <Bus className="size-3" /> Transport Only
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="border rounded-lg max-h-72 overflow-y-auto">
              {data.students.filter((s: any) => !debouncedSearch || s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || s.rollNumber.toLowerCase().includes(debouncedSearch.toLowerCase())).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No students found</div>
              ) : (
                data.students
                  .filter((s: any) => !debouncedSearch || s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || s.rollNumber.toLowerCase().includes(debouncedSearch.toLowerCase()))
                  .map((student: any) => (
                  <div
                    key={student.id}
                    className={cn('w-full flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left bg-transparent', selectedIds.has(student.id) && 'bg-emerald-50 dark:bg-emerald-900/20')}
                    onClick={() => { if (!student.isPaid) onToggle(student.id); }}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!student.isPaid) onToggle(student.id);
                      }
                    }}
                  >
                    <Checkbox checked={selectedIds.has(student.id)} disabled={student.isPaid} className={selectedIds.has(student.id) ? 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600' : ''} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{student.name}</span>
                        <span className="text-xs text-muted-foreground">#{student.rollNumber}</span>
                        {student.hasTransport && <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"><Bus className="size-2.5 mr-0.5" />Transport</Badge>}
                      </div>
                    </div>
                    {student.isPaid && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-0 shrink-0">Paid ✓</Badge>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onSave} disabled={saving || loading}>
            {saving ? 'Saving...' : `Save (${selectedIds.size} students)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
