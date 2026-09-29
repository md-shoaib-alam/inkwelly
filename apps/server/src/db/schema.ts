import { pgTable, text, timestamp, integer, boolean, doublePrecision, numeric, index, uniqueIndex, foreignKey, primaryKey } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// --- Tables ---

export const tenants = pgTable('Tenant', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  plan: text('plan').default('basic').notNull(),
  status: text('status').default('active').notNull(),
  maxStudents: integer('maxStudents').default(100).notNull(),
  maxTeachers: integer('maxTeachers').default(20).notNull(),
  maxParents: integer('maxParents').default(100).notNull(),
  maxClasses: integer('maxClasses').default(10).notNull(),
  settings: text('settings').default('{}').notNull(),
  startDate: text('startDate').notNull(),
  endDate: text('endDate'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  deletedAt: timestamp('deletedAt'),
}, (table) => ({
  statusIdx: index('Tenant_status_idx').on(table.status),
  planIdx: index('Tenant_plan_idx').on(table.plan),
  createdAtIdx: index('Tenant_createdAt_idx').on(table.createdAt),
  deletedAtIdx: index('Tenant_deletedAt_idx').on(table.deletedAt),
}));

export const auditLogs = pgTable('AuditLog', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId'),
  userId: text('userId'),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  details: text('details').default('{}').notNull(),
  ipAddress: text('ipAddress'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('AuditLog_tenantId_idx').on(table.tenantId),
  actionIdx: index('AuditLog_action_idx').on(table.action),
  createdAtIdx: index('AuditLog_createdAt_idx').on(table.createdAt),
  tenantCreatedAtIdx: index('AuditLog_tenantId_createdAt_idx').on(table.tenantId, table.createdAt),
  tenantUserIdIdx: index('AuditLog_tenantId_userId_idx').on(table.tenantId, table.userId),
  tenantActionIdx: index('AuditLog_tenantId_action_idx').on(table.tenantId, table.action),
}));

export const users = pgTable('User', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId'),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').default('student').notNull(),
  phone: text('phone'),
  username: text('username'),
  address: text('address'),
  avatar: text('avatar'),
  isActive: boolean('isActive').default(true).notNull(),
  customRoleId: text('customRoleId'),
  platformRoleId: text('platformRoleId'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('User_tenantId_idx').on(table.tenantId),
  roleIdx: index('User_role_idx').on(table.role),
  isActiveIdx: index('User_isActive_idx').on(table.isActive),
  createdAtIdx: index('User_createdAt_idx').on(table.createdAt),
  phoneIdx: index('User_phone_idx').on(table.phone),
  usernameIdx: index('User_username_idx').on(table.username),
  tenantUsernameUnique: uniqueIndex('User_tenantId_username_unique').on(table.tenantId, table.username),
  customRoleIdIdx: index('User_customRoleId_idx').on(table.customRoleId),
  platformRoleIdIdx: index('User_platformRoleId_idx').on(table.platformRoleId),
  tenantRoleActiveIdx: index('User_tenantId_role_isActive_idx').on(table.tenantId, table.role, table.isActive),
}));

export const refreshTokens = pgTable('RefreshToken', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  token: text('token').notNull().unique(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: text('tenantId'),
  userAgent: text('userAgent'),
  ipAddress: text('ipAddress'),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('RefreshToken_userId_idx').on(table.userId),
  expiresAtIdx: index('RefreshToken_expiresAt_idx').on(table.expiresAt),
}));

