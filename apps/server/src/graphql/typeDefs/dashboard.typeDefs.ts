export const dashboardTypeDefs = `#graphql
  type AdminDashboard {
    totalStudents: Int!
    totalTeachers: Int!
    totalClasses: Int!
    totalParents: Int!
    totalRevenue: Float!
    pendingFees: Float!
    attendanceRate: Float!
    upcomingEvents: Int!
    monthlyAttendance: [AttendanceRate!]!
    classDistribution: [ClassDist!]!
    gradeDistribution: [GradeDist!]!
    recentNotices: [NoticeInfo!]!
    feeByType: [FeeBreakdown!]!
  }

  type AttendanceRate {
    month: String!
    rate: Float!
  }

  type ClassDist {
    name: String!
    students: Int!
  }

  type GradeDist {
    grade: String!
    count: Int!
  }

  type NoticeInfo {
    id: String!
    title: String!
    content: String!
    authorName: String!
    priority: String!
    createdAt: String
    targetRole: String!
  }

  type FeeBreakdown {
    type: String!
    collected: Float!
    pending: Float!
  }

  type TeacherDashboard {
    teacherId: String!
    classes: [TeacherClass!]!
    subjects: [TeacherSubject!]!
    totalStudents: Int!
    pendingAssignments: Int!
    todaySchedule: [ScheduleEntry!]!
    todayAttendance: AttendanceToday!
    todaySelfAttendance: TeacherSelfAttendance!
    recentAssignments: [RecentAssignment!]!
  }

  type TeacherSelfAttendance {
    status: String!
    checkIn: String
    checkOut: String
  }

  type TeacherClass {
    id: String!
    name: String!
    section: String!
    studentCount: Int!
  }

  type TeacherSubject {
    id: String!
    name: String!
    code: String!
    className: String!
  }

  type ScheduleEntry {
    id: String!
    day: String!
    startTime: String!
    endTime: String!
    subjectName: String!
    className: String!
  }

  type AttendanceToday {
    present: Int!
    total: Int!
  }

  type RecentAssignment {
    id: String!
    title: String!
    subjectName: String!
    className: String!
    dueDate: String!
    submissions: Int!
    totalStudents: Int!
    mode: String!
  }

  type StudentDashboard {
    studentId: String!
    classId: String!
    attendanceRate: Float!
    avgGrade: Float!
    pendingAssignments: Int!
    todaySchedule: [ScheduleEntry!]!
    recentGrades: [RecentGrade!]!
    notices: [NoticeInfo!]!
  }

  type RecentGrade {
    id: String!
    subjectName: String!
    examType: String!
    marks: Float!
    maxMarks: Float!
    grade: String
  }

  type ParentDashboard {
    children: [ParentChild!]!
    notices: [NoticeInfo!]!
    fees: [ParentFee!]!
    performanceSummary: [ChildPerformance!]!
    subscriptionPlan: String!
  }

  type ParentChild {
    id: String!
    userId: String!
    name: String!
    email: String!
    className: String!
    classId: String!
    rollNumber: String!
    gender: String!
    dateOfBirth: String
    admissionDate: String
    grades: [ChildGrade!]!
    attendance: [ChildAttendance!]!
  }

  type ChildGrade {
    id: String!
    studentId: String!
    studentName: String!
    subjectName: String!
    examType: String!
    marks: Float!
    maxMarks: Float!
    grade: String
    createdAt: String!
  }

  type ChildAttendance {
    id: String!
    studentId: String!
    studentName: String!
    className: String!
    date: String!
    status: String!
    remarks: String
  }

  type ParentFee {
    id: String!
    studentName: String!
    type: String!
    amount: Float!
    status: String!
    dueDate: String!
    paidDate: String
    paidAmount: Float!
  }

  type ChildPerformance {
    name: String!
    attendanceRate: Float!
    avgGrade: Float!
    grade: String!
  }

  type DashboardSummary {
    totalStudents: Int!
    totalTeachers: Int!
    totalClasses: Int!
    totalParents: Int!
    attendanceRate: Float!
    upcomingEvents: Int!
  }

  type AcademicStats {
    classDistribution: [ClassDist!]!
    gradeDistribution: [GradeDist!]!
  }

  type FinancialStats {
    totalRevenue: Float!
    pendingFees: Float!
    feeByType: [FeeBreakdown!]!
  }
`;
