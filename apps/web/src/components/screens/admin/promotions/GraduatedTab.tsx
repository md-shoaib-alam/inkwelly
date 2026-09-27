"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { GraduationCap, Users, Loader2 } from "lucide-react";
import { ClassOption, StudentOption, PromotionRecord } from "./types";
import { GraduationsTable } from "./GraduationsTable";
import { getNumericGrade } from "./utils";

interface GraduatedTabProps {
  classes: ClassOption[];
  gradClassId: string;
  handleGradClassChange: (classId: string) => void;
  gradAcademicYear: string;
  setGradAcademicYear: (year: string) => void;
  gradRemarks: string;
  setGradRemarks: (remarks: string) => void;
  gradPreview: StudentOption[];
  gradSelectedIds: Set<string>;
  setGradSelectedIds: (ids: Set<string>) => void;
  toggleGradStudent: (id: string) => void;
  handleGraduate: () => void;
  gradSubmitting: boolean;
  graduations: PromotionRecord[];
  academicYearOptions?: string[];
}

export function GraduatedTab({
  classes,
  gradClassId,
  handleGradClassChange,
  gradAcademicYear,
  setGradAcademicYear,
  gradRemarks,
  setGradRemarks,
  gradPreview,
  gradSelectedIds,
  setGradSelectedIds,
  toggleGradStudent,
  handleGraduate,
  gradSubmitting,
  graduations,
  academicYearOptions = [],
}: GraduatedTabProps) {
  const yearOptions = academicYearOptions.length > 0
    ? academicYearOptions
    : (gradAcademicYear ? [gradAcademicYear] : []);

  const selectedYear = yearOptions.includes(gradAcademicYear)
    ? gradAcademicYear
    : (yearOptions[0] || "");

  useEffect(() => {
    if (selectedYear && gradAcademicYear !== selectedYear) {
      setGradAcademicYear(selectedYear);
    }
  }, [selectedYear, gradAcademicYear, setGradAcademicYear]);
  return (
    <div className="space-y-6">
      {/* Quick Graduate Card */}
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="size-4 text-violet-500" />
            Quick Graduate / Pass-Out
          </CardTitle>
          <CardDescription>
            Select a class and mark students as graduated (passed out from school). Use this for students in the final/highest class.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class *</label>
              <Select value={gradClassId} onValueChange={handleGradClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class to graduate from" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .sort((a, b) => getNumericGrade(b.grade) - getNumericGrade(a.grade))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}-{c.section} (Grade {c.grade}), {c.studentCount} students
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year *</label>
              <Select
                value={selectedYear}
                onValueChange={setGradAcademicYear}
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
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <Textarea
              placeholder="e.g. Batch of 2025, Passed out with distinction"
              value={gradRemarks}
              onChange={(e) => setGradRemarks(e.target.value)}
              rows={2}
            />
          </div>

          {/* Student Selection */}
          {gradPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="size-4" />
                  <span>Select students to graduate</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setGradSelectedIds(new Set(gradPreview.map((s) => s.id)))}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setGradSelectedIds(new Set())}>
                    Clear
                  </Button>
                </div>
              </div>
              <div 
                data-lenis-prevent
                className="max-h-72 overflow-y-auto overscroll-contain rounded-lg border bg-card"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={gradSelectedIds.size === gradPreview.length && gradPreview.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) setGradSelectedIds(new Set(gradPreview.map((s) => s.id)));
                            else setGradSelectedIds(new Set());
                          }}
                        />
                      </TableHead>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Roll No.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradPreview.map((s, i) => (
                      <TableRow key={s.id} className={gradSelectedIds.has(s.id) ? 'bg-violet-50/50 dark:bg-violet-900/20' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={gradSelectedIds.has(s.id)}
                            onCheckedChange={() => toggleGradStudent(s.id)}
                          />
                        </TableCell>
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
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleGraduate}
            disabled={gradSubmitting || !gradClassId || !gradAcademicYear || gradSelectedIds.size === 0}
          >
            {gradSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <GraduationCap className="size-4 mr-2" />}
            {gradSubmitting ? 'Graduating...' : `Graduate ${gradSelectedIds.size} Student(s)`}
          </Button>
        </CardContent>
      </Card>

      {/* Graduation History */}
      <GraduationsTable graduations={graduations} />
    </div>
  );
}