export const students = pgTable('Student', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().unique(),
  rollNumber: text('rollNumber').notNull(),
  classId: text('classId').notNull(),
  parentId: text('parentId'),
  academicYear: text('academicYear').default('2024-2025').notNull(),
  dateOfBirth: text('dateOfBirth'),
  gender: text('gender').default('male').notNull(),
  bloodGroup: text('bloodGroup'),
  admissionDate: text('admissionDate').default('2024-04-01').notNull(),
  admissionNo: text('admissionNo'),
  title: text('title'),
  firstName: text('firstName'),
  middleName: text('middleName'),
  lastName: text('lastName'),
  peNumber: text('peNumber'),
  abcId: text('abcId'),
  apaarId: text('apaarId'),
  aadhaarNo: text('aadhaarNo'),
  religion: text('religion'),
  nationality: text('nationality'),
  motherTongue: text('motherTongue'),
  casteCategory: text('casteCategory'),
  registrationNo: text('registrationNo'),
  joiningDate: text('joiningDate'),
  remarks: text('remarks'),
  isRte: boolean('isRte').default(false).notNull(),
  status: text('status').default('active').notNull(),
  deletedAt: timestamp('deletedAt'),
  deletedBy: text('deletedBy'),
  deletionReason: text('deletionReason'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  classIdIdx: index('Student_classId_idx').on(table.classId),
  parentIdIdx: index('Student_parentId_idx').on(table.parentId),
  genderIdx: index('Student_gender_idx').on(table.gender),
  rollNumberIdx: index('Student_rollNumber_idx').on(table.rollNumber),
  statusIdx: index('Student_status_idx').on(table.status),
  classStatusIdx: index('Student_classId_status_idx').on(table.classId, table.status),
}));

export const teachers = pgTable('Teacher', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().unique(),
  qualification: text('qualification'),
  experience: text('experience'),
  joiningDate: text('joiningDate').default('2024-04-01').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const parents = pgTable('Parent', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().unique(),
  occupation: text('occupation'),
  fatherTitle: text('fatherTitle'),
  fatherFirstName: text('fatherFirstName'),
  fatherMiddleName: text('fatherMiddleName'),
  fatherLastName: text('fatherLastName'),
  fatherMobile: text('fatherMobile'),
  fatherEducation: text('fatherEducation'),
  fatherWorkAddress: text('fatherWorkAddress'),
  motherTitle: text('motherTitle'),
  motherFirstName: text('motherFirstName'),
  motherMiddleName: text('motherMiddleName'),
  motherLastName: text('motherLastName'),
  motherMobile: text('motherMobile'),
  motherOccupation: text('motherOccupation'),
  motherEducation: text('motherEducation'),
  motherWorkAddress: text('motherWorkAddress'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const classes = pgTable('Class', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  name: text('name').notNull(),
  slug: text('slug'),
  section: text('section').default('A').notNull(),
  grade: text('grade').notNull(),
  medium: text('medium').default('English').notNull(),
  isVocational: boolean('isVocational').default(false).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  capacity: integer('capacity').default(40).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Class_tenantId_idx').on(table.tenantId),
  gradeIdx: index('Class_grade_idx').on(table.grade),
  mediumIdx: index('Class_medium_idx').on(table.medium),
  activeIdx: index('Class_isActive_idx').on(table.isActive),
  tenantGradeIdx: index('Class_tenantId_grade_idx').on(table.tenantId, table.grade),
  tenantNameSectionUnique: uniqueIndex('Class_tenantId_name_section_unique').on(table.tenantId, table.name, table.section),
  tenantSlugUnique: uniqueIndex('Class_tenantId_slug_unique').on(table.tenantId, table.slug),
}));

export const classTeachers = pgTable('ClassTeacher', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  classId: text('classId').notNull(),
  teacherId: text('teacherId').notNull(),
  isClassTeacher: boolean('isClassTeacher').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  classTeacherUnique: uniqueIndex('ClassTeacher_classId_teacherId_unique').on(table.classId, table.teacherId),
  teacherIdIdx: index('ClassTeacher_teacherId_idx').on(table.teacherId),
}));

export const subjects = pgTable('Subject', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  code: text('code').notNull(),
  classId: text('classId').notNull(),
  teacherId: text('teacherId'),
  tenantId: text('tenantId').default('master').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Subject_tenantId_idx').on(table.tenantId),
  classIdIdx: index('Subject_classId_idx').on(table.classId),
  teacherIdIdx: index('Subject_teacherId_idx').on(table.teacherId),
  tenantClassIdx: index('Subject_tenantId_classId_idx').on(table.tenantId, table.classId),
}));

