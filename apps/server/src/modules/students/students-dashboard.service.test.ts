import { test, expect, describe } from "bun:test";
import {
  NEP_STAGES,
  UNTRACKED_TILES,
  ageBandOf,
  ageYearsOn,
  daysSince,
  expectedMinAgeForGrade,
  inWindow,
  latestStamp,
  medianAge,
  monthKey,
  monthSpan,
  nepStageKey,
  profileCompletenessPct,
  profileFieldCount,
  trendMonths,
  youngerThanExpected,
} from "./students-dashboard.service";

/**
 * Only the derivations are tested here. Everything that needs a row is a `SELECT`
 * whose shape the web screen re-checks at runtime, and the server suite has no
 * database — the same split `backfill_academic_years.test.ts` uses.
 */

describe("NEP stage bands", () => {
  test("a grade lands in exactly one stage", () => {
    expect(nepStageKey("1")).toBe("foundational");
    expect(nepStageKey("3")).toBe("foundational");
    expect(nepStageKey("4")).toBe("preparatory");
    expect(nepStageKey("5")).toBe("preparatory");
    expect(nepStageKey("6")).toBe("middle");
    expect(nepStageKey("8")).toBe("middle");
    expect(nepStageKey("9")).toBe("secondary");
    expect(nepStageKey("12")).toBe("secondary");
  });

  test("a grade that does not parse is not guessed at", () => {
    // `Class.grade` is free text. The academics service puts unparsed grades in an
    // explicit bucket rather than rounding them into a stage, and so does this.
    expect(nepStageKey("LKG")).toBe("unclassified");
    expect(nepStageKey("")).toBe("unclassified");
    expect(nepStageKey(null)).toBe("unclassified");
    expect(nepStageKey("0")).toBe("unclassified");
    expect(nepStageKey("13")).toBe("unclassified");
  });

  test("the bands cover grades 1 to 12 with no gap or overlap", () => {
    const covered: number[] = [];
    for (const stage of NEP_STAGES) {
      for (let g = stage.min; g <= stage.max; g++) covered.push(g);
    }
    expect(covered.length).toBe(12);
    expect(new Set(covered).size).toBe(12);
    expect(Math.min(...covered)).toBe(1);
    expect(Math.max(...covered)).toBe(12);
  });
});

describe("age", () => {
  test("is whole years completed, not a year subtraction", () => {
    expect(ageYearsOn("2018-09-15", "2026-04-01")).toBe(7);
    expect(ageYearsOn("2018-09-15", "2026-10-01")).toBe(8);
    expect(ageYearsOn("2018-09-15", "2026-09-15")).toBe(8);
  });

  test("an unparseable date of birth is null, never zero", () => {
    // 0 would read as "a newborn enrolled in Grade 9" on the age pyramid.
    expect(ageYearsOn(null, "2026-04-01")).toBeNull();
    expect(ageYearsOn("", "2026-04-01")).toBeNull();
    expect(ageYearsOn("not-a-date", "2026-04-01")).toBeNull();
  });

  test("the pyramid bands are the reference's five buckets plus unknown", () => {
    expect(ageBandOf(4)).toBe("3-5");
    expect(ageBandOf(5)).toBe("3-5");
    expect(ageBandOf(6)).toBe("6-8");
    expect(ageBandOf(8)).toBe("6-8");
    expect(ageBandOf(9)).toBe("9-11");
    expect(ageBandOf(11)).toBe("9-11");
    expect(ageBandOf(12)).toBe("12-14");
    expect(ageBandOf(14)).toBe("12-14");
    expect(ageBandOf(15)).toBe("15-17");
    expect(ageBandOf(17)).toBe("15-17");
    // Outside the plotted range a school can still have, so it is not silently dropped.
    expect(ageBandOf(2)).toBe("under-3");
    expect(ageBandOf(19)).toBe("over-17");
  });

  test("median takes the middle of the sorted list, and the lower one when it is even", () => {
    expect(medianAge([7, 9, 8])).toBe(8);
    expect(medianAge([7, 8, 9, 10])).toBe(8);
    expect(medianAge([])).toBeNull();
  });
});

describe("the younger-than-expected alert", () => {
  test("a grade admits a child from five plus that grade", () => {
    expect(expectedMinAgeForGrade(1)).toBe(6);
    expect(expectedMinAgeForGrade(10)).toBe(15);
    expect(expectedMinAgeForGrade(null)).toBeNull();
    expect(expectedMinAgeForGrade(0)).toBeNull();
  });

  test("flags only a child below the floor, and stays quiet on missing data", () => {
    expect(youngerThanExpected({ grade: 1, dob: "2021-06-01", on: "2026-04-01" })).toBe(true);
    expect(youngerThanExpected({ grade: 1, dob: "2019-06-01", on: "2026-04-01" })).toBe(false);
    expect(youngerThanExpected({ grade: null, dob: "2021-06-01", on: "2026-04-01" })).toBe(false);
    expect(youngerThanExpected({ grade: 1, dob: null, on: "2026-04-01" })).toBe(false);
  });
});

