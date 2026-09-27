CREATE TABLE "AcademicYear" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL,
	"startDate" text NOT NULL,
	"endDate" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"isCurrent" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"subjectId" text NOT NULL,
	"classId" text NOT NULL,
	"teacherId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"dueDate" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"studentId" text NOT NULL,
	"classId" text NOT NULL,
	"date" text NOT NULL,
	"month" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'present' NOT NULL,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text,
	"userId" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"details" text DEFAULT '{}' NOT NULL,
	"ipAddress" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Certificate" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"studentId" text NOT NULL,
	"certificateType" text NOT NULL,
	"certificateNo" text NOT NULL,
	"issueDate" text NOT NULL,
	"content" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Certificate_certificateNo_unique" UNIQUE("certificateNo")
);
--> statement-breakpoint
CREATE TABLE "ClassTeacher" (
	"id" text PRIMARY KEY NOT NULL,
	"classId" text NOT NULL,
	"teacherId" text NOT NULL,
	"isClassTeacher" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Class" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL,
	"section" text DEFAULT 'A' NOT NULL,
	"grade" text NOT NULL,
	"capacity" integer DEFAULT 40 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CustomRole" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"permissions" text DEFAULT '{}' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Event" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" text NOT NULL,
	"endDate" text,
	"type" text DEFAULT 'general' NOT NULL,
	"targetRole" text DEFAULT 'all' NOT NULL,
	"color" text DEFAULT '#10b981' NOT NULL,
	"allDay" boolean DEFAULT false NOT NULL,
	"location" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExamResult" (
	"id" text PRIMARY KEY NOT NULL,
	"examId" text NOT NULL,
	"studentId" text NOT NULL,
	"marksObtained" double precision NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Exam" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"classId" text NOT NULL,
	"subjectId" text NOT NULL,
	"name" text NOT NULL,
	"examType" text NOT NULL,
	"date" text NOT NULL,
	"startTime" text,
	"endTime" text,
	"totalMarks" double precision DEFAULT 100 NOT NULL,
	"passingMarks" double precision DEFAULT 40 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExpenseCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Expense" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"categoryId" text NOT NULL,
	"amount" double precision NOT NULL,
	"date" text NOT NULL,
	"description" text,
	"paymentMethod" text DEFAULT 'cash' NOT NULL,
	"referenceNo" text,
	"status" text DEFAULT 'paid' NOT NULL,
	"receipt" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeeCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"frequency" text DEFAULT 'yearly' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeeConcession" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"studentId" text NOT NULL,
	"feeCategoryId" text,
	"concessionType" text NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"reason" text,
	"status" text DEFAULT 'active' NOT NULL,
	"validFrom" text,
	"validUntil" text,
	"approvedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeeReceipt" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"receiptNumber" text NOT NULL,
	"studentId" text NOT NULL,
	"feeIds" text NOT NULL,
	"totalAmount" double precision NOT NULL,
	"paidAmount" double precision NOT NULL,
	"concessionTotal" double precision DEFAULT 0 NOT NULL,
	"paymentMethod" text DEFAULT 'cash' NOT NULL,
	"paidDate" text NOT NULL,
	"collectedBy" text,
	"remarks" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "FeeReceipt_receiptNumber_unique" UNIQUE("receiptNumber")
);
--> statement-breakpoint
CREATE TABLE "FeeStructure" (
	"id" text PRIMARY KEY NOT NULL,
	"feeCategoryId" text NOT NULL,
	"classId" text NOT NULL,
	"amount" double precision NOT NULL,
	"academicYear" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Fee" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"studentId" text NOT NULL,
	"feeCategoryId" text,
	"amount" double precision NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"dueDate" text NOT NULL,
	"paidDate" text,
	"paidAmount" double precision DEFAULT 0 NOT NULL,
	"concession" double precision DEFAULT 0 NOT NULL,
	"receiptId" text,
	"receiptNumber" text,
	"paymentMethod" text,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Grade" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"studentId" text NOT NULL,
	"subjectId" text NOT NULL,
	"teacherId" text NOT NULL,
	"examType" text NOT NULL,
	"marks" double precision NOT NULL,
	"maxMarks" double precision NOT NULL,
	"grade" text,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Leave" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"userId" text NOT NULL,
	"userName" text NOT NULL,
	"userEmail" text NOT NULL,
	"role" text NOT NULL,
	"leaveType" text NOT NULL,
	"startDate" text NOT NULL,
	"endDate" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approvedBy" text,
	"approverRemarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Notice" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"authorId" text NOT NULL,
	"targetRole" text DEFAULT 'all' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "NotificationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"platform" text DEFAULT 'web' NOT NULL,
	"lastUsed" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "NotificationToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"type" text DEFAULT 'push' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Parent" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"occupation" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Parent_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "PlatformNotice" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"target" text DEFAULT 'everyone' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlatformRole" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#e11d48' NOT NULL,
	"permissions" text DEFAULT '{}' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlatformSetting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT 'false' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Promotion" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"studentId" text NOT NULL,
	"fromClassId" text NOT NULL,
	"toClassId" text,
	"academicYear" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"remarks" text,
	"type" text DEFAULT 'promotion' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StaffAttendance" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"tenantId" text NOT NULL,
	"date" text NOT NULL,
	"month" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'present' NOT NULL,
	"checkIn" text,
	"checkOut" text,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Student" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"rollNumber" text NOT NULL,
	"classId" text NOT NULL,
	"parentId" text,
	"academicYear" text DEFAULT '2024-2025' NOT NULL,
	"dateOfBirth" text,
	"gender" text DEFAULT 'male' NOT NULL,
	"bloodGroup" text,
	"admissionDate" text DEFAULT '2024-04-01' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Student_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "Subject" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"classId" text NOT NULL,
	"teacherId" text,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Submission" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"assignmentId" text NOT NULL,
	"studentId" text NOT NULL,
	"content" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"grade" text,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"parentId" text NOT NULL,
	"planName" text NOT NULL,
	"planId" text NOT NULL,
	"amount" double precision NOT NULL,
	"period" text DEFAULT 'yearly' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"paymentMethod" text DEFAULT 'card' NOT NULL,
	"transactionId" text,
	"startDate" text NOT NULL,
	"endDate" text,
	"autoRenew" boolean DEFAULT true NOT NULL,
	"addons" text DEFAULT '[]' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Teacher" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"qualification" text,
	"experience" text,
	"joiningDate" text DEFAULT '2024-04-01' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Teacher_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "Tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"address" text,
	"phone" text,
	"email" text,
	"website" text,
	"plan" text DEFAULT 'basic' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"maxStudents" integer DEFAULT 100 NOT NULL,
	"maxTeachers" integer DEFAULT 20 NOT NULL,
	"maxParents" integer DEFAULT 100 NOT NULL,
	"maxClasses" integer DEFAULT 10 NOT NULL,
	"settings" text DEFAULT '{}' NOT NULL,
	"startDate" text NOT NULL,
	"endDate" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "Tenant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "TicketMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"ticketId" text NOT NULL,
	"userId" text NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"createdBy" text NOT NULL,
	"assignedTo" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Timetable" (
	"id" text PRIMARY KEY NOT NULL,
	"classId" text NOT NULL,
	"subjectId" text,
	"teacherId" text,
	"day" text NOT NULL,
	"startTime" text NOT NULL,
	"endTime" text NOT NULL,
	"label" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TransportAssignment" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"routeId" text NOT NULL,
	"pickupPoint" text,
	"status" text DEFAULT 'active' NOT NULL,
	"startDate" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "TransportAssignment_studentId_unique" UNIQUE("studentId")
);
--> statement-breakpoint
CREATE TABLE "TransportRoute" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL,
	"fee" double precision NOT NULL,
	"vehicleId" text,
	"stops" text DEFAULT '[]' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"phone" text,
	"address" text,
	"avatar" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"customRoleId" text,
	"platformRoleId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "Vehicle" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"number" text NOT NULL,
	"type" text DEFAULT 'bus' NOT NULL,
	"capacity" integer DEFAULT 40 NOT NULL,
	"driverName" text,
	"driverPhone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Vehicle_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "AcademicYear_tenantId_name_unique" ON "AcademicYear" USING btree ("tenantId","name");--> statement-breakpoint
