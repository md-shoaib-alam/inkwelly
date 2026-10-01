ALTER TABLE "Class" RENAME COLUMN "grade" TO "classLevel";
--> statement-breakpoint
ALTER INDEX "Class_grade_idx" RENAME TO "Class_classLevel_idx";
--> statement-breakpoint
ALTER INDEX "Class_tenantId_grade_idx" RENAME TO "Class_tenantId_classLevel_idx";
