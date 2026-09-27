"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, School } from "lucide-react";

// Subcomponents
import { ExamsSkeleton } from "./exams-entry/exams-skeleton";
import { ExamsSelector } from "./exams-entry/exams-selector";
import { ExamDetailsBanner } from "./exams-entry/exam-details-banner";
import { ResultsSummary } from "./exams-entry/results-summary";
import { ResultsTable } from "./exams-entry/results-table";
import { useTeacherExams } from "./exams-entry/useTeacherExams";

export function TeacherExamsEntry() {
  const {
    classes,
    exams,
    selectedClass,
    selectedExamId,
    selectedExam,
    resultRows,
    loadingClasses,
    loadingExams,
    loadingStudents,
    savingResults,
    isPublishing,
    resultSummary,
    handleClassChange,
    handleExamChange,
    handleUpdateMark,
    handleSaveDraft,
    handlePublish,
  } = useTeacherExams();

  if (loadingClasses) {
    return <ExamsSkeleton />;
  }

  return (
    <div className="p-4 md:px-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Persistent Selectors Card */}
      <ExamsSelector
        classes={classes}
        selectedClass={selectedClass}
        onClassChange={handleClassChange}
        exams={exams}
        selectedExamId={selectedExamId}
        onExamChange={handleExamChange}
        loadingExams={loadingExams}
        hasSelectedExam={!!selectedExam}
      />

      {/* Conditional Views */}
      {!selectedExam ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="py-20 text-center text-muted-foreground">
            {selectedClass ? (
              <>
                <BookOpen className="size-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">
                  Please select an exam to continue
                </p>
                <p className="text-sm">
                  Pick an exam from your assigned subjects above to start entering
                  results.
                </p>
              </>
            ) : (
              <>
                <School className="size-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No Class Selected</p>
                <p className="text-sm">
                  Choose a class at the top to see available exams.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Exam Info Card */}
          <ExamDetailsBanner exam={selectedExam} />

          {/* Results Summary Mini Cards */}
          <ResultsSummary
            total={resultSummary.total}
            pass={resultSummary.pass}
            fail={resultSummary.fail}
            pending={resultSummary.pending}
          />

          {/* Scoring Table Card */}
          <ResultsTable
            loadingStudents={loadingStudents}
            resultRows={resultRows}
            onUpdateMark={handleUpdateMark}
            selectedExamStatus={selectedExam.status}
            savingResults={savingResults}
            isPublishing={isPublishing}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
          />
        </div>
      )}
    </div>
  );
}
