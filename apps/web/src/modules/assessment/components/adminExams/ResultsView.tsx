'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, School, CheckCircle2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ExamRecord, StudentResultRow } from './types';

// Sub-components
import { SelectionControls } from './results/SelectionControls';
import { ExamInfoCard } from './results/ExamInfoCard';
import { ResultsSummary } from './results/ResultsSummary';
import { ResultsTable } from './results/ResultsTable';

interface ResultsViewProps {
  selectedExam: ExamRecord | null;
  exams: ExamRecord[];
  classes: any[];
  resultsClassId: string;
  onResultsClassChange: (classId: string) => void;
  resultRows: StudentResultRow[];
  loadingStudents: boolean;
  savingResults: boolean;
  onBack: () => void;
  onSelectExam: (exam: ExamRecord | null) => void;
  onUpdateMark: (studentId: string, marks: string) => void;
  onSave: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  formatDate: (date: string) => string;
  formatTime: (time: string | null | undefined) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  getExamTypeBadge: (type: string) => React.ReactNode;
}

export function ResultsView({
  selectedExam,
  exams,
  classes,
  resultsClassId,
  onResultsClassChange,
  resultRows,
  loadingStudents,
  savingResults,
  onBack,
  onSelectExam,
  onUpdateMark,
  onSave,
  onPublish,
  isPublishing,
  formatDate,
  formatTime,
  getStatusBadge,
  getExamTypeBadge,
}: ResultsViewProps) {
  const filteredExams = useMemo(() => {
    if (!resultsClassId) return [];
    return exams.filter(e => e.status !== 'cancelled' && e.status !== 'completed' && e.status !== 'published' && e.isPublished !== true);
  }, [exams, resultsClassId]);

  const [selectedExamGroup, setSelectedExamGroup] = useState<string>('');

  useEffect(() => {
    if (selectedExam) {
      const groupName = selectedExam.name.includes(' - ') ? selectedExam.name.split(' - ')[0] : selectedExam.name;
      queueMicrotask(() => setSelectedExamGroup(groupName));
    } else {
      queueMicrotask(() => setSelectedExamGroup(''));
    }
  }, [selectedExam]);

  const examGroups = useMemo(() => {
    const groups = new Set<string>();
    filteredExams.forEach(e => {
      const groupName = e.name.includes(' - ') ? e.name.split(' - ')[0] : e.name;
      groups.add(groupName);
    });
    return Array.from(groups);
  }, [filteredExams]);

  const subjectsInGroup = useMemo(() => {
    if (!selectedExamGroup) return [];
    return filteredExams.filter(e => {
      const groupName = e.name.includes(' - ') ? e.name.split(' - ')[0] : e.name;
      return groupName === selectedExamGroup;
    });
  }, [filteredExams, selectedExamGroup]);
  
  const resultSummary = {
    total: resultRows.length,
    pass: resultRows.filter((r) => r.status === 'pass').length,
    fail: resultRows.filter((r) => r.status === 'fail').length,
    pending: resultRows.filter((r) => r.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <SelectionControls 
        resultsClassId={resultsClassId}
        onResultsClassChange={onResultsClassChange}
        classes={classes}
        selectedExamGroup={selectedExamGroup}
        setSelectedExamGroup={setSelectedExamGroup}
        examGroups={examGroups}
        selectedExam={selectedExam}
        onSelectExam={onSelectExam}
        subjectsInGroup={subjectsInGroup}
        onBack={onBack}
        exams={exams}
      />

      {!selectedExam ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="py-20 text-center text-muted-foreground">
            {selectedExamGroup && subjectsInGroup.length === 0 ? (
              <>
                <CheckCircle2 className="size-12 mx-auto mb-4 text-emerald-500" />
                <p className="text-lg font-medium text-foreground">All Subjects Completed</p>
                <p className="text-sm">All marks have been entered for &quot;{selectedExamGroup}&quot;. You can now review and publish the results from the Exams tab.</p>
              </>
            ) : resultsClassId ? (
              <>
                <BookOpen className="size-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Please select a subject to continue</p>
                <p className="text-sm">Pick a subject from the dropdown above to start entering results.</p>
              </>
            ) : (
              <>
                <School className="size-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No Class Selected</p>
                <p className="text-sm">Choose a class at the top to see available exams.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <ExamInfoCard 
            selectedExam={selectedExam}
            formatDate={formatDate}
            formatTime={formatTime}
            getExamTypeBadge={getExamTypeBadge}
            getStatusBadge={getStatusBadge}
          />

          <ResultsSummary 
            total={resultSummary.total}
            pass={resultSummary.pass}
            fail={resultSummary.fail}
            pending={resultSummary.pending}
          />

          <ResultsTable 
            loadingStudents={loadingStudents}
            resultRows={resultRows}
            onUpdateMark={onUpdateMark}
            onSave={onSave}
            onPublish={onPublish}
            savingResults={savingResults}
            isPublishing={isPublishing}
          />
        </div>
      )}
    </div>
  );
}
