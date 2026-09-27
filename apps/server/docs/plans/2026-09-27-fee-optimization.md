# Fee Domain Optimization — findings, fixes, and index draft

**Date:** 2026-09-27 · All numbers measured locally with `EXPLAIN (ANALYZE)`
against the dev DB (Fee: 62,000 rows / 22 MB, one tenant holds 60,000).
Companion to `2026-09-26-index-audit.md` — both migration drafts are lock-safe
and can be applied in the same window.

## 1. Code fixes applied (2026-09-27, all in `src/routes/fees.ts`)

| # | Fix | Why | Response shape |
| --- | --- | --- | --- |
| B1 | `/fee-assign` **remove** now filters `dueDate LIKE '<year>%'` in both the paid-check and the DELETE | It previously deleted the category's pending fees across **every** academic year while assign only created this year's — the known unfixed bug from the fan-out work | unchanged |
| B2 | `/fee-receipts` count queries (min + full mode) now use the **same WHERE** as the list (paidDate range, studentId, classId, search) | `total`/`totalPages` were computed from `tenantId` alone → wrong pagination whenever a filter was active | unchanged (values now correct) |
| P2 | fee-assign year checks: `ILIKE '%<year>%'` → `LIKE '<year>%'` | Verified in data: every dueDate starts with a 4-digit year (0 exceptions) and assign writes `<year>-04-01`, so the leading wildcard matched exactly the same rows while guaranteeing no index could ever be used | unchanged |
| P3 | `/fee-assign` GET transport lookup: full-table scan of `TransportAssignment` (no tenant filter, all tenants' rows into memory) → hash join scoped to the class's students | Unbounded at scale; class ownership is already tenant-verified above it | unchanged |

Checkpoint after fixes: `tsc --noEmit` clean; `bun test` **31 pass / 0 fail**.

Honest measurement notes:
- **P2 is perf-neutral at today's scale** (same plan shape: bitmap on
  `feeCategoryId` + filter; 62k rows is too small for the wildcard to hurt).
  The DB collation is `en_US.utf8`, so even prefix LIKE needs a
  `text_pattern_ops` index to seek — not worth it at this size. The fix removes
  a misleading wildcard and keeps the option open. Kept, not reverted, because
  it is semantically identical and strictly more indexable.
- **P3 verified by plan**: hash join, Student side uses `Student_classId_status_idx`.

## 2. Measured performance gaps → index draft (NOT applied, needs approval)

| Query | Measured today | Root cause |
| --- | --- | --- |
| Fee list page `GET /fees` (every page incl. deep offsets) | **31 ms** (OFFSET 1000) / 16 ms (OFFSET 5000) — parallel **seq scan of all 62k rows + top-N sort per request** | `ORDER BY createdAt DESC` has no `(tenantId, createdAt)` index; `Fee_tenantId_idx` doesn't cover the sort |
| Dashboard fee SUM | 13 ms seq scan | acceptable at this size; dashboard is cached — no action |
| Receipt dedupe check (15 s window) | n/a (FeeReceipt empty locally) | small table; `FeeReceipt_studentId_idx` covers it — no action |

```sql
-- Fee: make the list page an index scan instead of seq-scan+sort
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Fee_tenantId_createdAt_idx"
  ON "Fee" ("tenantId", "createdAt" DESC);

-- Fee: drop prefix-redundant / provably unusable indexes (write tax)
DROP INDEX CONCURRENTLY IF EXISTS "Fee_studentId_idx";   -- strict prefix of Fee_studentId_status_idx AND Fee_studentId_type_status_idx
-- Fee_dueDate_idx: 0 scans locally AND unusable by the old ILIKE. With P2 it
-- could serve prefix ranges, but collation en_US.utf8 needs text_pattern_ops
-- for that. Decide with prod stats:
-- DROP INDEX CONCURRENTLY IF EXISTS "Fee_dueDate_idx";

-- Verify after (expect: Index Scan Backward using Fee_tenantId_createdAt_idx, ~1 ms):
EXPLAIN (ANALYZE) SELECT f.id FROM "Fee" f
  WHERE f."tenantId" = '<real-tenant>'
  ORDER BY f."createdAt" DESC LIMIT 100 OFFSET 1000;
```

