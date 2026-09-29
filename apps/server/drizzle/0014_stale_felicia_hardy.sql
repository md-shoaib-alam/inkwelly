CREATE TABLE "PromotionRun" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"fromSession" text NOT NULL,
	"toSession" text,
	"effectiveDate" text,
	"scope" text NOT NULL,
	"studentIds" json DEFAULT '[]'::json NOT NULL,
	"remarks" text,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "PromotionRun_tenantId_idx" ON "PromotionRun" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "PromotionRun_status_idx" ON "PromotionRun" USING btree ("status");