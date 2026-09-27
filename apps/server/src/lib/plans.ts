export interface SchoolPlanDefinition {
  name: string;
  price: number;
  limits: {
    students: number;
    teachers: number;
    parents: number;
    classes: number;
  };
}

export type SchoolPlanTier = "basic" | "standard" | "premium";

// Authoritative billing catalog. Must stay in sync with
// school-web/src/lib/billing-constants.tsx (display side). Prices are INR/month.
export const SCHOOL_PLAN_CATALOG: Record<SchoolPlanTier, SchoolPlanDefinition> = {
  basic: {
    name: "Starter Plan",
    price: 499,
    limits: { students: 100, teachers: 20, parents: 100, classes: 10 },
  },
  standard: {
    name: "Growth Plan",
    price: 1499,
    limits: { students: 500, teachers: 50, parents: 500, classes: 30 },
  },
  premium: {
    name: "Institution Plan",
    price: 3999,
    limits: { students: 2000, teachers: 150, parents: 2000, classes: 100 },
  },
};