If/when applied, mirror in `src/db/schema.ts` (add `tenantCreatedAtIdx`, remove
the dropped index declarations) so `drizzle-kit` doesn't recreate them.

Rollback: `DROP INDEX CONCURRENTLY "Fee_tenantId_createdAt_idx";` /
recreate dropped ones from the column lists in `2026-09-26-index-audit.md` §1.

## 3. Second round — flagged items fixed 2026-09-27 (user: "fix all")

| # | Fix | Detail |
| --- | --- | --- |
| B4 | Receipt-number collision | `RCPT-${Date.now()}-${rand<1000}` → `RCPT-${Date.now()}-${12 hex chars CSPRNG}` in `fee-receipt.service.ts` (the only receipt generator; all payments go through `processPayment`). Same prefix/format, printable; collision probability now ~0 instead of 1/1000 per same-millisecond pair |
| C1 | `/fee-categories` loading every fee id | Client audit first: **school-web** renders `cat.feesCount`/`structuresCount` (types.ts:11-12) which the server never returned — the Fees column was blank; **test-app**'s FeeCategory type has no fees/structures fields at all; no other reader of the id arrays exists in either client. Server now returns two index-backed GROUP BY counts, keeps `fees: []`/`structures: []` present for shape compatibility, and adds the `feesCount`/`structuresCount` web always expected (also fixes the blank column) |
| C2 | `FeeReceipt.paidDate` TEXT | NOT changed — same family as spec §9 issue 7 (Attendance TEXT dates); needs its own data-migration decision, deliberately left |

Checkpoint after second round: `tsc --noEmit` clean, `bun test` 31 pass / 0 fail.

## 4. Local validation run (2026-09-27, dev DB — prod still pending your go)

The exact draft statements (all `CONCURRENTLY`, one at a time) were applied to
the **local dev DB** to validate them; every one succeeded.

| Check | Before | After |
| --- | --- | --- |
| Fee list page (OFFSET 1000, EXPLAIN ANALYZE) | 31 ms — parallel seq scan + top-N sort | **0.21 ms** — `Index Scan using Fee_tenantId_createdAt_idx` |
| Fee indexes total | 12 MB | 12 MB (dropped `Fee_studentId_idx`, added the new one — net zero) |
| Attendance indexes total | 403 MB | **246 MB** (4 drops + 4 reindexes; reindex took 2–4 s each at 1.09 M rows) |
| Attendance REST list (post-drop plan check) | 2.4 ms via `tenantId_date_idx` | 0.27 ms via `tenantId_date_studentId_idx` — no regression from the drops |
| Attendance tenantId-only `count(*)`, 1.08 M-row tenant | — | 180 ms parallel index-only scan — inherent to counting 1.08 M rows, not caused by the drop; dashboard counts are cached |

Honest correction: the audit's "403 → 90–120 MB" projection was too
optimistic. Post-reindex reality is 246 MB — the 3-column text-key indexes
(tenantId is 26 chars) are genuinely ~35–72 MB each when compact. Further
shrinkage only comes from the prod-stats decisions on `status_idx` /
`date_idx` / `tenantId_month_idx` (~22 MB).

`src/db/schema.ts` was synced in the same change: removed the 4 dropped
Attendance declarations + `Fee_studentId_idx`, added `Fee_tenantId_createdAt_idx`
— so `drizzle-kit` won't recreate them. **When you run the SQL on the VPS, the
deployed code must include this schema.ts** (they describe the same end state).

Rollback (local or prod): recreate from the column lists in
`2026-09-26-index-audit.md` §1 / §2 above with `CREATE INDEX CONCURRENTLY`.
