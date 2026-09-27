ALTER TABLE "Assignment" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "Assignment_status_idx" ON "Assignment" USING btree ("status");