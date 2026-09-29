ALTER TABLE "Parent" ADD COLUMN "fatherTitle" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "fatherFirstName" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "fatherMiddleName" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "fatherLastName" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "fatherMobile" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "fatherEducation" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "fatherWorkAddress" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherTitle" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherFirstName" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherMiddleName" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherLastName" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherMobile" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherOccupation" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherEducation" text;--> statement-breakpoint
ALTER TABLE "Parent" ADD COLUMN "motherWorkAddress" text;--> statement-breakpoint
ALTER TABLE "Student" ADD COLUMN "isRte" boolean DEFAULT false NOT NULL;