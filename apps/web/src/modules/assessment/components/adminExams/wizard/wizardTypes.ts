import { ClassOption, SubjectOption } from '../types';

export interface BulkSubjectRow {
  key: string;
  subjectName: string;
  code?: string;
  selected: boolean;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: string;
  passingMarks: string;
}

export interface CreatedExamSummary {
  examName: string;
  className: string;
  totalSubjects: number;
  startDate: string;
  endDate: string;
  isEdit?: boolean;
}

export interface GradeGroup {
  gradeName: string;
  classList: ClassOption[];
}
