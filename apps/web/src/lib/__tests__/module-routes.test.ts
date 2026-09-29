import { describe, expect, test } from "bun:test";
import {
  canonicalOwner,
  componentKey,
  LEGACY_SCREEN_KEYS,
  parseRoute,
  qualifiedKey,
  splitKey,
  type RouteContext,
} from "@/lib/routing/module-routes";

// A panel shaped like the real one: `students` owns its front door (`list`) and a
// `classes` sub-link, and `academics` owns `classes` and `academic-years`. `detail` is
// deliberately absent.
const PANEL: Record<string, string[]> = {
  academics: ["classes", "academic-years"],
  students: ["list", "classes"],
  "student-fees": ["classes", "fees"],
};

const ctx: RouteContext = {
  isModuleScreen: (module, screen) => PANEL[module]?.includes(screen) ?? false,
  isTenantRoot: (first) => first === "demo-academy",
};

const p = (pathname: string) => parseRoute(pathname, ctx);

describe("parseRoute", () => {
  test("a bare tenant root is the module launcher", () => {
    expect(p("/demo-academy")).toEqual({ year: null, module: null, screen: "modules" });
  });

  test("one segment after the tenant is a bare screen", () => {
    expect(p("/demo-academy/school-settings")).toEqual({
      year: null,
      module: null,
      screen: "school-settings",
    });
  });

  test("module + screen when the pair is a declared sub-link", () => {
    expect(p("/demo-academy/academics/classes")).toEqual({
      year: null,
      module: "academics",
      screen: "classes",
    });
  });

  test("a module's own front door reads as module + row", () => {
    // `/students` alone is the bare screen `students`; the roster's address bar carries
    // the row name, which is what makes it a two-segment route.
    expect(p("/demo-academy/students/list")).toEqual({
      year: null,
      module: "students",
      screen: "list",
    });
  });

  test("three segments that are NOT a declared sub-link stay a bare screen", () => {
    // `/students/STU-123` is the legacy screen/detail shape and must keep working.
    expect(p("/demo-academy/students/STU-123")).toEqual({
      year: null,
      module: null,
      screen: "students",
    });
  });

  test("the same screen name under two modules resolves to two different routes", () => {
    expect(p("/demo-academy/academics/classes").module).toBe("academics");
    expect(p("/demo-academy/students/classes").module).toBe("students");
  });

  test("an unknown module falls back to today's behaviour", () => {
    expect(p("/demo-academy/not-a-module/classes")).toEqual({
      year: null,
      module: null,
      screen: "not-a-module",
    });
  });
});

describe("key helpers", () => {
  test("qualifiedKey and splitKey round-trip", () => {
    expect(splitKey(qualifiedKey("academics", "classes"))).toEqual({ module: "academics", screen: "classes" });
    expect(splitKey(qualifiedKey("student-fees", "classes"))).toEqual({ module: "student-fees", screen: "classes" });
    expect(splitKey("modules")).toEqual({ module: null, screen: "modules" });
  });

  test("componentKey maps only the declared pairs and otherwise passes through", () => {
    expect(componentKey("academics", "classes")).toBe("classes");
    expect(componentKey("student-fees", "classes")).toBe("classes");
    expect(componentKey("students", "classes")).toBe("class-roster");
    expect(componentKey(null, "classes")).toBe("classes");
    expect(componentKey(null, "modules")).toBe("modules");
  });
});

describe("canonicalOwner", () => {
  const owners = { classes: "academics", fees: "student-fees" };
  const moduleIds = new Set(["academics", "students", "student-fees"]);

  test("a bare screen owned by a module canonicalises to it", () => {
    expect(canonicalOwner("classes", owners, moduleIds)).toBe("academics");
  });

  test("a bare screen that is also a module id is never rewritten", () => {
    // `/demo-academy/students` means All Students, not the students module root.
    expect(canonicalOwner("students", owners, moduleIds)).toBeNull();
  });

  test("an unowned screen is left alone", () => {
    // The launcher is a bare screen, not a module's row, so it never gains a prefix.
    expect(canonicalOwner("modules", owners, moduleIds)).toBeNull();
  });
});

