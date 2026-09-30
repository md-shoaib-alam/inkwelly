import { expect, test, describe } from "bun:test";
import {
  getMonthDays,
  countWorkingDays,
} from "../utils/calendar-utils";
import { readFileSync } from "fs";
import { join } from "path";

describe("Student Attendance Class Register Bulk Save & UI Components", () => {
  test("calendar utils handle 2026-09 days and working days correctly", () => {
    const days = getMonthDays("2026-09", {
      sessionStartDate: "2026-09-15",
      sessionEndDate: "2027-03-31",
    });
    expect(days.length).toBe(30);

    // Days before Sept 15 should be outside session
    const day1 = days[0];
    expect(day1.isOutsideSession).toBe(true);

    // Day 15 should be inside session
    const day15 = days[14];
    expect(day15.isOutsideSession).toBe(false);

    // Working days should be calculated
    const working = countWorkingDays(days);
    expect(working).toBeGreaterThan(0);
    expect(working).toBeLessThanOrEqual(30);
  });

  test("ClassRegisterView source code contains all required bulk save and staged UI elements", () => {
    const filePath = join(__dirname, "../components/ClassRegisterView.tsx");
    const source = readFileSync(filePath, "utf-8");

    // 1. Right-side monthly summary columns
    expect(source).toContain("Present");
    expect(source).toContain("Late");
    expect(source).toContain("Leave");
    expect(source).toContain("Absent");
    expect(source).toContain("%");
    expect(source).toContain("border-l-2 border-[#0f766e]/30");

    // 2. Status selector popover with 5 status options matching Image 2
    expect(source).toContain("handleCellStatusSelect(student.id, d.date, \"present\")");
    expect(source).toContain("handleCellStatusSelect(student.id, d.date, \"absent\")");
    expect(source).toContain("handleCellStatusSelect(student.id, d.date, \"late\")");
    expect(source).toContain("handleCellStatusSelect(student.id, d.date, \"halfDay\")");
    expect(source).toContain("handleCellStatusSelect(student.id, d.date, \"leave\")");

    // 3. Unsaved change indicator dot matching Image 3
    expect(source).toContain("isUnsaved");
    expect(source).toContain("bg-[#854d0e]");
    expect(source).toContain("rounded-full");

    // 4. Floating bottom bar matching Image 4
    expect(source).toContain("unsavedCount > 0");
    expect(source).toContain("unsaved change");
    expect(source).toContain("Discard");
    expect(source).toContain("Save all");
    expect(source).toContain("bg-[#0f766e]");

    // 5. Discard confirmation alert dialog matching Image 5
    expect(source).toContain("Discard unsaved changes?");
    expect(source).toContain("unsaved attendance");
    expect(source).toContain("This cannot be undone.");
    expect(source).toContain("Yes, discard");
    expect(source).toContain("bg-[#991b1b]");

    // 6. Transition mutex lock
    expect(source).toContain("saveLockRef");
    expect(source).toContain("isSaving");
    expect(source).toContain("saveLockRef.current = true");
    expect(source).toContain("saveLockRef.current = false");

    // 7. Table footer "Present each day" and Legend
    expect(source).toContain("Present each day");
    expect(source).toContain("Week off");
    expect(source).toContain("Holiday");
    expect(source).toContain("Not marked");
    expect(source).toContain("Outside the session");

    // 8. Uniform row heights and rowSpan for vertical text columns
    expect(source).toContain("rowSpan={spanCount}");
    expect(source).toContain("rowSpan={sundaySpan}");
    expect(source).toContain("rowSpan={holidaySpan}");
    expect(source).toContain("h-11");
  });

  test("classes/index.tsx resolves activeSession respecting 2026-27 session dates", () => {
    const indexPath = join(__dirname, "../index.tsx");
    const indexSource = readFileSync(indexPath, "utf-8");

    expect(indexSource).toContain("activeSession");
    expect(indexSource).toContain("sessionStartDate={activeSession.startDate}");
    expect(indexSource).toContain("sessionEndDate={activeSession.endDate}");
    expect(indexSource).toContain("2026-27");
  });

  test("ClassRegisterList and classes/index.tsx display attendance percentage instead of Marked badge", () => {
    const listPath = join(__dirname, "../components/ClassRegisterList.tsx");
    const listSource = readFileSync(listPath, "utf-8");

    // 1. ClassItem has todayPercentage
    expect(listSource).toContain("todayPercentage?: number | string");

    // 2. Check that it formats percentage with 1 decimal place (e.g. 4.0%)
    expect(listSource).toContain("toFixed(1)}%");

    // 3. Check for the rose badge styling matching Image 1 (4.0%)
    expect(listSource).toContain("bg-rose-100/90 text-rose-600");

    // 4. Check index.tsx attaches todayPercentage and statusText
    const indexPath = join(__dirname, "../index.tsx");
    const indexSource = readFileSync(indexPath, "utf-8");
    expect(indexSource).toContain("todayPercentage: percentage");
    expect(indexSource).toContain("statusText = `${(percentage ?? 0).toFixed(1)}%`");
  });
});

