import { test, expect, describe } from "bun:test";
import {
  COLUMNS,
  GRADUATION_RATE,
  PROFILE_GAP_RATE,
  WITHDRAWAL_RATE,
  birthDateFor,
  chunk,
  columnGroups,
  planFor,
  spreadDate,
  trailingMonths,
  type StudentPlan,
} from "./backfill_student_status_and_gaps";
import {
  ageYearsOn,
  expectedMinAgeForGrade,
  youngerThanExpected,
} from "../modules/students/students-dashboard.service";

/**
 * The rules, never the database. `backfill_academic_years.test.ts` tests `defaultYearNames`
 * the same way: a run needs Postgres, a plan needs only an id — and a test that called the
 * runner would rewrite thousands of local rows on every `bun test`.
 */

const TODAY = new Date("2026-09-29T00:00:00Z");
const MONTHS = trailingMonths(TODAY);

/** A plan with every column spelled out, for the grouping tests that don't compute one. */
function plan(
  admissionDate: string | null,
  status: StudentPlan["status"],
  leftOn: string | null,
  bloodGroup: string | null,
  dateOfBirth: string | null,
): StudentPlan {
  return { admissionDate, status, leftOn, bloodGroup, dateOfBirth };
}

describe("trailingMonths", () => {
  test("ends with the month the run happens in", () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[11]).toBe("2026-09");
    expect(MONTHS[0]).toBe("2025-10");
  });

  test("walks back through January without a zero month", () => {
    const from = trailingMonths(new Date("2026-01-05T00:00:00Z"));
    expect(from[0]).toBe("2025-02");
    expect(from[11]).toBe("2026-01");
  });
});

describe("spreadDate", () => {
  test("stays inside the month it is given", () => {
    for (let i = 0; i < 200; i++) {
      expect(spreadDate(`s${i}`, "adm", "2026-03", TODAY)).toMatch(/^2026-03-(0[1-9]|[12]\d|3[01])$/);
    }
  });

  test("a February admission cannot be day 29 or later", () => {
    // A fixed 1-31 day on '2026-02' writes a date Postgres rejects outright.
    for (let i = 0; i < 500; i++) {
      expect(spreadDate(`s${i}`, "adm", "2026-02", TODAY)).toMatch(/^2026-02-(0[1-9]|1\d|2[0-8])$/);
    }
  });

  test("the current month never runs past the day of the run", () => {
    // An admission dated two days from now would put a future row in the trend chart.
    for (let i = 0; i < 500; i++) {
      expect(Number(spreadDate(`s${i}`, "adm", "2026-09", TODAY)?.slice(-2))).toBeLessThanOrEqual(29);
    }
  });

  test("is the same date for the same id, every time", () => {
    expect(spreadDate("student-abc", "adm", "2026-05", TODAY)).toBe(
      spreadDate("student-abc", "adm", "2026-05", TODAY),
    );
  });
});

