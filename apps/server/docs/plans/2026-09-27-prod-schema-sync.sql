-- =====================================================================
-- DrizzleFull — production schema sync: index set + document numbering
-- =====================================================================
-- Prepared 2026-09-27.  Target: production PostgreSQL 17 (managed).
-- Status: PREPARED, NOT RUN. Nothing here has touched production.
--
-- WHAT THIS COVERS
--   Exactly the gap between the dev database (which already has all of
--   this) and production, verified by diffing every index in the dev DB
--   against every index created by drizzle/0000..0010:
--     ADD   Certificate_tenantId_certificateNo_unique
--     ADD   FeeReceipt_tenantId_receiptNumber_unique
--     ADD   Fee_tenantId_createdAt_idx
--     DROP  Attendance_tenantId_idx / Attendance_tenantId_date_idx
--           Attendance_studentId_idx / Attendance_classId_idx
--           Fee_studentId_idx
--     DROP  Certificate_certificateNo_unique  (old platform-wide constraint)
--     DROP  FeeReceipt_receiptNumber_unique   (old platform-wide constraint)
--   Sources: 2026-09-26-index-audit.md §1/§4/§7, 2026-09-27-fee-optimization.md §2/§4.
--
-- HOW TO RUN
--   Run statement by statement, in the order given, as a superuser on the
--   app database:  psql "$DATABASE_URL" -f this-file.sql
--   Do NOT wrap this file in BEGIN/COMMIT and do not add \set ON_ERROR_STOP
--   inside a transaction: CREATE/DROP/REINDEX ... CONCURRENTLY cannot run
--   inside a transaction block. Each statement below is independently safe
--   to re-run — every one is IF [NOT] EXISTS.
--
-- DEPLOY ORDER — MATTERS
--   PART A must be applied BEFORE the new numbering code is deployed.
--   The reverse order re-opens a cross-school collision on certificate
--   generate and on fee payment (a payment rolls back entirely, so the
--   symptom is a lost payment attempt, not corrupt data).
--   PART B/C must ship together with the current src/db/schema.ts; that
--   file already describes this end state, so deploying the code without
--   this SQL (or vice versa) leaves drizzle-kit able to re-create the
--   indexes we just dropped.
--
-- WHO IS AWAITING THIS: only the operator. Do not run blind — read PART 0
--   first, and the two decision gates at A1 and PART D.
-- =====================================================================


-- =====================================================================
-- PART 0 — PRE-FLIGHT (read-only, changes nothing; run this first)
-- =====================================================================

-- 0.1 Version. REINDEX ... CONCURRENTLY needs PostgreSQL 12+.
SHOW server_version;

-- 0.2 Are the objects already in the desired state? If this returns the
--     three "should exist" rows and none of the six "should be gone" rows,
--     PART A/B/C are no-ops and you can skip to PART V.
SELECT c.relname AS index_or_constraint, c.relnamespace::regnamespace AS nsp, c.relkind
FROM pg_class c
WHERE c.relname IN (
  'Certificate_tenantId_certificateNo_unique',      -- should EXIST after
  'FeeReceipt_tenantId_receiptNumber_unique',       -- should EXIST after
  'Fee_tenantId_createdAt_idx',                     -- should EXIST after
  'Certificate_certificateNo_unique',               -- should be GONE after
  'FeeReceipt_receiptNumber_unique',                -- should be GONE after
  'Attendance_tenantId_idx',                        -- should be GONE after
  'Attendance_tenantId_date_idx',                   -- should be GONE after
  'Attendance_studentId_idx',                       -- should be GONE after
  'Attendance_classId_idx',                         -- should be GONE after
  'Fee_studentId_idx'                              -- should be GONE after
)
ORDER BY 1;

-- 0.3 Long-running transactions block CONCURRENTLY ops (they wait for the
--     snapshot to go away, and a CREATE INDEX CONCURRENTLY can hang for
--     minutes behind one). This must return no rows before you start.
SELECT pid, now() - xact_start AS xact_age, state, left(query, 80) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL AND now() - xact_start > interval '1 minute'
ORDER BY xact_age DESC;

-- 0.4 Current bloat baseline, so PART V can show what you reclaimed.
SELECT relname,
       pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
       n_live_tup, n_dead_tup, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE relname IN ('Attendance', 'Fee', 'FeeReceipt', 'Certificate')
ORDER BY pg_indexes_size(relid) DESC;


-- =====================================================================
-- PART A — PER-SCHOOL DOCUMENT NUMBERING
-- Run BEFORE deploying the new certificate/receipt numbering code.
-- Safe while the OLD code is live: old receipt numbers carry a millisecond
-- timestamp plus 12 random hex chars, so they stay unique under the
-- narrower per-school rule too.
-- =====================================================================

