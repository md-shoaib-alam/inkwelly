CREATE TABLE "TenantIntegration" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"accountLabel" text,
	"config" text DEFAULT '{}' NOT NULL,
	"secrets" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"connectedAt" timestamp,
	"lastSyncAt" timestamp,
	"lastError" text,
	"createdById" text,
	"updatedById" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "TenantIntegration" ADD CONSTRAINT "TenantIntegration_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "TenantIntegration_tenantId_provider_unique" ON "TenantIntegration" USING btree ("tenantId","provider");--> statement-breakpoint
CREATE INDEX "TenantIntegration_tenantId_idx" ON "TenantIntegration" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "TenantIntegration_status_idx" ON "TenantIntegration" USING btree ("status");