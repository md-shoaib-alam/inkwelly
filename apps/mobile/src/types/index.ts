/**
 * Central type definitions for the School Management App.
 * Import from '@/types' instead of using `any` across components.
 */

// ── Auth / User ──────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'staff';

export interface CustomRoleInfo {
  id: string;
  name: string;
  color: string;
  permissions: Record<string, string[]>;
}

export interface PlatformRoleInfo {
  id: string;
  name: string;
  color: string;
  permissions: Record<string, string[]>;
}

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  address?: string;
  tenantId?: string;
  tenantLogo?: string;
  tenantName?: string;
  tenantEndDate?: string;
  customRole?: CustomRoleInfo | null;
  platformRole?: PlatformRoleInfo | null;
}

// ── Student ──────────────────────────────────────────────────────────────────

export interface Transport {
  routeId: string;
  pickupPoint: string;
  fee?: number;
}

export interface SiblingInfo {
  id: string;
  name: string;
  className: string;
}

export interface Student {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  className: string;
  classId: string;
  gender: string;
  dateOfBirth: string;
  admissionDate?: string;
  parentId: string;
  parentName: string;
  transport?: Transport;
  username?: string;
  status?: string;
  siblings?: SiblingInfo[];
  avatar?: string;
  parentEmail?: string;
  parentPhone?: string;
  address?: string;
}

/** Lightweight student shape returned by /students?mode=min */
export interface StudentMin {
  id: string;
  userId: string;
  name: string;
  className?: string;
  classId?: string;
}

// ── Staff ────────────────────────────────────────────────────────────────────

export interface Staff {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  status?: string;
  avatar?: string;
  customRole?: { name: string; color?: string } | null;
  isActive?: boolean;
}

// ── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'half_day';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  className?: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

// ── Grades ───────────────────────────────────────────────────────────────────

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName?: string;
  subjectName: string;
  examType: string;
  marks: number;
  maxMarks: number;
  grade?: string;
  createdAt?: string;
}

// ── Fees ─────────────────────────────────────────────────────────────────────

export type FeeStatus = 'paid' | 'pending' | 'overdue' | 'partial';

export interface FeeRecord {
  id: string;
  studentName: string;
  type: string;
  amount: number;
  paidAmount: number;
  status: FeeStatus;
  dueDate?: string;
}

// ── Homework / Submissions ────────────────────────────────────────────────────

export interface HomeworkItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  dueDate?: string;
  classId?: string;
  subjectName?: string;
  teacherName?: string;
  mode?: string;
  status?: 'pending' | 'overdue' | 'submitted';
  formattedDueDate?: string;
}

export interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt?: string;
  grade?: number;
}

// ── Timetable ────────────────────────────────────────────────────────────────

export interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectName?: string;
  teacherName?: string;
  classId?: string;
  roomNumber?: string;
}

// ── Notice ───────────────────────────────────────────────────────────────────

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorName?: string;
  priority?: string;
  createdAt: string;
  targetRole?: string;
  /** Formatted date string (YYYY-MM-DD), derived from createdAt */
  date?: string;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface MonthlyAttendance { month: string; rate: number; }
export interface ClassDistribution { name: string; students: number; }
export interface FeeByType { type: string; collected: number; pending: number; }
export interface MonthlyRevenue { month: string; amount: number; }

export interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalStaff: number;
  totalRevenue: number;
  attendanceRate: number;
  upcomingEvents: number;
  monthlyAttendance: MonthlyAttendance[];
  classDistribution: ClassDistribution[];
  feeByType: FeeByType[];
  monthlyRevenue: MonthlyRevenue[];
  recentNotices: Notice[];
  maleStudents: number;
  femaleStudents: number;
}

// ── Parent Dashboard ──────────────────────────────────────────────────────────

export interface ChildInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  className: string;
  classId: string;
  rollNumber: string;
  gender: string;
  dateOfBirth?: string;
  admissionDate?: string;
  grades: GradeRecord[];
  attendance: AttendanceRecord[];
  avatar?: string;
}

export interface PerformanceSummary {
  name: string;
  attendanceRate: number;
  avgGrade: string;
  grade: string;
}

export interface ParentDashboardData {
  children: ChildInfo[];
  notices: Notice[];
  fees: FeeRecord[];
  performanceSummary: PerformanceSummary[];
  subscriptionPlan?: string;
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────

export interface TeacherDashboardClass {
  id: string;
  name: string;
  section?: string;
  studentCount?: number;
}

export interface TeacherDashboardSubject {
  id: string;
  name: string;
  code?: string;
  className?: string;
}

export interface TeacherTodaySchedule {
  id: string;
  day?: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  className: string;
}

export interface TeacherRecentAssignment {
  id: string;
  title: string;
  subjectName: string;
  className?: string;
  dueDate?: string;
  submissions?: number;
  totalStudents?: number;
  mode?: string;
  description?: string;
}

export interface TeacherDashboardData {
  teacherId?: string;
  classes?: TeacherDashboardClass[];
  subjects?: TeacherDashboardSubject[];
  totalStudents?: number;
  pendingAssignments?: number;
  todaySchedule?: TeacherTodaySchedule[];
  todayAttendance?: { present: number; total: number };
  todaySelfAttendance?: { status: string; checkIn?: string | null; checkOut?: string | null };
  recentAssignments?: TeacherRecentAssignment[];
  recentNotices?: Notice[];
  totalClasses?: number;
}

// ── Student profile (from /students/me) ──────────────────────────────────────

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  classId: string;
  className: string;
  rollNumber: string;
  gender: string;
  avatar?: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface NotificationPayload {
  type?: string;
  link?: string;
  title?: string;
  body?: string;
  [key: string]: unknown;
}

// ── Theme Colors ─────────────────────────────────────────────────────────────

export interface ThemeColors {
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  text: string;
  textSecondary: string;
  border?: string;
  primary?: string;
  [key: string]: string | undefined;
}

// ── Scroll Events ─────────────────────────────────────────────────────────────

export interface NativeScrollEvent {
  nativeEvent: {
    contentOffset: { x: number; y: number };
    contentSize: { width: number; height: number };
    layoutMeasurement: { width: number; height: number };
  };
}