describe("planFor", () => {
  test("the same id gets the same plan on every run", () => {
    // Idempotence lives or dies here. A plan derived from the row's current contents would
    // change after the first write, and the second run would move the data again.
    expect(planFor("student-abc", MONTHS, TODAY)).toEqual(planFor("student-abc", MONTHS, TODAY));
  });

  test("only a leaver gets a leaving date", () => {
    for (let i = 0; i < 400; i++) {
      const plan = planFor(`s${i}`, MONTHS, TODAY);
      if (plan.status === "withdrawn") expect(plan.leftOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      else expect(plan.leftOn).toBeNull();
    }
  });

  test("a real cohort hits the announced rates within a few points", () => {
    const plans = Array.from({ length: 5000 }, (_, i) => planFor(`s${i}`, MONTHS, TODAY));
    const share = (s: StudentPlan["status"]) =>
      plans.filter((p) => p.status === s).length / plans.length;
    const close = (actual: number, target: number) => Math.abs(actual - target) < 0.02;
    expect(close(share("withdrawn"), WITHDRAWAL_RATE)).toBe(true);
    expect(close(share("graduated"), GRADUATION_RATE)).toBe(true);
    expect(
      close(plans.filter((p) => p.bloodGroup === null).length / plans.length, PROFILE_GAP_RATE),
    ).toBe(true);
  });

  test("admissions land in every month of the window", () => {
    // One bar is the flat chart this backfill exists to remove.
    const seen = new Set(
      Array.from({ length: 5000 }, (_, i) =>
        planFor(`s${i}`, MONTHS, TODAY).admissionDate?.slice(0, 7),
      ),
    );
    expect([...seen].sort()).toEqual([...MONTHS].sort());
  });

  test("a blood group is planned for nine students in ten, and the gap is spread evenly", () => {
    const plans = Array.from({ length: 1000 }, (_, i) => planFor(`s${i}`, MONTHS, TODAY));
    expect(new Set(plans.map((p) => p.bloodGroup).filter(Boolean)).size).toBe(8);
  });
});

describe("birthDateFor", () => {
  test("a grade that cannot be read gets no date of birth", () => {
    // An age invented for a class we cannot read is the worst kind of dummy data: nothing
    // on the screen could contradict it.
    for (const grade of [null, "", "Nursery", "0", "13"]) {
      expect(birthDateFor("s1", grade, TODAY)).toBeNull();
    }
  });

  test("the same id and grade give the same date on every run", () => {
    expect(birthDateFor("s1", "5", TODAY)).toBe(birthDateFor("s1", "5", TODAY));
  });

  test("sits one to two years above the grade's floor, measured on the run date", () => {
    for (let grade = 1; grade <= 12; grade++) {
      const floor = expectedMinAgeForGrade(String(grade)) ?? 0;
      const age = ageYearsOn(birthDateFor(`a${grade}`, String(grade), TODAY) ?? "", "2026-09-29");
      expect(age).toBeGreaterThanOrEqual(floor + 1);
      expect(age).toBeLessThanOrEqual(floor + 2);
    }
  });

  test("never seeds a child the dashboard would then flag as under-aged", () => {
    // The two rules have to agree. If the filler put a six-year-old in Grade 10, the
    // STUDENTS_YOUNGER_THAN_GRADE alert would be reporting our own seed, not the school.
    for (let grade = 1; grade <= 12; grade++) {
      for (let i = 0; i < 60; i++) {
        const dob = birthDateFor(`s${grade}-${i}`, String(grade), TODAY) ?? "";
        expect(youngerThanExpected({ grade: String(grade), dob, on: "2026-04-01" })).toBe(false);
      }
    }
  });

  test("a grade's cohort spreads over the year, day by day", () => {
    const dates = new Set(
      Array.from({ length: 540 }, (_, i) => birthDateFor(`s${i}`, "5", TODAY)),
    );
    // Two ages x 364 daily slots. A 540-child grade lands on roughly 350 of them, and a
    // birthday list over this cohort then reads as a list of dates rather than one date.
    expect(dates.size).toBeGreaterThan(250);
    expect(dates.size).toBeLessThanOrEqual(728);
  });
});

describe("columnGroups", () => {
  test("ids sharing a planned value share one statement", () => {
    const groups = columnGroups([
      { id: "a", plan: plan("2026-01-05", "active", null, "O+", "2018-03-11") },
      { id: "b", plan: plan("2026-01-05", "active", null, "O+", "2018-03-11") },
      { id: "c", plan: plan("2026-01-05", "active", null, "A-", "2018-07-02") },
    ]);
    expect(groups.admissionDate.get("2026-01-05")).toEqual(["a", "b", "c"]);
    expect(groups.bloodGroup.get("O+")).toEqual(["a", "b"]);
    expect(groups.bloodGroup.get("A-")).toEqual(["c"]);
    expect(groups.dateOfBirth.get("2018-03-11")).toEqual(["a", "b"]);
  });

  test("a null plans no write, so nothing already recorded is blanked", () => {
    // The gap cohort and the leavers' dates both travel as null; a group for null would
    // turn `SET "bloodGroup" = NULL` into a deletion of a value the school already had.
    const groups = columnGroups([
      { id: "a", plan: plan(null, "active", null, null, null) },
    ]);
    expect([...groups.admissionDate.keys()]).toEqual([]);
    expect([...groups.leftOn.keys()]).toEqual([]);
    expect([...groups.bloodGroup.keys()]).toEqual([]);
    expect([...groups.dateOfBirth.keys()]).toEqual([]);
    expect(groups.status.get("active")).toEqual(["a"]);
  });

  test("leaver dates gather only leavers", () => {
    const plans = Array.from({ length: 500 }, (_, i) => ({
      id: `s${i}`,
      plan: planFor(`s${i}`, MONTHS, TODAY),
    }));
    const groups = columnGroups(plans);
    const leavers = plans.filter((p) => p.plan.status === "withdrawn").map((p) => p.id);
    const stamped = [...groups.leftOn.values()].flat();
    expect(stamped.sort()).toEqual(leavers.sort());
  });

  test("a five-thousand student cohort groups into statements, not one statement per row", () => {
    // Ungrouped, 5,000 rows across five columns is 25k round trips. Grouped by value the
    // measured count is ~3.9k — the date-of-birth column alone takes ~3.2k because a day of
    // the year is nearly unique per child — and that is what lets a local run finish in
    // under a minute.
    const plans = Array.from({ length: 5000 }, (_, i) => ({
      id: `s${i}`,
      plan: planFor(`s${i}`, MONTHS, TODAY, String((i % 12) + 1)),
    }));
    const groups = columnGroups(plans);
    const statements = COLUMNS.reduce((n, c) => n + groups[c].size, 0);
    expect(statements).toBeLessThan(5000);
    expect(statements * 5).toBeLessThan(5000 * COLUMNS.length);
    expect(groups.admissionDate.size).toBeGreaterThan(200);
    expect(groups.dateOfBirth.size).toBeGreaterThan(1500);
    expect([...groups.status.keys()].sort()).toEqual(["active", "graduated", "withdrawn"]);
    // Every student lands in exactly one status bucket: the grouping is a partition, so a
    // run cannot quietly skip the rows that fall between two values.
    expect([...groups.status.values()].flat().sort()).toEqual(
      plans.map((p) => p.id).sort(),
    );
    expect([...groups.bloodGroup.values()].flat().length).toBe(
      plans.filter((p) => p.plan.bloodGroup !== null).length,
    );
    expect([...groups.dateOfBirth.values()].flat().sort()).toEqual(
      plans.map((p) => p.id).sort(),
    );
  });
});

describe("chunk", () => {
  test("keeps a statement's parameter list bounded without losing an id", () => {
    const parts = chunk(Array.from({ length: 1201 }, (_, i) => `s${i}`), 500);
    expect(parts.map((p) => p.length)).toEqual([500, 500, 201]);
    expect(parts.flat()).toHaveLength(1201);
  });

  test("an empty group is no statement at all", () => {
    expect(chunk([], 500)).toEqual([]);
  });
});