export const attendance = pgTable('Attendance', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  studentId: text('studentId').notNull(),
  classId: text('classId').notNull(),
  date: text('date').notNull(),
  month: text('month').default('').notNull(),
  status: text('status').default('present').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  studentClassDateUnique: uniqueIndex('Attendance_studentId_classId_date_unique').on(table.studentId, table.classId, table.date),
  tenantMonthIdx: index('Attendance_tenantId_month_idx').on(table.tenantId, table.month),
  dateIdx: index('Attendance_date_idx').on(table.date),
  statusIdx: index('Attendance_status_idx').on(table.status),
  classDateStatusIdx: index('Attendance_classId_date_status_idx').on(table.classId, table.date, table.status),
  tenantDateStudentIdx: index('Attendance_tenantId_date_studentId_idx').on(table.tenantId, table.date, table.studentId),
  studentDateIdx: index('Attendance_studentId_date_idx').on(table.studentId, table.date),
  tenantClassDateIdx: index('Attendance_tenantId_classId_date_idx').on(table.tenantId, table.classId, table.date),
}));

export const grades = pgTable('Grade', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  studentId: text('studentId').notNull(),
  subjectId: text('subjectId').notNull(),
  teacherId: text('teacherId').notNull(),
  examType: text('examType').notNull(),
  marks: doublePrecision('marks').notNull(),
  maxMarks: doublePrecision('maxMarks').notNull(),
  grade: text('grade'),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  studentSubjectExamUnique: uniqueIndex('Grade_studentId_subjectId_examType_unique').on(table.studentId, table.subjectId, table.examType),
  tenantIdIdx: index('Grade_tenantId_idx').on(table.tenantId),
  tenantExamTypeIdx: index('Grade_tenantId_examType_idx').on(table.tenantId, table.examType),
  studentIdIdx: index('Grade_studentId_idx').on(table.studentId),
  subjectIdIdx: index('Grade_subjectId_idx').on(table.subjectId),
  teacherIdIdx: index('Grade_teacherId_idx').on(table.teacherId),
  examTypeIdx: index('Grade_examType_idx').on(table.examType),
  tenantCreatedAtIdx: index('Grade_tenantId_createdAt_idx').on(table.tenantId, table.createdAt),
  studentExamTypeIdx: index('Grade_studentId_examType_idx').on(table.studentId, table.examType),
  tenantStudentIdx: index('Grade_tenantId_studentId_idx').on(table.tenantId, table.studentId),
}));

export const assignments = pgTable('Assignment', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  subjectId: text('subjectId').notNull(),
  classId: text('classId').notNull(),
  teacherId: text('teacherId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('dueDate').notNull(),
  status: text('status').default('active').notNull(),
  mode: text('mode').default('offline').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Assignment_tenantId_idx').on(table.tenantId),
  subjectIdIdx: index('Assignment_subjectId_idx').on(table.subjectId),
  classIdIdx: index('Assignment_classId_idx').on(table.classId),
  teacherIdIdx: index('Assignment_teacherId_idx').on(table.teacherId),
  dueDateIdx: index('Assignment_dueDate_idx').on(table.dueDate),
  statusIdx: index('Assignment_status_idx').on(table.status),
  modeIdx: index('Assignment_mode_idx').on(table.mode),
}));

export const submissions = pgTable('Submission', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  assignmentId: text('assignmentId').notNull(),
  studentId: text('studentId').notNull(),
  content: text('content'),
  status: text('status').default('submitted').notNull(),
  submittedAt: timestamp('submittedAt').defaultNow().notNull(),
  grade: text('grade'),
  feedback: text('feedback'),
}, (table) => ({
  tenantIdIdx: index('Submission_tenantId_idx').on(table.tenantId),
  assignmentIdIdx: index('Submission_assignmentId_idx').on(table.assignmentId),
  studentIdIdx: index('Submission_studentId_idx').on(table.studentId),
  statusIdx: index('Submission_status_idx').on(table.status),
}));

