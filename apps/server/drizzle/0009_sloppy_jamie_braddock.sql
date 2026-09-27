ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "FeeConcession" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "FeeReceipt" ALTER COLUMN "totalAmount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "FeeReceipt" ALTER COLUMN "paidAmount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "FeeReceipt" ALTER COLUMN "concessionTotal" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "FeeStructure" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "Fee" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "Fee" ALTER COLUMN "paidAmount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "Fee" ALTER COLUMN "concession" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "Subscription" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "TransportRoute" ALTER COLUMN "fee" SET DATA TYPE numeric(12, 2);