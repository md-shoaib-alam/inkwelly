import { expect, test } from "bun:test";
import {
  profilePathOf,
  rosterPathOf,
  studentProfileTail,
  studentRefFromPathname,
  studentRefOf,
} from "@/modules/students/students/student-ref";
import {
  DEFAULT_TAB,
  PROFILE_TABS,
  tabDefOf,
  tabFromParam,
  tabParamOf,
} from "@/modules/students/students/adminStudents/profile/tabs";

// The profile is addressed by a path segment rather than ?student=, so that a refresh
// (and a link out of the roster) names the student without the roster page loading first.
test("the profile ref comes off the tail of the roster screen's own URL", () => {
  expect(studentRefFromPathname("/demo-academy/2026-27/students/list/STU2026120")).toBe("STU2026120");
  expect(studentRefFromPathname("/demo-academy/students/list/STU2026120")).toBe("STU2026120");
  expect(studentRefFromPathname("/demo-academy/2026-27/students/students/STU2026120")).toBe("STU2026120");
});

test("a roster URL, and any other screen's trailing id, read as no ref", () => {
  expect(studentRefFromPathname("/demo-academy/2026-27/students/list")).toBeNull();
  // Graduated and class-change are separate screens whose URLs also end in an id.
  expect(studentRefFromPathname("/demo-academy/2026-27/students/graduated/STU2026120")).toBeNull();
  expect(studentRefFromPathname("/demo-academy/2026-27/students/class-change/STU2026120")).toBeNull();
  expect(studentRefFromPathname("/demo-academy/2026-27/students/classes/class-1st-a")).toBeNull();
  // One tail is the whole address; anything deeper belongs to another screen.
  expect(studentRefFromPathname("/demo-academy/2026-27/students/list/STU2026120/timeline")).toBeNull();
  expect(studentRefFromPathname("/demo-academy/2026-27/academics/exams/EX1")).toBeNull();
});

test("the ref survives a broken escape instead of taking the screen down", () => {
  expect(studentRefFromPathname("/d/2026-27/students/list/%")).toBe("%");
});

// Back has to land on the roster URL, and the roster's filters have to ride along in the
// query string, which is why the ref is a path segment and never a parameter.
test("the profile URL round-trips back to the roster URL", () => {
  const profile = "/demo-academy/2026-27/students/list/STU2026120";
  expect(rosterPathOf(profile, true)).toBe("/demo-academy/2026-27/students/list");
  expect(profilePathOf(rosterPathOf(profile, true), "STU2026120")).toBe(profile);
  expect(rosterPathOf("/demo-academy/2026-27/students/list", false)).toBe("/demo-academy/2026-27/students/list");
});

test("a ref with a space is encoded into the path and read back out", () => {
  expect(studentProfileTail("S-1 A")).toBe("list/S-1%20A");
  expect(profilePathOf("/d/2026-27/students/list", "S-1 A")).toBe("/d/2026-27/students/list/S-1%20A");
  expect(studentRefFromPathname("/d/2026-27/students/list/S-1%20A")).toBe("S-1 A");
});

test("the ref is the student ID first, then the roll number, then the internal id", () => {
  expect(studentRefOf({ username: "STU2026120", rollNumber: "1A001", id: "b5lunn" })).toBe("STU2026120");
  expect(studentRefOf({ username: null, rollNumber: "1A001", id: "b5lunn" })).toBe("1A001");
  expect(studentRefOf({ username: null, rollNumber: null, id: "b5lunn" })).toBe("b5lunn");
  expect(studentRefOf({})).toBe("");
});

test("the tab comes out of ?tab=, and a tab nobody knows falls back without a request", () => {
  expect(tabFromParam(null)).toBe(DEFAULT_TAB);
  expect(tabFromParam("family")).toBe("family");
  expect(tabFromParam("addresses")).toBe("addresses");
  expect(tabFromParam("bank")).toBe("bank");
  expect(tabFromParam("timeline")).toBe(DEFAULT_TAB);
  expect(tabFromParam("")).toBe(DEFAULT_TAB);
});

test("summary writes no parameter, so the plain profile URL is the summary tab", () => {
  expect(tabParamOf("summary")).toBeNull();
  expect(tabParamOf("family")).toBe("family");
  expect(tabFromParam(tabParamOf("summary"))).toBe("summary");
  for (const def of PROFILE_TABS) {
    expect(tabFromParam(tabParamOf(def.id))).toBe(def.id);
    expect(tabDefOf(def.id).id).toBe(def.id);
  }
});

// The profile route answers exactly these four, so a tab marked live here but absent
// there would 400 against an endpoint nobody wrote.
test("only the four tabs the server has a payload for are marked live", () => {
  expect(PROFILE_TABS.filter((t) => t.live).map((t) => t.id)).toEqual([
    "summary",
    "family",
    "academic",
    "addresses",
  ]);
  expect(PROFILE_TABS.map((t) => t.id)).toEqual([
    "summary",
    "family",
    "academic",
    "addresses",
    "bank",
    "documents",
    "requests",
    "udise",
  ]);
});