export const fees = pgTable('Fee', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  studentId: text('studentId').notNull(),
  feeCategoryId: text('feeCategoryId'),
  amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  type: text('type').notNull(),
  status: text('status').default('pending').notNull(),
  dueDate: text('dueDate').notNull(),
  paidDate: text('paidDate'),
  paidAmount: numeric('paidAmount', { precision: 12, scale: 2, mode: 'number' }).default(0).notNull(),
  concession: numeric('concession', { precision: 12, scale: 2, mode: 'number' }).default(0).notNull(),
  receiptId: text('receiptId'),
  receiptNumber: text('receiptNumber'),
  paymentMethod: text('paymentMethod'),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Fee_tenantId_idx').on(table.tenantId),
  tenantStatusIdx: index('Fee_tenantId_status_idx').on(table.tenantId, table.status),
  tenantCreatedAtIdx: index('Fee_tenantId_createdAt_idx').on(table.tenantId, table.createdAt),
  feeCategoryIdIdx: index('Fee_feeCategoryId_idx').on(table.feeCategoryId),
  statusIdx: index('Fee_status_idx').on(table.status),
  typeIdx: index('Fee_type_idx').on(table.type),
  dueDateIdx: index('Fee_dueDate_idx').on(table.dueDate),
  studentTypeStatusIdx: index('Fee_studentId_type_status_idx').on(table.studentId, table.type, table.status),
  tenantDueDateIdx: index('Fee_tenantId_dueDate_idx').on(table.tenantId, table.dueDate),
  studentStatusIdx: index('Fee_studentId_status_idx').on(table.studentId, table.status, table.dueDate, table.feeCategoryId),
  tenantPaidDateIdx: index('Fee_tenantId_paidDate_idx').on(table.tenantId, table.paidDate),
}));

export const feeCategories = pgTable('FeeCategory', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  frequency: text('frequency').default('yearly').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: uniqueIndex('FeeCategory_tenantId_code_unique').on(table.tenantId, table.code),
  tenantIdIdx: index('FeeCategory_tenantId_idx').on(table.tenantId),
}));

export const feeStructures = pgTable('FeeStructure', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  feeCategoryId: text('feeCategoryId').notNull(),
  classId: text('classId').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  academicYear: text('academicYear').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  feeCategoryClassYearUnique: uniqueIndex('FeeStructure_feeCategoryId_classId_academicYear_unique').on(table.feeCategoryId, table.classId, table.academicYear),
  feeCategoryIdIdx: index('FeeStructure_feeCategoryId_idx').on(table.feeCategoryId),
  classIdIdx: index('FeeStructure_classId_idx').on(table.classId),
}));

export const feeConcessions = pgTable('FeeConcession', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  studentId: text('studentId').notNull(),
  feeCategoryId: text('feeCategoryId'),
  concessionType: text('concessionType').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).default(0).notNull(),
  reason: text('reason'),
  status: text('status').default('active').notNull(),
  validFrom: text('validFrom'),
  validUntil: text('validUntil'),
  approvedBy: text('approvedBy'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('FeeConcession_tenantId_idx').on(table.tenantId),
  studentIdIdx: index('FeeConcession_studentId_idx').on(table.studentId),
  feeCategoryIdIdx: index('FeeConcession_feeCategoryId_idx').on(table.feeCategoryId),
}));

export const feeReceipts = pgTable('FeeReceipt', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').default('master').notNull(),
  receiptNumber: text('receiptNumber').notNull(),
  studentId: text('studentId').notNull(),
  feeIds: text('feeIds').notNull(),
  totalAmount: numeric('totalAmount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  paidAmount: numeric('paidAmount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  concessionTotal: numeric('concessionTotal', { precision: 12, scale: 2, mode: 'number' }).default(0).notNull(),
  paymentMethod: text('paymentMethod').default('cash').notNull(),
  paidDate: text('paidDate').notNull(),
  collectedBy: text('collectedBy'),
  remarks: text('remarks'),
  status: text('status').default('completed').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('FeeReceipt_tenantId_idx').on(table.tenantId),
  tenantPaidDateIdx: index('FeeReceipt_tenantId_paidDate_idx').on(table.tenantId, table.paidDate),
  studentIdIdx: index('FeeReceipt_studentId_idx').on(table.studentId),
  receiptNumberIdx: index('FeeReceipt_receiptNumber_idx').on(table.receiptNumber),
  tenantReceiptNumberUnique: uniqueIndex('FeeReceipt_tenantId_receiptNumber_unique').on(table.tenantId, table.receiptNumber),
}));

