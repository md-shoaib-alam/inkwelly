"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftRight, GraduationCap } from "lucide-react";

export type RosterStudent = {
  id: string;
  name: string;
  username?: string | null;
  rollNumber: string;
  classId?: string;
  className?: string;
  gender?: string;
  status?: string;
  avatar?: string | null;
  photo?: string | null;
};

interface ClassChangeTableProps {
  students: RosterStudent[];
  isSelected: (id: string) => boolean;
  onToggle: (student: RosterStudent) => void;
  onToggleAll: (selected: boolean) => void;
  onChange: (student: RosterStudent) => void;
  canChange: boolean;
}

const StatusPill = ({ status }: { status?: string }) => {
  const inactive = status?.toLowerCase() === "inactive";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
        inactive
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800"
      }`}
    >
      <span className={`size-1.5 rounded-full ${inactive ? "bg-amber-500" : "bg-emerald-500"}`} />
      {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Active"}
    </span>
  );
};

export function ClassChangeTable({
  students,
  isSelected,
  onToggle,
  onToggleAll,
  onChange,
  canChange,
}: ClassChangeTableProps) {
  const allOnPageSelected =
    students.length > 0 && students.every((student) => isSelected(student.id));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F8FAFC] dark:bg-zinc-800/50 hover:bg-[#F8FAFC] border-b border-slate-200/80 dark:border-zinc-800">
            <TableHead className="w-12 pl-4 py-3.5">
              <Checkbox
                checked={allOnPageSelected}
                disabled={!canChange || students.length === 0}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Select all students on this page"
              />
            </TableHead>
            <TableHead className="py-3.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              STUDENT
            </TableHead>
            <TableHead className="py-3.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              ADMISSION NO.
            </TableHead>
            <TableHead className="py-3.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              CURRENT CLASS
            </TableHead>
            <TableHead className="py-3.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              ROLL NO.
            </TableHead>
            <TableHead className="py-3.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              GENDER
            </TableHead>
            <TableHead className="py-3.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              STATUS
            </TableHead>
            <TableHead className="w-28 text-right pr-4 py-3.5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                <GraduationCap className="size-10 mx-auto mb-2 opacity-30" />
                <p>No students match these filters</p>
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => {
              const initials = student.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const photoUrl = student.avatar || student.photo;
              const admissionNo = student.username
                ? (student.username.startsWith("STU") ? student.username.replace("STU", "ADM") : student.username)
                : "–";

              return (
                <TableRow
                  key={student.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors border-b border-slate-100 dark:border-zinc-800/60 last:border-none"
                >
                  <TableCell className="pl-4 py-3.5">
                    <Checkbox
                      checked={isSelected(student.id)}
                      disabled={!canChange}
                      onCheckedChange={() => onToggle(student)}
                      aria-label={`Select ${student.name}`}
                    />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-[#F1F5F9] dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center text-[11px] font-medium shrink-0 overflow-hidden ring-1 ring-slate-200/60 dark:ring-zinc-700/60">
                        {photoUrl ? (
                          <img src={photoUrl} alt={student.name} className="size-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[13.5px] text-slate-900 dark:text-zinc-100 truncate leading-tight">
                          {student.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal leading-tight mt-0.5">
                          {student.username || student.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-[13px] text-slate-600 dark:text-zinc-400 font-normal">
                    {admissionNo}
                  </TableCell>
                  <TableCell className="py-3.5 text-[13px] text-slate-700 dark:text-zinc-300 font-normal">
                    {student.className || "Unassigned"}
                  </TableCell>
                  <TableCell className="py-3.5 text-[13px] text-slate-600 dark:text-zinc-400 font-normal">
                    {student.rollNumber || "–"}
                  </TableCell>
                  <TableCell className="py-3.5 text-[13px] text-slate-600 dark:text-zinc-400 capitalize font-normal">
                    {student.gender || "–"}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <StatusPill status={student.status} />
                  </TableCell>
                  <TableCell className="text-right py-3.5 pr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-[12.5px] font-medium inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      disabled={!canChange}
                      onClick={() => onChange(student)}
                    >
                      <ArrowLeftRight className="size-3.5 text-slate-600 dark:text-zinc-400" />
                      <span>Change</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
