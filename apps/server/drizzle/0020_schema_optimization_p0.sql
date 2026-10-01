-- P0 Schema Optimization: Add academicYear to Attendance and Grades tables
-- Plus critical composite indexes for million-user scale

-- Step 1: Add academicYear column to Attendance table
ALTER TABLE "Attendance" ADD COLUMN "academicYear" TEXT NOT NULL DEFAULT '2024-2025';

-- Step 2: Backfill academicYear from students table
UPDATE "Attendance" a
SET "academicYear" = s."academicYear"
FROM "Student" s
WHERE a."studentId" = s.id;

-- Step 3: Drop the default after backfill (optional, keeps schema clean)
ALTER TABLE "Attendance" ALTER COLUMN "academicYear" DROP DEFAULT;

-- Step 4: Create new composite indexes for Attendance
CREATE INDEX "Attendance_tenantId_academicYear_month_idx" ON "Attendance" ("tenantId", "academicYear", "month");
CREATE INDEX "Attendance_tenantId_academicYear_date_idx" ON "Attendance" ("tenantId", "academicYear", "date");
CREATE INDEX "Attendance_tenantId_classId_academicYear_date_idx" ON "Attendance" ("tenantId", "classId", "academicYear", "date");

-- Step 5: Drop old indexes that are superseded by new composites
DROP INDEX IF EXISTS "Attendance_tenantId_month_idx";
DROP INDEX IF EXISTS "Attendance_date_idx";
DROP INDEX IF EXISTS "Attendance_studentId_date_idx";
DROP INDEX IF EXISTS "Attendance_tenantId_classId_date_idx";

-- Step 6: Add academicYear column to Grade table
ALTER TABLE "Grade" ADD COLUMN "academicYear" TEXT NOT NULL DEFAULT '2024-2025';

-- Step 7: Backfill academicYear from students table
UPDATE "Grade" g
SET "academicYear" = s."academicYear"
FROM "Student" s
WHERE g."studentId" = s.id;

-- Step 8: Drop the default after backfill
ALTER TABLE "Grade" ALTER COLUMN "academicYear" DROP DEFAULT;

-- Step 9: Create new composite indexes for Grade
CREATE INDEX "Grade_tenantId_academicYear_idx" ON "Grade" ("tenantId", "academicYear");
CREATE INDEX "Grade_studentId_academicYear_idx" ON "Grade" ("studentId", "academicYear");

-- Step 10: Add critical composite index for Student roster queries
CREATE INDEX "Student_tenantId_classId_academicYear_status_idx" ON "Student" ("tenantId", "classId", "academicYear", "status");
CREATE INDEX "Student_tenantId_academicYear_createdAt_idx" ON "Student" ("tenantId", "academicYear", "createdAt");
