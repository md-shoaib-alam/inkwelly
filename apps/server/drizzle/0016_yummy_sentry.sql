CREATE TABLE "StudentIdSetting" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"schoolCode" text DEFAULT '' NOT NULL,
	"studentIdEnabled" boolean DEFAULT false NOT NULL,
	"studentIdPrefix" text DEFAULT 'STU' NOT NULL,
	"studentIdNumberLength" integer DEFAULT 4 NOT NULL,
	"studentIdFormat" text DEFAULT '{PREFIX}{YEAR}{SEQ}' NOT NULL,
	"studentIdResetEveryYear" boolean DEFAULT true NOT NULL,
	"studentIdStartFrom" integer,
	"admissionNoEnabled" boolean DEFAULT false NOT NULL,
	"admissionNoPrefix" text DEFAULT 'ADM' NOT NULL,
	"admissionNoNumberLength" integer DEFAULT 4 NOT NULL,
	"admissionNoFormat" text DEFAULT '{PREFIX}{YEAR}{SEQ}' NOT NULL,
	"admissionNoResetEveryYear" boolean DEFAULT true NOT NULL,
	"admissionNoStartFrom" integer,
	"rollNumberEnabled" boolean DEFAULT false NOT NULL,
	"rollNumberStartingNumber" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "StudentIdSetting_tenantId_uq" ON "StudentIdSetting" USING btree ("tenantId");