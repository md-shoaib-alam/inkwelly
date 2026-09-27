CREATE TABLE "AssessmentGrade" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"assessmentId" text NOT NULL,
	"studentId" text NOT NULL,
	"marksObtained" double precision NOT NULL,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Assessment" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"classId" text NOT NULL,
	"subjectId" text NOT NULL,
	"teacherId" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"totalMarks" double precision DEFAULT 25 NOT NULL,
	"passingMarks" double precision DEFAULT 10 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Assignment" ADD COLUMN "mode" text DEFAULT 'offline' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "AssessmentGrade_assessmentId_studentId_unique" ON "AssessmentGrade" USING btree ("assessmentId","studentId");--> statement-breakpoint
CREATE INDEX "AssessmentGrade_tenantId_idx" ON "AssessmentGrade" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "AssessmentGrade_assessmentId_idx" ON "AssessmentGrade" USING btree ("assessmentId");--> statement-breakpoint
CREATE INDEX "AssessmentGrade_studentId_idx" ON "AssessmentGrade" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "Assessment_tenantId_idx" ON "Assessment" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Assessment_classId_idx" ON "Assessment" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "Assessment_subjectId_idx" ON "Assessment" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "Assessment_teacherId_idx" ON "Assessment" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "Assignment_mode_idx" ON "Assignment" USING btree ("mode");