export const transportRoutes = pgTable('TransportRoute', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  name: text('name').notNull(),
  fee: numeric('fee', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  vehicleId: text('vehicleId'),
  stops: text('stops').default('[]').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('TransportRoute_tenantId_idx').on(table.tenantId),
  vehicleIdIdx: index('TransportRoute_vehicleId_idx').on(table.vehicleId),
}));

export const vehicles = pgTable('Vehicle', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  number: text('number').notNull().unique(),
  type: text('type').default('bus').notNull(),
  capacity: integer('capacity').default(40).notNull(),
  driverName: text('driverName'),
  driverPhone: text('driverPhone'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Vehicle_tenantId_idx').on(table.tenantId),
}));

export const transportAssignments = pgTable('TransportAssignment', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  studentId: text('studentId').notNull().unique(),
  routeId: text('routeId').notNull(),
  pickupPoint: text('pickupPoint'),
  status: text('status').default('active').notNull(),
  startDate: text('startDate').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  routeIdIdx: index('TransportAssignment_routeId_idx').on(table.routeId),
}));

export const notices = pgTable('Notice', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('authorId').notNull(),
  targetRole: text('targetRole').default('all').notNull(),
  priority: text('priority').default('normal').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Notice_tenantId_idx').on(table.tenantId),
  targetRoleIdx: index('Notice_targetRole_idx').on(table.targetRole),
  priorityIdx: index('Notice_priority_idx').on(table.priority),
  createdAtIdx: index('Notice_createdAt_idx').on(table.createdAt),
  tenantCreatedAtIdx: index('Notice_tenantId_createdAt_idx').on(table.tenantId, table.createdAt),
  tenantAuthorIdx: index('Notice_tenantId_authorId_idx').on(table.tenantId, table.authorId),
  tenantTargetRoleIdx: index('Notice_tenantId_targetRole_idx').on(table.tenantId, table.targetRole),
  tenantPriorityIdx: index('Notice_tenantId_priority_idx').on(table.tenantId, table.priority),
}));

export const notifications = pgTable('Notification', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId'),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isRead: boolean('isRead').default(false).notNull(),
  type: text('type').default('push').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('Notification_userId_idx').on(table.userId),
  tenantIdIdx: index('Notification_tenantId_idx').on(table.tenantId),
  createdAtIdx: index('Notification_createdAt_idx').on(table.createdAt),
}));

export const platformNotices = pgTable('PlatformNotice', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  target: text('target').default('everyone').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('PlatformNotice_createdAt_idx').on(table.createdAt),
  isActiveIdx: index('PlatformNotice_isActive_idx').on(table.isActive),
}));

export const timetables = pgTable('Timetable', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  classId: text('classId').notNull(),
  subjectId: text('subjectId'),
  teacherId: text('teacherId'),
  day: text('day').notNull(),
  startTime: text('startTime').notNull(),
  endTime: text('endTime').notNull(),
  label: text('label'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  classIdIdx: index('Timetable_classId_idx').on(table.classId),
  subjectIdIdx: index('Timetable_subjectId_idx').on(table.subjectId),
  teacherIdIdx: index('Timetable_teacherId_idx').on(table.teacherId),
  dayIdx: index('Timetable_day_idx').on(table.day),
}));

