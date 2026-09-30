CREATE TABLE "AttendanceSetting" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"cutoffTime" text DEFAULT '09:00' NOT NULL,
	"targetRate" integer DEFAULT 92 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "AttendanceSetting_tenantId_uq" ON "AttendanceSetting" USING btree ("tenantId");