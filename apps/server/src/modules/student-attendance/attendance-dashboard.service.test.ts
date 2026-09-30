import { expect, test } from "bun:test";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import { StudentsDashboardService } from "../students/students-dashboard.service";
import {
  DEFAULT_TARGET,
  AttendanceDashboardService,
  bandOf,
  deltaPoints,
  inSchoolRate,
  isSchoolDay,
  minutesOf,
  monthBounds,
  pastCutoff,
  previousMonthBounds,
  rateOver,
  shiftDay,
} from "./attendance-dashboard.service";

/**
 * The dashboard is a screen full of derived numbers, and the derivation is where a wrong
 * one would live: a band threshold read as a constant, a month boundary that skips a
 * December, a comparison drawn against a month nobody marked. These pins are the arithmetic
 * the cards show, checked without a browser.
 */

test("a day shifts by whole days without a month boundary eating one", () => {
  expect(shiftDay("2026-09-01", -1)).toBe("2026-08-31");
  expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  // A leap day still lands on the 29th, so a February grid never loses a cell.
  expect(shiftDay("2024-02-28", 1)).toBe("2024-02-29");
});

test("the month bounds are inclusive at both ends", () => {
  expect(monthBounds("2026-09-17")).toEqual({ start: "2026-09-01", end: "2026-09-30" });
  expect(monthBounds("2026-02-05")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
});

test("the comparison month is the one before, across a year", () => {
  expect(previousMonthBounds("2026-01-15")).toEqual({ start: "2025-12-01", end: "2025-12-31" });
  expect(previousMonthBounds("2026-09-30")).toEqual({ start: "2026-08-01", end: "2026-08-31" });
});

test("the bands come off the school's own target, not a constant", () => {
  // Good at target, Watch within ten points under it, Critical below that.
  expect(bandOf(92, 92)).toBe("good");
  expect(bandOf(91, 92)).toBe("watch");
  expect(bandOf(82, 92)).toBe("watch");
  expect(bandOf(81, 92)).toBe("critical");
  // A school that sets a laxer target gets its own thresholds, not the default's.
  expect(bandOf(70, 70)).toBe("good");
  expect(bandOf(69, 70)).toBe("watch");
  expect(bandOf(59, 70)).toBe("critical");
  expect(DEFAULT_TARGET).toBe(92);
});

test("a rate is present over marked students, never over an empty window", () => {
  expect(rateOver([{ present: 8, absent: 2 }, { present: 10, absent: 0 }])).toBe(90);
  expect(rateOver([])).toBe(0);
  expect(rateOver([{ present: 0, absent: 0 }])).toBe(0);
});

test("the in-school share is measured against the roll, to one decimal", () => {
  // The reference prints 0.0% and 86.0 pp, so a rate that silently rounds to a whole
  // number would disagree with the card next to it.
  expect(inSchoolRate(259, 297)).toBe(87.2);
  expect(inSchoolRate(1, 3)).toBe(33.3);
  expect(inSchoolRate(0, 0)).toBe(0);
});

test("a delta needs something to compare against", () => {
  expect(deltaPoints(88, 80)).toBe(8);
  expect(deltaPoints(88, 90)).toBe(-2);
  // A month nobody marked has no rate, and "0 points" would read as a collapse.
  expect(deltaPoints(88, null)).toBeNull();
});

test("a holiday outranks a working day and a weekend does not need one", () => {
  const week = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  // 2026-09-07 is a Monday, 2026-09-06 a Sunday.
  expect(isSchoolDay("2026-09-07", week, new Set())).toBe(true);
  expect(isSchoolDay("2026-09-06", week, new Set())).toBe(false);
  expect(isSchoolDay("2026-09-07", week, new Set(["2026-09-07"]))).toBe(false);
  // An empty setting is the default week, not "the school never opens".
  expect(isSchoolDay("2026-09-05", [], new Set())).toBe(true);
  expect(isSchoolDay("2026-09-06", [], new Set())).toBe(false);
});

test("the cutoff is a clock the register can compare against", () => {
  expect(minutesOf("09:00")).toBe(540);
  expect(minutesOf("not a time")).toBeNull();
  const at = (h: number, m: number) => new Date(2026, 8, 30, h, m, 0);
  expect(pastCutoff(at(8, 59), "09:00")).toBe(false);
  expect(pastCutoff(at(9, 0), "09:00")).toBe(true);
  expect(pastCutoff(at(14, 30), "09:00")).toBe(true);
  // An unreadable cutoff never invents a late.
  expect(pastCutoff(at(23, 59), "0900")).toBe(false);
});

test("the roll agrees with the students dashboard's own count", async () => {
  // Both screens scope by tenant through Class, and "259 of 297" has to mean the same 297
  // on both. A silent change to either scope shows up here as two different numbers.
  const tenant = await db
    .select({ id: schema.users.tenantId })
    .from(schema.students)
    .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
    .where(and(isNull(schema.students.deletedAt), eq(schema.users.role, "student")))
    .limit(1)
    .then((r) => r[0]?.id);
  expect(tenant).toBeTruthy();

  const classes = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(eq(schema.classes.tenantId, tenant!));
  const roll = await db
    .select({ students: count() })
    .from(schema.students)
    .where(
      and(
        inArray(
          schema.students.classId,
          classes.map((c) => c.id),
        ),
        eq(schema.students.status, "active"),
        isNull(schema.students.deletedAt),
      ),
    );
  const activeOnRoll = roll[0]?.students ?? 0;

  const [attendance, students] = await Promise.all([
    AttendanceDashboardService.commandCenter(tenant!),
    StudentsDashboardService.commandCenter(tenant!),
  ]);

  expect(attendance.stats.rollStrength).toBe(activeOnRoll);
  expect(attendance.stats.rollStrength).toBe(students.stats.total);
  // Every student on the roll is in exactly one of present, absent, or still unmarked,
  // which is what stops the status grid from silently dropping children.
  const present = attendance.statusBreakdown.find((cell) => cell.key === "present")?.students ?? 0;
  const absent = attendance.statusBreakdown.find((cell) => cell.key === "absent")?.students ?? 0;
  expect(present + absent + attendance.stats.unmarkedToday).toBe(attendance.stats.rollStrength);
  expect(attendance.stats.totalClasses).toBe(classes.length);
});

test("three of the six status columns are not tracked in this build", async () => {
  // The honest part of the screen: a zero on an unshipped status reads as a school that
  // failed to do something, so it has to arrive flagged rather than as a number.
  const out = await AttendanceDashboardService.commandCenter("otlwwde7c6n8mmhl7dc1c8zb");
  const untracked = out.statusBreakdown.filter((cell) => !cell.tracked).map((cell) => cell.key);
  expect(untracked).toEqual(["late", "halfDay", "leave"]);
  expect(out.untracked.map((tile) => tile.key)).toEqual(["late", "halfDay", "leave"]);
  for (const cell of out.statusBreakdown.filter((c) => !c.tracked)) {
    expect(cell.reason.length).toBeGreaterThan(10);
  }
});

test("the session is framed in days the school can check", async () => {
  const out = await AttendanceDashboardService.commandCenter("otlwwde7c6n8mmhl7dc1c8zb");
  if (out.session) {
    expect(out.session.dayNumber).toBeGreaterThan(0);
    expect(out.session.dayNumber).toBeLessThanOrEqual(out.session.totalDays);
    expect(out.calendar.length).toBeGreaterThanOrEqual(28);
    expect(out.calendar.length).toBeLessThanOrEqual(31);
    expect(out.calendar.filter((d) => !d.isSchoolDay).length).toBeGreaterThan(0);
  }
});
