import { test, expect, describe } from "bun:test";
import { YEAR_COLUMN_TABLES, feeDueDatePattern } from "./academic.year-usage";
import * as schema from "../../db/schema";

describe("the rename guard knows which tables partition by academic year", () => {
  test("every academicYear-column table is covered", () => {
    // The year is stored as a NAME on all of these. If a further column
    // appears, this test must fail loudly so the guard is widened rather than
    // quietly staying half-complete — that is the whole point of pinning the
    // list here instead of importing it.
    expect(Object.keys(YEAR_COLUMN_TABLES).sort()).toEqual([
      "assignments",
      "attendance",
      "classes",
      "exams",
      "feeStructures",
      "fees",
      "grades",
      "promotions",
      "students",
      "submissions",
    ]);
  });

  test("fees carry a year column and keep the dueDate prefix as a second lock", () => {
    // `${year}-04-01` is the encoding the fee screens write (spec §1); the
    // column arrived with 0022. A rename guard may over-block but must never
    // under-block, so BOTH arms count.
    expect(feeDueDatePattern("2026-2027")).toBe("2026-2027-%");
    expect("academicYear" in schema.fees).toBe(true);
  });
});
