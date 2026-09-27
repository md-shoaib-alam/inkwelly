import { relations } from 'drizzle-orm';
import * as schema from './schema';

export const tenantsRelations = relations(schema.tenants, ({ many }) => ({
  academicYears: many(schema.academicYears),
  assignments: many(schema.assignments),
  attendance: many(schema.attendance),
  auditLogs: many(schema.auditLogs),
  certificates: many(schema.certificates),
  classes: many(schema.classes),
  customRoles: many(schema.customRoles),
  events: many(schema.events),
  exams: many(schema.exams),
  expenses: many(schema.expenses),
  expenseCategories: many(schema.expenseCategories),
  fees: many(schema.fees),
  feeCategories: many(schema.feeCategories),
  feeConcessions: many(schema.feeConcessions),
  receipts: many(schema.feeReceipts),
  grades: many(schema.grades),
  leaves: many(schema.leaves),
  notices: many(schema.notices),
  promotions: many(schema.promotions),
  staffAttendance: many(schema.staffAttendance),
  subjects: many(schema.subjects),
  submissions: many(schema.submissions),
  subscriptions: many(schema.subscriptions),
  tickets: many(schema.tickets),
  transportRoutes: many(schema.transportRoutes),
  users: many(schema.users),
  vehicles: many(schema.vehicles),
  notifications: many(schema.notifications),
}));

export const auditLogsRelations = relations(schema.auditLogs, ({ one }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.auditLogs.tenantId],
    references: [schema.tenants.id],
  }),
  user: one(schema.users, {
    fields: [schema.auditLogs.userId],
    references: [schema.users.id],
  }),
}));

export const usersRelations = relations(schema.users, ({ one, many }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.users.tenantId],
    references: [schema.tenants.id],
  }),
  customRole: one(schema.customRoles, {
    fields: [schema.users.customRoleId],
    references: [schema.customRoles.id],
  }),
  platformRole: one(schema.platformRoles, {
    fields: [schema.users.platformRoleId],
    references: [schema.platformRoles.id],
  }),
  auditLogs: many(schema.auditLogs),
  approvedLeaves: many(schema.leaves, { relationName: 'ApprovedBy' }),
  leaves: many(schema.leaves, { relationName: 'UserLeaves' }),
  notices: many(schema.notices),
  notificationTokens: many(schema.notificationTokens),
  notifications: many(schema.notifications),
  parent: one(schema.parents, {
    fields: [schema.users.id],
    references: [schema.parents.userId],
  }),
  staffAttendance: many(schema.staffAttendance),
  student: one(schema.students, {
    fields: [schema.users.id],
    references: [schema.students.userId],
  }),
  teacher: one(schema.teachers, {
    fields: [schema.users.id],
    references: [schema.teachers.userId],
  }),
  assignedTickets: many(schema.tickets, { relationName: 'TicketAssignee' }),
  createdTickets: many(schema.tickets, { relationName: 'TicketCreator' }),
  ticketMessages: many(schema.ticketMessages),
}));

export const studentsRelations = relations(schema.students, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.students.userId],
    references: [schema.users.id],
  }),
  class: one(schema.classes, {
    fields: [schema.students.classId],
    references: [schema.classes.id],
  }),
  parent: one(schema.parents, {
    fields: [schema.students.parentId],
    references: [schema.parents.id],
  }),
  attendance: many(schema.attendance),
  certificates: many(schema.certificates),
  examResults: many(schema.examResults),
  fees: many(schema.fees),
  concessions: many(schema.feeConcessions),
  receipts: many(schema.feeReceipts),
  grades: many(schema.grades),
  promotions: many(schema.promotions),
  submissions: many(schema.submissions),
  transport: one(schema.transportAssignments, {
    fields: [schema.students.id],
    references: [schema.transportAssignments.studentId],
  }),
}));

export const teachersRelations = relations(schema.teachers, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.teachers.userId],
    references: [schema.users.id],
  }),
  assignments: many(schema.assignments),
  classes: many(schema.classTeachers),
  grades: many(schema.grades),
  subjects: many(schema.subjects),
  timetable: many(schema.timetables),
}));

