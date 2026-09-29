import { test, expect, describe } from "bun:test";
import {
  adminLandingOwners,
  adminScreenOwners,
  qualifyAdminTail,
} from "@/components/layout/sidebar/screen-owners";
import {
  buildAdminRail,
  getDefaultScreen,
  isAdminModuleScreen,
} from "@/components/layout/sidebar/module-nav-config";
import { academicYearUrl } from "@/lib/routing/academic-year-url";
import { parseRoute } from "@/lib/routing/module-routes";

// Every link an admin can click is built by `useTenantHref`, which runs the tail
// through `qualifyAdminTail`. These three groups are the whole rule that builder
// has to implement, and they are in priority order:
//   1. a row of no module at all (`dashboard`, `students`) stays bare;
//   2. a row the current module declares goes under it (`money-book/reports`);
//   3. anything else goes to the one module that owns it (`academics/timetable`).
describe("qualifyAdminTail", () => {
  test("module roots and unowned screens stay bare", () => {
    // `/slug/students` addresses the All Students row of the Students module, so
    // `/slug/students/students` would be a second name for the same thing.
    for (const tail of ["dashboard", "students", "ai-connect", "notices", "reports", "nope"]) {
      expect(qualifyAdminTail(tail, null)).toBe(tail);
    }
  });

  test("a screen owned by a parented card gets that module", () => {
    expect(qualifyAdminTail("timetable", null)).toBe("academics/timetable");
    expect(qualifyAdminTail("calendar", null)).toBe("academics/calendar");
    expect(qualifyAdminTail("graduated", null)).toBe("students/graduated");
  });

  test("a module's own landing screen gets its module too", () => {
    // The dashboard grid links these, and the rail navigates to them, so they are
    // the URLs an admin lands on most often.
    expect(qualifyAdminTail("academics-dashboard", null)).toBe("academics/academics-dashboard");
    expect(qualifyAdminTail("fees", null)).toBe("student-fees/fees");
    expect(qualifyAdminTail("exams", null)).toBe("examinations/exams");
    expect(qualifyAdminTail("iam-dashboard", null)).toBe("iam/iam-dashboard");
  });

  test("the current module wins when it declares the row", () => {
    // `reports` is a row of six panels, so no single owner is right; from the
    // module you are standing in, the answer is unambiguous.
    expect(qualifyAdminTail("reports", "money-book")).toBe("money-book/reports");
    expect(qualifyAdminTail("reports", "student-fees")).toBe("student-fees/reports");
    expect(qualifyAdminTail("classes", "academics")).toBe("academics/classes");
    expect(qualifyAdminTail("classes", "student-fees")).toBe("student-fees/classes");
    expect(qualifyAdminTail("transport-fee", "student-fees")).toBe("student-fees/transport-fee");
  });

  test("a row the current module does not declare still goes to its owner", () => {
    expect(qualifyAdminTail("timetable", "students")).toBe("academics/timetable");
  });

  test("an already qualified tail is returned untouched, which makes it idempotent", () => {
    for (const tail of ["academics/timetable", "students/graduated", "money-book/reports"]) {
      expect(qualifyAdminTail(tail, "academics")).toBe(tail);
      expect(qualifyAdminTail(qualifyAdminTail(tail, null), "students")).toBe(tail);
    }
  });

  test("a query string and a detail segment both survive the rewrite", () => {
    // In-screen links carry their params in the tail, and `transport-fee/<name>`
    // carries a route name as a path segment. Neither is a module.
    expect(qualifyAdminTail("results-entry?examId=E-2&classId=C-1", "examinations")).toBe(
      "examinations/results-entry?examId=E-2&classId=C-1",
    );
    expect(qualifyAdminTail("transport-fee/Route%20A", "student-fees")).toBe(
      "student-fees/transport-fee/Route%20A",
    );
    expect(qualifyAdminTail("students?classId=C-1", null)).toBe("students?classId=C-1");
  });
});

// The rewrite is only safe while every tail it produces is one the routing
// contract reads back as the same module and screen. A qualified key the
// contract cannot read would render the wrong screen and loop the converger.
describe("qualified tails round-trip through parseRoute", () => {
  const TAILS: Array<[string, string | null]> = [
    ["timetable", null],
    ["academics-dashboard", null],
    ["fees", null],
    ["exams", null],
    ["iam-dashboard", null],
    ["reports", "money-book"],
    ["classes", "academics"],
    ["transport-fee", "student-fees"],
    ["results-entry?examId=E-2", "examinations"],
    ["transport-fee/Route%20A", "student-fees"],
  ];

  for (const [tail, module] of TAILS) {
    test(`${module ?? "owned"}: ${tail}`, () => {
      const qualified = qualifyAdminTail(tail, module);
      const [path, search = ""] = qualified.split("?");
      const segments = path.split("/");
      // A detail segment (`transport-fee/Route A`) is not part of the module/screen
      // pair, and `parseRoute` leaves it out of its result too.
      const [expectModule, expectScreen] =
        segments.length >= 2 ? [segments[0], segments[1]] : [null, segments[0]];
      // `parseRoute` reads a pathname, and a pathname never carries the query —
      // that is what `usePathname` and `useSearchParams` split apart for it.
      expect(
        parseRoute(academicYearUrl("demo-academy", "2026-2027", path), {
          isModuleScreen: isAdminModuleScreen,
          isTenantRoot: (first) => first === "demo-academy",
          yearSlugs: ["2026-2027"],
        }),
      ).toEqual({ year: "2026-2027", module: expectModule, screen: expectScreen });
      expect(qualified.endsWith(`?${search}`)).toBe(tail.includes("?"));
    });
  }

  test("the two owner maps never claim the same screen for different modules", () => {
    const both = Object.keys(adminLandingOwners).filter(
      (screen) => screen in adminScreenOwners && adminScreenOwners[screen] !== adminLandingOwners[screen],
    );
    expect(both).toEqual([]);
  });
});

// The rail qualifies against the module being *entered*, never the one the address
// bar still shows. Transport's landing screen is also a row of the Student Fees
// panel, so resolving it against the old module would leave `student-fees` in the
// URL and light up the panel of the module the admin just left.
describe("a rail click leaves the module it was in", () => {
  const rail = buildAdminRail();

  for (const entered of rail) {
    test(`${entered.key}`, () => {
      const tail = qualifyAdminTail(getDefaultScreen(entered), entered.key);
      expect(tail === entered.key || tail.startsWith(`${entered.key}/`)).toBe(true);
    });
  }

  test("the same screen name in two modules keeps the rail's answer", () => {
    // `transport-fee` is Transport's front door and a row of the Student Fees panel.
    // From the panel it belongs to Student Fees; from the rail it belongs to
    // Transport. `landingTail` is what feeds the rail branch the entered module.
    const transport = rail.find((m) => m.key === "transport")!;
    expect(qualifyAdminTail(getDefaultScreen(transport), "student-fees")).toBe(
      "student-fees/transport-fee",
    );
    expect(qualifyAdminTail(getDefaultScreen(transport), transport.key)).toBe(
      "transport/transport-fee",
    );
  });
});
