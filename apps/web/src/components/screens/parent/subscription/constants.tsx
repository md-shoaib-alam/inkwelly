import { PARENT_PLANS } from "@/lib/billing-constants";

export const PLANS = PARENT_PLANS;

export const PRICE_LOOKUP: Record<string, Record<string, number>> = {
  monthly: {
    basic: 0,
    standard: 11,
    premium: 29,
  },
  quarterly: {
    basic: 0,
    standard: 29,
    premium: 79,
  },
  yearly: {
    basic: 0,
    standard: 99,
    premium: 249,
  },
};
