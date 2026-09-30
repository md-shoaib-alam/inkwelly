import { expect, test } from "bun:test";
import { ATTENDANCE_STATUSES, normalizeAttendanceStatus } from "./attendance-status";

/**
 * `Attendance.status` has no constraint at the database, so this matcher is the whole of the
 * write path's validation. Two things it has to get right: the spellings a sheet and the
 * marking screen each produce have to land on one status, and a value that means none of the
 * five has to be refused rather than stored where every report's counter will pass over it.
 */

test("the five the register writes are unchanged by the matcher", () => {
  for (const status of ATTENDANCE_STATUSES) {
    expect(normalizeAttendanceStatus(status)).toBe(status);
  }
});

test("the spellings a sheet imports land on the status the screen sends", () => {
  expect(normalizeAttendanceStatus("Half Day")).toBe("halfDay");
  expect(normalizeAttendanceStatus("half_day")).toBe("halfDay");
  expect(normalizeAttendanceStatus(" HALF-DAY ")).toBe("halfDay");
  expect(normalizeAttendanceStatus("Present")).toBe("present");
});

test("a value that means none of the five is refused", () => {
  for (const raw of ["", "   ", null, undefined, "unmarked", "banana", "presently"]) {
    expect(normalizeAttendanceStatus(raw)).toBeNull();
  }
});
