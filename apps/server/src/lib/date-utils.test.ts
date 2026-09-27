import { describe, expect, test } from "bun:test";
import { formatDate } from "./date-utils";

describe("formatDate", () => {
  test("formats as YYYY-MM-DD with zero-padded month and day", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  test("uses local calendar date components, not UTC", () => {
    const d = new Date(2026, 7, 29, 23, 59);
    expect(formatDate(d)).toBe("2026-08-29");
  });
});
