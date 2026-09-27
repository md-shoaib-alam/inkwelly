"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, School, Trophy, BookOpen, ArrowLeft } from "lucide-react";
import type { ExamRecord } from "../types";

interface SelectionControlsProps {
  resultsClassId: string;
  onResultsClassChange: (classId: string) => void;
  classes: any[];
  selectedExamGroup: string;
  setSelectedExamGroup: (val: string) => void;
  examGroups: string[];
  selectedExam: ExamRecord | null;
  onSelectExam: (exam: ExamRecord | null) => void;
  subjectsInGroup: ExamRecord[];
  onBack: () => void;
  exams: ExamRecord[];
}

export function SelectionControls({
  resultsClassId,
  onResultsClassChange,
  classes,
  selectedExamGroup,
  setSelectedExamGroup,
  examGroups,
  selectedExam,
  onSelectExam,
  subjectsInGroup,
  onBack,
  exams,
}: SelectionControlsProps) {
  return (
    <Card className="border-orange-500/20 dark:border-orange-500/10 shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base flex items-center gap-3">
          <div className="size-7 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 flex items-center justify-center text-sm font-bold">
            {selectedExam ? <CheckCircle2 className="size-4" /> : "1"}
          </div>
          Select Class & Subject
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          
          {/* Dropdown 1: Select Class */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="results-class-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Class</label>
            <Select value={resultsClassId} onValueChange={onResultsClassChange}>
              <SelectTrigger id="results-class-select" className="w-full h-10">
                <div className="flex items-center gap-2">
                  <School className="size-4 text-orange-500 shrink-0" />
                  <SelectValue placeholder="Choose a class..." />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.grade} - {c.section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropdown 2: Select Exam Group */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="results-exam-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Exam</label>
            <Select 
              value={selectedExamGroup} 
              onValueChange={(val) => {
                setSelectedExamGroup(val);
                onSelectExam(null); // Clear subject selection when changing exam group
              }}
              disabled={!resultsClassId}
            >
              <SelectTrigger id="results-exam-select" className={`w-full h-10 ${resultsClassId ? 'border-orange-200 dark:border-orange-900/50' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-blue-500 shrink-0" />
                  <SelectValue placeholder="Select Exam..." />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {examGroups.length > 0 ? (
                  examGroups.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No active exams</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Dropdown 3: Select Subject */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="results-subject-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Subject</label>
            <Select 
              value={selectedExam?.id || ''} 
              onValueChange={(id) => {
                const exam = exams.find(e => e.id === id);
                if (exam) onSelectExam(exam);
              }}
              disabled={!selectedExamGroup}
            >
              <SelectTrigger id="results-subject-select" className={`w-full h-10 ${selectedExamGroup ? 'border-emerald-200 dark:border-emerald-900/50' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Select Subject..." />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {subjectsInGroup.length > 0 ? (
                  subjectsInGroup.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.subjectName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>All subjects completed</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end self-end h-10 lg:ml-auto">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              Exit Entry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
