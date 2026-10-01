# Schema Optimization Migration Deployment Instructions

**Date:** 2026-10-02  
**Target:** Staging Database  
**Status:** Ready to deploy (schema fixed, migrations generated)

---

## Overview

Three migration files need to be applied to the staging database in order:

1. **0020_schema_optimization_p0.sql** - P0 critical fixes (academicYear columns + indexes)
2. **0021_normalize_parent_contacts.sql** - Parent table normalization
3. **0022_add_academic_year_to_remaining_tables.sql** - Academic year on Fee/Assignment/Submission

Additionally, drizzle-kit generated **0021_schema_optimization_p1.sql** which contains the complete diff for all schema changes.

---

## Deployment Methods

### Method 1: Using psql (Recommended)

If you have PostgreSQL client tools installed:

```bash
# Connect to your staging database
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Apply migrations in order
psql "$DATABASE_URL" -f apps/server/drizzle/0020_schema_optimization_p0.sql
psql "$DATABASE_URL" -f apps/server/drizzle/0021_normalize_parent_contacts.sql
psql "$DATABASE_URL" -f apps/server/drizzle/0022_add_academic_year_to_remaining_tables.sql
```

### Method 2: Using Node.js pg client

If you don't have psql but have Node.js:

```bash
cd apps/server

# Install pg temporarily
npm install pg

# Run the deployment script
node deploy-migrations.js

# Remove pg after deployment
npm uninstall pg
```

The `deploy-migrations.js` script will:
- Connect using the DATABASE_URL environment variable
- Apply each migration file in order
- Handle errors gracefully (skip already-applied migrations)
- Verify the new columns exist

### Method 3: Using Drizzle Kit Push

If you want drizzle-kit to handle it automatically:

```bash
cd apps/server

# This will prompt for confirmation and apply all schema changes
bunx drizzle-kit push

# Or generate and review the SQL first
bunx drizzle-kit generate --name final_schema_changes
# Then manually apply the generated SQL file
```

---

## Pre-Deployment Checklist

- [ ] Backup staging database
- [ ] Verify DATABASE_URL points to staging (not production!)
- [ ] Check that migration 0020_session_tracking.sql was already applied (from QR feature)
- [ ] Ensure no active deployments are running
- [ ] Notify team of brief downtime during migration

---

## Post-Deployment Verification

After applying migrations, verify the changes:

```sql
-- Check new columns exist
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'academicYear' 
  AND table_name IN ('Attendance', 'Grade', 'Fee', 'Assignment', 'Submission')
ORDER BY table_name;

-- Check ParentContact table exists
SELECT COUNT(*) FROM ParentContact;

-- Check new indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('Attendance', 'Grade', 'Student', 'Fee', 'Assignment', 'Submission', 'ParentContact')
  AND indexname LIKE '%academicYear%'
ORDER BY indexname;

-- Expected output:
-- Attendance.academicYear ✓
-- Grade.academicYear ✓
-- Fee.academicYear ✓
-- Assignment.academicYear ✓
-- Submission.academicYear ✓
-- ParentContact table ✓
-- ~12 new indexes ✓
```

---

## Rollback Plan

If something goes wrong, here's how to rollback:

### Option A: Restore from backup
```bash
pg_restore -d staging_db backup_file.dump
```

### Option B: Reverse individual migrations
```sql
-- Drop new columns (if needed)
ALTER TABLE "Attendance" DROP COLUMN IF EXISTS "academicYear";
ALTER TABLE "Grade" DROP COLUMN IF EXISTS "academicYear";
ALTER TABLE "Fee" DROP COLUMN IF EXISTS "academicYear";
ALTER TABLE "Assignment" DROP COLUMN IF EXISTS "academicYear";
ALTER TABLE "Submission" DROP COLUMN IF EXISTS "academicYear";

-- Drop ParentContact table
DROP TABLE IF EXISTS "ParentContact" CASCADE;

-- Drop new indexes
DROP INDEX IF EXISTS "Attendance_tenantId_academicYear_month_idx";
DROP INDEX IF EXISTS "Attendance_tenantId_academicYear_date_idx";
DROP INDEX IF EXISTS "Attendance_tenantId_classId_academicYear_date_idx";
DROP INDEX IF EXISTS "Grade_tenantId_academicYear_idx";
DROP INDEX IF EXISTS "Grade_studentId_academicYear_idx";
DROP INDEX IF EXISTS "Student_classId_academicYear_status_idx";
DROP INDEX IF EXISTS "Student_academicYear_createdAt_idx";
DROP INDEX IF EXISTS "Fee_tenantId_academicYear_idx";
DROP INDEX IF EXISTS "Assignment_tenantId_academicYear_idx";
DROP INDEX IF EXISTS "Submission_tenantId_academicYear_idx";
```

---

## Known Issues & Notes

1. **Student table doesn't have tenantId**: The original plan included `(tenantId, classId, academicYear, status)` index, but Student stores tenant on the User table via userId. Fixed to use `(classId, academicYear, status)` instead.

2. **Migration 0020_session_tracking.sql**: This was from the QR scan-to-sign-in feature and should already be deployed. Don't re-apply it.

3. **Duplicate 0020 files**: There are two 0020 files:
   - `0020_session_tracking.sql` - Already deployed (QR feature)
   - `0020_schema_optimization_p0.sql` - New (this deployment)

4. **Generated migration 0021_schema_optimization_p1.sql**: This is the complete diff drizzle-kit generated. You can use it as an alternative to applying the three manual migrations, but the manual approach gives better control and visibility.

---

## Expected Downtime

- **Migration time:** ~30 seconds for small databases, ~2-5 minutes for large ones (>1M rows)
- **Application downtime:** None required (online index creation in PostgreSQL 15+)
- **Recommended maintenance window:** Low-traffic period (optional but recommended)

---

## Support

If you encounter issues:
1. Check the error message - most failures are due to missing columns or duplicate indexes
2. Verify the DATABASE_URL is correct
3. Ensure you're connected to the right database (staging, not production!)
4. Contact the development team with the full error output

---

**Last Updated:** 2026-10-02  
**Commit:** 7d752c1 (fix schema indexes)  
**Migrations:** 0020, 0021, 0022