CREATE INDEX "AcademicYear_tenantId_idx" ON "AcademicYear" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "AcademicYear_status_idx" ON "AcademicYear" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Assignment_tenantId_idx" ON "Assignment" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Assignment_subjectId_idx" ON "Assignment" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "Assignment_classId_idx" ON "Assignment" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Assignment_teacherId_idx" ON "Assignment" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "Assignment_dueDate_idx" ON "Assignment" USING btree ("dueDate");--> statement-breakpoint
CREATE UNIQUE INDEX "Attendance_studentId_classId_date_unique" ON "Attendance" USING btree ("studentId","classId","date");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_idx" ON "Attendance" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_month_idx" ON "Attendance" USING btree ("tenantId","month");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_date_idx" ON "Attendance" USING btree ("tenantId","date");--> statement-breakpoint
CREATE INDEX "Attendance_studentId_idx" ON "Attendance" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "Attendance_classId_idx" ON "Attendance" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Attendance_date_idx" ON "Attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "Attendance_status_idx" ON "Attendance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Attendance_classId_date_status_idx" ON "Attendance" USING btree ("classId","date","status");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_date_studentId_idx" ON "Attendance" USING btree ("tenantId","date","studentId");--> statement-breakpoint
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance" USING btree ("studentId","date");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_classId_date_idx" ON "Attendance" USING btree ("tenantId","classId","date");--> statement-breakpoint
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" USING btree ("action");--> statement-breakpoint
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog" USING btree ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "AuditLog_tenantId_userId_idx" ON "AuditLog" USING btree ("tenantId","userId");--> statement-breakpoint
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog" USING btree ("tenantId","action");--> statement-breakpoint
CREATE INDEX "Certificate_tenantId_idx" ON "Certificate" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Certificate_studentId_idx" ON "Certificate" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "Certificate_certificateType_idx" ON "Certificate" USING btree ("certificateType");--> statement-breakpoint
CREATE UNIQUE INDEX "ClassTeacher_classId_teacherId_unique" ON "ClassTeacher" USING btree ("classId","teacherId");--> statement-breakpoint
CREATE INDEX "ClassTeacher_teacherId_idx" ON "ClassTeacher" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "Class_tenantId_idx" ON "Class" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Class_grade_idx" ON "Class" USING btree ("grade");--> statement-breakpoint
CREATE INDEX "CustomRole_tenantId_idx" ON "CustomRole" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "CustomRole_name_idx" ON "CustomRole" USING btree ("name");--> statement-breakpoint
CREATE INDEX "Event_tenantId_idx" ON "Event" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Event_date_idx" ON "Event" USING btree ("date");--> statement-breakpoint
CREATE INDEX "Event_type_idx" ON "Event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Event_targetRole_idx" ON "Event" USING btree ("targetRole");--> statement-breakpoint
CREATE UNIQUE INDEX "ExamResult_examId_studentId_unique" ON "ExamResult" USING btree ("examId","studentId");--> statement-breakpoint
CREATE INDEX "ExamResult_examId_idx" ON "ExamResult" USING btree ("examId");--> statement-breakpoint
CREATE INDEX "ExamResult_studentId_idx" ON "ExamResult" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "ExamResult_studentId_status_idx" ON "ExamResult" USING btree ("studentId","status");--> statement-breakpoint
CREATE INDEX "Exam_tenantId_idx" ON "Exam" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Exam_classId_idx" ON "Exam" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Exam_subjectId_idx" ON "Exam" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "Exam_status_idx" ON "Exam" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Exam_date_idx" ON "Exam" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "ExpenseCategory_tenantId_name_unique" ON "ExpenseCategory" USING btree ("tenantId","name");--> statement-breakpoint
CREATE INDEX "ExpenseCategory_tenantId_idx" ON "ExpenseCategory" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Expense_tenantId_idx" ON "Expense" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Expense_categoryId_idx" ON "Expense" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "Expense_date_idx" ON "Expense" USING btree ("date");--> statement-breakpoint
CREATE INDEX "Expense_status_idx" ON "Expense" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "FeeCategory_tenantId_code_unique" ON "FeeCategory" USING btree ("tenantId","code");--> statement-breakpoint
CREATE INDEX "FeeCategory_tenantId_idx" ON "FeeCategory" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "FeeConcession_tenantId_idx" ON "FeeConcession" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "FeeConcession_studentId_idx" ON "FeeConcession" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "FeeConcession_feeCategoryId_idx" ON "FeeConcession" USING btree ("feeCategoryId");--> statement-breakpoint
CREATE INDEX "FeeReceipt_tenantId_idx" ON "FeeReceipt" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "FeeReceipt_tenantId_paidDate_idx" ON "FeeReceipt" USING btree ("tenantId","paidDate");--> statement-breakpoint
CREATE INDEX "FeeReceipt_studentId_idx" ON "FeeReceipt" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "FeeReceipt_receiptNumber_idx" ON "FeeReceipt" USING btree ("receiptNumber");--> statement-breakpoint
CREATE UNIQUE INDEX "FeeStructure_feeCategoryId_classId_academicYear_unique" ON "FeeStructure" USING btree ("feeCategoryId","classId","academicYear");--> statement-breakpoint
CREATE INDEX "FeeStructure_feeCategoryId_idx" ON "FeeStructure" USING btree ("feeCategoryId");--> statement-breakpoint
CREATE INDEX "FeeStructure_classId_idx" ON "FeeStructure" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Fee_tenantId_idx" ON "Fee" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Fee_tenantId_status_idx" ON "Fee" USING btree ("tenantId","status");--> statement-breakpoint
CREATE INDEX "Fee_studentId_idx" ON "Fee" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "Fee_feeCategoryId_idx" ON "Fee" USING btree ("feeCategoryId");--> statement-breakpoint
CREATE INDEX "Fee_status_idx" ON "Fee" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Fee_type_idx" ON "Fee" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Fee_dueDate_idx" ON "Fee" USING btree ("dueDate");--> statement-breakpoint
CREATE INDEX "Fee_studentId_type_status_idx" ON "Fee" USING btree ("studentId","type","status");--> statement-breakpoint
CREATE INDEX "Fee_tenantId_dueDate_idx" ON "Fee" USING btree ("tenantId","dueDate");--> statement-breakpoint
CREATE INDEX "Fee_studentId_status_idx" ON "Fee" USING btree ("studentId","status");--> statement-breakpoint
CREATE INDEX "Fee_tenantId_paidDate_idx" ON "Fee" USING btree ("tenantId","paidDate");--> statement-breakpoint
CREATE UNIQUE INDEX "Grade_studentId_subjectId_examType_unique" ON "Grade" USING btree ("studentId","subjectId","examType");--> statement-breakpoint
CREATE INDEX "Grade_tenantId_idx" ON "Grade" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Grade_tenantId_examType_idx" ON "Grade" USING btree ("tenantId","examType");--> statement-breakpoint
CREATE INDEX "Grade_studentId_idx" ON "Grade" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "Grade_subjectId_idx" ON "Grade" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "Grade_teacherId_idx" ON "Grade" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "Grade_examType_idx" ON "Grade" USING btree ("examType");--> statement-breakpoint
CREATE INDEX "Grade_tenantId_createdAt_idx" ON "Grade" USING btree ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "Grade_studentId_examType_idx" ON "Grade" USING btree ("studentId","examType");--> statement-breakpoint
CREATE INDEX "Grade_tenantId_studentId_idx" ON "Grade" USING btree ("tenantId","studentId");--> statement-breakpoint
CREATE INDEX "Leave_tenantId_idx" ON "Leave" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Leave_userId_idx" ON "Leave" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Leave_approvedBy_idx" ON "Leave" USING btree ("approvedBy");--> statement-breakpoint
CREATE INDEX "Leave_status_idx" ON "Leave" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Notice_tenantId_idx" ON "Notice" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Notice_targetRole_idx" ON "Notice" USING btree ("targetRole");--> statement-breakpoint
CREATE INDEX "Notice_priority_idx" ON "Notice" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "Notice_createdAt_idx" ON "Notice" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Notice_tenantId_createdAt_idx" ON "Notice" USING btree ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "Notice_tenantId_authorId_idx" ON "Notice" USING btree ("tenantId","authorId");--> statement-breakpoint
CREATE INDEX "Notice_tenantId_targetRole_idx" ON "Notice" USING btree ("tenantId","targetRole");--> statement-breakpoint
CREATE INDEX "Notice_tenantId_priority_idx" ON "Notice" USING btree ("tenantId","priority");--> statement-breakpoint
CREATE INDEX "NotificationToken_userId_idx" ON "NotificationToken" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Notification_userId_idx" ON "Notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Notification_tenantId_idx" ON "Notification" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "PlatformNotice_createdAt_idx" ON "PlatformNotice" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "PlatformNotice_isActive_idx" ON "PlatformNotice" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "PlatformRole_name_idx" ON "PlatformRole" USING btree ("name");--> statement-breakpoint
CREATE INDEX "PlatformSetting_key_idx" ON "PlatformSetting" USING btree ("key");--> statement-breakpoint
CREATE INDEX "Promotion_tenantId_idx" ON "Promotion" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Promotion_studentId_idx" ON "Promotion" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "Promotion_fromClassId_idx" ON "Promotion" USING btree ("fromClassId");--> statement-breakpoint
CREATE INDEX "Promotion_toClassId_idx" ON "Promotion" USING btree ("toClassId");--> statement-breakpoint
CREATE INDEX "Promotion_status_idx" ON "Promotion" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "StaffAttendance_userId_date_unique" ON "StaffAttendance" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "StaffAttendance_tenantId_idx" ON "StaffAttendance" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "StaffAttendance_tenantId_month_idx" ON "StaffAttendance" USING btree ("tenantId","month");--> statement-breakpoint
CREATE INDEX "StaffAttendance_date_idx" ON "StaffAttendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "StaffAttendance_tenantId_date_idx" ON "StaffAttendance" USING btree ("tenantId","date");--> statement-breakpoint
CREATE INDEX "Student_classId_idx" ON "Student" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Student_parentId_idx" ON "Student" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "Student_gender_idx" ON "Student" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "Student_rollNumber_idx" ON "Student" USING btree ("rollNumber");--> statement-breakpoint
CREATE INDEX "Student_status_idx" ON "Student" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Subject_tenantId_idx" ON "Subject" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Subject_classId_idx" ON "Subject" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Subject_teacherId_idx" ON "Subject" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "Submission_tenantId_idx" ON "Submission" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Submission_assignmentId_idx" ON "Submission" USING btree ("assignmentId");--> statement-breakpoint
CREATE INDEX "Submission_studentId_idx" ON "Submission" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "Submission_status_idx" ON "Submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Subscription_parentId_idx" ON "Subscription" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "Subscription_status_idx" ON "Subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Subscription_planId_idx" ON "Subscription" USING btree ("planId");--> statement-breakpoint
CREATE INDEX "Subscription_createdAt_idx" ON "Subscription" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Subscription_tenantId_status_planName_idx" ON "Subscription" USING btree ("tenantId","status","planName");--> statement-breakpoint
CREATE INDEX "Tenant_status_idx" ON "Tenant" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Tenant_plan_idx" ON "Tenant" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "Tenant_createdAt_idx" ON "Tenant" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Tenant_deletedAt_idx" ON "Tenant" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage" USING btree ("ticketId");--> statement-breakpoint
CREATE INDEX "TicketMessage_userId_idx" ON "TicketMessage" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "TicketMessage_createdAt_idx" ON "TicketMessage" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Ticket_tenantId_idx" ON "Ticket" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Ticket_status_idx" ON "Ticket" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Ticket_priority_idx" ON "Ticket" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "Ticket_category_idx" ON "Ticket" USING btree ("category");--> statement-breakpoint
CREATE INDEX "Ticket_createdBy_idx" ON "Ticket" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "Ticket_assignedTo_idx" ON "Ticket" USING btree ("assignedTo");--> statement-breakpoint
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Ticket_tenantId_createdAt_idx" ON "Ticket" USING btree ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "Ticket_tenantId_category_idx" ON "Ticket" USING btree ("tenantId","category");--> statement-breakpoint
CREATE INDEX "Ticket_tenantId_createdBy_idx" ON "Ticket" USING btree ("tenantId","createdBy");--> statement-breakpoint
CREATE INDEX "Timetable_classId_idx" ON "Timetable" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Timetable_subjectId_idx" ON "Timetable" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "Timetable_teacherId_idx" ON "Timetable" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "Timetable_day_idx" ON "Timetable" USING btree ("day");--> statement-breakpoint
CREATE INDEX "TransportAssignment_routeId_idx" ON "TransportAssignment" USING btree ("routeId");--> statement-breakpoint
CREATE INDEX "TransportRoute_tenantId_idx" ON "TransportRoute" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "TransportRoute_vehicleId_idx" ON "TransportRoute" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "User_tenantId_idx" ON "User" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "User_role_idx" ON "User" USING btree ("role");--> statement-breakpoint
CREATE INDEX "User_isActive_idx" ON "User" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "User_createdAt_idx" ON "User" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "User_phone_idx" ON "User" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "User_customRoleId_idx" ON "User" USING btree ("customRoleId");--> statement-breakpoint
CREATE INDEX "User_platformRoleId_idx" ON "User" USING btree ("platformRoleId");--> statement-breakpoint
CREATE INDEX "Vehicle_tenantId_idx" ON "Vehicle" USING btree ("tenantId");