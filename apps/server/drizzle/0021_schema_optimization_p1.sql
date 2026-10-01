CREATE TABLE "ParentContact" (
	"id" text PRIMARY KEY NOT NULL,
	"parentId" text NOT NULL,
	"relationship" text NOT NULL,
	"title" text,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text,
	"mobile" text,
	"education" text,
	"workAddress" text,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "Attendance_tenantId_month_idx";--> statement-breakpoint
DROP INDEX "Attendance_date_idx";--> statement-breakpoint
DROP INDEX "Attendance_status_idx";--> statement-breakpoint
DROP INDEX "Attendance_studentId_date_idx";--> statement-breakpoint
DROP INDEX "Attendance_tenantId_classId_date_idx";--> statement-breakpoint
ALTER TABLE "Assignment" ADD COLUMN "academicYear" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Attendance" ADD COLUMN "academicYear" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Fee" ADD COLUMN "academicYear" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Grade" ADD COLUMN "academicYear" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Submission" ADD COLUMN "academicYear" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ParentContact" ADD CONSTRAINT "ParentContact_parentId_Parent_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."Parent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ParentContact_parentId_idx" ON "ParentContact" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "ParentContact_relationship_idx" ON "ParentContact" USING btree ("relationship");--> statement-breakpoint
CREATE INDEX "ParentContact_mobile_idx" ON "ParentContact" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "Assignment_tenantId_academicYear_idx" ON "Assignment" USING btree ("tenantId","academicYear");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_academicYear_month_idx" ON "Attendance" USING btree ("tenantId","academicYear","month");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_academicYear_date_idx" ON "Attendance" USING btree ("tenantId","academicYear","date");--> statement-breakpoint
CREATE INDEX "Attendance_tenantId_classId_academicYear_date_idx" ON "Attendance" USING btree ("tenantId","classId","academicYear","date");--> statement-breakpoint
CREATE INDEX "Fee_tenantId_academicYear_idx" ON "Fee" USING btree ("tenantId","academicYear");--> statement-breakpoint
CREATE INDEX "Grade_tenantId_academicYear_idx" ON "Grade" USING btree ("tenantId","academicYear");--> statement-breakpoint
CREATE INDEX "Grade_studentId_academicYear_idx" ON "Grade" USING btree ("studentId","academicYear");--> statement-breakpoint
CREATE INDEX "Student_classId_academicYear_status_idx" ON "Student" USING btree ("classId","academicYear","status");--> statement-breakpoint
CREATE INDEX "Student_academicYear_createdAt_idx" ON "Student" USING btree ("academicYear","createdAt");--> statement-breakpoint
CREATE INDEX "Submission_tenantId_academicYear_idx" ON "Submission" USING btree ("tenantId","academicYear");--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "fatherTitle";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "fatherFirstName";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "fatherMiddleName";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "fatherLastName";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "fatherMobile";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "fatherEducation";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "fatherWorkAddress";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherTitle";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherFirstName";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherMiddleName";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherLastName";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherMobile";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherOccupation";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherEducation";--> statement-breakpoint
ALTER TABLE "Parent" DROP COLUMN "motherWorkAddress";