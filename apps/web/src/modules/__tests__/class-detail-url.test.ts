import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { classRefFromPathname } from "@/modules/students/classes/class-ref";
import { parseRoute } from "@/lib/routing/module-routes";
import { qualifyAdminTail } from "@/components/layout/sidebar/screen-owners";
import { isAdminModuleScreen } from "@/components/layout/sidebar/module-nav-config";

const at = (...p: string[]) =>
  readFileSync(resolve(import.meta.dir, "..", "students", "classes", ...p), "utf8");

// /students/classes/<class-slug> is a class page, not a filtered roster, so the
// screen has to be able to read its own third segment back out of the URL.
test("the class screen reads the segment after its own key as a class ref", () => {
  expect(classRefFromPathname("/dps/2026-27/students/classes/class-1st-a")).toBe("class-1st-a");
  expect(classRefFromPathname("/dps/students/classes/class-1st-a")).toBe("class-1st-a");
  expect(classRefFromPathname("/dps/2026-27/classes/class-1st-a")).toBe("class-1st-a");
});

test("the classes list URL carries no ref", () => {
  expect(classRefFromPathname("/dps/2026-27/students/classes")).toBeNull();
  expect(classRefFromPathname("/dps/students/classes")).toBeNull();
});

// Another screen's trailing segment is an id, not a class, and reading it as one
// would render a class page on top of a different screen.
test("a ref is only read when the classes key is actually in the path", () => {
  expect(classRefFromPathname("/dps/students/list/STU-9")).toBeNull();
  expect(classRefFromPathname("/dps/2026-27/students")).toBeNull();
  expect(classRefFromPathname("")).toBeNull();
});

// A ref is URL text, so `class%201a` has to arrive as the name it was written from.
test("a percent-encoded ref is decoded", () => {
  expect(classRefFromPathname("/dps/students/classes/class%201a")).toBe("class 1a");
});

// The link and the parser must agree, or the URL in the address bar means a
// different screen than the one that was pushed.
test("the emitted tail lands back on the classes screen", () => {
  const tail = qualifyAdminTail("classes/class-1st-a", "students");
  expect(tail).toBe("students/classes/class-1st-a");

  const route = parseRoute(`/demo-academy/2026-2027/${tail}`, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: (first) => first === "demo-academy",
    yearSlugs: ["2026-2027"],
  });
  expect(route).toEqual({ year: "2026-2027", module: "students", screen: "classes" });
});

// The whole ask: a row opens its class, not the All Students roster filtered to it.
test("a class row opens the class page instead of the filtered student list", () => {
  const s = at("index.tsx");
  expect(s).toContain("classes/${cls.slug ?? cls.id}");
  expect(s).not.toMatch(/["'`]list\?classId/);
  expect(s).toContain("<ClassDetail");
});

// The detail page is a second screen of the same module, so it decides list-or-detail
// here; a new dispatcher case would have meant touching the shared route contract.
test("one screen answers both URLs, so the route parser never sees a new case", () => {
  const s = at("index.tsx");
  expect(s).toContain("classRefFromPathname(usePathname())");
  expect(s).toContain("function ClassList");
});

// The class is named by its slug in the address bar, but the roster is keyed by id,
// and the header counts a class rather than a page — so both read the server.
test("the class page resolves the slug and counts the class, not the page", () => {
  const d = at("ClassDetail.tsx");
  expect(d).toContain("c.slug === classRef");
  expect(d).toContain("classId=${cls.id}");
  expect(d).toContain("classId: cls.id");
  expect(d).toContain("totalItems");
  expect(d).not.toMatch(/rows\.length\s*[+*/]\s*(boys|girls)/);
});
