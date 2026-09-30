import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  adminLandingRoots,
  adminModuleLandings,
  adminSharedRoots,
  resolveAdminRoute,
  servesLandingAtRoot,
} from "@/components/layout/sidebar/module-roots";import {
  buildAdminRail,
  getDefaultScreen,
  isAdminModuleScreen,
} from "@/components/layout/sidebar/module-nav-config";
import { qualifyAdminTail } from "@/components/layout/sidebar/screen-owners";
import { componentKey, parseRoute } from "@/lib/routing/module-routes";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");
const DISPATCHER = "src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx";
const KEY_RE = /case\s(['"])([a-z0-9-]+)\1/g;
const routedKeys = new Set(
  [...readFileSync(join(APP_ROOT, DISPATCHER), "utf8").matchAll(KEY_RE)].map((m) => m[2]),
);

// Eleven of the thirteen rail modules open on a screen whose name is not the module's
// own, which is why `/slug/academics` used to bounce: no dispatcher case is named
// `academics`. Measured off the rail, so this pin is the list of roots that need
// resolving, and a card that starts or stops naming its own screen must change it.
// `academics` is measured against the thirteen purchasable rail modules, not the
// launcher row. The two not listed (`leaves`, `ai-connect`) open on a screen of their
// own name and so need no entry.
const EXPECTED_LANDINGS: [string, string][] = [
  ["academics", "academics-dashboard"],
  ["employee-attendance", "staff-attendance"],
  ["employees", "staff"],
  ["events", "calendar"],
  ["examinations", "exams"],
  ["iam", "iam-dashboard"],
  ["money-book", "expenses"],
  ["student-attendance", "attendance-dashboard"],
  ["student-fees", "fees"],
  ["students", "students-dashboard"],
  ["transport", "transport-fee"],
];

describe("the Students root is shared between roles", () => {
  // `students` is the roster's row key in the staff, teacher, student and parent nav
  // trees, and each of those permission maps is derived from its own tree, so the word
  // cannot move. An admin's module root is its landing; everyone else keeps the screen
  // the bare word has always served. The roster is reachable by every role at
  // `/students/list`, which is what the admin panel row links to.
  test("an admin's `/students` is the dashboard", () => {
    for (const role of ["admin", "super_admin"]) {
      expect(resolveAdminRoute(null, "students", role)).toEqual({
        module: "students",
        screen: "students-dashboard",
        canonicalTail: null,
      });
    }
  });

  test("every other role keeps `/students` as the roster", () => {
    for (const role of ["staff", "teacher", "student", "parent", null, undefined]) {
      expect(resolveAdminRoute(null, "students", role)).toEqual({
        module: null,
        screen: "students",
        canonicalTail: null,
      });
    }
  });

  test("the doubled root collapses for an admin, and the long form still mounts", () => {
    expect(resolveAdminRoute("students", "students-dashboard", "admin").canonicalTail).toBe(
      "students",
    );
    expect(resolveAdminRoute("students", "list", "admin")).toEqual({
      module: "students",
      screen: "list",
      canonicalTail: null,
    });
  });

  test("both roster spellings still mount the roster", () => {
    // `list` is stacked on `students` in the same switch, the shape `session` and the
    // legacy `academic-years` already use, so the qualified row and the other roles'
    // root render one screen while the staff key keeps its own case.
    expect(routedKeys.has("list")).toBe(true);
    expect(routedKeys.has("students")).toBe(true);
    const src = readFileSync(join(APP_ROOT, DISPATCHER), "utf8");
    expect(src).toMatch(/case 'list':\s*case 'students': return <AdminStudents \/>;/);
  });

  test("the roster row is addressed from inside its module", () => {
    expect(qualifyAdminTail("list", "students")).toBe("students/list");
    // The card lands on the dashboard now, so `list` is an ordinary panel row with no
    // owner to canonicalise it from. Bare `/list` still mounts the roster.
    expect(qualifyAdminTail("list", null)).toBe("list");
    expect(qualifyAdminTail("students-dashboard", null)).toBe("students/students-dashboard");
  });

  test("only the admin roles read a root as its landing", () => {
    expect(["admin", "super_admin"].every(servesLandingAtRoot)).toBe(true);
    expect(["staff", "teacher", "student", "parent", null, undefined].some(servesLandingAtRoot)).toBe(
      false,
    );
  });
});

describe("module roots", () => {
  test("every rail module is addressable by its own name", () => {
    const bounced = buildAdminRail()
      .map((item) => ({ item, key: screenKeyOfRoot(item.key) }))
      .filter(({ key }) => !routedKeys.has(key))
      .map(({ item }) => `${item.key} -> ${screenKeyOfRoot(item.key)}`);
    expect(bounced).toEqual([]);
  });

  test("the landings are exactly the eleven non-identity roots", () => {
    expect(Object.entries(adminModuleLandings).sort()).toEqual(
      [...EXPECTED_LANDINGS].sort(),
    );
  });

  test("no landing is shared and none is a module id", () => {
    // A shared landing would make `adminLandingRoots` last-write-wins, and a landing
    // that is also a module id would make one root name two screens.
    const moduleIds = new Set(buildAdminRail().map((m) => m.key));
    expect(Object.keys(adminLandingRoots).length).toBe(Object.keys(adminModuleLandings).length);
    expect(Object.keys(adminLandingRoots).filter((l) => moduleIds.has(l))).toEqual([]);
  });

  test("every rail row's default screen is what an admin's root renders", () => {
    for (const item of buildAdminRail()) {
      expect(resolveAdminRoute(null, item.key, "admin").screen).toBe(getDefaultScreen(item));
      // A shared root is the one place a non-admin's root is not the landing.
      const staffScreen = resolveAdminRoute(null, item.key, "staff").screen;
      expect(adminSharedRoots.has(item.key) ? item.key : getDefaultScreen(item)).toBe(staffScreen);
    }
  });

  test("the link builder never rewrites a rail name, wherever the click comes from", () => {
    // `module-sidebar` hands `module.key` to the tail builder, so the address bar only
    // reads `/slug/2026-27/academics` if `qualifyAdminTail` leaves a module id alone.
    // Checked against every other module as the *current* one: a name that is also
    // somebody's panel row would qualify to `that-module/academics` and light the
    // wrong panel.
    const ids = buildAdminRail().map((m) => m.key);
    const rewritten: string[] = [];
    for (const id of ids) {
      for (const ofModule of [null, ...ids]) {
        const tail = qualifyAdminTail(id, ofModule);
        if (tail !== id) rewritten.push(`${id} from /${ofModule ?? "-"} -> ${tail}`);
      }
    }
    expect(rewritten).toEqual([]);
  });
});

describe("resolveAdminRoute", () => {
  test("a bare module id renders that module's landing screen and needs no redirect", () => {
    expect(resolveAdminRoute(null, "academics", "admin")).toEqual({
      module: "academics",
      screen: "academics-dashboard",
      canonicalTail: null,
    });
  });

  test("a doubled root collapses to the module", () => {
    expect(resolveAdminRoute("academics", "academics-dashboard").canonicalTail).toBe("academics");
    expect(resolveAdminRoute("iam", "iam-dashboard").canonicalTail).toBe("iam");
  });

  test("a bare landing screen goes to the root, not to the doubled form", () => {
    expect(resolveAdminRoute(null, "academics-dashboard")).toEqual({
      module: "academics",
      screen: "academics-dashboard",
      canonicalTail: "academics",
    });
  });

  test("an owned row is resolved for rendering but left to canonicalAdminTail for the URL", () => {
    // `academics/timetable` is that file's answer, and keeping it there also keeps the
    // staff role out of a redirect it cannot satisfy.
    expect(resolveAdminRoute(null, "timetable")).toEqual({
      module: "academics",
      screen: "timetable",
      canonicalTail: null,
    });
    expect(resolveAdminRoute("academics", "timetable").canonicalTail).toBeNull();
  });

  test("dashboard, an identity root and an unknown key are untouched", () => {
    for (const screen of ["dashboard", "leaves", "ai-connect", "nope"]) {
      expect(resolveAdminRoute(null, screen, "admin")).toEqual({
        module: null,
        screen,
        canonicalTail: null,
      });
    }
  });

  test("`/academics/session` is a qualified route that is already canonical", () => {
    // Read through the same contract the dispatcher uses. If `session` were not a
    // declared sub-link, parseRoute would hand back the bare screen `academics` and the
    // session screen would never mount.
    const parts = parseRoute("/demo-academy/2026-2027/academics/session", {
      isModuleScreen: isAdminModuleScreen,
      isTenantRoot: (first) => first === "demo-academy",
      yearSlugs: ["2026-2027"],
    });
    expect(parts).toEqual({ year: "2026-2027", module: "academics", screen: "session" });
    expect(resolveAdminRoute(parts.module, parts.screen).canonicalTail).toBeNull();
    expect(routedKeys.has("session")).toBe(true);
    // The legacy key still routes: the year gate's no-year escape hatch and the staff
    // accordion both redirect to it.
    expect(routedKeys.has("academic-years")).toBe(true);
  });

  test("no canonical tail is itself redirectable, which is what ends the chain", () => {
    // Exhaustive over every rail module and every row it declares, not by example: a
    // redirect that targets a URL this file wants to redirect again is a loop, and a
    // target whose screen no case serves is a bounce. Run for both roles, because a
    // shared root answers differently and a collapse that only holds for one of them
    // is still a loop for the other.
    const loops: string[] = [];
    const bounces: string[] = [];
    for (const role of ["admin", "staff"]) {
      for (const item of buildAdminRail()) {
        for (const row of item.sections.flatMap((s) => s.items)) {
          for (const start of [
            resolveAdminRoute(item.key, row.key, role),
            resolveAdminRoute(null, row.key, role),
          ]) {
            if (!start.canonicalTail) continue;
            const back = parseRoute(`/demo/${start.canonicalTail}`, {
              isModuleScreen: isAdminModuleScreen,
              isTenantRoot: (first) => first === "demo",
            });
            const next = resolveAdminRoute(back.module, back.screen, role);
            if (next.canonicalTail) {
              loops.push(`${role} ${item.key}/${row.key} -> ${start.canonicalTail} -> ${next.canonicalTail}`);
            }
            if (!routedKeys.has(componentKey(next.module, next.screen))) {
              bounces.push(`${role} ${item.key}/${row.key} -> ${start.canonicalTail} renders ${next.screen}`);
            }
          }
        }
      }
    }
    expect(loops).toEqual([]);
    expect(bounces).toEqual([]);
  });

  test("a root and its long form render the same screen", () => {
    for (const [module, landing] of EXPECTED_LANDINGS) {
      const short = resolveAdminRoute(null, module, "admin");
      const long = resolveAdminRoute(module, landing, "admin");
      expect(componentKey(short.module, short.screen)).toBe(
        componentKey(long.module, long.screen),
      );
      expect(long.canonicalTail).toBe(module);
    }
  });
});

function screenKeyOfRoot(moduleId: string): string {
  const resolved = resolveAdminRoute(null, moduleId);
  return componentKey(resolved.module, resolved.screen);
}
