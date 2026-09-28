"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, GraduationCap, Users, Loader2, ArrowRight, Calendar, School } from "lucide-react";
import { ClassOption, StudentOption } from "./types";
import { isLastClass, getNumericGrade } from "./utils";

interface BulkPromoteTabProps {
  classes: ClassOption[];
  bulkFromClass: string;
  handleBulkFromClassChange: (classId: string) => void;
  bulkToClass: string;
  setBulkToClass: (classId: string) => void;
  bulkAcademicYear: string;
  setBulkAcademicYear: (year: string) => void;
  bulkRemarks: string;
  setBulkRemarks: (remarks: string) => void;
  bulkPreview: StudentOption[];
  handleBulkPromote: () => void;
  bulkSubmitting: boolean;
  academicYearOptions?: string[];
}

export function BulkPromoteTab({
  classes,
  bulkFromClass,
  handleBulkFromClassChange,
  bulkToClass,
  setBulkToClass,
  bulkAcademicYear,
  setBulkAcademicYear,
  bulkRemarks,
  setBulkRemarks,
  bulkPreview,
  handleBulkPromote,
  bulkSubmitting,
  academicYearOptions = [],
}: BulkPromoteTabProps) {
  const yearOptions = academicYearOptions.length > 0
    ? academicYearOptions
    : (bulkAcademicYear ? [bulkAcademicYear] : []);

  const selectedYear = yearOptions.includes(bulkAcademicYear)
    ? bulkAcademicYear
    : (yearOptions[0] || "");

  useEffect(() => {
    if (selectedYear && bulkAcademicYear !== selectedYear) {
      setBulkAcademicYear(selectedYear);
    }
  }, [selectedYear, bulkAcademicYear, setBulkAcademicYear]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            Bulk Class Promotion
          </CardTitle>
          <CardDescription>
            Select a source class and all its students will be promoted to the next class. The target class is auto-detected based on grade sequence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 3 Selectors in One Row with Arrow */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr] gap-4 items-end">
            {/* From Class */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                From Class (Current) <span className="text-red-500">*</span>
              </label>
              <Select value={bulkFromClass} onValueChange={handleBulkFromClassChange}>
                <SelectTrigger className="w-full h-10 bg-card rounded-xl">
                  <div className="flex items-center gap-2 truncate">
                    <School className="size-4 text-blue-600 shrink-0" />
                    <SelectValue placeholder="Select class to promote from" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {classes
                    .sort((a, b) => getNumericGrade(a.grade) - getNumericGrade(b.grade))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                        {c.name} - {c.section} (Grade {c.grade}){c.studentCount !== undefined ? ` • ${c.studentCount} students` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transition Arrow Indicator */}
            <div className="hidden lg:flex items-center justify-center pb-2.5 text-muted-foreground/70">
              <ArrowRight className="size-4.5" />
            </div>

            {/* To Class */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                To Class (Next) <span className="text-red-500">*</span>
              </label>
              <Select value={bulkToClass} onValueChange={setBulkToClass}>
                <SelectTrigger className="w-full h-10 bg-card rounded-xl">
                  <div className="flex items-center gap-2 truncate">
                    <School className="size-4 text-blue-600 shrink-0" />
                    <SelectValue placeholder="Auto-detected or select manually" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {classes
                    .filter((c) => c.id !== bulkFromClass)
                    .sort((a, b) => getNumericGrade(a.grade) - getNumericGrade(b.grade))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                        {c.name} - {c.section} (Grade {c.grade})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedYear}
                onValueChange={setBulkAcademicYear}
              >
                <SelectTrigger className="w-full h-10 bg-card rounded-xl">
                  <div className="flex items-center gap-2 truncate">
                    <Calendar className="size-4 text-blue-600 shrink-0" />
                    <SelectValue placeholder="Select academic year" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y} className="cursor-pointer">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {bulkFromClass && isLastClass(bulkFromClass, classes) && (
            <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl px-3.5 py-2.5 border border-violet-200 dark:border-violet-800">
              <GraduationCap className="size-4 shrink-0" />
              <span>This is the highest class: students should be <strong>graduated</strong> instead.</span>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <Textarea
              placeholder="e.g. Annual promotion 2025-2026"
              value={bulkRemarks}
              onChange={(e) => setBulkRemarks(e.target.value)}
              rows={2}
              className="rounded-xl"
            />
          </div>

          {/* Preview */}
          {bulkPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="size-4" />
                <span>{bulkPreview.length} student(s) will be promoted</span>
              </div>
              <div 
                data-lenis-prevent
                className="max-h-72 overflow-y-auto overscroll-contain rounded-xl border bg-card"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Roll No.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkPreview.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{s.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">#{s.rollNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-medium cursor-pointer"
            onClick={handleBulkPromote}
            disabled={bulkSubmitting || !bulkFromClass || !bulkToClass || !bulkAcademicYear || bulkPreview.length === 0}
          >
            {bulkSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Zap className="size-4 mr-2" />}
            {bulkSubmitting ? 'Creating Promotions...' : `Promote ${bulkPreview.length} Student(s)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