export const parentsRelations = relations(schema.parents, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.parents.userId],
    references: [schema.users.id],
  }),
  students: many(schema.students),
  subscriptions: many(schema.subscriptions),
}));

export const classesRelations = relations(schema.classes, ({ one, many }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.classes.tenantId],
    references: [schema.tenants.id],
  }),
  assignments: many(schema.assignments),
  attendance: many(schema.attendance),
  teachers: many(schema.classTeachers),
  exams: many(schema.exams),
  feeStructures: many(schema.feeStructures),
  fromPromotions: many(schema.promotions, { relationName: 'FromClass' }),
  toPromotions: many(schema.promotions, { relationName: 'ToClass' }),
  students: many(schema.students),
  subjects: many(schema.subjects),
  timetable: many(schema.timetables),
}));

export const classTeachersRelations = relations(schema.classTeachers, ({ one }) => ({
  class: one(schema.classes, {
    fields: [schema.classTeachers.classId],
    references: [schema.classes.id],
  }),
  teacher: one(schema.teachers, {
    fields: [schema.classTeachers.teacherId],
    references: [schema.teachers.id],
  }),
}));

export const subjectsRelations = relations(schema.subjects, ({ one, many }) => ({
  class: one(schema.classes, {
    fields: [schema.subjects.classId],
    references: [schema.classes.id],
  }),
  teacher: one(schema.teachers, {
    fields: [schema.subjects.teacherId],
    references: [schema.teachers.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.subjects.tenantId],
    references: [schema.tenants.id],
  }),
  assignments: many(schema.assignments),
  exams: many(schema.exams),
  grades: many(schema.grades),
  timetable: many(schema.timetables),
}));