export const events = pgTable('Event', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  endDate: text('endDate'),
  type: text('type').default('general').notNull(),
  targetRole: text('targetRole').default('all').notNull(),
  color: text('color').default('#10b981').notNull(),
  allDay: boolean('allDay').default(false).notNull(),
  location: text('location'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Event_tenantId_idx').on(table.tenantId),
  dateIdx: index('Event_date_idx').on(table.date),
  typeIdx: index('Event_type_idx').on(table.type),
  targetRoleIdx: index('Event_targetRole_idx').on(table.targetRole),
}));

export const subscriptions = pgTable('Subscription', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  parentId: text('parentId').notNull(),
  planName: text('planName').notNull(),
  planId: text('planId').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  period: text('period').default('yearly').notNull(),
  status: text('status').default('active').notNull(),
  paymentMethod: text('paymentMethod').default('card').notNull(),
  transactionId: text('transactionId'),
  startDate: text('startDate').notNull(),
  endDate: text('endDate'),
  autoRenew: boolean('autoRenew').default(true).notNull(),
  addons: text('addons').default('[]').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Subscription_tenantId_idx').on(table.tenantId),
  parentIdIdx: index('Subscription_parentId_idx').on(table.parentId),
  statusIdx: index('Subscription_status_idx').on(table.status),
  planIdIdx: index('Subscription_planId_idx').on(table.planId),
  createdAtIdx: index('Subscription_createdAt_idx').on(table.createdAt),
  tenantStatusPlanIdx: index('Subscription_tenantId_status_planName_idx').on(table.tenantId, table.status, table.planName),
}));

export const platformRoles = pgTable('PlatformRole', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#e11d48').notNull(),
  permissions: text('permissions').default('{}').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('PlatformRole_name_idx').on(table.name),
}));

export const tickets = pgTable('Ticket', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').default('open').notNull(),
  priority: text('priority').default('medium').notNull(),
  category: text('category').default('general').notNull(),
  createdBy: text('createdBy').notNull(),
  assignedTo: text('assignedTo'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Ticket_tenantId_idx').on(table.tenantId),
  statusIdx: index('Ticket_status_idx').on(table.status),
  priorityIdx: index('Ticket_priority_idx').on(table.priority),
  categoryIdx: index('Ticket_category_idx').on(table.category),
  createdByIdx: index('Ticket_createdBy_idx').on(table.createdBy),
  assignedToIdx: index('Ticket_assignedTo_idx').on(table.assignedTo),
  createdAtIdx: index('Ticket_createdAt_idx').on(table.createdAt),
  tenantCreatedAtIdx: index('Ticket_tenantId_createdAt_idx').on(table.tenantId, table.createdAt),
  tenantCategoryIdx: index('Ticket_tenantId_category_idx').on(table.tenantId, table.category),
  tenantCreatedByIdx: index('Ticket_tenantId_createdBy_idx').on(table.tenantId, table.createdBy),
}));

export const ticketMessages = pgTable('TicketMessage', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ticketId: text('ticketId').notNull(),
  userId: text('userId').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index('TicketMessage_ticketId_idx').on(table.ticketId),
  userIdIdx: index('TicketMessage_userId_idx').on(table.userId),
  createdAtIdx: index('TicketMessage_createdAt_idx').on(table.createdAt),
}));

export const platformSettings = pgTable('PlatformSetting', {
  key: text('key').primaryKey(),
  value: text('value').default('false').notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('PlatformSetting_key_idx').on(table.key),
}));

export const customRoles = pgTable('CustomRole', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#6366f1').notNull(),
  permissions: text('permissions').default('{}').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('CustomRole_tenantId_idx').on(table.tenantId),
  nameIdx: index('CustomRole_name_idx').on(table.name),
}));

export const staffAttendance = pgTable('StaffAttendance', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  tenantId: text('tenantId').notNull(),
  date: text('date').notNull(),
  month: text('month').default('').notNull(),
  status: text('status').default('present').notNull(),
  checkIn: text('checkIn'),
  checkOut: text('checkOut'),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  userDateUnique: uniqueIndex('StaffAttendance_userId_date_unique').on(table.userId, table.date),
  tenantIdIdx: index('StaffAttendance_tenantId_idx').on(table.tenantId),
  tenantMonthIdx: index('StaffAttendance_tenantId_month_idx').on(table.tenantId, table.month),
  dateIdx: index('StaffAttendance_date_idx').on(table.date),
  tenantDateIdx: index('StaffAttendance_tenantId_date_idx').on(table.tenantId, table.date),
}));

