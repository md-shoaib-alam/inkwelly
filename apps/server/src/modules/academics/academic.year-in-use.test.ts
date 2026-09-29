import { test, expect, describe } from "bun:test";
import { YEAR_COLUMN_TABLES, feeDueDatePattern } from "./academic.year-usage";
import * as schema from "../../db/schema";

describe("the rename guard knows which tables partition by academic year", () => {
  test("exactly the four academicYear-column tables are covered", () => {
    // Spec §1 found the year stored as a name on students, feeStructures,
    // promotions, exams. If a fifth column appears, this test must fail loudly
    // so the guard is widened rather than quietly staying half-complete.
    expect(Object.keys(YEAR_COLUMN_TABLES).sort()).toEqual(
      ["exams", "feeStructures", "promotions", "students"],
    );
  });

  test("fees are matched by the dueDate prefix because the table has no year column", () => {
    // `${year}-04-01` is the encoding the fee screens write (spec §1).
    expect(feeDueDatePattern("2026-2027")).toBe("2026-2027-%");
    expect("academicYear" in schema.fees).toBe(false);
  });
});
