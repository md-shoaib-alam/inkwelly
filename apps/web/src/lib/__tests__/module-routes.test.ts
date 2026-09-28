import { describe, expect, test } from "bun:test";
import {
  canonicalOwner,
  componentKey,
  parseRoute,
  qualifiedKey,
  splitKey,
  type RouteContext,
} from "@/lib/routing/module-routes";

// A panel shaped like the real one: `students` owns a `classes` sub-link, and
// `academics` owns `classes` and `academic-years`. `detail` is deliberately absent.
const PANEL: Record<string, string[]> = {
  academics: ["classes", "academic-years"],
  students: ["students", "classes"],
  "student-fees": ["classes", "fees"],
};

const ctx: RouteContext = {
  isModuleScreen: (module, screen) => PANEL[module]?.includes(screen) ?? false,
  isTenantRoot: (first) => first === "demo-academy",
};

const p = (pathname: string) => parseRoute(pathname, ctx);

describe("parseRoute", () => {
  test("a bare tenant root is the dashboard", () => {
    expect(p("/demo-academy")).toEqual({ module: null, screen: "dashboard" });
  });

  test("one segment after the tenant is a bare screen", () => {
    expect(p("/demo-academy/school-settings")).toEqual({
      module: null,
      screen: "school-settings",
    });
  });

  test("module + screen when the pair is a declared sub-link", () => {
    expect(p("/demo-academy/academics/classes")).toEqual({
      module: "academics",
      screen: "classes",
    });
  });

  test("three segments that are NOT a declared sub-link stay a bare screen", () => {
    // `/students/STU-123` is the legacy screen/detail shape and must keep working.
    expect(p("/demo-academy/students/STU-123")).toEqual({
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
      module: null,
      screen: "not-a-module",
    });
  });
});

describe("key helpers", () => {
  test("qualifiedKey and splitKey round-trip", () => {
    expect(splitKey(qualifiedKey("academics", "classes"))).toEqual({ module: "academics", screen: "classes" });
    expect(splitKey(qualifiedKey("student-fees", "classes"))).toEqual({ module: "student-fees", screen: "classes" });
    expect(splitKey("dashboard")).toEqual({ module: null, screen: "dashboard" });
  });

  test("componentKey maps only the declared pairs and otherwise passes through", () => {
    expect(componentKey("academics", "classes")).toBe("classes");
    expect(componentKey("student-fees", "classes")).toBe("classes");
    expect(componentKey("students", "classes")).toBe("class-roster");
    expect(componentKey(null, "classes")).toBe("classes");
    expect(componentKey(null, "dashboard")).toBe("dashboard");
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
    expect(canonicalOwner("dashboard", owners, moduleIds)).toBeNull();
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
