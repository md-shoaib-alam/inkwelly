DROP INDEX "Assessment_status_idx";--> statement-breakpoint
ALTER TABLE "Exam" ADD COLUMN "academicYear" text DEFAULT '2024-2025' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "username" text;--> statement-breakpoint
CREATE INDEX "User_username_idx" ON "User" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "User_tenantId_username_unique" ON "User" USING btree ("tenantId","username");