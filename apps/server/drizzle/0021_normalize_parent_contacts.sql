-- P1 Schema Optimization: Normalize parents table into parentContacts
-- Split 18 inline columns into separate contact rows for father/mother/guardian

-- Step 1: Create new ParentContact table (already in schema.ts, just need data migration)
CREATE TABLE IF NOT EXISTS "ParentContact" (
  id TEXT PRIMARY KEY,
  "parentId" TEXT NOT NULL REFERENCES "Parent"(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  title TEXT,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT,
  mobile TEXT,
  education TEXT,
  "workAddress" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX "ParentContact_parentId_idx" ON "ParentContact" ("parentId");
CREATE INDEX "ParentContact_relationship_idx" ON "ParentContact" (relationship);
CREATE INDEX "ParentContact_mobile_idx" ON "ParentContact" (mobile);

-- Step 3: Migrate existing father data
INSERT INTO "ParentContact" (id, "parentId", relationship, title, "firstName", "middleName", "lastName", mobile, education, "workAddress", "isPrimary", "createdAt")
SELECT 
  gen_random_uuid()::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  p.id,
  'father',
  p."fatherTitle",
  p."fatherFirstName",
  p."fatherMiddleName",
  p."fatherLastName",
  p."fatherMobile",
  p."fatherEducation",
  p."fatherWorkAddress",
  true, -- father is primary by default if exists
  p."createdAt"
FROM "Parent" p
WHERE p."fatherFirstName" IS NOT NULL;

-- Step 4: Migrate existing mother data
INSERT INTO "ParentContact" (id, "parentId", relationship, title, "firstName", "middleName", "lastName", mobile, education, "workAddress", "isPrimary", "createdAt")
SELECT 
  gen_random_uuid()::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  p.id,
  'mother',
  p."motherTitle",
  p."motherFirstName",
  p."motherMiddleName",
  p."motherLastName",
  p."motherMobile",
  p."motherEducation",
  p."motherWorkAddress",
  false, -- mother is not primary by default
  p."createdAt"
FROM "Parent" p
WHERE p."motherFirstName" IS NOT NULL;

-- Step 5: Drop old columns from Parent table
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "fatherTitle";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "fatherFirstName";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "fatherMiddleName";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "fatherLastName";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "fatherMobile";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "fatherEducation";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "fatherWorkAddress";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherTitle";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherFirstName";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherMiddleName";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherLastName";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherMobile";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherOccupation";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherEducation";
ALTER TABLE "Parent" DROP COLUMN IF EXISTS "motherWorkAddress";