describe("profile completeness", () => {
  test("scores the four fields a student row actually has", () => {
    // The reference shows 62%. Nothing in this schema records a document, an address
    // proof or a category, so scoring more fields would mean inventing them.
    const full = { dateOfBirth: "2018-05-05", bloodGroup: "B+", parentId: "p1", rollNumber: "12" };
    expect(profileFieldCount(full)).toBe(4);
    expect(profileCompletenessPct([full, full])).toBe(100);
  });

  test("counts an empty string as missing", () => {
    expect(profileFieldCount({ dateOfBirth: "", bloodGroup: null, parentId: null, rollNumber: "12" })).toBe(1);
  });

  test("a partly-filled cohort reads the share of students complete on every field", () => {
    const rows = [
      { dateOfBirth: "2018-01-01", bloodGroup: "B+", parentId: "p", rollNumber: "1" },
      { dateOfBirth: "2018-01-01", bloodGroup: null, parentId: "p", rollNumber: "2" },
      { dateOfBirth: "2018-01-01", bloodGroup: "O+", parentId: "p", rollNumber: "3" },
      { dateOfBirth: "2018-01-01", bloodGroup: "A+", parentId: "p", rollNumber: "4" },
    ];
    expect(profileCompletenessPct(rows)).toBe(75);
  });

  test("an empty cohort is 0, not a division by zero", () => {
    expect(profileCompletenessPct([])).toBe(0);
  });
});

describe("window and month keys", () => {
  test("a session window is inclusive at both ends", () => {
    expect(inWindow("2026-04-01", "2026-04-01", "2027-03-31")).toBe(true);
    expect(inWindow("2027-03-31", "2026-04-01", "2027-03-31")).toBe(true);
    expect(inWindow("2026-03-31", "2026-04-01", "2027-03-31")).toBe(false);
    expect(inWindow(null, "2026-04-01", "2027-03-31")).toBe(false);
  });

  test("month keys sort as calendar order", () => {
    expect(monthKey("2026-09-21")).toBe("2026-09");
    expect(monthKey("2026-1-5")).toBeNull();
    expect(["2026-09", "2026-10", "2027-01"].sort()).toEqual(["2026-09", "2026-10", "2027-01"]);
  });

  test("the trend window is the trailing year, ending with the current month", () => {
    // Twelve bars no matter what a school set its session to. Plotting admissions
    // against the session instead would restart the curve every April.
    expect(trendMonths("2026-09-29")).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  test("the trend window crosses the year boundary backwards", () => {
    // January's trailing year starts in the previous February, not the previous January.
    expect(trendMonths("2026-01-15")[0]).toBe("2025-02");
    expect(trendMonths("2026-01-15")).toHaveLength(12);
    expect(trendMonths("not a date")).toEqual([]);
  });
});

describe("untracked tiles", () => {
  test("every one names the missing data, not a zero", () => {
    // The academics readiness axis does this for syllabus: an absent table is reported
    // as untracked, because 0% blames the school for a feature we never shipped.
    expect(UNTRACKED_TILES.length).toBeGreaterThan(0);
    for (const tile of UNTRACKED_TILES) {
      expect(tile.key).toBeTruthy();
      expect(tile.label).toBeTruthy();
      expect(tile.reason.length).toBeGreaterThan(15);
    }
  });

  test("keys are unique and none shadows a metric the service really computes", () => {
    const keys = UNTRACKED_TILES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    const computed = [
      "total",
      "admissions",
      "withdrawals",
      "graduated",
      "promoted",
      "profileCompleteness",
      "gender",
      "stages",
      "birthdays",
      "classStrength",
      "agePyramid",
      "enrolment",
      "movement",
      "alerts",
      "recentActivity",
      "lastUpdated",
    ];
    expect(keys.filter((k) => computed.includes(k))).toEqual([]);
  });
});

describe("recent activity", () => {
  test("a day count is whole days, not a subtraction of the day-of-month", () => {
    expect(daysSince("2026-09-29", "2026-09-29")).toBe(0);
    expect(daysSince("2026-09-28", "2026-09-29")).toBe(1);
    expect(daysSince("2026-08-31", "2026-09-01")).toBe(1);
    expect(daysSince("2025-10-01", "2026-09-29")).toBe(363);
  });

  test("a row stamped in the future reads today, never a negative age", () => {
    // `updatedAt` is written by the database clock and `today` by this one; either can
    // lead the other by a few hours, and a `-1d` on the dashboard is not a thing.
    expect(daysSince("2026-09-30", "2026-09-29")).toBe(0);
  });

  test("a missing or malformed stamp is today, not NaN", () => {
    expect(daysSince("", "2026-09-29")).toBe(0);
    expect(daysSince("not a date", "2026-09-29")).toBe(0);
    expect(daysSince("2026-09-20", "")).toBe(0);
  });
});

describe("the trend window", () => {
  test("a session's months are counted inclusively", () => {
    expect(monthSpan("2026-06-01", "2026-09-29")).toBe(4);
  });

  test("a session that crosses a year boundary still counts its months", () => {
    expect(monthSpan("2025-11-02", "2026-02-10")).toBe(4);
  });

  test("with no session row there is no window, so a trailing year is kept", () => {
    expect(monthSpan(null, "2026-09-29")).toBe(12);
    expect(monthSpan("not a date", "2026-09-29")).toBe(12);
  });

  test("a session that has not opened yet still gets one month of axis", () => {
    expect(monthSpan("2026-12-01", "2026-09-29")).toBe(1);
  });
});

describe("the footer stamp", () => {
  test("the newest row wins, whatever order the cohort arrives in", () => {
    expect(
      latestStamp([
        "2026-08-01T00:00:00.000Z",
        "2026-09-29T18:08:00.000Z",
        "2026-09-29T06:12:00.000Z",
      ]),
    ).toBe("2026-09-29T18:08:00.000Z");
  });

  test("a cohort with nothing stamped has no footer at all", () => {
    // An empty string would render as "Updated Invalid Date" under the cards.
    expect(latestStamp([])).toBeNull();
    expect(latestStamp([null, null])).toBeNull();
  });

  test("the whole ISO instant survives, because the footer shows a time", () => {
    // `updatedAt` is otherwise formatted to a date and the clock is thrown away.
    expect(latestStamp(["2026-09-29T23:38:11.000Z"])).toBe("2026-09-29T23:38:11.000Z");
  });
});
