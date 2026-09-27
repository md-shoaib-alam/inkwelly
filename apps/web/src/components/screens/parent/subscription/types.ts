import { ParentPlan } from "@/lib/billing-constants";

export type Plan = ParentPlan;

export interface SubscriptionRecord {
  id: string;
  planName: string;
  planId: string;
  amount: number;
  period: string;
  status: string;
  transactionId: string | null;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  addons: string;
  createdAt: string;
}
