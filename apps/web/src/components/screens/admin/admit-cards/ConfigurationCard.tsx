"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Loader2, FileText, Printer, Download, Sparkles, Layout } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const examTypeLabels: Record<string, string> = {
  unit_test: 'Unit Test',
  midterm: 'Mid-Term',
  final: 'Final Exam',
  quiz: 'Quiz',
  practical: 'Practical',
};

interface ConfigurationCardProps {
  availableExamTypes: string[];
  selectedExamType: string;
  setSelectedExamType: (v: string) => void;
  classData: any;
  todayDateString: string;
  totalStudents: number;
  totalExams: number;
  selectedStudentIds: Set<string>;
  selectAll: boolean;
  onToggleAll: () => void;
  onToggleStudent: (id: string) => void;
  onGenerate: () => void;
  generating: boolean;
  onPrintAll: () => void;
  onDownloadAll: () => void;
  admitCardsCount: number;
  preparingPrint: boolean;
  downloadingAll: boolean;
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
}

export function ConfigurationCard({
  availableExamTypes,
  selectedExamType,
  setSelectedExamType,
  classData,
  todayDateString,
  totalStudents,
  totalExams,
  selectedStudentIds,
  selectAll,
  onToggleAll,
  onToggleStudent,
  onGenerate,
  generating,
  onPrintAll,
  onDownloadAll,
  admitCardsCount,
  preparingPrint,
  downloadingAll,
  selectedTemplate,
  setSelectedTemplate,
}: ConfigurationCardProps) {
  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-1">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-bold">2</div>
          Configure Admit Card
        </CardTitle>
        <CardDescription>Filter by exam type and select students</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Template Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Print Template</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-full h-9 rounded-lg text-xs font-bold border-zinc-200 dark:border-zinc-800 bg-background focus:ring-amber-500">
              <div className="flex items-center gap-2">
                <Layout className="size-3.5 text-amber-500" />
                <SelectValue placeholder="Select Template" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="classic_quad" className="text-xs font-semibold">Classic Quad (4 per A4)</SelectItem>
              <SelectItem value="premium_modern" className="text-xs font-semibold">Premium Modern (4 per A4)</SelectItem>
              <SelectItem value="compact_dual" className="text-xs font-semibold">Detailed Dual (2 per A4)</SelectItem>
              <SelectItem value="minimal_ticket" className="text-xs font-semibold">Minimalist Ticket (4 per A4)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Exam Cycle Filter */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium mb-2 block">Exam Cycle</label>
          <div className="flex flex-wrap gap-2">
            {availableExamTypes.map((typeKey: string) => {
              const [cycleName, examType] = typeKey.split('::');
              const count = classData.exams.filter((e: any) => {
                const isScheduled = e.status?.trim().toLowerCase() === 'scheduled';
                const isUpcoming = e.date >= todayDateString;
                const eCycleName = e.name.includes(' - ') ? e.name.split(' - ')[0] : e.name;
                return eCycleName === cycleName && e.examType === examType && (isScheduled || isUpcoming) && !e.resultPublished;
              }).length;
              if (count === 0) return null;
              return (
                <Button
                  key={typeKey}
                  variant={selectedExamType === typeKey ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedExamType(typeKey)}
                  className={`gap-1.5 h-8 text-xs font-bold rounded-lg transition-all duration-300 ${
                    selectedExamType === typeKey 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-none shadow-md' 
                      : 'border-amber-100 hover:border-amber-200 dark:border-amber-900/50'
                  }`}
                >
                  {cycleName}
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 px-1 py-0 h-4 text-[10px] min-w-[1.2rem] flex items-center justify-center border-none rounded ${
                      selectedExamType === typeKey 
                        ? 'bg-amber-500/30 text-white' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    }`}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Students</p>
            <p className="text-xl font-bold">{totalStudents}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Exams</p>
            <p className="text-xl font-bold">{totalExams}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Selected</p>
            <p className="text-xl font-bold text-amber-600">{selectedStudentIds.size}</p>
          </div>
        </div>

        {totalExams === 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-500">No exams found</p>
              <p className="text-xs text-muted-foreground">Create exams for this class first in the Exams section before generating admit cards.</p>
            </div>
          </div>
        )}

        {/* Student Selection */}
        {totalExams > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Select Students</h3>
              <Button variant="link" size="sm" onClick={onToggleAll} className="text-xs h-auto p-0 font-semibold text-amber-600 hover:text-amber-700">
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="max-h-52 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableRow>
                    <TableHead className="w-12 px-4">
                      <Checkbox checked={selectAll} onCheckedChange={onToggleAll} />
                    </TableHead>
                    <TableHead className="w-[40%] px-4">Roll No</TableHead>
                    <TableHead className="w-[40%] px-4">Student Name</TableHead>
                    <TableHead className="w-[20%] px-4 text-center">Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classData.students.map((student: any) => (
                    <TableRow key={student.id} className="hover:bg-muted/50 border-zinc-100 dark:border-zinc-800">
                      <TableCell className="px-4 text-center">
                        <Checkbox
                          checked={selectedStudentIds.has(student.id)}
                          onCheckedChange={() => onToggleStudent(student.id)}
                        />
                      </TableCell>
                      <TableCell className="w-[40%] px-4 font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">{student.rollNumber}</TableCell>
                      <TableCell className="w-[40%] px-4 font-bold text-sm text-zinc-800 dark:text-zinc-200">{student.name}</TableCell>
                      <TableCell className="w-[20%] px-4 text-center text-xs font-medium text-zinc-500">{student.section || 'A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Action Buttons: Generate & Batch Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={onGenerate}
            disabled={generating || selectedStudentIds.size === 0 || totalExams === 0}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-300 transform active:scale-[0.98] gap-2"
          >
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? 'Generating…' : `Generate ${selectedStudentIds.size} Admit Card${selectedStudentIds.size !== 1 ? 's' : ''}`}
          </Button>

          {admitCardsCount > 0 && (
            <div className="flex flex-col sm:flex-row lg:grid lg:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
              <Button
                onClick={onPrintAll}
                disabled={preparingPrint || downloadingAll}
                className="hidden lg:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold h-9 rounded-xl transition-all duration-300 gap-2 shadow-sm justify-center items-center"
              >
                {preparingPrint ? <Loader2 className="size-3.5 animate-spin" /> : <Printer className="size-3.5" />}
                Print
              </Button>
              <Button
                onClick={onDownloadAll}
                disabled={preparingPrint || downloadingAll}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold h-9 rounded-xl transition-all duration-300 gap-2 shadow-sm justify-center items-center"
              >
                {downloadingAll ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                Download
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
