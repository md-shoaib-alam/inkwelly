-- Part 1: the Class feature (medium / isVocational / isActive / slug).
ALTER TABLE "Class" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "Class" ADD COLUMN "medium" text DEFAULT 'English' NOT NULL;--> statement-breakpoint
ALTER TABLE "Class" ADD COLUMN "isVocational" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Class" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "Class_medium_idx" ON "Class" USING btree ("medium");--> statement-breakpoint
CREATE INDEX "Class_isActive_idx" ON "Class" USING btree ("isActive");--> statement-breakpoint
CREATE UNIQUE INDEX "Class_tenantId_slug_unique" ON "Class" USING btree ("tenantId","slug");--> statement-breakpoint

-- Part 2: NOT part of this feature. These statements were already owed by
-- HEAD's schema.ts -- the Certificate/FeeReceipt uniqueness was switched from
-- global to tenant-scoped and the Attendance/Fee indexes were renamed, but no
-- migration was ever generated for it. drizzle-kit folded them in here because
-- it diffs schema.ts against the last snapshot, not against this task.
-- Both constraint changes only *relax* (global unique implies tenant-scoped
-- unique), so they cannot fail on data that satisfied the old ones.
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_certificateNo_unique";--> statement-breakpoint
ALTER TABLE "FeeReceipt" DROP CONSTRAINT "FeeReceipt_receiptNumber_unique";--> statement-breakpoint
DROP INDEX "Attendance_tenantId_idx";--> statement-breakpoint
DROP INDEX "Attendance_tenantId_date_idx";--> statement-breakpoint
DROP INDEX "Attendance_studentId_idx";--> statement-breakpoint
DROP INDEX "Attendance_classId_idx";--> statement-breakpoint
DROP INDEX "Fee_studentId_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "Certificate_tenantId_certificateNo_unique" ON "Certificate" USING btree ("tenantId","certificateNo");--> statement-breakpoint
CREATE UNIQUE INDEX "FeeReceipt_tenantId_receiptNumber_unique" ON "FeeReceipt" USING btree ("tenantId","receiptNumber");--> statement-breakpoint
CREATE INDEX "Fee_tenantId_createdAt_idx" ON "Fee" USING btree ("tenantId","createdAt");
