-- Search speed: trigram (pg_trgm) GIN indexes so the existing ILIKE '%term%'
-- searches can use an index instead of full-scanning.
-- Covers every server-side search column: users search (name/email/username),
-- roll-number search, and tenant-name search (super-admin list).
-- No query changes are needed; Postgres uses these indexes for ILIKE automatically.
-- NOTE: CREATE EXTENSION needs a superuser connection (local: yes; Render: allowed).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "User_name_trgm_idx" ON "User" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING gin ("email" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_username_trgm_idx" ON "User" USING gin ("username" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Student_rollNumber_trgm_idx" ON "Student" USING gin ("rollNumber" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Tenant_name_trgm_idx" ON "Tenant" USING gin ("name" gin_trgm_ops);
