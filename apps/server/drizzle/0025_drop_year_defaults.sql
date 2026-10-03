-- A school must create its first academic session before data is written, so
-- no row may be stamped with an invented year. Drops the '2024-2025' column
-- defaults; every insert path now passes academicYear explicitly (or the write
-- is refused with a 400). Un-journaled like 0022/0023/0024: apply directly.
-- DROP DEFAULT is idempotent.
--
-- Ship this together with the code that stamps every write; importing the old
-- bundle against defaulted-off columns would 500 on student/class imports.
ALTER TABLE "Student" ALTER COLUMN "academicYear" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "Class" ALTER COLUMN "academicYear" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "Exam" ALTER COLUMN "academicYear" DROP DEFAULT;
