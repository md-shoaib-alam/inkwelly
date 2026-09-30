CREATE TABLE "StudentAddress" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text DEFAULT 'master' NOT NULL,
	"studentId" text NOT NULL,
	"addressType" text DEFAULT 'current' NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text,
	"state" text,
	"country" text,
	"postalCode" text,
	"landmark" text,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "StudentAddress_tenantId_idx" ON "StudentAddress" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "StudentAddress_studentId_idx" ON "StudentAddress" USING btree ("studentId");