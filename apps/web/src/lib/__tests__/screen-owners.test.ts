import { test, expect, describe } from "bun:test";
import {
  adminModuleIds,
  adminScreenOwners,
  canonicalAdminTail,
} from "@/components/layout/sidebar/screen-owners";
import { isAdminModuleScreen } from "@/components/layout/sidebar/module-nav-config";
import { moduleCatalogue } from "@/modules/dashboard/components/adminDashboard/moduleCatalogue";
import { academicYearUrl } from "@/lib/routing/academic-year-url";
import { parseRoute } from "@/lib/routing/module-routes";

// What the grid change is only half of: a card that left the dashboard because its
// screen is another module's panel row should also stop being addressable as a
// top-level URL. This map is the other half, and it is derived from the same
// `parent` field, so the two cannot drift apart.
const EXPECTED = [
  ["certificates", "students"],
  ["graduated", "students"],
  ["promotions", "students"],
  ["school-settings", "academics"],
  ["students-dashboard", "students"],
  ["timetable", "academics"],
];

describe("admin screen owners", () => {
  test("the map is exactly the parented cards that name one module", () => {
    expect(Object.entries(adminScreenOwners).sort()).toEqual(EXPECTED);
  });

  test("shared and unbuilt parents contribute nothing", () => {
    // Reports is a row of six panels, so naming one owner would be a coin flip. Tests and
    // Homework have `screen: null`, so there is no route to canonicalise.
    expect(adminScreenOwners["reports"]).toBeUndefined();
    expect(adminScreenOwners["assessments"]).toBeUndefined();
    expect(adminScreenOwners["homework"]).toBeUndefined();
    const shared = moduleCatalogue.filter((c) => c.parent === "shared");
    expect(shared.map((c) => c.id)).toEqual(["reports"]);
  });

  test("every mapped screen is a live row of the panel it would be sent to", () => {
    const unreachable = EXPECTED.filter(
      ([screen, module]) => !isAdminModuleScreen(module, screen),
    );
    expect(unreachable).toEqual([]);
  });

  test("no mapped screen collides with a rail module id", () => {
    // canonicalOwner() refuses to rewrite a screen that is also a module id, so a
    // collision would silently drop that screen from the map.
    const collided = EXPECTED.filter(([screen]) => adminModuleIds.has(screen));
    expect(collided).toEqual([]);
  });
});

describe("canonicalAdminTail", () => {
  test("a bare owned screen becomes its module-qualified tail", () => {
    expect(canonicalAdminTail(null, "timetable")).toBe("academics/timetable");
    expect(canonicalAdminTail(null, "graduated")).toBe("students/graduated");
    // The Students front door's own row, reached from the landing-owner map rather
    // than the parented-card map, because the card is the module.
    expect(canonicalAdminTail(null, "list")).toBe("students/list");
  });

  test("an already qualified screen returns null, which is what stops a redirect loop", () => {
    expect(canonicalAdminTail("academics", "timetable")).toBeNull();
  });

  test("unowned keys are left alone", () => {
    for (const screen of ["modules", "students", "reports", "notices", "tickets", "nope"]) {
      expect(canonicalAdminTail(null, screen)).toBeNull();
    }
  });

  test("the target parses back to the same module and screen it was built for", () => {
    // Not a tautology: it proves the rewritten path is one the contract reads as
    // qualified, so the canonicaliser sees a module and returns null next time.
    for (const [screen, module] of EXPECTED) {
      const tail = canonicalAdminTail(null, screen) as string;
      const path = academicYearUrl("demo-academy", "2026-2027", tail);
      expect(path).toBe(`/demo-academy/2026-2027/${module}/${screen}`);
      expect(
        parseRoute(path, {
          isModuleScreen: isAdminModuleScreen,
          isTenantRoot: (first) => first === "demo-academy",
          yearSlugs: ["2026-2027"],
        }),
      ).toEqual({ year: "2026-2027", module, screen });
    }
  });
});
