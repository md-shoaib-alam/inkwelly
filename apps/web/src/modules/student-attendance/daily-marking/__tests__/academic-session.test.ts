import { expect, test, describe } from "bun:test";
import { formatSessionDate, isDateOutsideSession } from "../academic-session";

describe("daily-marking academic session helpers", () => {
  test("formats ISO dates with the Sept convention matching the shipped banner", () => {
    expect(formatSessionDate("2026-06-15")).toBe("15 Jun 2026");
    expect(formatSessionDate("2026-09-28")).toBe("28 Sept 2026");
    expect(formatSessionDate("2027-03-31")).toBe("31 Mar 2027");
  });

  test("flags a date outside [start, end] and not one inside", () => {
    const start = "2026-06-15";
    const end = "2026-09-28";
    expect(isDateOutsideSession("2026-10-03", start, end)).toBe(true); // after end
    expect(isDateOutsideSession("2026-05-01", start, end)).toBe(true); // before start
    expect(isDateOutsideSession("2026-06-15", start, end)).toBe(false); // on start
    expect(isDateOutsideSession("2026-09-28", start, end)).toBe(false); // on end
    expect(isDateOutsideSession("2026-08-01", start, end)).toBe(false); // inside
  });

  test("a missing bound means no session configured, never outside", () => {
    expect(isDateOutsideSession("2026-10-03", null, null)).toBe(false);
    expect(isDateOutsideSession("2026-10-03", "2026-06-15", undefined)).toBe(false);
  });

  test("slices timestamp-bearing bounds down to the date part", () => {
    // AcademicYear stores free text; a full ISO timestamp must still compare.
    expect(isDateOutsideSession("2026-10-03", "2026-06-15T00:00:00Z", "2026-09-28T00:00:00Z")).toBe(true);
    expect(isDateOutsideSession("2026-08-03", "2026-06-15T00:00:00Z", "2026-09-28T00:00:00Z")).toBe(false);
  });
});
