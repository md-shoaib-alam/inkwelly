import { test, expect, describe } from "bun:test";
import { cleanText, fullNameFromParts } from "./students.routes";
import { isCalendarDate } from "./student-update.audit";

/**
 * The Edit student information screen writes back everything admission captured. These
 * pins cover the two ways that write silently loses a correction: an empty box being
 * stored as an empty string instead of clearing the column, and a name part changing
 * without the display name following it.
 */
describe("cleanText", () => {
  test("an empty or whitespace box clears the column instead of storing blanks", () => {
    expect(cleanText("")).toBeNull();
    expect(cleanText("   ")).toBeNull();
    expect(cleanText(null)).toBeNull();
    expect(cleanText(undefined)).toBeNull();
  });

  test("a typed value is trimmed and kept", () => {
    expect(cleanText("  PE123456  ")).toBe("PE123456");
  });
});

describe("fullNameFromParts", () => {
  test("the display name is the present parts in order", () => {
    expect(fullNameFromParts({ firstName: "Aadhya", middleName: null, lastName: "Khan" })).toBe("Aadhya Khan");
    expect(fullNameFromParts({ firstName: "Aadhya", middleName: "Kumar", lastName: "Khan" })).toBe(
      "Aadhya Kumar Khan",
    );
  });

  test("blank parts contribute nothing, not spaces", () => {
    expect(fullNameFromParts({ firstName: " Aadhya ", middleName: "  ", lastName: "" })).toBe("Aadhya");
    expect(fullNameFromParts({ firstName: "", middleName: null, lastName: null })).toBe("");
  });
});

describe("isCalendarDate", () => {
  test("an impossible day or month is refused, not rolled over", () => {
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(isCalendarDate("06/06/2022")).toBe(false);
    expect(isCalendarDate("")).toBe(false);
  });

  test("a real date passes, including a leap day", () => {
    expect(isCalendarDate("2022-06-06")).toBe(true);
    expect(isCalendarDate("2024-02-29")).toBe(true);
  });
});