export const promotions = pgTable('Promotion', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  studentId: text('studentId').notNull(),
  fromClassId: text('fromClassId').notNull(),
  toClassId: text('toClassId'),
  academicYear: text('academicYear').notNull(),
  status: text('status').default('pending').notNull(),
  remarks: text('remarks'),
  type: text('type').default('promotion').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Promotion_tenantId_idx').on(table.tenantId),
  studentIdIdx: index('Promotion_studentId_idx').on(table.studentId),
  fromClassIdIdx: index('Promotion_fromClassId_idx').on(table.fromClassId),
  toClassIdIdx: index('Promotion_toClassId_idx').on(table.toClassId),
  statusIdx: index('Promotion_status_idx').on(table.status),
}));

export const certificates = pgTable('Certificate', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  studentId: text('studentId').notNull(),
  certificateType: text('certificateType').notNull(),
  certificateNo: text('certificateNo').notNull(),
  issueDate: text('issueDate').notNull(),
  content: text('content').default('{}').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Certificate_tenantId_idx').on(table.tenantId),
  studentIdIdx: index('Certificate_studentId_idx').on(table.studentId),
  certificateTypeIdx: index('Certificate_certificateType_idx').on(table.certificateType),
  tenantCertificateNoUnique: uniqueIndex('Certificate_tenantId_certificateNo_unique').on(table.tenantId, table.certificateNo),
}));

export const leaves = pgTable('Leave', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  userId: text('userId').notNull(),
  userName: text('userName').notNull(),
  userEmail: text('userEmail').notNull(),
  role: text('role').notNull(),
  leaveType: text('leaveType').notNull(),
  startDate: text('startDate').notNull(),
  endDate: text('endDate').notNull(),
  reason: text('reason'),
  status: text('status').default('pending').notNull(),
  approvedBy: text('approvedBy'),
  approverRemarks: text('approverRemarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Leave_tenantId_idx').on(table.tenantId),
  userIdIdx: index('Leave_userId_idx').on(table.userId),
  approvedByIdx: index('Leave_approvedBy_idx').on(table.approvedBy),
  statusIdx: index('Leave_status_idx').on(table.status),
}));

export const exams = pgTable('Exam', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  classId: text('classId').notNull(),
  subjectId: text('subjectId').notNull(),
  name: text('name').notNull(),
  examType: text('examType').notNull(),
  academicYear: text('academicYear').default('2024-2025').notNull(),
  date: text('date').notNull(),
  startTime: text('startTime'),
  endTime: text('endTime'),
  totalMarks: doublePrecision('totalMarks').default(100).notNull(),
  passingMarks: doublePrecision('passingMarks').default(40).notNull(),
  status: text('status').default('scheduled').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Exam_tenantId_idx').on(table.tenantId),
  classIdIdx: index('Exam_classId_idx').on(table.classId),
  subjectIdIdx: index('Exam_subjectId_idx').on(table.subjectId),
  statusIdx: index('Exam_status_idx').on(table.status),
  dateIdx: index('Exam_date_idx').on(table.date),
}));

export const examResults = pgTable('ExamResult', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  examId: text('examId').notNull(),
  studentId: text('studentId').notNull(),
  marksObtained: doublePrecision('marksObtained').notNull(),
  status: text('status').default('pending').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  examStudentUnique: uniqueIndex('ExamResult_examId_studentId_unique').on(table.examId, table.studentId),
  examIdIdx: index('ExamResult_examId_idx').on(table.examId),
  studentIdIdx: index('ExamResult_studentId_idx').on(table.studentId),
  studentStatusIdx: index('ExamResult_studentId_status_idx').on(table.studentId, table.status),
}));

