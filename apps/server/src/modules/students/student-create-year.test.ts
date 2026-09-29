import { test, expect, describe } from "bun:test";
import { academicYearIsKnown } from "./student.create.guards";

describe("student create honours the requested academic year", () => {
  test("a year the tenant owns is accepted verbatim", () => {
    expect(academicYearIsKnown("2026-2027", ["2026-2027", "2025-2026"])).toBe("2026-2027");
  });
  test("a year the tenant does not own is refused rather than silently stored", () => {
    expect(() => academicYearIsKnown("1999-2000", ["2026-2027"])).toThrow(/1999-2000/);
  });
  test("no year falls back to the tenant's current one", () => {
    // The mobile app does not send the header yet; a missing value must not 400.
    expect(academicYearIsKnown(undefined, ["2025-2026", "2026-2027"], "2026-2027")).toBe("2026-2027");
  });
  test("a tenant with no years at all cannot create a student", () => {
    // Task 8 gives every new school a year; this is the pre-backfill state, and it
    // must fail loudly instead of writing the schema's literal default.
    expect(() => academicYearIsKnown(undefined, [])).toThrow(/Academic year required/);
  });
});
