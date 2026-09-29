import { test, expect, describe } from "bun:test";
import { defaultYearNames } from "./backfill_academic_years";

describe("defaultYearNames", () => {
  test("an April start keeps the same academic year all calendar year", () => {
    expect(defaultYearNames(new Date("2026-09-29T00:00:00Z"))).toEqual({
      name: "2026-2027",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
    });
  });
  test("January belongs to the year that started last April", () => {
    expect(defaultYearNames(new Date("2027-01-15T00:00:00Z"))).toEqual({
      name: "2026-2027",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
    });
  });
  test("the name format matches the seeded year and the exam fallback", () => {
    // full_seed_data.ts seeds '2026-2027'; exams.routes.ts builds `${y}-${y+1}`.
    expect(defaultYearNames().name).toMatch(/^\d{4}-\d{4}$/);
  });
});