export const attendanceRelations = relations(schema.attendance, ({ one }) => ({
  class: one(schema.classes, {
    fields: [schema.attendance.classId],
    references: [schema.classes.id],
  }),
  student: one(schema.students, {
    fields: [schema.attendance.studentId],
    references: [schema.students.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.attendance.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const gradesRelations = relations(schema.grades, ({ one }) => ({
  student: one(schema.students, {
    fields: [schema.grades.studentId],
    references: [schema.students.id],
  }),
  subject: one(schema.subjects, {
    fields: [schema.grades.subjectId],
    references: [schema.subjects.id],
  }),
  teacher: one(schema.teachers, {
    fields: [schema.grades.teacherId],
    references: [schema.teachers.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.grades.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const assignmentsRelations = relations(schema.assignments, ({ one, many }) => ({
  class: one(schema.classes, {
    fields: [schema.assignments.classId],
    references: [schema.classes.id],
  }),
  subject: one(schema.subjects, {
    fields: [schema.assignments.subjectId],
    references: [schema.subjects.id],
  }),
  teacher: one(schema.teachers, {
    fields: [schema.assignments.teacherId],
    references: [schema.teachers.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.assignments.tenantId],
    references: [schema.tenants.id],
  }),
  submissions: many(schema.submissions),
}));

export const submissionsRelations = relations(schema.submissions, ({ one }) => ({
  assignment: one(schema.assignments, {
    fields: [schema.submissions.assignmentId],
    references: [schema.assignments.id],
  }),
  student: one(schema.students, {
    fields: [schema.submissions.studentId],
    references: [schema.students.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.submissions.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const feesRelations = relations(schema.fees, ({ one }) => ({
  category: one(schema.feeCategories, {
    fields: [schema.fees.feeCategoryId],
    references: [schema.feeCategories.id],
  }),
  student: one(schema.students, {
    fields: [schema.fees.studentId],
    references: [schema.students.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.fees.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const feeCategoriesRelations = relations(schema.feeCategories, ({ one, many }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.feeCategories.tenantId],
    references: [schema.tenants.id],
  }),
  fees: many(schema.fees),
  concessions: many(schema.feeConcessions),
  structures: many(schema.feeStructures),
}));

export const feeStructuresRelations = relations(schema.feeStructures, ({ one }) => ({
  class: one(schema.classes, {
    fields: [schema.feeStructures.classId],
    references: [schema.classes.id],
  }),
  category: one(schema.feeCategories, {
    fields: [schema.feeStructures.feeCategoryId],
    references: [schema.feeCategories.id],
  }),
}));

export const feeConcessionsRelations = relations(schema.feeConcessions, ({ one }) => ({
  category: one(schema.feeCategories, {
    fields: [schema.feeConcessions.feeCategoryId],
    references: [schema.feeCategories.id],
  }),
  student: one(schema.students, {
    fields: [schema.feeConcessions.studentId],
    references: [schema.students.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.feeConcessions.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const feeReceiptsRelations = relations(schema.feeReceipts, ({ one }) => ({
  student: one(schema.students, {
    fields: [schema.feeReceipts.studentId],
    references: [schema.students.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.feeReceipts.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const transportRoutesRelations = relations(schema.transportRoutes, ({ one, many }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.transportRoutes.tenantId],
    references: [schema.tenants.id],
  }),
  vehicle: one(schema.vehicles, {
    fields: [schema.transportRoutes.vehicleId],
    references: [schema.vehicles.id],
  }),
  students: many(schema.transportAssignments),
}));

export const vehiclesRelations = relations(schema.vehicles, ({ one, many }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.vehicles.tenantId],
    references: [schema.tenants.id],
  }),
  routes: many(schema.transportRoutes),
}));

export const transportAssignmentsRelations = relations(schema.transportAssignments, ({ one }) => ({
  route: one(schema.transportRoutes, {
    fields: [schema.transportAssignments.routeId],
    references: [schema.transportRoutes.id],
  }),
  student: one(schema.students, {
    fields: [schema.transportAssignments.studentId],
    references: [schema.students.id],
  }),
}));

export const noticesRelations = relations(schema.notices, ({ one }) => ({
  author: one(schema.users, {
    fields: [schema.notices.authorId],
    references: [schema.users.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.notices.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const notificationsRelations = relations(schema.notifications, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.notifications.userId],
    references: [schema.users.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.notifications.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const timetablesRelations = relations(schema.timetables, ({ one }) => ({
  class: one(schema.classes, {
    fields: [schema.timetables.classId],
    references: [schema.classes.id],
  }),
  subject: one(schema.subjects, {
    fields: [schema.timetables.subjectId],
    references: [schema.subjects.id],
  }),
  teacher: one(schema.teachers, {
    fields: [schema.timetables.teacherId],
    references: [schema.teachers.id],
  }),
}));

export const eventsRelations = relations(schema.events, ({ one }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.events.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const subscriptionsRelations = relations(schema.subscriptions, ({ one }) => ({
  parent: one(schema.parents, {
    fields: [schema.subscriptions.parentId],
    references: [schema.parents.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.subscriptions.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const platformRolesRelations = relations(schema.platformRoles, ({ many }) => ({
  users: many(schema.users),
}));

export const ticketsRelations = relations(schema.tickets, ({ one, many }) => ({
  assignee: one(schema.users, {
    fields: [schema.tickets.assignedTo],
    references: [schema.users.id],
    relationName: 'TicketAssignee',
  }),
  creator: one(schema.users, {
    fields: [schema.tickets.createdBy],
    references: [schema.users.id],
    relationName: 'TicketCreator',
  }),
  tenant: one(schema.tenants, {
    fields: [schema.tickets.tenantId],
    references: [schema.tenants.id],
  }),
  messages: many(schema.ticketMessages),
}));

export const ticketMessagesRelations = relations(schema.ticketMessages, ({ one }) => ({
  ticket: one(schema.tickets, {
    fields: [schema.ticketMessages.ticketId],
    references: [schema.tickets.id],
  }),
  author: one(schema.users, {
    fields: [schema.ticketMessages.userId],
    references: [schema.users.id],
  }),
}));

export const assessmentsRelations = relations(schema.assessments, ({ one, many }) => ({
  class: one(schema.classes, {
    fields: [schema.assessments.classId],
    references: [schema.classes.id],
  }),
  subject: one(schema.subjects, {
    fields: [schema.assessments.subjectId],
    references: [schema.subjects.id],
  }),
  teacher: one(schema.teachers, {
    fields: [schema.assessments.teacherId],
    references: [schema.teachers.id],
  }),
  grades: many(schema.assessmentGrades),
}));

export const assessmentGradesRelations = relations(schema.assessmentGrades, ({ one }) => ({
  assessment: one(schema.assessments, {
    fields: [schema.assessmentGrades.assessmentId],
    references: [schema.assessments.id],
  }),
  student: one(schema.students, {
    fields: [schema.assessmentGrades.studentId],
    references: [schema.students.id],
  }),
}));


export const customRolesRelations = relations(schema.customRoles, ({ one, many }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.customRoles.tenantId],
    references: [schema.tenants.id],
  }),
  users: many(schema.users),
}));

export const staffAttendanceRelations = relations(schema.staffAttendance, ({ one }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.staffAttendance.tenantId],
    references: [schema.tenants.id],
  }),
  user: one(schema.users, {
    fields: [schema.staffAttendance.userId],
    references: [schema.users.id],
  }),
}));

export const promotionsRelations = relations(schema.promotions, ({ one }) => ({
  fromClass: one(schema.classes, {
    fields: [schema.promotions.fromClassId],
    references: [schema.classes.id],
    relationName: 'FromClass',
  }),
  student: one(schema.students, {
    fields: [schema.promotions.studentId],
    references: [schema.students.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.promotions.tenantId],
    references: [schema.tenants.id],
  }),
  toClass: one(schema.classes, {
    fields: [schema.promotions.toClassId],
    references: [schema.classes.id],
    relationName: 'ToClass',
  }),
}));

export const certificatesRelations = relations(schema.certificates, ({ one }) => ({
  student: one(schema.students, {
    fields: [schema.certificates.studentId],
    references: [schema.students.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.certificates.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const leavesRelations = relations(schema.leaves, ({ one }) => ({
  approver: one(schema.users, {
    fields: [schema.leaves.approvedBy],
    references: [schema.users.id],
    relationName: 'ApprovedBy',
  }),
  tenant: one(schema.tenants, {
    fields: [schema.leaves.tenantId],
    references: [schema.tenants.id],
  }),
  user: one(schema.users, {
    fields: [schema.leaves.userId],
    references: [schema.users.id],
    relationName: 'UserLeaves',
  }),
}));

export const examsRelations = relations(schema.exams, ({ one, many }) => ({
  class: one(schema.classes, {
    fields: [schema.exams.classId],
    references: [schema.classes.id],
  }),
  subject: one(schema.subjects, {
    fields: [schema.exams.subjectId],
    references: [schema.subjects.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.exams.tenantId],
    references: [schema.tenants.id],
  }),
  results: many(schema.examResults),
}));

export const examResultsRelations = relations(schema.examResults, ({ one }) => ({
  exam: one(schema.exams, {
    fields: [schema.examResults.examId],
    references: [schema.exams.id],
  }),
  student: one(schema.students, {
    fields: [schema.examResults.studentId],
    references: [schema.students.id],
  }),
}));

export const academicYearsRelations = relations(schema.academicYears, ({ one }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.academicYears.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const expenseCategoryRelations = relations(schema.expenseCategories, ({ one, many }) => ({
  tenant: one(schema.tenants, {
    fields: [schema.expenseCategories.tenantId],
    references: [schema.tenants.id],
  }),
  expenses: many(schema.expenses),
}));

export const expensesRelations = relations(schema.expenses, ({ one }) => ({
  category: one(schema.expenseCategories, {
    fields: [schema.expenses.categoryId],
    references: [schema.expenseCategories.id],
  }),
  tenant: one(schema.tenants, {
    fields: [schema.expenses.tenantId],
    references: [schema.tenants.id],
  }),
}));

export const notificationTokensRelations = relations(schema.notificationTokens, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.notificationTokens.userId],
    references: [schema.users.id],
  }),
}));
