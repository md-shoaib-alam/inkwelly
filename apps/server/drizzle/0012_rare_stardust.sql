ALTER TABLE "Student" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Student" ADD COLUMN "deletedBy" text;--> statement-breakpoint
ALTER TABLE "Student" ADD COLUMN "deletionReason" text;