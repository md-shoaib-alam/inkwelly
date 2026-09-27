-- Manual rollback for 0010_red_nextwave.sql
-- Drops the per-school third-party integration registry.
-- Not registered in drizzle/meta/_journal.json, so `bun run db:migrate` will not pick it up.
-- Run it by hand only if you must go back, then also remove tenantIntegrations from src/db/schema.ts.
--
-- WARNING: this deletes every stored integration status, config and encrypted credential blob.
-- There is no export path for those rows yet, so take a pg_dump first.

DROP TABLE IF EXISTS "TenantIntegration";
