export interface ExamRecord {
  id: string;
  classId: string;
  className: string;
  classSection: string;
  subjectId: string;
  subjectName: string;
  name: string;
  examType: string;
  totalMarks: number;
  passingMarks: number;
  date: string;
  startTime?: string;
  endTime?: string;
  status: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

export interface StudentResultRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: string;
  remarks: string;
  status: "pass" | "fail" | "pending";
}

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