-- A1. DECISION GATE — must return ZERO rows before continuing.
--     The new indexes are unique per (tenantId, number). If any school
--     already holds the same number twice, the CONCURRENTLY build fails
--     and leaves an INVALID index (see A3 and the remediation note).
SELECT 'Certificate' AS tbl, "tenantId", "certificateNo" AS num, count(*) AS n
FROM "Certificate" GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL
SELECT 'FeeReceipt', "tenantId", "receiptNumber", count(*)
FROM "FeeReceipt" GROUP BY 2, 3 HAVING count(*) > 1;

-- A2. Add the per-school uniques first. CONCURRENTLY so fee payments and
--     certificate writes are never blocked; the per-school index is looser
--     than the platform-wide constraint still in place, so this build
--     cannot fail on cross-school duplicates.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "Certificate_tenantId_certificateNo_unique"
  ON "Certificate" USING btree ("tenantId", "certificateNo");

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "FeeReceipt_tenantId_receiptNumber_unique"
  ON "FeeReceipt" USING btree ("tenantId", "receiptNumber");

-- A3. Both must be valid before dropping anything. Any row here is a failed
--     CONCURRENTLY build; fix it before continuing:
--       DROP INDEX CONCURRENTLY "<the invalid name>";  -- then re-run A2
SELECT c.relname AS invalid_index
FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
WHERE NOT i.indisvalid;

-- A4. Now retire the platform-wide uniques. These were created as
--     constraints by drizzle/0000, so DROP CONSTRAINT is the real path;
--     DROP INDEX covers a database where they exist as bare indexes
--     instead (e.g. after a drizzle-kit db push). Both no-op if already
--     gone, so run both lines.
ALTER TABLE "Certificate"  DROP CONSTRAINT IF EXISTS "Certificate_certificateNo_unique";
ALTER TABLE "FeeReceipt"   DROP CONSTRAINT IF EXISTS "FeeReceipt_receiptNumber_unique";
DROP INDEX CONCURRENTLY IF EXISTS "Certificate_certificateNo_unique";
DROP INDEX CONCURRENTLY IF EXISTS "FeeReceipt_receiptNumber_unique";

-- A5. Confirm the numbering is now per-school only: expect exactly the two
--     "_tenantId_..._unique" indexes and no single-column unique.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('Certificate', 'FeeReceipt') AND indexdef LIKE '%UNIQUE%'
ORDER BY 1, 2;


-- =====================================================================
-- PART B — FEE LIST PAGE INDEX  (create before dropping its old friend)
-- Dev measurement: fee list page at OFFSET 1000 went 31 ms (parallel seq
-- scan of every row + top-N sort) to 0.21 ms (index scan).
-- =====================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Fee_tenantId_createdAt_idx"
  ON "Fee" USING btree ("tenantId", "createdAt" DESC);

-- "Fee_studentId_idx" is a strict prefix of both Fee_studentId_status_idx
-- and Fee_studentId_type_status_idx, which stay. A B-tree on (A, B) answers
-- every query a B-tree on (A) answers, so this drop removes a write tax
-- without removing an access path.
DROP INDEX CONCURRENTLY IF EXISTS "Fee_studentId_idx";

ANALYZE "Fee";


-- =====================================================================
-- PART C — ATTENDANCE PREFIX DROPS  (highest-write table in the system)
-- Every one of these is a strict prefix of an index that stays:
--   tenantId      -> tenantId_date_studentId_idx (+ 2 longer tenantId ones)
--   tenantId,date -> tenantId_date_studentId_idx
--   studentId     -> studentId_date_idx (+ the unique)
--   classId       -> classId_date_status_idx
-- Dev measurement after the drops: REST attendance list 2.4 ms -> 0.27 ms
-- via tenantId_date_studentId_idx, i.e. no plan regression.
-- Run one at a time and watch A3's invalid-index query after each.
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS "Attendance_tenantId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Attendance_tenantId_date_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Attendance_studentId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Attendance_classId_idx";

ANALYZE "Attendance";


-- =====================================================================
-- PART V — VERIFY (read-only). Run after A/B/C.
-- =====================================================================

-- V.1 Expected index set per table.
SELECT tablename, indexname FROM pg_indexes
WHERE tablename IN ('Attendance', 'Fee') ORDER BY 1, 2;

-- V.2 Sizes — this is what the change bought. Dev went 403 MB -> 246 MB on
--     Attendance after drops + PART Z reindexes.
SELECT relname, pg_size_pretty(pg_indexes_size(relid)) AS indexes_size
FROM pg_stat_user_tables
WHERE relname IN ('Attendance', 'Fee', 'FeeReceipt', 'Certificate')
ORDER BY pg_indexes_size(relid) DESC;

