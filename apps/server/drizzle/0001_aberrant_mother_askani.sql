CREATE INDEX "Class_tenantId_grade_idx" ON "Class" USING btree ("tenantId","grade");--> statement-breakpoint
CREATE INDEX "Student_classId_status_idx" ON "Student" USING btree ("classId","status");--> statement-breakpoint
CREATE INDEX "Subject_tenantId_classId_idx" ON "Subject" USING btree ("tenantId","classId");--> statement-breakpoint
CREATE INDEX "User_tenantId_role_isActive_idx" ON "User" USING btree ("tenantId","role","isActive");