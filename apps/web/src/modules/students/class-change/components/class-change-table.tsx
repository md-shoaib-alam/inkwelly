"use client";

import { Badge } from "@/components/ui/badge";
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
import { GraduationCap } from "lucide-react";

export type RosterStudent = {
  id: string;
  name: string;
  username?: string | null;
  rollNumber: string;
  classId?: string;
  className?: string;
  gender?: string;
  status?: string;
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        inactive
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
      }`}
    >
      <span className={`size-1.5 rounded-full ${inactive ? "bg-amber-500" : "bg-emerald-500"}`} />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Active"}
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
    <div className="overflow-x-auto px-2 sm:px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pl-3 sm:pl-4">
              <Checkbox
                checked={allOnPageSelected}
                disabled={!canChange || students.length === 0}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Select all students on this page"
              />
            </TableHead>
            <TableHead className="h-12">Student</TableHead>
            <TableHead className="hidden md:table-cell">Admission No.</TableHead>
            <TableHead className="hidden sm:table-cell">Current class</TableHead>
            <TableHead className="hidden lg:table-cell">Roll No.</TableHead>
            <TableHead className="hidden lg:table-cell">Gender</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="w-24 text-right">Change</TableHead>
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
            students.map((student) => (
              <TableRow
                key={student.id}
                className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors border-b last:border-none"
              >
                <TableCell className="pl-3 sm:pl-4 py-4">
                  <Checkbox
                    checked={isSelected(student.id)}
                    disabled={!canChange}
                    onCheckedChange={() => onToggle(student)}
                    aria-label={`Select ${student.name}`}
                  />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold shrink-0">
                      {student.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <p className="font-medium text-sm truncate">{student.name}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 font-mono text-[13px] text-slate-700 dark:text-zinc-300">
                  {student.username || "–"}
                </TableCell>
                <TableCell className="hidden sm:table-cell py-4">
                  <Badge variant="secondary" className="font-normal">
                    {student.className || "Unassigned"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell py-4 font-mono text-sm">
                  {student.rollNumber}
                </TableCell>
                <TableCell className="hidden lg:table-cell py-4 capitalize">
                  {student.gender || "–"}
                </TableCell>
                <TableCell className="hidden md:table-cell py-4">
                  <StatusPill status={student.status} />
                </TableCell>
                <TableCell className="text-right py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    disabled={!canChange}
                    onClick={() => onChange(student)}
                  >
                    Change
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
