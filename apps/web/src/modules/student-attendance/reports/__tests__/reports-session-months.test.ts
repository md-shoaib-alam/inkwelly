import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { getSessionMonthsAndPresets } from "../utils/session-months";

describe("Student Attendance Reports Session Months & Presets", () => {
  const reportsFile = join(__dirname, "../index.tsx");
  const source = readFileSync(reportsFile, "utf-8");

  test("does not contain hardcoded ACADEMIC_MONTHS or April 2027", () => {
    expect(source).not.toContain("const ACADEMIC_MONTHS =");
    expect(source).not.toContain('"2027-04"');
  });

  test("uses useActiveAcademicYear and derives session months dynamically", () => {
    expect(source).toContain("useActiveAcademicYear");
    expect(source).toContain("getSessionMonthsAndPresets");
    expect(source).toContain("sessionMonths.map");
  });

  test("Tab 2 Month select dropdown iterates over sessionMonths", () => {
    expect(source).toContain("value={registerMonth}");
    expect(source).toContain("onChange={(e) => setRegisterMonth(e.target.value)}");
    expect(source).toContain("{sessionMonths.map((m) => (");
  });

  test("Tab 3 and Tab 4 quick fill presets use quickFillPresets", () => {
    expect(source).toContain("{quickFillPresets.map((preset) => (");
    expect(source).not.toContain("QUICK_FILL_PRESETS");
  });

  test("computes exact session months for 2026-2027 session without April 2027", () => {
    const activeYear = {
      name: "2026-2027",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
    };
    const { sessionMonths, quickFillPresets, sessionStartDate, sessionEndDate } =
      getSessionMonthsAndPresets(activeYear, "2026-2027", "/loadtest-academy/2026-2027/student-attendance/reports");

    expect(sessionStartDate).toBe("2026-04-01");
    expect(sessionEndDate).toBe("2027-03-31");
    expect(sessionMonths.length).toBe(12);

    // First month: April 2026
    expect(sessionMonths[0].value).toBe("2026-04");
    expect(sessionMonths[0].label).toBe("April 2026");

    // Middle month: September 2026
    expect(sessionMonths[5].value).toBe("2026-09");
    expect(sessionMonths[5].label).toBe("September 2026");

    // Last month: March 2027
    expect(sessionMonths[11].value).toBe("2027-03");
    expect(sessionMonths[11].label).toBe("March 2027");

    // "April 2027" must NOT be in the session
    const hasApril2027 = sessionMonths.some((m) => m.value === "2027-04");
    expect(hasApril2027).toBe(false);

    // Quick fill presets include "Full session" + 12 months
    expect(quickFillPresets.length).toBe(13);
    expect(quickFillPresets[0].label).toBe("Full session");
    expect(quickFillPresets[0].from).toBe("2026-04-01");
    expect(quickFillPresets[0].to).toBe("2027-03-31");
  });

  test("computes session months from fallback yearSlug when activeYear object is null", () => {
    const { sessionMonths } = getSessionMonthsAndPresets(
      null,
      "2026-2027",
      "/loadtest-academy/2026-2027/student-attendance/reports"
    );

    expect(sessionMonths.length).toBe(12);
    expect(sessionMonths[0].value).toBe("2026-04");
    expect(sessionMonths[11].value).toBe("2027-03");
    expect(sessionMonths.some((m) => m.value === "2027-04")).toBe(false);
  });

  test("computes session months for 2025-2026 session correctly", () => {
    const activeYear = {
      name: "2025-2026",
      startDate: "2025-04-01",
      endDate: "2026-03-31",
    };
    const { sessionMonths } = getSessionMonthsAndPresets(
      activeYear,
      "2025-2026",
      "/demo-academy/2025-2026/student-attendance/reports"
    );

    expect(sessionMonths.length).toBe(12);
    expect(sessionMonths[0].value).toBe("2025-04");
    expect(sessionMonths[11].value).toBe("2026-03");
    expect(sessionMonths.some((m) => m.value === "2026-04")).toBe(false);
  });
});
