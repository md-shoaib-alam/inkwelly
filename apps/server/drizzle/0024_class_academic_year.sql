-- Year-scope the Class table. Deliberately un-journaled like 0022/0023: this repo's
-- drizzle ledger drifts, so apply this file directly and verify with pg_indexes.
-- `bun sql` is not available on this machine's Bun (v1.4.2); use a one-off postgres.js
-- script that splits on `--> statement-breakpoint` and makes each statement idempotent
-- (ADD COLUMN / CREATE INDEX -> IF NOT EXISTS, DROP INDEX -> IF EXISTS) before running.
--
-- The column default STAYS (same pattern as Student/Exam): bulk class import and the
-- seeds lean on it, while POST /classes stamps the tenant's real current session.
ALTER TABLE "Class" ADD COLUMN "academicYear" text DEFAULT '2024-2025' NOT NULL;
--> statement-breakpoint
-- Categorise existing classes under the session their school is actually running;
-- tenants without a current session keep the column default.
UPDATE "Class" c SET "academicYear" = y."name"
FROM "AcademicYear" y WHERE y."tenantId" = c."tenantId" AND y."isCurrent" = true;
--> statement-breakpoint
-- Next session's "Class 10 - A" must be a new row, not a uniqueness collision.
DROP INDEX "Class_tenantId_name_section_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "Class_tenantId_name_section_academicYear_unique" ON "Class" USING btree ("tenantId","name","section","academicYear");
--> statement-breakpoint
CREATE INDEX "Class_tenantId_academicYear_idx" ON "Class" USING btree ("tenantId","academicYear");
