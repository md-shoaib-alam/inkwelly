export interface MarksheetTemplateProps {
  sheet: {
    studentName: string;
    rollNumber: string;
    schoolName: string;
    subjects: Array<{
      subjectName: string;
      midtermMarks: string;
      finalMarks: string;
      obtained: string;
      maxMarks?: number;
      obtainedMarks?: number;
      passingMarks?: number;
      percentage: number;
      status: 'pass' | 'fail' | 'pending';
    }>;
    totalMaxMarks: number;
    totalObtainedMarks: number;
    overallPercentage: number;
    grade: string;
    remarks: string;
    color: string;
    status: 'pass' | 'fail' | 'pending';
  };
  classNameStr: string;
  classSection: string;
  academicYear: string;
  marksheetType: 'midterm' | 'final' | 'combined';
  examName?: string;
}
