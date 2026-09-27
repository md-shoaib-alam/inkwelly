# Index Audit — Attendance & hot tables (spec §9 issue 8)

**Date:** 2026-09-26 · **Scope:** read-only analysis on the local DB (which
replicates the production shape the spec recorded: **142 MB heap vs 403 MB of
indexes on Attendance, 1.09 M rows**). No index was created, dropped, or
reindexed for this audit. The draft migration at the bottom needs your
approval and a production `pg_stat_user_indexes` check first.

---

## 1. Inventory — all 13 Attendance indexes

Local `idx_scan` = dev-box usage only; **prod numbers must come from the VPS**
(query in §5). Sizes are local.

| Index | Columns | Size | Local scans | Verdict |
| --- | --- | --- | --- | --- |
| `Attendance_pkey` | id | 52 MB | 0 | keep (PK); bloated → reindex |
| `Attendance_studentId_classId_date_unique` | studentId, classId, date | 86 MB | 0 | **keep — correctness**: UPSERT conflict target (`attendance.ts:177,394`); bloated → reindex |
| `Attendance_tenantId_date_studentId_idx` | tenantId, date, studentId | 120 MB | 28 | keep (covers REST list + dashboard date ranges); severely bloated → reindex |
| `Attendance_studentId_date_idx` | studentId, date | 68 MB | 33 | keep (student history, loaders.ts top-50, deletes); bloated → reindex |
| `Attendance_classId_date_status_idx` | classId, date, status | 12 MB | 102 | keep — hottest index (all GraphQL classId paths); EXPLAIN confirms index-only scans |
| `Attendance_tenantId_classId_date_idx` | tenantId, classId, date | 9 MB | 53 | keep |
| `Attendance_tenantId_month_idx` | tenantId, month | 7.4 MB | 20 | **prod-stats decision** — only 1 query site (`attendance.ts:94`) |
| `Attendance_status_idx` | status | 6.9 MB | 12 | **prod-stats decision** — low-selectivity single column; EXPLAIN C shows the planner prefers tenantId + filter anyway |
| `Attendance_date_idx` | date | 7.4 MB | 3 | **prod-stats decision** — used only when estimates favor it (EXPLAIN B); classId_date_status covers the real hot path |
| `Attendance_tenantId_date_idx` | tenantId, date | 9.1 MB | 33 | **DROP — strict prefix** of `tenantId_date_studentId_idx` |
| `Attendance_studentId_idx` | studentId | 13 MB | 0 | **DROP — strict prefix** of `studentId_date_idx` and the unique index |
| `Attendance_classId_idx` | classId | 7 MB | 0 | **DROP — strict prefix** of `classId_date_status_idx` |
| `Attendance_tenantId_idx` | tenantId | 7 MB | 6 | **DROP — strict prefix** of three longer tenantId indexes |

### Why prefix drops are safe by structure (not by stats)

A B-tree on `(A, B)` answers every query a B-tree on `(A)` answers — same seek,
slightly wider entries. The planner provably retains an access path:

- `tenantId =` → `tenantId_date_studentId_idx` (EXPLAIN E today uses an
  index-only scan on tenantId; same works on the longer index)
- `tenantId + date` → `tenantId_date_studentId_idx` (EXPLAIN A/A2: identical
  plan shape, backward scan + incremental sort, 2.4 ms on the full-range case)
- `classId =` / `classId + date` → `classId_date_status_idx` (EXPLAIN B2:
  2.1 ms for LIMIT 50)
- `studentId =` → `studentId_date_idx`

Cost of keeping them instead: every Attendance INSERT/UPSERT maintains **13**
indexes — a permanent write tax on the highest-write table in the system
(QR/attendance marking at IST morning peak).

## 2. The bigger win: bloat, not count

