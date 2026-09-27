export interface ExamRecord {
  id: string;
  name: string;
  cleanExamName?: string;
  rawName?: string;
  subjectName: string;
  className: string;
  classSection: string;
  classId: string;
  subjectId: string;
  examType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'published' | 'cancelled' | 'draft' | string;
  totalMarks: number;
  passingMarks: number;
  academicYear?: string;
  teacherName?: string;
  totalStudents?: number;
  marksEnteredCount?: number;
  isPublished?: boolean;
}

export interface ExamFormData {
  classId: string;
  subjectId: string;
  name: string;
  examType: string;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: string;
  passingMarks: string;
  academicYear?: string;
}

export interface StudentResultRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: string;
  remarks: string;
  status: 'pass' | 'fail' | 'pending';
}

export interface ClassOption {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
  classId: string;
  teacherId?: string;
  teacherName?: string;
}

export interface StudentOption {
  id: string;
  name: string;
  rollNumber: string;
}
