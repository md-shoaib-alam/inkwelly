import type { GradeRecord } from "@/lib/types";

export type AssessmentGrade = {
  id: string;
  assessmentId: string;
  title: string;
  type: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  passingMarks: number;
  remarks: string;
  createdAt: string;
};

export type GradeDistributionItem = {
  grade: string;
  count: number;
};
