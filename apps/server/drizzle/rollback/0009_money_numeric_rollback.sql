-- Manual rollback for 0009_sloppy_jamie_braddock.sql
-- Reverts the 11 money columns from numeric(12,2) back to double precision.
-- Not registered in drizzle/meta/_journal.json, so `bun run db:migrate` will not pick it up.
-- Run it by hand only if you must go back, then also revert src/db/schema.ts.
--
-- WARNING: running this after 0009 has been live re-introduces binary-float rounding
-- on money, which is the hazard 0009 was created to remove.

ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "FeeConcession" ALTER COLUMN "amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "FeeReceipt" ALTER COLUMN "totalAmount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "FeeReceipt" ALTER COLUMN "paidAmount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "FeeReceipt" ALTER COLUMN "concessionTotal" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "FeeStructure" ALTER COLUMN "amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "Fee" ALTER COLUMN "amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "Fee" ALTER COLUMN "paidAmount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "Fee" ALTER COLUMN "concession" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "Subscription" ALTER COLUMN "amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "TransportRoute" ALTER COLUMN "fee" SET DATA TYPE double precision;