Size anomaly proving bloat: `tenantId_date_studentId_idx` (3 cols, 1.09 M rows)
= **120 MB** while `tenantId_classId_date_idx` (same 3-column shape, same rows)
= **9 MB**. Same for unique (86 MB) and studentId_date (68 MB) vs compact
peers. Cause: ~1 M seed/upsert churn — dead index pages never compacted
(`n_dead_tup=0`, so VACUUM can't help; only REINDEX reclaims it).

**UPDATE 2026-09-27 — Steps 1–2 validated on the local dev DB** (exact draft
statements, all succeeded): 403 MB → **246 MB**; reindexes took 2–4 s each;
post-drop EXPLAINs show no regressions. Honest correction: my 90–120 MB
projection was too optimistic — the compact 3-column text-key indexes are
genuinely 35–72 MB each. Full numbers in `2026-09-27-fee-optimization.md` §4.
`src/db/schema.ts` is synced to this end state. Prod application still pending.

## 3. Non-index findings (flagged, not fixed)

1. **Date-shape bug confirmed in live data** — `min(date)` returned
   `1695-05-26T00:00:00.000Z`: some rows store ISO timestamps instead of
   `YYYY-MM-DD`. This is spec §9 issue 7; it corrupts every TEXT date range
   comparison. The index audit cannot fix this; it strengthens the case for
   the migration.
2. **FeeReceipt list/count filter mismatch** (`fees.ts:668–687, 696–744`) —
   list filters by `paidDate` range but the pagination `count(*)` filters by
   `tenantId` only → wrong page totals. Correctness bug, separate fix.
3. **Fee `dueDate ILIKE '%year%'`** (`fees.ts:974`) — leading wildcard, no
   B-tree can help; needs a code change (equality on an academicYear column or
   trigram index) if it ever gets slow. Fee table is small today (10 MB).
4. **Fee main list orders by `createdAt DESC`** with no matching index —
   fine at 62 k rows; revisit only if Fee grows 10×.
5. Fee has its own prefix redundancies (`Fee_studentId_idx` ⊂
   `Fee_studentId_status_idx`; `Fee_tenantId_idx` scans=0) — 5 MB total,
   low priority, can ride along in the same migration.

## 4. Draft migration — NOT APPLIED, needs your approval

Run on the VPS **after** §5 confirms the three undecided indexes. All
statements are lock-safe (`CONCURRENTLY` — no write blocking, safe during
school hours).

```sql
-- Step 1: drop the four structurally-redundant Attendance indexes
DROP INDEX CONCURRENTLY IF EXISTS "Attendance_tenantId_date_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Attendance_studentId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Attendance_classId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Attendance_tenantId_idx";

-- Step 2: reclaim bloat on the keepers (one at a time; each takes a few minutes at 1.09M rows)
REINDEX INDEX CONCURRENTLY "Attendance_tenantId_date_studentId_idx";
REINDEX INDEX CONCURRENTLY "Attendance_studentId_classId_date_unique";
REINDEX INDEX CONCURRENTLY "Attendance_studentId_date_idx";
REINDEX INDEX CONCURRENTLY "Attendance_pkey";

-- Step 3 (only if §5 prod stats show them unused):
-- DROP INDEX CONCURRENTLY IF EXISTS "Attendance_status_idx";
-- DROP INDEX CONCURRENTLY IF EXISTS "Attendance_date_idx";
-- DROP INDEX CONCURRENTLY IF EXISTS "Attendance_tenantId_month_idx";

-- Step 4 (optional, ~5 MB): Fee prefix redundancies
-- DROP INDEX CONCURRENTLY IF EXISTS "Fee_studentId_idx";
-- DROP INDEX CONCURRENTLY IF EXISTS "Fee_tenantId_idx";

-- Verify after: sizes and a spot-check plan
SELECT pg_size_pretty(pg_indexes_size('"Attendance"'::regclass));
EXPLAIN (ANALYZE) SELECT id FROM "Attendance"
  WHERE "tenantId"='<a-real-tenant>' AND date >= '<recent>'
  ORDER BY date DESC, "studentId" LIMIT 20;
```

Rollback: re-create any dropped index with `CREATE INDEX CONCURRENTLY` using
the column lists in §1 — nothing here is destructive to data.

## 5. Production evidence required before Step 3

Local scan counts are dev-box noise for the three undecided indexes. On the
VPS (or provider panel SQL console):

```sql
SELECT indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'Attendance'
ORDER BY idx_scan;
```

Note: counters are since last stats reset — if the DB was recently restarted
tuned (postgres-tuning-runbook), let it run a few school days first. Rule:
drop any of `status_idx` / `date_idx` / `tenantId_month_idx` with
`idx_scan = 0` over ≥1 full school week; keep the ones with real scans.

## 6. EXPLAIN evidence (local, 2026-09-26, biggest tenant = 1.08 M rows)

| Shape | Plan chosen | Time |
| --- | --- | --- |
| REST list: tenantId + date ≥, ORDER date DESC, studentId, LIMIT 20 | `tenantId_date_idx` backward + incremental sort | 2.4 ms |
| GraphQL: classId + date ≥, ORDER date DESC, LIMIT 50 | `classId_date_status_idx` backward | 2.1 ms |
| Dashboard: count tenantId + status='present' | `tenantId_idx` + filter (12 k rows) | 10.8 ms |
| Dashboard: tenantId + date ≥ GROUP BY date,status | `tenantId_date_idx` | 0.04 ms (empty range) |
| 30-day class aggregate: classId IN + date ≥ | `classId_date_status_idx` **index-only, 0 heap fetches** | 265 ms full-range (artifact: `1695-...` min date forced the widest window; real 30-day windows read far less) |

## 7. Document-number constraints (added 2026-09-27, applied locally)

`Certificate.certificateNo` and `FeeReceipt.receiptNumber` were `UNIQUE`
platform-wide while both numbers are generated from a **per-school** sequence.
Consequence: the second school's first certificate collided with the first
school's `CERT/<year>/0001` and every generate returned 500. Receipt numbers
escaped it only because they embedded a millisecond timestamp plus 12 random
hex chars — which is why they printed as
`RCPT-1790462666645-1B8F79920EB0`.

Both are now unique **per school**, so numbering is contiguous and short
(`CERT/2026/0001`, `RCPT-2026-0001`).

```sql
-- Safe to run while the OLD code is still live: old numbers are random-entropy
-- based, so they stay unique under the narrower constraint too.
BEGIN;
ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_certificateNo_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_tenantId_certificateNo_unique"
  ON "Certificate" USING btree ("tenantId", "certificateNo");
ALTER TABLE "FeeReceipt" DROP CONSTRAINT IF EXISTS "FeeReceipt_receiptNumber_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "FeeReceipt_tenantId_receiptNumber_unique"
  ON "FeeReceipt" USING btree ("tenantId", "receiptNumber");
COMMIT;
```

**Deploy order: this SQL first, then the code.** The reverse order re-opens the
cross-school collision on certificate generate and on fee payment (a fee
payment rolls back entirely, so the 500 is a lost payment attempt, not bad
data).

Rollback: drop the two new indexes and re-add the original constraints. Only
possible if two schools have meanwhile been assigned the same number — check
first with
`SELECT "certificateNo", count(DISTINCT "tenantId") c FROM "Certificate" GROUP BY 1 HAVING count(DISTINCT "tenantId") > 1;`
(and the same on `"FeeReceipt"."receiptNumber"`).

These statements are **not** in `drizzle/0011_*.sql`. `drizzle-kit generate`
also emits the §4 Attendance/Fee index drops, so a generated migration would
couple the two and §4 is still gated on prod `pg_stat_user_indexes`. Apply the
SQL by hand and keep `src/db/schema.ts` as the source of truth.

**Packaged 2026-09-27:** §4 and §7 are now assembled into one ordered,
idempotent, comment-documented file —
[`2026-09-27-prod-schema-sync.sql`](./2026-09-27-prod-schema-sync.sql). It was
replayed against the dev database (24/24 statements pass, all no-ops on an
already-synced DB) and its PART A ordering was proven against a scratch schema
reproducing prod's shape. Prod has not been touched. §7's original
"drop the constraint inside a transaction" snippet is superseded by that file,
which builds the per-school index `CONCURRENTLY` *first* so no window exists
where numbering is unconstrained and fee-payment writes are never blocked.
