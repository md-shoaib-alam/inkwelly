ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "sessionFamily" text;
--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "lastSeenAt" timestamp;
--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "isShared" boolean DEFAULT false;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_sessionFamily_idx" ON "RefreshToken" ("userId", "sessionFamily");
