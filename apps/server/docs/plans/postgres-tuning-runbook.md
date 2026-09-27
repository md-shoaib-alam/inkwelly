# Postgres Tuning Runbook — managed node (spec §7)

**Who runs this: YOU, not the code.** The managed node (`10.0.0.13`, PG 17.9,
4 vCPU / 16 GB) is still at install defaults. `shared_buffers` and
`pg_stat_statements` require a **restart** — schedule the window first
(seconds of downtime; do it outside 07:00–09:00 IST).

## 0. Capture the BEFORE state (no restart needed)

```sql
SELECT name, setting, unit FROM pg_settings
WHERE name IN ('shared_buffers','effective_cache_size','work_mem','wal_compression','max_connections');
```

Save the output — the verification runbook's before/after table needs it.

## 1. Apply (psql as the admin role, or the provider's parameter panel)

```sql
ALTER SYSTEM SET shared_buffers = '4GB';            -- ¼ of 16 GB
ALTER SYSTEM SET effective_cache_size = '10GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET wal_compression = on;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

If the provider panel forbids `ALTER SYSTEM` (some managed PGs do), set the
same five parameters there instead — values identical.

## 2. Restart

Provider panel → restart the node. Then verify:

```sql
SHOW shared_buffers;                 -- expect 4GB
SHOW effective_cache_size;           -- expect 10GB
SHOW work_mem;                       -- expect 16MB
SHOW wal_compression;                -- expect on
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT count(*) FROM pg_stat_statements;   -- > 0 after some traffic
```

## 3. After a day of traffic — feed deferred issue #8

```sql
SELECT relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'Attendance'
ORDER BY idx_scan ASC;
```

Indexes with `idx_scan = 0` after a full school week are candidates for
dropping (the 13-index write tax, capacity study issue #8). **Do not drop
anything from this query alone** — bring the output back first.

## Rollback

```sql
ALTER SYSTEM RESET shared_buffers;
ALTER SYSTEM RESET effective_cache_size;
ALTER SYSTEM RESET work_mem;
ALTER SYSTEM RESET wal_compression;
ALTER SYSTEM RESET shared_preload_libraries;
-- + one more restart
```