-- V.3 Spot-check the two plans this was all for. Substitute a real tenant id
--     and a recent date; both are quoted so they survive as literals.
EXPLAIN (ANALYZE) SELECT f.id FROM "Fee" f
WHERE f."tenantId" = '<REPLACE-WITH-REAL-TENANT-ID>'
ORDER BY f."createdAt" DESC LIMIT 100 OFFSET 1000;
-- expect: Index Scan (Backward) using Fee_tenantId_createdAt_idx, ~1 ms

EXPLAIN (ANALYZE) SELECT id FROM "Attendance"
WHERE "tenantId" = '<REPLACE-WITH-REAL-TENANT-ID>' AND date >= '<REPLACE-YYYY-MM-DD>'
ORDER BY date DESC, "studentId" LIMIT 20;
-- expect: Index Scan Backward using Attendance_tenantId_date_studentId_idx

-- V.4 Nothing left invalid.
SELECT c.relname FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
WHERE NOT i.indisvalid;


-- =====================================================================
-- PART Z — RECLAIM BLOAT (optional, do last, one at a time)
-- Dead index pages from a year of UPSERT churn do not come back with
-- VACUUM; only REINDEX rewrites them. Safe during school hours: CONCURRENTLY
-- builds a replacement and swaps it in. Each takes a few seconds per million
-- rows and needs temporary disk equal to the index size.
-- Skip if V.2 above already shows compact sizes.
-- =====================================================================

-- REINDEX INDEX CONCURRENTLY "Attendance_tenantId_date_studentId_idx";
-- REINDEX INDEX CONCURRENTLY "Attendance_studentId_classId_date_unique";
-- REINDEX INDEX CONCURRENTLY "Attendance_studentId_date_idx";
-- REINDEX INDEX CONCURRENTLY "Attendance_pkey";


-- =====================================================================
-- PART D — STILL UNDECIDED (deliberately commented out)
-- These three Attendance indexes are low-use but not provably redundant, so
-- the audit left them for production stats rather than dev-box noise. Rule:
-- drop only what shows idx_scan = 0 over at least one full school week, and
-- note the counters reset on restart — let the database run a few school
-- days after any restart before judging.
-- =====================================================================

-- Decide first:
-- SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS size
-- FROM pg_stat_user_indexes WHERE relname = 'Attendance' ORDER BY idx_scan;
--
-- Then, only for those that came back at zero:
-- DROP INDEX CONCURRENTLY IF EXISTS "Attendance_status_idx";
-- DROP INDEX CONCURRENTLY IF EXISTS "Attendance_date_idx";
-- DROP INDEX CONCURRENTLY IF EXISTS "Attendance_tenantId_month_idx";


-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- Nothing in this file touches rows. Every drop is reversible with the
-- statements below, and the numbering change is reversible ONLY if no two
-- schools have been assigned the same number since A4 — check first:
--
--   SELECT "certificateNo", count(DISTINCT "tenantId") c FROM "Certificate"
--   GROUP BY 1 HAVING count(DISTINCT "tenantId") > 1;
--   SELECT "receiptNumber", count(DISTINCT "tenantId") c FROM "FeeReceipt"
--   GROUP BY 1 HAVING count(DISTINCT "tenantId") > 1;
--
-- Numbering (put the platform-wide uniques back; fails if the check above
-- returned rows, which is the point):
--   DROP INDEX CONCURRENTLY IF EXISTS "Certificate_tenantId_certificateNo_unique";
--   DROP INDEX CONCURRENTLY IF EXISTS "FeeReceipt_tenantId_receiptNumber_unique";
--   ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_certificateNo_unique" UNIQUE ("certificateNo");
--   ALTER TABLE "FeeReceipt"  ADD CONSTRAINT "FeeReceipt_receiptNumber_unique"  UNIQUE ("receiptNumber");
--   -- and redeploy the previous code build, which assumes platform-wide uniqueness.
--
-- Indexes (restore pre-file shape; also remember to revert src/db/schema.ts,
-- which no longer declares these):
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Attendance_tenantId_idx"        ON "Attendance" ("tenantId");
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Attendance_tenantId_date_idx"   ON "Attendance" ("tenantId", "date");
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Attendance_studentId_idx"       ON "Attendance" ("studentId");
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Attendance_classId_idx"         ON "Attendance" ("classId");
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Fee_studentId_idx"              ON "Fee" ("studentId");
--   DROP INDEX CONCURRENTLY IF EXISTS "Fee_tenantId_createdAt_idx";