export const academicYears = pgTable('AcademicYear', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  name: text('name').notNull(),
  startDate: text('startDate').notNull(),
  endDate: text('endDate').notNull(),
  status: text('status').default('active').notNull(),
  isCurrent: boolean('isCurrent').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantNameUnique: uniqueIndex('AcademicYear_tenantId_name_unique').on(table.tenantId, table.name),
  tenantIdIdx: index('AcademicYear_tenantId_idx').on(table.tenantId),
  statusIdx: index('AcademicYear_status_idx').on(table.status),
}));

export const expenseCategories = pgTable('ExpenseCategory', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantNameUnique: uniqueIndex('ExpenseCategory_tenantId_name_unique').on(table.tenantId, table.name),
  tenantIdIdx: index('ExpenseCategory_tenantId_idx').on(table.tenantId),
}));

export const expenses = pgTable('Expense', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  categoryId: text('categoryId').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  date: text('date').notNull(),
  description: text('description'),
  paymentMethod: text('paymentMethod').default('cash').notNull(),
  referenceNo: text('referenceNo'),
  status: text('status').default('paid').notNull(),
  receipt: text('receipt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Expense_tenantId_idx').on(table.tenantId),
  categoryIdIdx: index('Expense_categoryId_idx').on(table.categoryId),
  dateIdx: index('Expense_date_idx').on(table.date),
  statusIdx: index('Expense_status_idx').on(table.status),
}));

export const notificationTokens = pgTable('NotificationToken', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  token: text('token').notNull().unique(),
  platform: text('platform').default('web').notNull(),
  lastUsed: timestamp('lastUsed').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('NotificationToken_userId_idx').on(table.userId),
}));

export const assessments = pgTable('Assessment', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  classId: text('classId').notNull(),
  subjectId: text('subjectId').notNull(),
  teacherId: text('teacherId').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // unit_test, quiz, practical
  totalMarks: doublePrecision('totalMarks').default(25).notNull(),
  passingMarks: doublePrecision('passingMarks').default(10).notNull(),
  status: text('status').default('active').notNull(), // active, completed
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('Assessment_tenantId_idx').on(table.tenantId),
  classIdIdx: index('Assessment_classId_idx').on(table.classId),
  subjectIdIdx: index('Assessment_subjectId_idx').on(table.subjectId),
  teacherIdIdx: index('Assessment_teacherId_idx').on(table.teacherId),
}));

export const assessmentGrades = pgTable('AssessmentGrade', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull(),
  assessmentId: text('assessmentId').notNull(),
  studentId: text('studentId').notNull(),
  marksObtained: doublePrecision('marksObtained').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantStudentUnique: uniqueIndex('AssessmentGrade_assessmentId_studentId_unique').on(table.assessmentId, table.studentId),
  tenantIdIdx: index('AssessmentGrade_tenantId_idx').on(table.tenantId),
  assessmentIdIdx: index('AssessmentGrade_assessmentId_idx').on(table.assessmentId),
  studentIdIdx: index('AssessmentGrade_studentId_idx').on(table.studentId),
}));

// One row per school per vendor. A row exists only once the school starts connecting it:
// "not set up" and "needs upgrade" are derived from plan + absence of a row, never stored.
export const tenantIntegrations = pgTable('TenantIntegration', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tenantId: text('tenantId').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  status: text('status').default('pending').notNull(),
  accountLabel: text('accountLabel'),
  config: text('config').default('{}').notNull(),
  // AES-256-GCM blob of the field schema's secret values. Write-only through the API.
  secrets: text('secrets'),
  enabled: boolean('enabled').default(true).notNull(),
  connectedAt: timestamp('connectedAt'),
  lastSyncAt: timestamp('lastSyncAt'),
  lastError: text('lastError'),
  createdById: text('createdById'),
  updatedById: text('updatedById'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  tenantProviderUnique: uniqueIndex('TenantIntegration_tenantId_provider_unique').on(table.tenantId, table.provider),
  tenantIdIdx: index('TenantIntegration_tenantId_idx').on(table.tenantId),
  statusIdx: index('TenantIntegration_status_idx').on(table.status),
}));

