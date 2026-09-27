DROP INDEX "Fee_studentId_status_idx";--> statement-breakpoint
CREATE INDEX "Fee_studentId_status_idx" ON "Fee" USING btree ("studentId","status","dueDate","feeCategoryId");