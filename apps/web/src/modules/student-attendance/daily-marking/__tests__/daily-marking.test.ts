import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Daily Attendance & Class Marking Navigation Tests", () => {
  test("ClassDailyAttendanceView contains all required UI elements matching Images 2 & 3", () => {
    const viewPath = join(__dirname, "../class-daily-attendance-view.tsx");
    const source = readFileSync(viewPath, "utf-8");

    // 1. Back button and header
    expect(source).toContain("Back");
    expect(source).toContain("ArrowLeft");
    expect(source).toContain("of");
    expect(source).toContain("marked");
    expect(source).toContain("unsaved");

    // 2. Quick action buttons
    expect(source).toContain("Mark all present");
    expect(source).toContain("Mark all absent");
    expect(source).toContain("Reset");
    expect(source).toContain("Search by name, roll, or admission no.");

    // 3. Table columns & segmented status buttons matching Image 2 & 3
    expect(source).toContain("STUDENT");
    expect(source).toContain("ROLL");
    expect(source).toContain("STATUS");
    expect(source).toContain("NOTE");
    expect(source).toContain('"present"');
    expect(source).toContain('"absent"');
    expect(source).toContain('"late"');
    expect(source).toContain('"halfDay"');
    expect(source).toContain('"leave"');

    // 4. Unsaved change indicator dot
    expect(source).toContain("isUnsaved");
    expect(source).toContain("bg-amber-500");

    // 5. Sticky bottom bar with status tallies and save button
    expect(source).toContain("sticky bottom-");
    expect(source).toContain("Present");
    expect(source).toContain("All saved");
    expect(source).toContain("Save");
    expect(source).toContain("saveLockRef");

    // 6. Seed students list matching reference
    expect(source).toContain("Ayaan Pillai");
    expect(source).toContain("Ishita Bose");
    expect(source).toContain("Ananya Sharma");
  });

  test("DailyMarkingView handles row click and opens ClassDailyAttendanceView", () => {
    const dailyPath = join(__dirname, "../daily-marking-view.tsx");
    const source = readFileSync(dailyPath, "utf-8");

    // 1. Row is clickable with cursor-pointer
    expect(source).toContain("onClick={() => router.push(targetHref)}");
    expect(source).toContain("cursor-pointer");

    // 2. Mounts ClassDailyAttendanceView when a class is selected
    expect(source).toContain("ClassDailyAttendanceView");
    expect(source).toContain("activeClassRow");

    // 3. Command center data integration for status & tallies
    expect(source).toContain("useAttendanceCommandCenter");
  });

  test("ClassRegisterList table row is clickable to open register", () => {
    const listPath = join(__dirname, "../../classes/components/ClassRegisterList.tsx");
    const source = readFileSync(listPath, "utf-8");

    expect(source).toContain("onClick={() => onOpenRegister(cls)}");
    expect(source).toContain("cursor-pointer");
  });
});
