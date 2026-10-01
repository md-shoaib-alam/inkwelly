export const academicTypeDefs = `#graphql
  type TenantDetail {
    tenant: Tenant!
    students: [TenantStudent!]!
    teachers: [TenantTeacher!]!
    parents: [TenantParent!]!
    classes: [TenantClass!]!
    notices: [NoticeInfo!]!
    fees: [TenantFee!]!
    attendance: [TenantAttendance!]!
  }

  type TenantStudent {
    id: String!
    name: String!
    email: String!
    username: String
    phone: String
    rollNumber: String!
    className: String!
    gender: String!
    dateOfBirth: String
    status: String!
    classId: String
    parentId: String
    parentName: String
    admissionDate: String
    academicYear: String
    class: TenantClass
    parent: TenantParent
  }

  type TenantTeacher {
    id: String!
    name: String!
    email: String!
    phone: String
    qualification: String
    experience: String
    status: String!
    subjects: [String!]
    classes: [String!]
    joiningDate: String
  }

  type TenantParent {
    id: String!
    userId: String!
    name: String!
    email: String!
    username: String
    phone: String
    address: String
    role: String
    isActive: Boolean
    occupation: String
    status: String!
    children: [TenantStudent!]
    subscription: Subscription
  }

  type ClassTeacherRef {
    id: String!
    name: String!
    avatar: String
    isPrimary: Boolean!
  }

  type TenantClass {
    id: String!
    name: String!
    slug: String
    section: String!
    classLevel: String!
    medium: String!
    isVocational: Boolean!
    isActive: Boolean!
    capacity: Int!
    studentCount: Int!
    profileCompletePercent: Int!
    classTeacher: String
    classTeacherId: String
    teachers: [ClassTeacherRef!]
  }

  type ClassStats {
    total: Int!
    active: Int!
    enrolled: Int!
  }

  type ClassFilterOptions {
    classLevels: [String!]!
    sections: [String!]!
    mediums: [String!]!
  }

  type TenantFee {
    id: String!
    studentName: String!
    type: String!
    amount: Float!
    status: String!
    dueDate: String!
    paidAmount: Float!
  }

  type TenantAttendance {
    id: String!
    studentName: String!
    date: String!
    status: String!
    className: String!
  }

  type StaffAttendance {
    id: String!
    staffName: String!
    role: String!
    date: String!
    status: String!
    checkIn: String
    checkOut: String
    remarks: String
  }

  type Subject {
    id: String!
    name: String!
    code: String!
    classId: String!
    teacherId: String
    className: String
    teacherName: String
  }

  type StaffMember {
    id: String!
    name: String!
    email: String!
    role: String!
    phone: String
    address: String
    isActive: Boolean!
    customRole: CustomRole
    createdAt: String!
  }
  type Event {
    id: ID!
    tenantId: String!
    title: String!
    description: String
    date: String!
    endDate: String
    type: String!
    targetRole: String!
    color: String!
    allDay: Boolean!
    location: String
    createdAt: String!
  }

  input EventInput {
    title: String!
    description: String
    date: String!
    endDate: String
    type: String
    targetRole: String
    color: String
    allDay: Boolean
    location: String
  }

  type AcademicYear {
    id: String!
    name: String!
    startDate: String!
    endDate: String!
    status: String!
    isCurrent: Boolean!
    createdAt: String!
  }

  input CreateAcademicYearInput {
    name: String!
    startDate: String!
    endDate: String!
    status: String
    isCurrent: Boolean
  }

  type AcademicsSession {
    name: String!
    isCurrent: Boolean!
    startDate: String!
    endDate: String!
    totalDays: Int!
    dayNumber: Int!
    percentComplete: Int!
  }

  type AcademicsStats {
    classes: Int!
    students: Int!
    teachers: Int!
    subjects: Int!
    offerings: Int!
    taught: Int!
    classLevels: Int!
    classesWithOfferings: Int!
    ratio: Float!
    ratioLabel: String!
    ratioBand: String!
  }

  type AcademicsReadinessAxis {
    key: String!
    label: String!
    tracked: Boolean!
    percent: Int!
    detail: String!
  }

  type AcademicsReadiness {
    score: Int!
    axes: [AcademicsReadinessAxis!]!
  }

  type AcademicsStage {
    key: String!
    label: String!
    classes: Int!
    students: Int!
  }

  type AcademicsGrowthPoint {
    year: String!
    students: Int!
    exams: Int!
  }

  type AcademicsGrowth {
    sessions: Int!
    points: [AcademicsGrowthPoint!]!
  }

  type AcademicsFinding {
    code: String!
    severity: String!
    count: Int!
    title: String!
    detail: String!
    screen: String!
  }

  type AcademicsCommandCenter {
    session: AcademicsSession
    stats: AcademicsStats!
    readiness: AcademicsReadiness!
    stages: [AcademicsStage!]!
    growth: AcademicsGrowth!
    findings: [AcademicsFinding!]!
  }

  extend type Query {
    academicYears: [AcademicYear!]!
    currentAcademicYear: AcademicYear
    academicsCommandCenter(tenantId: String, academicYear: String): AcademicsCommandCenter!
  }

  extend type Mutation {
    createAcademicYear(input: CreateAcademicYearInput!): AcademicYear!
    updateAcademicYear(id: String!, input: CreateAcademicYearInput!): AcademicYear!
    deleteAcademicYear(id: String!): Boolean!
    setCurrentAcademicYear(id: String!): AcademicYear!
  }
`;
