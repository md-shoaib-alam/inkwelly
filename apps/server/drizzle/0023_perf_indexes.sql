CREATE INDEX "Subscription_transactionId_idx" ON "Subscription" ("transactionId");--> statement-breakpoint
CREATE INDEX "Exam_tenantId_classId_academicYear_idx" ON "Exam" ("tenantId","classId","academicYear");--> statement-breakpoint
CREATE INDEX "Notification_userId_unread_idx" ON "Notification" ("userId") WHERE "isRead" = false;--> statement-breakpoint
CREATE INDEX "FeeConcession_tenantId_createdAt_idx" ON "FeeConcession" ("tenantId","createdAt");
