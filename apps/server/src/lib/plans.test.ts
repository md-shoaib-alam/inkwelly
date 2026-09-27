import { describe, expect, test } from "bun:test";
import { SCHOOL_PLAN_CATALOG } from "./plans";

const PLAN_ORDER = ["basic", "standard", "premium"] as const;

describe("SCHOOL_PLAN_CATALOG", () => {
  test("contains exactly the basic/standard/premium plans", () => {
    expect(Object.keys(SCHOOL_PLAN_CATALOG).sort()).toEqual([...PLAN_ORDER].sort());
  });

  test("prices are positive and strictly increase across tiers", () => {
    for (const key of PLAN_ORDER) {
      expect(SCHOOL_PLAN_CATALOG[key].price).toBeGreaterThan(0);
    }
    expect(SCHOOL_PLAN_CATALOG.basic.price).toBeLessThan(SCHOOL_PLAN_CATALOG.standard.price);
    expect(SCHOOL_PLAN_CATALOG.standard.price).toBeLessThan(SCHOOL_PLAN_CATALOG.premium.price);
  });

  test("limits are positive and non-decreasing across tiers", () => {
    for (const field of ["students", "teachers", "parents", "classes"] as const) {
      const values = PLAN_ORDER.map((key) => SCHOOL_PLAN_CATALOG[key].limits[field]);
      for (const v of values) expect(v).toBeGreaterThan(0);
      expect(values[0]!).toBeLessThanOrEqual(values[1]!);
      expect(values[1]!).toBeLessThanOrEqual(values[2]!);
    }
  });
});
