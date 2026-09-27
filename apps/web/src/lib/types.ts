export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalParents: number;
  totalRevenue: number;
  pendingFees: number;
  attendanceRate: number;
  upcomingEvents: number;
}

export interface StudentInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  className: string;
  classId: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  gender: string;
  dateOfBirth?: string;
  admissionDate: string;
  phone?: string;
  academicYear?: string;
}

export interface TeacherInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  qualification?: string;
  experience?: string;
  subjects?: string[];
  classes?: string[];
  phone?: string;
  joiningDate: string;
  status?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  section: string;
  grade: string;
  capacity: number;
  studentCount: number;
  classTeacher?: string;
  classTeacherId?: string;
}

export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  className: string;
  teacherName?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: string;
  createdAt?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  examType: string;
  marks: number;
  maxMarks: number;
  grade: string;
}

export interface AssignmentInfo {
  id: string;
  title: string;
  description?: string;
  subjectName: string;
  className: string;
  teacherName: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  mode: "online" | "offline";
  createdAt?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  type: string;
  status: string;
  dueDate: string;
  paidAmount: number;
}

export interface NoticeInfo {
  id: string;
  title: string;
  content: string;
  authorName: string;
  targetRole: string;
  priority: string;
  createdAt: string;
}

export interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  subjectName: string;
  teacherName: string;
  className: string;
}

export interface EventInfo {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
}
