-- P1 Schema Optimization: Add academicYear to Fees, Assignments, and Submissions
-- Ensures consistent year-scoping across all student-related tables

-- Step 1: Add academicYear to Fee table
ALTER TABLE "Fee" ADD COLUMN "academicYear" TEXT NOT NULL DEFAULT '2024-2025';

-- Step 2: Backfill Fee.academicYear from students table
UPDATE "Fee" f
SET "academicYear" = s."academicYear"
FROM "Student" s
WHERE f."studentId" = s.id;

-- Step 3: Drop default after backfill
ALTER TABLE "Fee" ALTER COLUMN "academicYear" DROP DEFAULT;

-- Step 4: Create index on Fee.tenantId + academicYear
CREATE INDEX "Fee_tenantId_academicYear_idx" ON "Fee" ("tenantId", "academicYear");

-- Step 5: Add academicYear to Assignment table
ALTER TABLE "Assignment" ADD COLUMN "academicYear" TEXT NOT NULL DEFAULT '2024-2025';

-- Step 6: Backfill Assignment.academicYear from class (via tenant's current year)
-- Since assignments are class-level, use the current academic year from academicYears table
UPDATE "Assignment" a
SET "academicYear" = ay.name
FROM "Class" c
JOIN "AcademicYear" ay ON c."tenantId" = ay."tenantId" AND ay."isCurrent" = true
WHERE a."classId" = c.id;

-- Step 7: Drop default after backfill
ALTER TABLE "Assignment" ALTER COLUMN "academicYear" DROP DEFAULT;

-- Step 8: Create index on Assignment.tenantId + academicYear
CREATE INDEX "Assignment_tenantId_academicYear_idx" ON "Assignment" ("tenantId", "academicYear");

-- Step 9: Add academicYear to Submission table
ALTER TABLE "Submission" ADD COLUMN "academicYear" TEXT NOT NULL DEFAULT '2024-2025';

-- Step 10: Backfill Submission.academicYear from assignment
UPDATE "Submission" s
SET "academicYear" = a."academicYear"
FROM "Assignment" a
WHERE s."assignmentId" = a.id;

-- Step 11: Drop default after backfill
ALTER TABLE "Submission" ALTER COLUMN "academicYear" DROP DEFAULT;

-- Step 12: Create index on Submission.tenantId + academicYear
CREATE INDEX "Submission_tenantId_academicYear_idx" ON "Submission" ("tenantId", "academicYear");
