ALTER TABLE "Assessment" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "Assessment_status_idx" ON "Assessment" USING btree ("status");