// The dispatcher's staff guard must run on the resolved key. These two cases are
// the whole reason: a staff user typing a module-scoped URL must not slip past a
// guard that was only ever shown the bare half.
test("a module-scoped URL resolves to the same component key as the bare screen", () => {
  expect(componentKey("academics", "classes")).toBe(componentKey(null, "classes"));
});

test("a qualified key never leaks its module name as the screen", () => {
  expect(componentKey("academics", "classes")).not.toBe("academics");
});

// The year block below is a second context on purpose: the tests above carry no
// `yearSlugs`, which is what proves the widened contract leaves today's callers
// alone. `ctx` and `p` are already taken by that first block.
const YEARS = ["2026-2027", "2025-2026"];
const yearCtx = (over: Partial<RouteContext> = {}): RouteContext => ({
  isModuleScreen: (module, screen) => module === "academics" && screen === "classes",
  isTenantRoot: (first) => first === "demo",
  yearSlugs: YEARS,
  ...over,
});

describe("parseRoute with a year segment", () => {
  test("recognised year at index 1 becomes the year and drops out of the screen path", () => {
    expect(parseRoute("/demo/2026-2027/exams", yearCtx())).toEqual({
      year: "2026-2027",
      module: null,
      screen: "exams",
    });
    expect(parseRoute("/demo/2026-2027/academics/classes", yearCtx())).toEqual({
      year: "2026-2027",
      module: "academics",
      screen: "classes",
    });
  });

  test("a bare or qualified URL still resolves to its screen, with no year", () => {
    expect(parseRoute("/demo/exams", yearCtx())).toEqual({
      year: null,
      module: null,
      screen: "exams",
    });
    expect(parseRoute("/demo/academics/classes", yearCtx())).toEqual({
      year: null,
      module: "academics",
      screen: "classes",
    });
  });

  test("an unrecognised segment at index 1 is a screen, not a year", () => {
    expect(parseRoute("/demo/2024-2025/exams", yearCtx())).toEqual({
      year: null,
      module: null,
      screen: "2024-2025",
    });
  });

  test("a year with nothing after it means the module launcher", () => {
    expect(parseRoute("/demo/2026-2027", yearCtx())).toEqual({
      year: "2026-2027",
      module: null,
      screen: "modules",
    });
  });

  test("the year is not read when the first segment is the tenant root", () => {
    expect(parseRoute("/demo", yearCtx())).toEqual({
      year: null,
      module: null,
      screen: "modules",
    });
  });

  // The launcher is not inside a module, so its own URL must never gain a prefix and
  // must never be read as one. `modules` is a screen key, not a module id.
  test("the module launcher parses as a bare screen, with and without a year", () => {
    expect(p("/demo-academy/modules")).toEqual({ year: null, module: null, screen: "modules" });
    expect(parseRoute("/demo/2026-2027/modules", yearCtx())).toEqual({
      year: "2026-2027",
      module: null,
      screen: "modules",
    });
  });

  // The redirect arm needs the old key to still arrive as itself; if the parser
  // quietly renamed it there would be nothing left to redirect from.
  test("the retired `dashboard` key still parses as itself so it can be redirected", () => {
    expect(parseRoute("/demo/2026-2027/dashboard", yearCtx())).toEqual({
      year: "2026-2027",
      module: null,
      screen: "dashboard",
    });
  });

  test("no yearSlugs at all keeps the old behaviour exactly", () => {
    const bare = yearCtx({ yearSlugs: undefined });
    expect(parseRoute("/demo/academics/classes", bare)).toEqual({
      year: null,
      module: "academics",
      screen: "classes",
    });
    expect(parseRoute("/demo/students/STU-123", bare)).toEqual({
      year: null,
      module: null,
      screen: "students",
    });
  });
});

describe("LEGACY_SCREEN_KEYS", () => {
  test("the retired dashboard key points at the launcher", () => {
    expect(LEGACY_SCREEN_KEYS["dashboard"]).toBe("modules");
  });

  test("no key chains, so one redirect always lands on a live screen", () => {
    for (const target of Object.values(LEGACY_SCREEN_KEYS)) {
      expect(LEGACY_SCREEN_KEYS[target]).toBeUndefined();
    }
  });
});
